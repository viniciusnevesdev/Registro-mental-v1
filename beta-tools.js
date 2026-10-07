/* Registro Mental — ferramentas exclusivas do ambiente Beta */
(() => {
  'use strict';

  const BETA_RELEASE = '1.2.0-beta.18';
  const PROD_DB = 'registro-mental-v1';
  const BETA_DB = 'registro-mental-beta-v1';
  const PROD_SETTINGS = 'registro-settings-v2';
  const BETA_SETTINGS = 'registro-beta-settings-v1';
  const STORES = ['events', 'audio', 'medications'];

  function openDb(name) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, 2);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('events')) {
          const store = db.createObjectStore('events', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('type', 'type');
        }
        if (!db.objectStoreNames.contains('audio')) db.createObjectStore('audio', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('medications')) db.createObjectStore('medications', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error(`Falha ao abrir ${name}`));
    });
  }

  function requestPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function readStore(db, name) {
    if (!db.objectStoreNames.contains(name)) return [];
    return requestPromise(db.transaction(name, 'readonly').objectStore(name).getAll());
  }

  async function replaceStore(db, name, rows) {
    if (!db.objectStoreNames.contains(name)) return;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(name, 'readwrite');
      const store = tx.objectStore(name);
      store.clear();
      for (const row of rows || []) store.put(row);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transação cancelada'));
    });
  }

  async function copyOfficialToBeta() {
    const source = await openDb(PROD_DB);
    const target = await openDb(BETA_DB);
    try {
      const snapshot = {};
      for (const storeName of STORES) snapshot[storeName] = await readStore(source, storeName);
      for (const storeName of STORES) await replaceStore(target, storeName, snapshot[storeName]);

      try {
        const rawSettings = localStorage.getItem(PROD_SETTINGS);
        if (rawSettings) localStorage.setItem(BETA_SETTINGS, rawSettings);
        localStorage.setItem('registro-beta-demo-seeded', 'yes');
        localStorage.setItem('registro-beta-copied-at', new Date().toISOString());
      } catch (_) {}

      return {
        events: snapshot.events?.length || 0,
        medications: snapshot.medications?.length || 0,
        audio: snapshot.audio?.length || 0
      };
    } finally {
      source.close();
      target.close();
    }
  }

  async function clearBetaOnly() {
    const db = await openDb(BETA_DB);
    try {
      for (const storeName of STORES) await replaceStore(db, storeName, []);
    } finally {
      db.close();
    }
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith('registro-beta-'))
        .forEach(key => localStorage.removeItem(key));
      localStorage.setItem('registro-beta-demo-seeded', 'yes');
    } catch (_) {}
  }

  function installStyle() {
    if (document.getElementById('rm-beta-tools-style')) return;
    const style = document.createElement('style');
    style.id = 'rm-beta-tools-style';
    style.textContent = `
      #rmBetaBadge{position:fixed;top:max(8px,env(safe-area-inset-top));right:10px;z-index:2147482500;padding:5px 9px;border-radius:999px;background:#ff9500;color:#fff;font:700 10px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;letter-spacing:.08em;box-shadow:0 3px 12px rgba(0,0,0,.12);pointer-events:none}
      .rm-beta-card{margin:0 0 14px;padding:14px;border:1px solid rgba(255,149,0,.28);border-radius:18px;background:rgba(255,149,0,.08);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}
      .rm-beta-card strong{display:block;font-size:14px;margin-bottom:4px}.rm-beta-card p{margin:0;color:#6e6e73;font-size:12px;line-height:1.4}
      .rm-beta-actions{display:flex;gap:8px;margin-top:11px}.rm-beta-actions button{appearance:none;border:0;border-radius:11px;padding:9px 10px;font:600 12px/1.1 inherit;background:#111114;color:#fff}.rm-beta-actions button:last-child{background:#e5e5ea;color:#1c1c1e}
      @media(prefers-color-scheme:dark){.rm-beta-card{background:rgba(255,159,10,.12);border-color:rgba(255,159,10,.32)}.rm-beta-card p{color:#a1a1a6}.rm-beta-actions button{background:#f2f2f4;color:#111114}.rm-beta-actions button:last-child{background:#2c2c2e;color:#f2f2f4}}
    `;
    document.head.appendChild(style);
  }

  function installUi() {
    installStyle();
    if (!document.getElementById('rmBetaBadge')) {
      const badge = document.createElement('div');
      badge.id = 'rmBetaBadge';
      badge.textContent = 'BETA';
      document.body.appendChild(badge);
    }

    const home = document.querySelector('[data-view="home"]');
    if (!home || document.getElementById('rmBetaCard')) return false;
    const header = home.querySelector('.page-header');
    const card = document.createElement('section');
    card.id = 'rmBetaCard';
    card.className = 'rm-beta-card';
    card.innerHTML = `
      <strong>Ambiente Beta · ${BETA_RELEASE}</strong>
      <p>Dados isolados. Registrar, editar ou apagar algo aqui não altera o app Oficial.</p>
      <div class="rm-beta-actions">
        <button type="button" id="rmBetaCopy">Copiar dados do Oficial</button>
        <button type="button" id="rmBetaClear">Limpar Beta</button>
      </div>`;
    if (header?.nextSibling) home.insertBefore(card, header.nextSibling);
    else home.prepend(card);

    document.getElementById('rmBetaCopy').onclick = async event => {
      const button = event.currentTarget;
      if (!confirm('Substituir os dados atuais da Beta por uma cópia dos dados do app Oficial? O Oficial não será alterado.')) return;
      button.disabled = true;
      button.textContent = 'Copiando…';
      try {
        const result = await copyOfficialToBeta();
        alert(`Cópia concluída: ${result.events} registros e ${result.medications} medicamentos. O app Oficial permaneceu intacto.`);
        location.reload();
      } catch (error) {
        console.error(error);
        button.disabled = false;
        button.textContent = 'Tentar novamente';
        alert('Não foi possível copiar os dados para a Beta. Nenhum dado do Oficial foi alterado.');
      }
    };

    document.getElementById('rmBetaClear').onclick = async event => {
      if (!confirm('Apagar somente os dados da Beta? Seus dados do app Oficial permanecerão intactos.')) return;
      const button = event.currentTarget;
      button.disabled = true;
      button.textContent = 'Limpando…';
      try {
        await clearBetaOnly();
        location.reload();
      } catch (error) {
        console.error(error);
        button.disabled = false;
        button.textContent = 'Tentar novamente';
        alert('Não foi possível limpar a Beta.');
      }
    };
    return true;
  }

  function paintBetaVersion() {
    const top = document.getElementById('topVersion');
    const about = document.getElementById('versionLabel');
    if (top) top.textContent = `v${BETA_RELEASE}`;
    if (about) about.textContent = BETA_RELEASE;
  }

  function apply() {
    paintBetaVersion();
    installUi();
  }

  apply();
  document.addEventListener('DOMContentLoaded', apply, { once: true });
  window.addEventListener('registro:release-ready', apply);
  [50, 250, 900, 1800].forEach(ms => setTimeout(apply, ms));
})();
