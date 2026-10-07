/* Registro Mental Beta — editor seguro de aparência e proteção da barra inferior. */
(() => {
  'use strict';

  const RELEASE = '1.2.0-beta.18';
  const SETTINGS_KEY = 'registro-beta-settings-v1';
  const DEFAULT_ICON = {
    home: 'home',
    history: 'history',
    analysis: 'chart',
    learning: 'spark',
    settings: 'settings'
  };
  const ICON_CHOICES = [
    ['home', 'Casa'], ['history', 'Histórico'], ['chart', 'Gráfico'],
    ['spark', 'Brilho'], ['settings', 'Ajustes'], ['note', 'Anotação'],
    ['pill', 'Medicamento'], ['moon', 'Lua'], ['bag', 'Compra'], ['heart', 'Saúde']
  ];

  function readSettings() {
    try {
      if (typeof getSettings === 'function') return getSettings();
      return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    } catch (_) {
      return {};
    }
  }

  function writeSettings(settings) {
    if (typeof saveSettings === 'function') saveSettings(settings);
    else localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[char]);
  }

  function tabs() {
    return [...document.querySelectorAll('.tab-bar .tab-item')].map(tab => {
      const key = tab.dataset.tab;
      const iconHolder = tab.querySelector(':scope > span');
      const inferred = DEFAULT_ICON[key] || iconHolder?.dataset.icon || 'note';
      if (iconHolder && !iconHolder.dataset.rmBaseIcon) iconHolder.dataset.rmBaseIcon = iconHolder.dataset.icon || inferred;
      return {
        key,
        tab,
        iconHolder,
        fallbackLabel: tab.querySelector('small')?.textContent?.trim() || key,
        fallbackIcon: iconHolder?.dataset.rmBaseIcon || inferred
      };
    }).filter(item => item.key);
  }

  function activeTheme(settings) {
    const requested = settings.theme || document.documentElement.dataset.theme || 'system';
    if (requested === 'dark' || requested === 'light') return requested;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function defaults(theme) {
    return theme === 'dark'
      ? { barWidth: 95, barHeight: 52, bottomOffset: 10, iconSize: 31, iconY: -1, activeScale: 1.32, textSize: 9, bubbleOpacity: .5, hideLabels: true }
      : { barWidth: 95, barHeight: 52, bottomOffset: 10, iconSize: 28, iconY: -1, activeScale: 1.32, textSize: 9, bubbleOpacity: .25, hideLabels: true };
  }

  function enforceBarLayout() {
    const bar = document.querySelector('.tab-bar');
    if (!bar) return;
    const count = Math.max(1, bar.querySelectorAll(':scope > .tab-item').length);
    bar.style.setProperty('grid-template-columns', `repeat(${count}, minmax(0, 1fr))`, 'important');
    bar.style.setProperty('grid-template-rows', '1fr', 'important');
    bar.querySelectorAll(':scope > .tab-item').forEach(tab => {
      tab.style.minWidth = '0';
      tab.style.minHeight = '0';
    });
  }

  function applyNavigation(settings = readSettings()) {
    const labels = settings.betaNavigationLabels || {};
    const icons = settings.betaNavigationIcons || {};
    const bar = document.querySelector('.tab-bar');
    if (!bar) return;

    tabs().forEach(item => {
      const label = item.tab.querySelector('small');
      if (label && labels[item.key]) label.textContent = labels[item.key];
      const icon = icons[item.key];
      if (item.iconHolder && icon) {
        item.iconHolder.dataset.icon = icon;
        try {
          if (typeof hydrateIcons === 'function') hydrateIcons(item.iconHolder.parentElement);
        } catch (_) {}
      }
    });

    enforceBarLayout();
    try {
      if (typeof applyRegistroTabBar === 'function') applyRegistroTabBar();
    } catch (_) {}
    enforceBarLayout();
  }

  function iconMarkup(name) {
    let body = '';
    try { body = baseIcons?.[name] || baseIcons?.note || ''; } catch (_) {}
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  }

  function range(key, label, min, max, step, unit) {
    return `<div class="rm-ae-control"><div><label for="rmAe-${key}">${label}</label><output id="rmAeOut-${key}"></output></div><input id="rmAe-${key}" data-rm-ae-range="${key}" data-unit="${unit}" type="range" min="${min}" max="${max}" step="${step}"></div>`;
  }

  function installStyles() {
    if (document.getElementById('rm-appearance-editor-styles')) return;
    const style = document.createElement('style');
    style.id = 'rm-appearance-editor-styles';
    style.textContent = `
      .tab-bar{grid-template-rows:1fr!important}
      .tab-bar>.tab-item{min-width:0!important;min-height:0!important}
      .rm-ae{display:grid;gap:14px;padding-top:3px}
      .rm-ae-preview{position:sticky;top:-10px;z-index:5;padding:10px;border:1px solid var(--separator);border-radius:20px;background:color-mix(in srgb,var(--surface) 94%,transparent);box-shadow:0 10px 24px rgba(0,0,0,.12);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
      .rm-ae-preview>strong{display:block;font-size:14px}.rm-ae-preview>small{display:block;margin:3px 0 9px;color:var(--secondary);font-size:11px}
      .rm-ae-stage{position:relative;height:142px;overflow:hidden;border:1px solid var(--separator);border-radius:16px;background:var(--bg)}
      .rm-ae-cards{position:absolute;inset:12px 12px auto;display:grid;grid-template-columns:1fr 1fr;gap:8px}.rm-ae-cards i{height:58px;border:1px solid var(--separator);border-radius:14px;background:var(--surface)}
      .rm-ae-bar{position:absolute;display:grid;gap:0;box-sizing:border-box;overflow:visible;border:1px solid var(--separator);background:color-mix(in srgb,var(--surface) 86%,transparent);box-shadow:0 8px 20px rgba(0,0,0,.14)}
      .rm-ae-bubble{position:absolute;z-index:0;box-sizing:border-box}.rm-ae-tab{position:relative;z-index:1;min-width:0;border:0;background:transparent;color:var(--secondary);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0}.rm-ae-tab>span{display:grid;place-items:center}.rm-ae-tab svg{width:100%;height:100%}.rm-ae-tab small{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .rm-ae-section{padding:15px;border:1px solid var(--separator);border-radius:18px;background:var(--surface)}.rm-ae-section h3{margin:0;font-size:15px}.rm-ae-section>p{margin:4px 0 13px;color:var(--secondary);font-size:11px;line-height:1.4}
      .rm-ae-control+.rm-ae-control{margin-top:14px}.rm-ae-control>div{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:7px}.rm-ae-control label,.rm-ae-switch label{font-size:12px;font-weight:750}.rm-ae-control output{color:var(--accent);font-size:11px;font-weight:800}.rm-ae-control input{width:100%;accent-color:var(--accent)}
      .rm-ae-switch{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.rm-ae-switch button{position:relative;width:49px;height:30px;border:0;border-radius:999px;background:var(--surface-2)}.rm-ae-switch button span{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.18);transition:.18s}.rm-ae-switch button[aria-pressed="true"]{background:var(--accent)}.rm-ae-switch button[aria-pressed="true"] span{transform:translateX(19px)}
      .rm-ae-tabs{display:grid;gap:9px;margin-top:14px}.rm-ae-tab-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(118px,.8fr);gap:8px}.rm-ae-tab-row input,.rm-ae-tab-row select{width:100%;min-width:0;border:1px solid var(--separator);border-radius:12px;padding:11px;background:var(--surface-2);color:var(--text);font-size:12px}
      .rm-ae-actions{position:sticky;bottom:calc(-20px - env(safe-area-inset-bottom));z-index:6;margin:0 -16px calc(-20px - env(safe-area-inset-bottom));padding:12px 16px calc(20px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--surface) 96%,transparent);border-top:1px solid var(--separator);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
      @media(max-width:360px){.rm-ae-tab-row{grid-template-columns:1fr}.rm-ae-preview{position:relative;top:auto}}
    `;
    document.head.appendChild(style);
  }

  function openEditor() {
    const currentSettings = readSettings();
    const theme = activeTheme(currentSettings);
    const nav = tabs();
    const style = {
      ...defaults(theme),
      ...(currentSettings.tabBarStyles?.[theme] || {})
    };
    const draft = {
      ...style,
      labels: Object.fromEntries(nav.map(item => [item.key, currentSettings.betaNavigationLabels?.[item.key] || item.fallbackLabel])),
      icons: Object.fromEntries(nav.map(item => [item.key, currentSettings.betaNavigationIcons?.[item.key] || item.fallbackIcon]))
    };
    let selected = Math.max(0, nav.findIndex(item => item.tab.classList.contains('selected')));

    const tabRows = nav.map(item => `
      <div class="rm-ae-tab-row">
        <input data-rm-ae-label="${escapeHtml(item.key)}" maxlength="18" aria-label="Nome da aba ${escapeHtml(item.fallbackLabel)}">
        <select data-rm-ae-icon="${escapeHtml(item.key)}" aria-label="Ícone da aba ${escapeHtml(item.fallbackLabel)}">${ICON_CHOICES.map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select>
      </div>`).join('');

    openBackdrop('Personalizar aparência', `
      <div class="rm-ae" id="rmAppearanceEditor">
        <section class="rm-ae-preview"><strong>Prévia ao vivo</strong><small>As mudanças só entram no aplicativo quando você salvar.</small><div class="rm-ae-stage"><div class="rm-ae-cards"><i></i><i></i></div><nav class="rm-ae-bar" id="rmAePreviewBar"><span class="rm-ae-bubble" id="rmAePreviewBubble"></span></nav></div></section>
        <section class="rm-ae-section"><h3>Ícones</h3><p>Ajuste o tamanho, a posição e o destaque da opção selecionada.</p>${range('iconSize','Tamanho dos ícones',18,40,1,' px')}${range('iconY','Posição vertical',-10,10,1,' px')}${range('activeScale','Destaque da aba ativa',1,1.6,.01,'×')}</section>
        <section class="rm-ae-section"><h3>Textos e símbolos</h3><p>Renomeie as opções e escolha o símbolo de cada uma.</p><div class="rm-ae-switch"><label for="rmAeShowLabels">Mostrar nomes</label><button type="button" id="rmAeShowLabels" aria-pressed="false"><span></span></button></div>${range('textSize','Tamanho dos textos',7,14,1,' px')}<div class="rm-ae-tabs">${tabRows}</div></section>
        <section class="rm-ae-section"><h3>Barra inferior</h3><p>Ajuste as dimensões sem permitir que os ícones quebrem em outra linha.</p>${range('barWidth','Largura',72,100,1,'%')}${range('barHeight','Altura',46,86,1,' px')}${range('bottomOffset','Distância inferior',2,32,1,' px')}${range('bubbleOpacity','Destaque da seleção',0,1,.01,'')}</section>
        <div class="form-actions rm-ae-actions"><button type="button" class="secondary-button" id="rmAeCancel">Cancelar</button><button type="button" class="primary-button" id="rmAeSave">Salvar e aplicar</button></div>
      </div>`);

    const render = () => {
      const bar = document.getElementById('rmAePreviewBar');
      if (!bar) return;
      bar.innerHTML = '<span class="rm-ae-bubble" id="rmAePreviewBubble"></span>' + nav.map((item, index) => `<button type="button" class="rm-ae-tab" data-rm-ae-select="${index}"><span>${iconMarkup(draft.icons[item.key])}</span><small>${escapeHtml(draft.labels[item.key])}</small></button>`).join('');
      const previewTabs = [...bar.querySelectorAll('.rm-ae-tab')];
      const count = Math.max(1, previewTabs.length);
      const bubble = document.getElementById('rmAePreviewBubble');
      bar.style.width = `${draft.barWidth}%`;
      bar.style.height = `${draft.barHeight}px`;
      bar.style.left = '50%';
      bar.style.bottom = `${Math.min(24, Number(draft.bottomOffset))}px`;
      bar.style.transform = 'translateX(-50%)';
      bar.style.padding = '2px';
      bar.style.borderRadius = '999px';
      bar.style.gridTemplateColumns = `repeat(${count}, minmax(0, 1fr))`;
      requestAnimationFrame(() => {
        if (!bubble) return;
        const innerWidth = Math.max(0, bar.clientWidth - 4);
        const cell = innerWidth / count;
        bubble.style.left = `${2 + selected * cell}px`;
        bubble.style.top = '2px';
        bubble.style.width = `${cell}px`;
        bubble.style.height = `${Math.max(0, bar.clientHeight - 4)}px`;
        bubble.style.borderRadius = '999px';
        bubble.style.background = `color-mix(in srgb,var(--accent) ${Math.round(Number(draft.bubbleOpacity) * 100)}%,transparent)`;
      });
      previewTabs.forEach((tab, index) => {
        const active = index === selected;
        const icon = tab.querySelector('span');
        const label = tab.querySelector('small');
        tab.style.opacity = active ? '1' : '.58';
        tab.style.color = active ? 'var(--accent)' : 'var(--secondary)';
        icon.style.width = `${draft.iconSize}px`;
        icon.style.height = `${draft.iconSize}px`;
        icon.style.transform = `translateY(${draft.iconY}px) scale(${active ? draft.activeScale : 1})`;
        label.style.display = draft.hideLabels ? 'none' : 'block';
        label.style.fontSize = `${draft.textSize}px`;
      });
      document.querySelectorAll('[data-rm-ae-select]').forEach(button => button.onclick = () => { selected = Number(button.dataset.rmAeSelect); render(); });
      document.querySelectorAll('[data-rm-ae-range]').forEach(input => {
        const key = input.dataset.rmAeRange;
        if (document.activeElement !== input) input.value = draft[key];
        const output = document.getElementById(`rmAeOut-${key}`);
        if (output) output.textContent = `${draft[key]}${input.dataset.unit || ''}`;
      });
      const labelsButton = document.getElementById('rmAeShowLabels');
      labelsButton?.setAttribute('aria-pressed', String(!draft.hideLabels));
      document.querySelectorAll('[data-rm-ae-label]').forEach(input => { if (document.activeElement !== input) input.value = draft.labels[input.dataset.rmAeLabel]; });
      document.querySelectorAll('[data-rm-ae-icon]').forEach(select => { select.value = draft.icons[select.dataset.rmAeIcon]; });
    };

    document.querySelectorAll('[data-rm-ae-range]').forEach(input => input.oninput = () => { draft[input.dataset.rmAeRange] = Number(input.value); render(); });
    document.getElementById('rmAeShowLabels').onclick = () => { draft.hideLabels = !draft.hideLabels; render(); };
    document.querySelectorAll('[data-rm-ae-label]').forEach(input => input.oninput = () => { draft.labels[input.dataset.rmAeLabel] = input.value.slice(0, 18); render(); });
    document.querySelectorAll('[data-rm-ae-icon]').forEach(select => select.onchange = () => { draft.icons[select.dataset.rmAeIcon] = select.value; render(); });
    document.getElementById('rmAeCancel').onclick = closeSheet;
    document.getElementById('rmAeSave').onclick = () => {
      const next = readSettings();
      const styleKeys = ['barWidth', 'barHeight', 'bottomOffset', 'iconSize', 'iconY', 'activeScale', 'textSize', 'bubbleOpacity', 'hideLabels'];
      const nextStyle = { ...(next.tabBarStyles?.[theme] || {}) };
      styleKeys.forEach(key => { nextStyle[key] = draft[key]; });
      next.tabBarStyles = { ...(next.tabBarStyles || {}), [theme]: nextStyle };
      next.hideTabLabels = Boolean(draft.hideLabels);
      next.betaNavigationLabels = { ...draft.labels };
      next.betaNavigationIcons = { ...draft.icons };
      writeSettings(next);
      applyNavigation(next);
      closeSheet();
      if (typeof toast === 'function') toast('Aparência aplicada.');
    };
    render();
  }

  function installSettingsEntry() {
    const groups = [...document.querySelectorAll('.view[data-view="settings"] > .settings-group')];
    const group = groups.find(item => /personaliza[cç][aã]o avan[cç]ada|personalizar apar[eê]ncia/i.test(item.querySelector(':scope > h2')?.textContent || ''));
    const primaryButton = document.getElementById('rmAppearanceSettingsBtn');
    if (!primaryButton) return false;
    const description = primaryButton.querySelector('small');
    if (description) description.textContent = 'Prévia ao vivo, ícones, textos, tamanho e posição';
    primaryButton.onclick = openEditor;
    if (group && !group.contains(primaryButton)) group.remove();
    return true;
  }

  function install() {
    installStyles();
    const bar = document.querySelector('.tab-bar');
    if (bar && !bar.__rmAppearanceObserver) {
      bar.__rmAppearanceObserver = new MutationObserver(() => {
        applyNavigation();
        requestAnimationFrame(enforceBarLayout);
      });
      bar.__rmAppearanceObserver.observe(bar, { childList: true });
    }
    const ready = installSettingsEntry();
    applyNavigation();
    return ready && Boolean(bar);
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    install();
    if (attempts >= 25) clearInterval(timer);
  }, 100);
  document.addEventListener('registro:release-ready', () => {
    install();
    setTimeout(install, 250);
    setTimeout(install, 1000);
  }, { once: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();

  window.REGISTRO_APPEARANCE_EDITOR_RELEASE = RELEASE;
})();
