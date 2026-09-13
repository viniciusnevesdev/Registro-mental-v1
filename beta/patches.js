/* Registro Mental V1 — correções finais isoladas do motor principal */
(() => {
  'use strict';

  const RELEASE = String(window.REGISTRO_SHELL_RELEASE || '1.2.0-beta.44');
  const SPARK_ICON = `<svg class="svg-icon rm-spark-custom" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21.7734 24.9609" width="24" height="24" aria-hidden="true" focusable="false" stroke="none">
    <g stroke="none">
      <rect height="24.9609" opacity="0" width="21.7734" x="0" y="0"/>
      <path d="M4.36719 16.25C4.17969 16.25 4.04688 16.3672 4.02344 16.5625C3.61719 19.6875 3.51562 19.7188 0.34375 20.2578C0.125 20.2891 0 20.4062 0 20.6016C0 20.7969 0.125 20.9062 0.304688 20.9375C3.5 21.5547 3.61719 21.5234 4.02344 24.625C4.04688 24.8359 4.17969 24.9609 4.36719 24.9609C4.54688 24.9609 4.6875 24.8359 4.71094 24.6328C5.13281 21.4844 5.21875 21.4375 8.42188 20.9375C8.60156 20.9141 8.72656 20.7969 8.72656 20.6016C8.72656 20.4141 8.60156 20.2891 8.42188 20.2578C5.21875 19.6406 5.14062 19.6719 4.71094 16.5469C4.6875 16.3672 4.54688 16.25 4.36719 16.25Z" fill="currentColor" fill-opacity="0.85" stroke="none"/>
      <path d="M12.2578 3.29688C11.9766 3.29688 11.7734 3.49219 11.7422 3.77344C10.8828 10.3359 10.0703 11.0547 3.64062 11.8828C3.35156 11.9141 3.14844 12.125 3.14844 12.3984C3.14844 12.6797 3.35156 12.8906 3.64062 12.9219C10.0938 13.5859 10.9531 14.4609 11.7422 21.0234C11.7734 21.3047 11.9766 21.5078 12.2578 21.5078C12.5312 21.5078 12.7422 21.3047 12.7812 21.0234C13.5781 14.4609 14.4297 13.5859 20.875 12.9219C21.1719 12.8906 21.3672 12.6797 21.3672 12.3984C21.3672 12.125 21.1719 11.9141 20.875 11.8828C14.4297 11.2109 13.5781 10.3359 12.7812 3.77344C12.7422 3.49219 12.5312 3.29688 12.2578 3.29688Z" fill="currentColor" fill-opacity="0.85" stroke="none"/>
    </g>
  </svg>`;

  function installStyles() {
    if (document.getElementById('rm-v1-final-patch-style')) return;
    const style = document.createElement('style');
    style.id = 'rm-v1-final-patch-style';
    style.textContent = `
      html { --icon-stroke: 2 !important; }
      .rm-spark-custom,
      .rm-spark-custom * {
        stroke: none !important;
        stroke-width: 0 !important;
        -webkit-text-stroke: 0 !important;
      }
      .voice-row { display: none !important; }
    `;
    document.head.appendChild(style);
  }

  function removeIconWeightSetting() {
    const control = document.getElementById('iconWeightControl');
    const block = control?.closest('.setting-block');
    if (block) {
      const next = block.nextElementSibling;
      const prev = block.previousElementSibling;
      if (next?.classList.contains('setting-separator')) next.remove();
      else if (prev?.classList.contains('setting-separator')) prev.remove();
      block.remove();
    }

    try {
      const key = 'registro-beta-settings-v1';
      const raw = localStorage.getItem(key);
      if (raw) {
        const settings = JSON.parse(raw);
        if ('iconWeight' in settings) {
          delete settings.iconWeight;
          localStorage.setItem(key, JSON.stringify(settings));
        }
      }
    } catch (_) {}

    document.documentElement.dataset.iconWeight = 'regular';
  }

  function replaceSparkHolder(holder) {
    if (!holder) return;
    if (holder.querySelector('.rm-spark-custom')) {
      holder.removeAttribute('data-icon');
      return;
    }
    holder.removeAttribute('data-icon');
    holder.innerHTML = SPARK_ICON;
  }

  function applySparkIcons() {
    document.querySelectorAll('[data-icon="spark"]').forEach(replaceSparkHolder);
    const learningTab = document.querySelector('[data-tab="learning"]');
    if (learningTab) {
      replaceSparkHolder(learningTab.querySelector('[data-icon]') || learningTab.querySelector('span'));
    }
  }

  function removeVoiceUi() {
    document.querySelectorAll('.voice-row').forEach(el => el.remove());
  }

  function installUpdateButtonBehavior() {
    const button = document.getElementById('rmForceUpdateBtn');
    if (!button || button.dataset.rmV1Handler === RELEASE) return;
    button.dataset.rmV1Handler = RELEASE;
    button.onclick = async () => {
      if (!navigator.onLine) {
        if (typeof window.toast === 'function') window.toast('Conecte-se à internet para atualizar.');
        return;
      }
      button.disabled = true;
      button.textContent = 'Buscando…';
      try {
        const probe = await fetch(`./release-guard.js?verificar=${Date.now()}`, { cache: 'no-store' });
        if (!probe.ok) throw new Error('A publicação não respondeu.');
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.allSettled(regs
            .filter(reg => String(reg.scope || '').includes('/Registro-mental-v1/beta/'))
            .map(reg => reg.unregister()));
        }
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.allSettled(keys
            .filter(key => key.startsWith('registro-beta-v1-'))
            .map(key => caches.delete(key)));
        }
        button.textContent = 'Atualizando…';
        location.replace(`./launch.html?force=${Date.now()}&from=${encodeURIComponent(RELEASE)}`);
      } catch (error) {
        console.error('Falha ao buscar atualização', error);
        button.disabled = false;
        button.textContent = 'Tentar novamente';
        if (typeof window.toast === 'function') window.toast('Não foi possível buscar a atualização.');
      }
    };
  }

  function paintRelease() {
    const top = document.getElementById('topVersion');
    const about = document.getElementById('versionLabel');
    if (top) top.textContent = `v${RELEASE}`;
    if (about) about.textContent = RELEASE;
  }

  function applyAll() {
    installStyles();
    removeIconWeightSetting();
    removeVoiceUi();
    applySparkIcons();
    installUpdateButtonBehavior();
    paintRelease();
  }

  // Sem MutationObserver permanente: evita loops, gasto de CPU e regressões no Safari.
  applyAll();
  window.addEventListener('registro:release-ready', applyAll);
  document.addEventListener('DOMContentLoaded', applyAll, { once: true });
  [0, 250, 900, 1800].forEach(ms => setTimeout(applyAll, ms));
  document.addEventListener('click', event => {
    if (event.target.closest('.tab-item, #customIconsBtn, #rmForceUpdateBtn')) {
      setTimeout(applyAll, 0);
    }
  }, { passive: true });

  window.REGISTRO_PATCH_RELEASE = RELEASE;
  window.dispatchEvent(new CustomEvent('registro:patches-ready', { detail: { release: RELEASE } }));
})();

