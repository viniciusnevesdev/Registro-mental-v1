/* Registro Mental Beta 1.2.0-beta.18 — base estável sincronizada com a Oficial 1.1.10. */
(() => {
  'use strict';

  const RELEASE = '1.2.0-beta.18';
  const SETTINGS_KEY = 'registro-beta-settings-v1';
  const DIAG_KEY = 'registro-beta-last-diagnostic-v1';
  const COLORS = {
    accent: '#7259D6',
    accentSoft: '#EEEAFF',
    accentStrong: '#533AB7',
    accentSoftDark: '#2D2741',
    accentStrongDark: '#C9BFFF',
    note: '#0188FE',
    med: '#00C0E7',
    sleep: '#6155F4',
    buy: '#FF4900'
  };

  const runtimeErrors = [];
  let watchdogInstalled = false;
  let failureShown = false;
  let consecutiveVisualFailures = 0;

  function safeRun(fn) {
    try { return fn(); } catch (error) { console.warn('Registro Beta: sincronização não bloqueante', error); return undefined; }
  }

  function paintRelease() {
    window.REGISTRO_SHELL_RELEASE = RELEASE;
    window.REGISTRO_V1_RELEASE = RELEASE;
    window.REGISTRO_EXPECTED_RELEASE = RELEASE;
    window.REGISTRO_CURRENT_RELEASE = RELEASE;
    const top = document.getElementById('topVersion');
    const about = document.getElementById('versionLabel');
    if (top) top.textContent = `v${RELEASE}`;
    if (about) about.textContent = RELEASE;
    let style = document.getElementById('rm-beta-sync-release');
    if (!style) {
      style = document.createElement('style');
      style.id = 'rm-beta-sync-release';
      document.head.appendChild(style);
    }
    style.textContent = `#topVersion::after{content:"v${RELEASE}"!important}#versionLabel::after{content:"${RELEASE}"!important}`;
  }

  function normalizeSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const settings = JSON.parse(raw);
      let changed = false;
      ['accent','palette','paleta','colorPalette','colourPalette','visualPalette','themePalette','semanticPalette'].forEach(key => {
        if (Object.prototype.hasOwnProperty.call(settings, key)) {
          delete settings[key];
          changed = true;
        }
      });
      if (!Object.prototype.hasOwnProperty.call(settings, 'hideTabLabels')) {
        settings.hideTabLabels = false;
        changed = true;
      }
      if (changed) localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (_) {}
  }

  function applyColors() {
    const html = document.documentElement;
    delete html.dataset.accent;
    delete html.dataset.semanticPalette;
    html.style.setProperty('--accent', COLORS.accent, 'important');
    html.style.setProperty('--record-note', COLORS.note, 'important');
    html.style.setProperty('--record-med', COLORS.med, 'important');
    html.style.setProperty('--record-sleep', COLORS.sleep, 'important');
    html.style.setProperty('--record-buy', COLORS.buy, 'important');
    html.style.setProperty('--note', COLORS.note, 'important');
    html.style.setProperty('--med', COLORS.med, 'important');
    html.style.setProperty('--sleep', COLORS.sleep, 'important');
    html.style.setProperty('--buy', COLORS.buy, 'important');
  }

  function installStyles() {
    let style = document.getElementById('rm-beta-stable-sync-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'rm-beta-stable-sync-style';
      document.head.appendChild(style);
    }
    style.textContent = `
      :root,html,html[data-theme="light"],html[data-theme="system"]{
        --accent:${COLORS.accent}!important;--accent-soft:${COLORS.accentSoft}!important;--accent-strong:${COLORS.accentStrong}!important;
        --record-note:${COLORS.note}!important;--record-med:${COLORS.med}!important;--record-sleep:${COLORS.sleep}!important;--record-buy:${COLORS.buy}!important;
        --note:${COLORS.note}!important;--med:${COLORS.med}!important;--sleep:${COLORS.sleep}!important;--buy:${COLORS.buy}!important
      }
      html[data-theme="dark"]{
        --accent:${COLORS.accent}!important;--accent-soft:${COLORS.accentSoftDark}!important;--accent-strong:${COLORS.accentStrongDark}!important;
        --record-note:${COLORS.note}!important;--record-med:${COLORS.med}!important;--record-sleep:${COLORS.sleep}!important;--record-buy:${COLORS.buy}!important;
        --note:${COLORS.note}!important;--med:${COLORS.med}!important;--sleep:${COLORS.sleep}!important;--buy:${COLORS.buy}!important
      }
      @media(prefers-color-scheme:dark){html[data-theme="system"]{--accent-soft:${COLORS.accentSoftDark}!important;--accent-strong:${COLORS.accentStrongDark}!important}}

      [data-icon="note"]{color:var(--record-note)!important}
      [data-icon="pill"]{color:var(--record-med)!important}
      [data-icon="moon"]{color:var(--record-sleep)!important}
      [data-icon="bag"]{color:var(--record-buy)!important}
      .kind-note{color:var(--record-note)!important}.kind-medication{color:var(--record-med)!important}.kind-sleep{color:var(--record-sleep)!important}.kind-purchase{color:var(--record-buy)!important}
      .primary-action{--rm-card-accent:var(--record-note)!important}.primary-action .action-icon,.primary-action strong{color:var(--record-note)!important}
      .med-action{--rm-card-accent:var(--record-med)!important}.med-action .action-icon{color:var(--record-med)!important}
      .sleep-action{--rm-card-accent:var(--record-sleep)!important}.sleep-action .action-icon{color:var(--record-sleep)!important}
      .buy-action{--rm-card-accent:var(--record-buy)!important}.buy-action .action-icon{color:var(--record-buy)!important}

      .tab-bar,.capsule-tabbar{background:color-mix(in srgb,var(--surface) 94%,transparent)!important;border-color:color-mix(in srgb,var(--separator) 88%,var(--surface))!important;backdrop-filter:blur(24px) saturate(145%)!important;-webkit-backdrop-filter:blur(24px) saturate(145%)!important}
      .tab-item{opacity:1!important}.tab-item:not(.selected){color:var(--secondary)!important}
      html:not([data-hide-tab-labels="true"]) .tab-item small,html:not([data-hide-tab-labels="true"]) .tab-item .tab-label{display:block!important;visibility:visible!important;opacity:.92!important;font-size:8px!important;line-height:1.05!important}
      html[data-hide-tab-labels="true"] .tab-item small,html[data-hide-tab-labels="true"] .tab-item .tab-label{display:none!important}

      #historyFilters.filter-scroll{overflow-x:auto!important;overflow-y:visible!important;padding-top:8px!important;padding-bottom:10px!important;margin-top:-8px!important;margin-bottom:-10px!important;scroll-padding-inline:4px}
      #historyFilters .filter-chip{position:relative!important}

      #homeTimeline .timeline-item{grid-template-columns:68px minmax(0,1fr) 28px}
      #homeTimeline .rm-home-recent-day{display:block;color:var(--secondary);font-size:10px;font-weight:750;line-height:1.15;white-space:nowrap}
      #homeTimeline .rm-home-recent-hour{display:block;margin-top:3px;color:var(--secondary);font-size:11px;line-height:1.15;font-variant-numeric:tabular-nums}

      #accentControl,.accent-options,#semanticPaletteControl,button[data-accent],button[data-semantic-palette],.semantic-palette-swatches,.semantic-palette-note{display:none!important}
    `;
  }

  function localDayKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function compactRecentDay(timestamp) {
    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime())) return '';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const key = localDayKey(date);
    if (key === localDayKey(today)) return 'Hoje';
    if (key === localDayKey(yesterday)) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }).replace('.', '');
  }

  async function renderLastSix(events) {
    const box = document.getElementById('homeTimeline');
    if (!box || typeof window.eventCard !== 'function') return;
    const recent = (Array.isArray(events) ? events : [])
      .slice()
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0,6);
    box.innerHTML = recent.map(event => window.eventCard(event)).join('');
    [...box.querySelectorAll('.timeline-item')].forEach((card,index) => {
      const event = recent[index];
      const time = card.querySelector('.timeline-time');
      if (!event || !time) return;
      const date = new Date(event.timestamp);
      const hour = Number.isFinite(date.getTime()) ? date.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }) : '';
      time.innerHTML = `<span class="rm-home-recent-day">${compactRecentDay(event.timestamp)}</span><span class="rm-home-recent-hour">${hour}</span>`;
    });
    const empty = document.getElementById('homeEmpty');
    if (empty) {
      empty.textContent = 'Nenhum registro ainda.';
      empty.classList.toggle('hidden', recent.length > 0);
    }
    if (typeof window.hydrateAudio === 'function') await window.hydrateAudio(box);
  }

  function installRecentSixBehavior() {
    const current = window.renderHome;
    if (typeof current !== 'function' || current.__rmRecentSixBeta === true) return;
    const wrapped = async function(events) {
      await current.apply(this, arguments);
      try { await renderLastSix(events); } catch (error) { console.warn('Registro Beta: últimos registros não bloquearam a tela', error); }
    };
    wrapped.__rmRecentSixBeta = true;
    wrapped.__rmRecentSixBase = current;
    window.renderHome = wrapped;
    if (typeof window.allEvents === 'function') Promise.resolve(window.allEvents()).then(renderLastSix).catch(() => {});
  }

  function styleState(element) {
    if (!element) return { exists:false };
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      exists:true,
      tag:element.tagName,
      id:element.id || '',
      className:String(element.className || ''),
      display:style.display,
      visibility:style.visibility,
      opacity:style.opacity,
      width:Math.round(rect.width),
      height:Math.round(rect.height)
    };
  }

  function visualSnapshot() {
    return {
      html: styleState(document.documentElement),
      body: styleState(document.body),
      shell: styleState(document.querySelector('.app-shell')),
      content: styleState(document.getElementById('content')),
      activeView: styleState(document.querySelector('.view.active')),
      tabbar: styleState(document.querySelector('.tab-bar')),
      bootComplete: document.body?.classList.contains('rm-boot-complete') || false,
      release: window.REGISTRO_CURRENT_RELEASE || RELEASE
    };
  }

  function isInvisible(state) {
    return !state?.exists || state.display === 'none' || state.visibility === 'hidden' || Number(state.opacity) === 0 || state.width < 2 || state.height < 2;
  }

  function diagnosticText(reason, snapshot = visualSnapshot()) {
    const bootLog = Array.isArray(window.__RM_BOOT_DIAGNOSTICS) ? window.__RM_BOOT_DIAGNOSTICS.slice(-30) : [];
    return [
      `Registro Mental Beta ${RELEASE}`,
      `Falha: ${reason}`,
      `Horário: ${new Date().toISOString()}`,
      `URL: ${location.href}`,
      `Online: ${navigator.onLine ? 'sim' : 'não'}`,
      `User agent: ${navigator.userAgent}`,
      '',
      `html: ${JSON.stringify(snapshot.html)}`,
      `body: ${JSON.stringify(snapshot.body)}`,
      `app-shell: ${JSON.stringify(snapshot.shell)}`,
      `content: ${JSON.stringify(snapshot.content)}`,
      `active-view: ${JSON.stringify(snapshot.activeView)}`,
      `tabbar: ${JSON.stringify(snapshot.tabbar)}`,
      '',
      `Erros recentes: ${runtimeErrors.length ? runtimeErrors.slice(-10).join(' | ') : 'nenhum capturado'}`,
      '',
      'Boot:',
      ...bootLog.map(item => `${item.t}ms ${item.kind}: ${item.message}${item.extra ? ` — ${item.extra}` : ''}`)
    ].join('\n');
  }

  function saveDiagnostic(text) {
    try { sessionStorage.setItem(DIAG_KEY, text); } catch (_) {}
    try { localStorage.setItem(DIAG_KEY, text); } catch (_) {}
  }

  function copyLegacy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly','');
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return Boolean(ok);
    } catch (_) { return false; }
  }

  function forceVisible(element, displayValue) {
    if (!element) return;
    element.style.setProperty('display', displayValue, 'important');
    element.style.setProperty('visibility', 'visible', 'important');
    element.style.setProperty('opacity', '1', 'important');
  }

  function showEmergencyDiagnostic(reason, snapshot) {
    if (failureShown) return;
    failureShown = true;
    const report = diagnosticText(reason, snapshot);
    saveDiagnostic(report);

    forceVisible(document.documentElement, 'block');
    forceVisible(document.body, 'block');

    const old = document.getElementById('rmBetaEmergencyDiagnostic');
    if (old) old.remove();
    const overlay = document.createElement('section');
    overlay.id = 'rmBetaEmergencyDiagnostic';
    overlay.setAttribute('role','alert');
    overlay.style.cssText = 'position:fixed!important;inset:0!important;z-index:2147483647!important;display:block!important;visibility:visible!important;opacity:1!important;overflow:auto!important;padding:calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))!important;background:#f5f5f7!important;color:#111114!important;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif!important;box-sizing:border-box!important';
    overlay.innerHTML = '<div style="width:min(100%,520px);margin:0 auto;background:#fff;border-radius:24px;padding:20px;box-shadow:0 12px 38px rgba(0,0,0,.10)"><h1 style="margin:0 0 8px;font-size:24px">Falha visual detectada</h1><p style="margin:0 0 14px;color:#6e6e73;font-size:13px;line-height:1.45">A Beta carregou, mas a interface ficou invisível ou sem área útil. O estado quebrado foi salvo antes da recuperação visual.</p><pre id="rmBetaEmergencyReport" style="margin:0;padding:12px;border-radius:14px;background:#111114;color:#f5f5f7;white-space:pre-wrap;word-break:break-word;font:11px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;max-height:50vh;overflow:auto"></pre><div style="display:grid;gap:9px;margin-top:14px"><button id="rmBetaEmergencyCopy" type="button" style="border:0;border-radius:14px;padding:13px;background:#111114;color:#fff;font:700 14px/1.2 inherit">Copiar diagnóstico</button><button id="rmBetaEmergencyPage" type="button" style="border:0;border-radius:14px;padding:13px;background:#ededf2;color:#17171a;font:700 14px/1.2 inherit">Abrir diagnóstico independente</button><button id="rmBetaEmergencyRetry" type="button" style="border:0;border-radius:14px;padding:13px;background:#ededf2;color:#17171a;font:700 14px/1.2 inherit">Reabrir a Beta</button></div></div>';
    document.body.appendChild(overlay);
    document.getElementById('rmBetaEmergencyReport').textContent = report;
    document.getElementById('rmBetaEmergencyCopy').onclick = async event => {
      let ok = false;
      try { await navigator.clipboard.writeText(report); ok = true; } catch (_) { ok = copyLegacy(report); }
      event.currentTarget.textContent = ok ? 'Diagnóstico copiado' : 'Copie o texto acima';
    };
    document.getElementById('rmBetaEmergencyPage').onclick = () => { location.href = `./diagnostico.html?from=watchdog&t=${Date.now()}`; };
    document.getElementById('rmBetaEmergencyRetry').onclick = () => { location.replace(`./?v=${encodeURIComponent(RELEASE)}&retry=${Date.now()}`); };
  }

  function checkVisualHealth() {
    if (failureShown || !document.body) return;
    const ready = document.body.classList.contains('rm-boot-complete') || Boolean(window.REGISTRO_CURRENT_RELEASE);
    if (!ready) return;
    const snapshot = visualSnapshot();
    const bad = isInvisible(snapshot.html) || isInvisible(snapshot.body) || isInvisible(snapshot.shell) || isInvisible(snapshot.content) || isInvisible(snapshot.activeView);
    if (!bad) {
      consecutiveVisualFailures = 0;
      return;
    }
    consecutiveVisualFailures += 1;
    if (consecutiveVisualFailures >= 2) showEmergencyDiagnostic('interface invisível após a inicialização', snapshot);
  }

  function installWatchdog() {
    if (watchdogInstalled) return;
    watchdogInstalled = true;
    window.addEventListener('error', event => {
      runtimeErrors.push(`${event.message || 'Erro JavaScript'} @ ${String(event.filename || '').split('/').pop() || 'runtime'}`);
      if (runtimeErrors.length > 30) runtimeErrors.shift();
    });
    window.addEventListener('unhandledrejection', event => {
      runtimeErrors.push(`Promise rejeitada: ${event.reason?.message || String(event.reason || '')}`);
      if (runtimeErrors.length > 30) runtimeErrors.shift();
    });
    setInterval(checkVisualHealth, 1200);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(checkVisualHealth, 150); });
  }

  function applyAll() {
    paintRelease();
    normalizeSettings();
    installStyles();
    applyColors();
    installRecentSixBehavior();
  }

  installWatchdog();
  safeRun(applyAll);
  document.addEventListener('DOMContentLoaded', () => safeRun(applyAll), { once:true });
  window.addEventListener('registro:release-ready', () => safeRun(applyAll));
  [100,350,800,1500,3000,5000].forEach(ms => setTimeout(() => safeRun(applyAll), ms));
  document.addEventListener('click', event => {
    if (event.target.closest('.tab-item,[data-theme-value],#hideTabLabelsToggle,#homeOptionsBtn,#rmAeSave')) setTimeout(() => safeRun(applyAll), 0);
  }, { passive:true });

  window.REGISTRO_BETA_STABLE_SYNC_READY = true;
})();
