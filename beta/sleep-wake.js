/* Monitor de tempo acordado — Beta 1.2.0-beta.45
   Usa o fim do último sono concluído como despertar. O horário manual é
   reservado para quando o usuário acorda sem registrar um sono completo. */
(() => {
  'use strict';

  const RELEASE = '1.2.0-beta.45';
  window.REGISTRO_CURRENT_RELEASE = RELEASE;
  document.getElementById('topVersion')?.replaceChildren(document.createTextNode(`v${RELEASE}`));
  document.getElementById('versionLabel')?.replaceChildren(document.createTextNode(RELEASE));

  const KEY = 'registro-beta-awake-monitor-v1';
  const CRITICAL_HOURS = 16;
  let tick = null;

  const readState = () => {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch (_) { return {}; }
  };
  const writeState = value => localStorage.setItem(KEY, JSON.stringify(value));
  const parseDate = value => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  };
  const human = ms => {
    const minutes = Math.max(0, Math.floor(ms / 60000));
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours < 24) return `${hours}h${String(rest).padStart(2, '0')}`;
    const days = Math.floor(hours / 24);
    const restHours = hours % 24;
    return restHours ? `${days} ${days === 1 ? 'dia' : 'dias'} e ${restHours}h` : `${days} ${days === 1 ? 'dia' : 'dias'}`;
  };
  const localInput = date => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };
  const dateFromInput = value => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  };

  async function latestRegisteredWake(events) {
    return events
      .filter(event => event?.type === 'sleep' && event.endTime)
      .map(event => parseDate(event.endTime))
      .filter(date => date && date <= new Date())
      .sort((a, b) => b - a)[0] || null;
  }

  async function getWake(events) {
    const state = readState();
    const manual = parseDate(state.manualWakeAt);
    const registered = await latestRegisteredWake(events);
    if (manual && (!registered || manual >= registered)) return { date: manual, source: 'manual' };
    if (registered) return { date: registered, source: 'sleep' };
    return null;
  }

  function statusFor(hours) {
    if (hours < 4) return { key: 'fresh', label: 'Acordado há pouco tempo', color: '#31b66b' };
    if (hours < 8) return { key: 'steady', label: 'Tempo acordado moderado', color: '#d2a52d' };
    if (hours < 14) return { key: 'late', label: 'Acordado há bastante tempo', color: '#e58232' };
    if (hours < CRITICAL_HOURS) return { key: 'warning', label: 'Atenção: o período acordado está longo', color: '#e45b32' };
    return { key: 'critical', label: 'Alerta: período acordado acima do limite de referência', color: '#dc4545' };
  }

  function monitorMarkup(wake) {
    if (!wake) return `<div class="rm-awake-empty"><strong>Tempo acordado</strong><span>Registre um sono com o horário em que acordou ou informe o horário manualmente.</span><button type="button" class="secondary-button" id="rmSetWakeBtn">Informar horário de despertar</button></div>`;
    return `<div class="rm-awake-monitor" id="rmAwakeMonitor" data-awake-source="${wake.source}">
      <div class="rm-awake-main"><span class="rm-awake-icon" data-icon="moon"></span><div><strong>Tempo acordado</strong><small id="rmAwakeSince">Desde ${wake.date.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</small></div><b id="rmAwakeValue">—</b></div>
      <div class="rm-awake-status" id="rmAwakeStatus"></div>
      <div class="rm-awake-actions"><button type="button" class="secondary-button" id="rmSetWakeBtn">Corrigir horário</button><button type="button" class="link-button" id="rmUseLastSleepBtn">Usar último sono registrado</button></div>
    </div>`;
  }

  function ensureStyle() {
    if (document.getElementById('rm-awake-style')) return;
    const style = document.createElement('style');
    style.id = 'rm-awake-style';
    style.textContent = `
      #sleepAnalysis{grid-template-columns:repeat(3,minmax(0,1fr))!important}
      .rm-awake-monitor,.rm-awake-empty{grid-column:1/-1;margin-top:2px;padding:13px 12px;border-radius:18px;background:color-mix(in srgb,var(--rm-awake-color,#31b66b) 10%,var(--surface-2));border:1px solid color-mix(in srgb,var(--rm-awake-color,#31b66b) 28%,var(--separator));transition:background-color .35s ease,border-color .35s ease,color .35s ease}
      .rm-awake-main{display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:9px}.rm-awake-icon{width:29px;height:29px;display:grid;place-items:center;color:var(--rm-awake-color,#31b66b)}.rm-awake-icon svg{width:24px;height:24px}.rm-awake-main strong{display:block;font-size:13px;color:var(--rm-awake-color,#31b66b)}.rm-awake-main small{display:block;margin-top:2px;color:var(--secondary);font-size:10.5px}.rm-awake-main>b{font-size:22px;line-height:1;color:var(--rm-awake-color,#31b66b);font-variant-numeric:tabular-nums}.rm-awake-status{margin:10px 0 0;color:var(--rm-awake-color,#31b66b);font-size:11.5px;font-weight:750;line-height:1.35}.rm-awake-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:10px}.rm-awake-actions .secondary-button{border:0;border-radius:11px;padding:8px 10px;font-size:11px;font-weight:750}.rm-awake-actions .link-button{font-size:11px;padding:5px 0}.rm-awake-empty strong{display:block;color:var(--rm-awake-color,#31b66b);font-size:13px}.rm-awake-empty span{display:block;margin-top:3px;color:var(--secondary);font-size:11px;line-height:1.35}.rm-awake-empty button{margin-top:10px;border:0;border-radius:11px;padding:8px 10px;font-size:11px;font-weight:750}.rm-awake-monitor[data-awake-level="critical"]{animation:rm-awake-pulse 2.4s ease-in-out infinite}.rm-awake-monitor[data-awake-level="critical"] .rm-awake-icon{animation:rm-awake-glow 2.4s ease-in-out infinite}@keyframes rm-awake-pulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--rm-awake-color) 0%,transparent)}50%{box-shadow:0 0 0 5px color-mix(in srgb,var(--rm-awake-color) 13%,transparent)}}@keyframes rm-awake-glow{0%,100%{opacity:.72}50%{opacity:1}}@media(prefers-reduced-motion:reduce){.rm-awake-monitor[data-awake-level="critical"],.rm-awake-monitor[data-awake-level="critical"] .rm-awake-icon{animation:none}}
      @media(max-width:390px){.rm-awake-main>b{font-size:19px}.rm-awake-actions{gap:7px}}
    `;
    document.head.appendChild(style);
  }

  function updateMonitor(wake) {
    const box = document.getElementById('rmAwakeMonitor');
    if (!box || !wake) return;
    const elapsed = Math.max(0, Date.now() - wake.date.getTime());
    const hours = elapsed / 3600000;
    const status = statusFor(hours);
    box.style.setProperty('--rm-awake-color', status.color);
    box.dataset.awakeLevel = status.key;
    document.getElementById('rmAwakeValue').textContent = human(elapsed);
    document.getElementById('rmAwakeStatus').textContent = status.label;
    const since = document.getElementById('rmAwakeSince');
    if (since) since.textContent = `Desde ${wake.date.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}`;
  }

  function openWakeEditor(currentWake) {
    const value = currentWake?.date ? localInput(currentWake.date) : localInput(new Date());
    openBackdrop('Horário de despertar', `<div class="field"><label for="rmWakeInput">Acordei às</label><input class="date-input" id="rmWakeInput" type="datetime-local" value="${value}"></div><p class="helper">Esse horário inicia o contador de tempo acordado. Ele não cria um registro de sono.</p>${formButtons('Salvar horário')}`, async event => {
      event.preventDefault();
      const date = dateFromInput(document.getElementById('rmWakeInput')?.value);
      if (!date || date > new Date()) return toast('Informe um horário de despertar válido.');
      writeState({ manualWakeAt: date.toISOString(), updatedAt: new Date().toISOString() });
      closeSheet();
      await refresh();
      toast('Horário de despertar atualizado.');
    });
  }

  async function refresh() {
    const events = (await allEvents()).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    const wake = await getWake(events);
    const sleep = document.getElementById('sleepAnalysis');
    if (!sleep) return;
    let monitor = sleep.querySelector('.rm-awake-monitor,.rm-awake-empty');
    if (!monitor) sleep.insertAdjacentHTML('beforeend', monitorMarkup(wake));
    else monitor.outerHTML = monitorMarkup(wake);
    ensureStyle();
    hydrateIcons(sleep);
    document.getElementById('rmSetWakeBtn')?.addEventListener('click', () => openWakeEditor(wake));
    document.getElementById('rmUseLastSleepBtn')?.addEventListener('click', async () => { localStorage.removeItem(KEY); await refresh(); toast('Usando o último sono registrado.'); });
    if (tick) clearInterval(tick);
    if (wake) { updateMonitor(wake); tick = setInterval(() => updateMonitor(wake), 30000); }
  }

  if (typeof renderAnalysis === 'function') {
    const previous = renderAnalysis;
    renderAnalysis = async function(...args) { const result = await previous(...args); await refresh(); return result; };
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-tab="analysis"]')) setTimeout(refresh, 80);
  }, true);
  window.addEventListener('beforeunload', () => { if (tick) clearInterval(tick); });
  ensureStyle();
  setTimeout(refresh, 120);
})();


/* Carrega o estoque manual de medicamentos da Beta. */
(function(){
  if(window.__RM_MED_STOCK_LOADER__) return;
  window.__RM_MED_STOCK_LOADER__=true;
  var s=document.createElement('script');
  s.src='./medication-inventory.js?v=20260913-2';
  s.async=true;
  document.head.appendChild(s);
})();