/* RM_OFFICIAL_BACKUP_COMPAT_V1
   Mantém a Oficial estável e adiciona somente uma ponte segura para backups novos. */
(() => {
  'use strict';

  const MAX_BACKUP_FORMAT = 2;
  const UNDO_ID = '__rm_official_last_import_undo_v1__';

  function requestPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Falha no armazenamento local.'));
    });
  }

  function validEvent(item) {
    return Boolean(item && typeof item.id === 'string' && item.id && typeof item.timestamp === 'string' && item.timestamp && ['note','medication','sleep','purchase'].includes(item.type));
  }

  function validMedication(item) {
    return Boolean(item && typeof item.id === 'string' && item.id && typeof item.activeIngredient === 'string' && item.activeIngredient.trim());
  }

  function uniqueById(items) {
    return [...new Map(items.map(item => [item.id, { ...item }])).values()];
  }

  function validateBackup(parsed) {
    if (Array.isArray(parsed)) return { format: 1, events: parsed, medications: [], settings: null, betaSource: false };
    if (!parsed || typeof parsed !== 'object') throw new Error('O conteúdo do arquivo não é um backup válido.');
    const format = Number(parsed.backupFormat || 1);
    if (!Number.isFinite(format) || format < 1) throw new Error('A versão do formato de backup é inválida.');
    if (format > MAX_BACKUP_FORMAT) throw new Error(`Este backup usa o formato ${format}. A Oficial 1.2.0-beta.44 entende até o formato ${MAX_BACKUP_FORMAT}. Use um “Backup para Oficial estável” criado pela Beta.`);
    if (!Array.isArray(parsed.events)) throw new Error('O arquivo não contém uma lista de registros.');
    return {
      format,
      events: parsed.events,
      medications: Array.isArray(parsed.medications) ? parsed.medications : [],
      settings: parsed.settings && typeof parsed.settings === 'object' && !Array.isArray(parsed.settings) ? parsed.settings : null,
      betaSource: parsed.source?.environment === 'beta',
      officialCompatible: parsed.kind === 'official-compatible'
    };
  }

  async function currentSnapshot() {
    return { events: await allEvents(), medications: await allMedications(), settings: { ...getSettings() } };
  }

  async function writeUndo(snapshot) {
    await requestPromise(store(AUDIO, 'readwrite').put({ id: UNDO_ID, createdAt: new Date().toISOString(), snapshot }));
  }

  async function readUndo() {
    try { return await requestPromise(store(AUDIO).get(UNDO_ID)); } catch (_) { return null; }
  }

  async function deleteUndo() {
    try { await requestPromise(store(AUDIO, 'readwrite').delete(UNDO_ID)); } catch (_) {}
  }

  async function replaceWithSnapshot(snapshot) {
    await new Promise((resolve, reject) => {
      const tx = db.transaction([EVENTS, MEDICATIONS], 'readwrite');
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('Falha ao restaurar os dados.'));
      tx.onabort = () => reject(tx.error || new Error('Restauração cancelada.'));
      const eventStore = tx.objectStore(EVENTS);
      const medicationStore = tx.objectStore(MEDICATIONS);
      eventStore.clear(); medicationStore.clear();
      (snapshot.events || []).forEach(item => eventStore.put({ ...item }));
      (snapshot.medications || []).forEach(item => medicationStore.put({ ...item }));
    });
    saveSettings(snapshot.settings || {});
  }

  async function performImport(parsed, mode) {
    const info = validateBackup(parsed);
    const events = uniqueById(info.events.filter(validEvent));
    const medications = uniqueById(info.medications.filter(validMedication));
    if (!events.length && !medications.length) throw new Error('Nenhum dado compatível foi encontrado no backup.');

    const before = await currentSnapshot();
    const previousUndo = await readUndo();
    await writeUndo(before);
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction([EVENTS, MEDICATIONS], 'readwrite');
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('Falha ao gravar o backup.'));
        tx.onabort = () => reject(tx.error || new Error('Importação cancelada.'));
        const eventStore = tx.objectStore(EVENTS);
        const medicationStore = tx.objectStore(MEDICATIONS);
        if (mode === 'replace') { eventStore.clear(); medicationStore.clear(); }
        events.forEach(item => eventStore.put(item));
        medications.forEach(item => medicationStore.put(item));
      });

      const storedEvents = await allEvents();
      const storedMeds = await allMedications();
      const eventIds = new Set(storedEvents.map(item => item.id));
      const medIds = new Set(storedMeds.map(item => item.id));
      if (events.some(item => !eventIds.has(item.id)) || medications.some(item => !medIds.has(item.id))) throw new Error('A verificação final não confirmou todos os dados importados.');

      if (mode === 'replace' && info.settings && !info.betaSource) saveSettings({ ...getSettings(), ...info.settings });
      try { localStorage.setItem('registro-demo-seeded', 'yes'); } catch (_) {}
      closeSheet();
      if (typeof renderAll === 'function') await renderAll();
      refreshUndoRow();
      toast(`${mode === 'replace' ? 'Backup restaurado' : 'Backup adicionado'}: ${events.length} registro${events.length === 1 ? '' : 's'} e ${medications.length} medicamento${medications.length === 1 ? '' : 's'}.`);
    } catch (error) {
      await replaceWithSnapshot(before);
      if (previousUndo) await requestPromise(store(AUDIO, 'readwrite').put(previousUndo));
      else await deleteUndo();
      throw error;
    }
  }

  function openChoice(parsed) {
    const info = validateBackup(parsed);
    const events = uniqueById(info.events.filter(validEvent));
    const medications = uniqueById(info.medications.filter(validMedication));
    const warning = info.betaSource && !info.officialCompatible ? '<div class="analysis-row"><strong>Backup criado na Beta</strong><span>A Oficial importará os dados compatíveis e ignorará configurações experimentais.</span></div>' : '';
    openBackdrop('Como importar?', `${warning}<div class="analysis-row"><strong>${events.length} registros · ${medications.length} medicamentos</strong><span>Uma cópia do estado atual será guardada antes da importação.</span></div><div class="rm-official-import-actions"><button type="button" class="primary-button full-button" id="rmOfficialMerge">Manter os atuais e adicionar</button><button type="button" class="secondary-button full-button" id="rmOfficialReplace">Apagar os atuais e restaurar o backup</button><button type="button" class="secondary-button full-button" data-cancel>Cancelar</button></div>`);
    document.getElementById('rmOfficialMerge').onclick = () => runImport(parsed, 'merge');
    document.getElementById('rmOfficialReplace').onclick = () => runImport(parsed, 'replace');
  }

  async function runImport(parsed, mode) {
    try { await performImport(parsed, mode); }
    catch (error) {
      console.error('Oficial: falha ao importar backup.', error);
      alert(`O backup não foi importado.\n\n${error?.message || 'Não foi possível concluir a importação.'}\n\nOs dados anteriores foram restaurados.`);
    }
  }

  async function compatibleImport(file) {
    const parsed = JSON.parse(await file.text());
    validateBackup(parsed);
    const [currentEvents, currentMeds] = await Promise.all([allEvents(), allMedications()]);
    if (!currentEvents.length && !currentMeds.length) return runImport(parsed, 'replace');
    openChoice(parsed);
  }

  async function undoLastImport() {
    const undo = await readUndo();
    if (!undo?.snapshot) return toast('Não há uma importação para desfazer.');
    if (!confirm('Desfazer a última importação e voltar exatamente ao estado anterior?')) return;
    try {
      await replaceWithSnapshot(undo.snapshot);
      await deleteUndo();
      await renderAll();
      refreshUndoRow();
      toast('Última importação desfeita.');
    } catch (error) {
      console.error('Oficial: falha ao desfazer importação.', error);
      alert('Não foi possível desfazer a importação.');
    }
  }

  async function refreshUndoRow() {
    const button = document.getElementById('rmOfficialUndoImportBtn');
    if (!button || typeof db === 'undefined' || !db) return;
    const undo = await readUndo();
    button.hidden = !undo?.snapshot;
    const separator = document.getElementById('rmOfficialUndoImportSeparator');
    if (separator) separator.hidden = !undo?.snapshot;
  }

  function ensureUndoRow() {
    const importButton = document.getElementById('importBtn');
    if (!importButton) return false;
    if (!document.getElementById('rmOfficialUndoImportBtn')) {
      const separator = document.createElement('div');
      separator.id = 'rmOfficialUndoImportSeparator';
      separator.className = 'setting-separator inset';
      separator.hidden = true;
      const button = document.createElement('button');
      button.id = 'rmOfficialUndoImportBtn';
      button.className = 'settings-row';
      button.hidden = true;
      button.innerHTML = '<span class="settings-row-icon" data-icon="history"></span><span><strong>Desfazer última importação</strong><small>Restaura o estado anterior</small></span><span class="chevron">›</span>';
      importButton.insertAdjacentElement('afterend', separator);
      separator.insertAdjacentElement('afterend', button);
      button.onclick = undoLastImport;
      try { hydrateIcons(button); } catch (_) {}
    }
    refreshUndoRow();
    return true;
  }

  function installImporter() {
    const input = document.getElementById('importFile');
    if (!input || typeof window.importData !== 'function') return false;
    if (input.dataset.rmOfficialCompat === '1') return true;
    input.dataset.rmOfficialCompat = '1';
    window.importData = compatibleImport;
    input.onchange = async event => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      try { await compatibleImport(file); }
      catch (error) {
        console.error('Oficial: arquivo de backup recusado.', error);
        alert(`Este arquivo não pode ser importado.\n\n${error?.message || 'Backup incompatível.'}\n\nNenhum dado atual foi alterado.`);
      }
    };
    ensureUndoRow();
    return true;
  }

  function installOfficialCompatStyle() {
    if (document.getElementById('rm-official-backup-compat-style')) return;
    const style = document.createElement('style');
    style.id = 'rm-official-backup-compat-style';
    style.textContent = '.rm-official-import-actions{display:grid;gap:9px;margin-top:12px}#rmOfficialUndoImportBtn[hidden],#rmOfficialUndoImportSeparator[hidden]{display:none!important}';
    document.head.appendChild(style);
  }

  function apply() {
    installOfficialCompatStyle();
    installImporter();
    ensureUndoRow();
  }

  apply();
  window.addEventListener('registro:release-ready', apply);
  document.addEventListener('DOMContentLoaded', apply, { once: true });
  [100, 350, 900, 1800].forEach(ms => setTimeout(apply, ms));
})();


/* RM_CROSS_ENV_BACKUP_BRIDGE_V1
   Ponte manual e reversível entre Beta e Oficial. O ambiente atual é o único que recebe escrita. */
(() => {
  'use strict';

  const CFG = {"current":"beta","ownDb":"registro-mental-beta-v1","otherDb":"registro-mental-v1","otherLabel":"Oficial","undoId":"__rm_beta_last_import_undo_v1__","demoSeedKey":"registro-beta-demo-seeded","bridgeLastKey":"registro-beta-last-cross-bridge","lastBackupKey":"registro-beta-last-backup","filePrefix":"Registro-Mental-Beta_para-Oficial","otherUrl":"../","outgoingToken":"from-beta","incomingToken":"from-official"};
  const BACKUP_FORMAT = 2;
  const KNOWN_EVENT_TYPES = new Set(['note', 'medication', 'sleep', 'purchase']);
  let incomingHandled = false;

  function requestPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Falha ao acessar o armazenamento local.'));
    });
  }

  function openDatabase(name, mustExist = true) {
    return new Promise((resolve, reject) => {
      let missing = false;
      const request = indexedDB.open(name);
      request.onupgradeneeded = event => {
        if (mustExist && event.oldVersion === 0) {
          missing = true;
          try { request.transaction.abort(); } catch (_) {}
          return;
        }
        const database = request.result;
        if (!database.objectStoreNames.contains('events')) {
          const events = database.createObjectStore('events', { keyPath: 'id' });
          events.createIndex('timestamp', 'timestamp');
          events.createIndex('type', 'type');
        }
        if (!database.objectStoreNames.contains('audio')) database.createObjectStore('audio', { keyPath: 'id' });
        if (!database.objectStoreNames.contains('medications')) database.createObjectStore('medications', { keyPath: 'id' });
      };
      request.onsuccess = () => {
        if (missing) {
          try { request.result.close(); } catch (_) {}
          reject(new Error(`A versão ${CFG.otherLabel} ainda não possui um banco local neste iPhone.`));
          return;
        }
        resolve(request.result);
      };
      request.onerror = () => reject(missing
        ? new Error(`A versão ${CFG.otherLabel} ainda não possui um banco local neste iPhone.`)
        : (request.error || new Error('Não foi possível abrir o banco local.')));
    });
  }

  async function readStore(database, name) {
    if (!database.objectStoreNames.contains(name)) return [];
    return requestPromise(database.transaction(name, 'readonly').objectStore(name).getAll());
  }

  async function readData(databaseName, mustExist = true) {
    const database = await openDatabase(databaseName, mustExist);
    try {
      const [events, medications] = await Promise.all([
        readStore(database, 'events'),
        readStore(database, 'medications')
      ]);
      return { events, medications };
    } finally {
      database.close();
    }
  }

  function validEvent(item) {
    return Boolean(item && typeof item.id === 'string' && item.id &&
      typeof item.timestamp === 'string' && item.timestamp &&
      KNOWN_EVENT_TYPES.has(item.type));
  }

  function validMedication(item) {
    return Boolean(item && typeof item.id === 'string' && item.id &&
      typeof item.activeIngredient === 'string' && item.activeIngredient.trim());
  }

  function uniqueById(items) {
    return [...new Map(items.map(item => [item.id, { ...item }])).values()];
  }

  function normalizeData(raw) {
    const events = uniqueById((Array.isArray(raw?.events) ? raw.events : []).filter(validEvent));
    const medications = uniqueById((Array.isArray(raw?.medications) ? raw.medications : []).filter(validMedication));
    return { events, medications };
  }

  function currentSettingsSnapshot() {
    try {
      return typeof getSettings === 'function' ? { ...getSettings() } : {};
    } catch (_) {
      return {};
    }
  }

  async function currentSnapshot() {
    const data = normalizeData(await readData(CFG.ownDb, true));
    return { ...data, settings: currentSettingsSnapshot() };
  }

  async function readUndoRaw() {
    const database = await openDatabase(CFG.ownDb, true);
    try {
      if (!database.objectStoreNames.contains('audio')) return null;
      return requestPromise(database.transaction('audio', 'readonly').objectStore('audio').get(CFG.undoId));
    } catch (_) {
      return null;
    } finally {
      database.close();
    }
  }

  async function writeUndoRaw(record) {
    const database = await openDatabase(CFG.ownDb, true);
    try {
      if (!database.objectStoreNames.contains('audio')) throw new Error('Armazenamento de segurança indisponível.');
      await requestPromise(database.transaction('audio', 'readwrite').objectStore('audio').put(record));
    } finally {
      database.close();
    }
  }

  async function deleteUndoRaw() {
    const database = await openDatabase(CFG.ownDb, true);
    try {
      if (database.objectStoreNames.contains('audio')) {
        await requestPromise(database.transaction('audio', 'readwrite').objectStore('audio').delete(CFG.undoId));
      }
    } catch (_) {
    } finally {
      database.close();
    }
  }

  async function writeData(snapshot, mode) {
    const database = await openDatabase(CFG.ownDb, true);
    try {
      await new Promise((resolve, reject) => {
        const tx = database.transaction(['events', 'medications'], 'readwrite');
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('Falha ao gravar os dados.'));
        tx.onabort = () => reject(tx.error || new Error('A transferência foi cancelada.'));
        const events = tx.objectStore('events');
        const medications = tx.objectStore('medications');
        if (mode === 'replace') {
          events.clear();
          medications.clear();
        }
        snapshot.events.forEach(item => events.put({ ...item }));
        snapshot.medications.forEach(item => medications.put({ ...item }));
      });
    } finally {
      database.close();
    }
  }

  async function restoreSnapshot(snapshot) {
    await writeData({ events: snapshot.events || [], medications: snapshot.medications || [] }, 'replace');
    try {
      if (typeof saveSettings === 'function' && snapshot.settings) saveSettings(snapshot.settings);
    } catch (_) {}
  }

  function revealUndoRow() {
    const ids = CFG.current === 'beta'
      ? ['rmBetaUndoImportBtn', 'rmBetaUndoImportSeparator']
      : ['rmOfficialUndoImportBtn', 'rmOfficialUndoImportSeparator'];
    ids.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.hidden = false;
    });
  }

  async function refreshAfterImport() {
    try {
      localStorage.setItem(CFG.demoSeedKey, 'yes');
      localStorage.setItem(CFG.bridgeLastKey, new Date().toISOString());
    } catch (_) {}
    revealUndoRow();
    try { if (typeof rmInvalidate === 'function') rmInvalidate(); } catch (_) {}
    try {
      if (typeof switchTab === 'function') switchTab('history');
      if (typeof rmRenderActive === 'function') await rmRenderActive('history', { force: true });
      else if (typeof renderAll === 'function') await renderAll();
    } catch (error) {
      console.warn('Ponte: dados transferidos, mas a interface não atualizou imediatamente.', error);
    }
  }

  async function importFromOther(source, mode) {
    const before = await currentSnapshot();
    const previousUndo = await readUndoRaw();
    await writeUndoRaw({
      id: CFG.undoId,
      createdAt: new Date().toISOString(),
      reason: 'cross-environment-bridge',
      snapshot: before
    });

    try {
      await writeData(source, mode);
      const stored = normalizeData(await readData(CFG.ownDb, true));
      const eventIds = new Set(stored.events.map(item => item.id));
      const medicationIds = new Set(stored.medications.map(item => item.id));
      if (source.events.some(item => !eventIds.has(item.id)) ||
          source.medications.some(item => !medicationIds.has(item.id))) {
        throw new Error('A verificação final não confirmou todos os dados transferidos.');
      }
      await refreshAfterImport();
      try { if (typeof closeSheet === 'function') closeSheet(); } catch (_) {}
      const action = mode === 'replace' ? 'Dados substituídos' : 'Dados adicionados';
      if (typeof toast === 'function') {
        toast(`${action}: ${source.events.length} registro${source.events.length === 1 ? '' : 's'} e ${source.medications.length} medicamento${source.medications.length === 1 ? '' : 's'}.`);
      }
    } catch (error) {
      try {
        await restoreSnapshot(before);
        if (previousUndo) await writeUndoRaw(previousUndo);
        else await deleteUndoRaw();
      } catch (rollbackError) {
        console.error('Ponte: também falhou ao restaurar o estado anterior.', rollbackError);
      }
      throw error;
    }
  }

  async function openReceivePreview() {
    try {
      const rawSource = await readData(CFG.otherDb, true);
      const source = normalizeData(rawSource);
      if (!source.events.length && !source.medications.length) {
        throw new Error(`A versão ${CFG.otherLabel} não possui registros ou medicamentos para transferir.`);
      }
      const current = normalizeData(await readData(CFG.ownDb, true));
      if (typeof openBackdrop !== 'function') throw new Error('A interface de confirmação ainda não está pronta.');

      openBackdrop(`Receber da ${CFG.otherLabel}?`, `
        <div class="analysis-row">
          <strong>${source.events.length} registros · ${source.medications.length} medicamentos</strong>
          <span>A ${CFG.otherLabel} será apenas lida. Nenhum dado dela será apagado ou alterado.</span>
        </div>
        <div class="analysis-row">
          <strong>Neste ambiente: ${current.events.length} registros · ${current.medications.length} medicamentos</strong>
          <span>Configurações visuais não são transferidas pela ponte direta.</span>
        </div>
        <div class="rm-cross-bridge-actions">
          <button type="button" class="primary-button full-button" id="rmCrossBridgeMerge">Manter os atuais e adicionar</button>
          <button type="button" class="secondary-button full-button" id="rmCrossBridgeReplace">Substituir os dados deste ambiente</button>
          <button type="button" class="secondary-button full-button" data-cancel>Cancelar</button>
        </div>
      `);

      document.getElementById('rmCrossBridgeMerge').onclick = async () => {
        try {
          await importFromOther(source, 'merge');
        } catch (error) {
          console.error('Ponte: falha ao somar os dados.', error);
          alert(`A transferência não foi concluída.\n\n${error?.message || 'Não foi possível importar os dados.'}\n\nO estado anterior foi restaurado.`);
        }
      };

      document.getElementById('rmCrossBridgeReplace').onclick = async () => {
        if (!confirm(`Substituir os dados atuais deste ambiente pelos dados da ${CFG.otherLabel}?\n\nUma cópia para Desfazer será criada antes.`)) return;
        try {
          await importFromOther(source, 'replace');
        } catch (error) {
          console.error('Ponte: falha ao substituir os dados.', error);
          alert(`A transferência não foi concluída.\n\n${error?.message || 'Não foi possível importar os dados.'}\n\nO estado anterior foi restaurado.`);
        }
      };
    } catch (error) {
      console.error('Ponte: não foi possível preparar a transferência.', error);
      alert(`Não foi possível receber dados da ${CFG.otherLabel}.\n\n${error?.message || 'A outra versão não respondeu.'}`);
    }
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function filenameStamp() {
    const date = new Date();
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}_${pad2(date.getHours())}-${pad2(date.getMinutes())}-${pad2(date.getSeconds())}`;
  }

  function downloadJson(payload, filename) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function exportInterchangeBackup() {
    try {
      const data = normalizeData(await readData(CFG.ownDb, true));
      const release = String(window.REGISTRO_SHELL_RELEASE || window.REGISTRO_V1_RELEASE || window.REGISTRO_CURRENT_RELEASE || '');
      const payload = {
        app: 'Registro Mental',
        backupFormat: BACKUP_FORMAT,
        kind: 'cross-environment',
        exportedAt: new Date().toISOString(),
        source: {
          environment: CFG.current === 'beta' ? 'beta' : 'production',
          release
        },
        compatibility: {
          betaImport: true,
          stableImport: true,
          minimumOfficial: '1.1.1',
          transferPolicy: 'data-and-settings-in-file'
        },
        counts: {
          events: data.events.length,
          medications: data.medications.length
        },
        events: data.events,
        medications: data.medications,
        settings: currentSettingsSnapshot()
      };
      downloadJson(payload, `${CFG.filePrefix}_${filenameStamp()}.json`);
      try { localStorage.setItem(CFG.lastBackupKey, new Date().toISOString()); } catch (_) {}
      try { if (typeof renderBackupState === 'function') renderBackupState(); } catch (_) {}
      if (typeof toast === 'function') toast(`Backup para ${CFG.otherLabel} criado.`);
    } catch (error) {
      console.error('Ponte: falha ao criar backup JSON.', error);
      alert('Não foi possível criar o backup de intercâmbio.');
    }
  }

  function openOtherToReceive() {
    const url = new URL(CFG.otherUrl, location.href);
    url.searchParams.set('bridge', CFG.outgoingToken);
    url.searchParams.set('ts', String(Date.now()));
    location.href = url.href;
  }

  function ensureStyles() {
    if (document.getElementById('rm-cross-env-bridge-style')) return;
    const style = document.createElement('style');
    style.id = 'rm-cross-env-bridge-style';
    style.textContent = `
      .rm-cross-bridge-actions{display:grid;gap:9px;margin-top:12px}
      #rmCrossEnvBridgeGroup .settings-card{overflow:hidden}
      #rmCrossEnvBridgeGroup .settings-row small{line-height:1.35}
    `;
    document.head.appendChild(style);
  }

  function ensureBridgeUi() {
    const importButton = document.getElementById('importBtn');
    const dataGroup = importButton?.closest('.settings-group');
    if (!importButton || !dataGroup) return false;

    let group = document.getElementById('rmCrossEnvBridgeGroup');
    if (!group) {
      group = document.createElement('section');
      group.id = 'rmCrossEnvBridgeGroup';
      group.className = 'settings-group';
      group.innerHTML = `
        <h2>Integração Beta ↔ Oficial</h2>
        <div class="settings-card list-card">
          <button type="button" class="settings-row" id="rmCrossReceiveBtn">
            <span class="settings-row-icon" data-icon="import"></span>
            <span><strong>Receber da ${CFG.otherLabel}</strong><small>Lê a outra versão e permite somar ou substituir com Desfazer</small></span>
            <span class="chevron">›</span>
          </button>
          <div class="setting-separator inset"></div>
          <button type="button" class="settings-row" id="rmCrossSendBtn">
            <span class="settings-row-icon" data-icon="export"></span>
            <span><strong>Enviar para a ${CFG.otherLabel}</strong><small>Abre a ${CFG.otherLabel}, que pedirá confirmação antes de receber</small></span>
            <span class="chevron">›</span>
          </button>
          <div class="setting-separator inset"></div>
          <button type="button" class="settings-row" id="rmCrossJsonBtn">
            <span class="settings-row-icon" data-icon="export"></span>
            <span><strong>Backup para a ${CFG.otherLabel} em JSON</strong><small>Arquivo compatível com as duas versões, com data e horário no nome</small></span>
            <span class="chevron">›</span>
          </button>
        </div>
        <p class="group-footnote">A ponte direta transfere registros e medicamentos. Aparência e preferências continuam separadas entre Beta e Oficial.</p>
      `;
      dataGroup.insertAdjacentElement('afterend', group);
      try { if (typeof hydrateIcons === 'function') hydrateIcons(group); } catch (_) {}
    }

    const receive = document.getElementById('rmCrossReceiveBtn');
    const send = document.getElementById('rmCrossSendBtn');
    const json = document.getElementById('rmCrossJsonBtn');
    if (receive) receive.onclick = openReceivePreview;
    if (send) send.onclick = openOtherToReceive;
    if (json) json.onclick = exportInterchangeBackup;
    return true;
  }

  function handleIncomingBridge() {
    if (incomingHandled) return;
    const params = new URLSearchParams(location.search);
    if (params.get('bridge') !== CFG.incomingToken) return;
    incomingHandled = true;
    try {
      const url = new URL(location.href);
      url.searchParams.delete('bridge');
      url.searchParams.delete('ts');
      history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
    } catch (_) {}
    setTimeout(openReceivePreview, 220);
  }

  function applyBridge() {
    ensureStyles();
    ensureBridgeUi();
    handleIncomingBridge();
  }

  applyBridge();
  window.addEventListener('registro:release-ready', applyBridge);
  document.addEventListener('DOMContentLoaded', applyBridge, { once: true });
  [120, 400, 1000, 2200, 4000, 7000, 10000].forEach(ms => setTimeout(applyBridge, ms));
})();
