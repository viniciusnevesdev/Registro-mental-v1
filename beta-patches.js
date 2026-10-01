/* Registro Mental Beta — alterações experimentais entram aqui antes de promoção ao Oficial. */
(() => {
  'use strict';

  window.REGISTRO_BETA_PATCHES_READY = true;

  const normalize = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  function installBetaUIStyles() {
    if (document.getElementById('rm-beta-ui-refinements')) return;
    const style = document.createElement('style');
    style.id = 'rm-beta-ui-refinements';
    style.textContent = `
      /* Fechamento das sheets: somente o X, sem caixa/círculo. */
      .sheet-close,
      .sheet-header .sheet-close,
      button.sheet-close {
        width: 48px !important;
        height: 48px !important;
        min-width: 48px !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        color: var(--text) !important;
        display: grid !important;
        place-items: center !important;
      }
      .sheet-close::before,
      .sheet-close::after { content: none !important; }
      .sheet-close:active {
        transform: scale(.90);
        opacity: .62;
      }
      .sheet-close .rm-beta-x-icon {
        width: 33px !important;
        height: 33px !important;
        display: block;
        overflow: visible;
      }

      /* Cadastro de medicamentos: ação única ocupa toda a largura. */
      .registry-toolbar.rm-beta-single-action {
        display: block !important;
      }
      .registry-toolbar.rm-beta-single-action #addMedicationBtn {
        display: block !important;
        width: 100% !important;
        min-width: 0 !important;
        margin: 0 !important;
      }

      /* Um único design para cartões de registros: Histórico e Mais recentes. */
      .rm-v28-timeline .timeline-main {
        padding-left: 0 !important;
      }

      /* Anotações: cabeçalho mais coeso e conteúdo com alinhamento óptico. */
      .rm-v28-timeline.rm-type-note .rm-card-header-main {
        gap: 5px !important;
      }
      .rm-v28-timeline.rm-type-note .timeline-main {
        padding-left: 8px !important;
      }
      .rm-v28-timeline.rm-type-note .rm-card-header-main .rm-beta-header-mood {
        width: 22px !important;
        height: 22px !important;
        min-width: 22px !important;
        border-radius: 7px !important;
        margin-left: 4px !important;
        font-size: 12px !important;
        line-height: 1 !important;
        font-weight: 850 !important;
        box-shadow: 0 0 6px var(--rm-mini-glow) !important;
      }

      /* Tema: título e seletor em uma única linha mais compacta. */
      .setting-block.rm-beta-theme-row {
        display: grid !important;
        grid-template-columns: auto minmax(0, 1fr) !important;
        align-items: center !important;
        gap: 16px !important;
        padding-top: 14px !important;
        padding-bottom: 14px !important;
      }
      .rm-beta-theme-row .setting-label {
        margin: 0 !important;
        min-width: max-content !important;
      }
      .rm-beta-theme-row .setting-label small { display: none !important; }
      .rm-beta-theme-row #themeControl {
        margin: 0 !important;
        width: 100% !important;
        min-height: 42px !important;
      }
      .rm-beta-theme-row #themeControl button {
        min-height: 38px !important;
        padding-top: 7px !important;
        padding-bottom: 7px !important;
      }

      /* Efeitos visuais: descrição individual logo abaixo de cada opção. */
      #visualModeSetting.rm-beta-visual-setting,
      .setting-block.rm-beta-visual-setting {
        padding-top: 16px !important;
        padding-bottom: 16px !important;
      }
      .rm-beta-visual-setting #visualModeHelp { display: none !important; }
      .rm-beta-visual-setting #visualModeControl { margin-bottom: 8px !important; }
      .rm-beta-visual-notes {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        padding: 0 6px;
      }
      .rm-beta-visual-note {
        text-align: center;
        font-size: 11px;
        line-height: 1.28;
        color: var(--text-secondary, #8e8e93);
        opacity: .42;
        transition: opacity .18s ease, color .18s ease;
      }
      .rm-beta-visual-note.is-active {
        opacity: .95;
        color: var(--text, currentColor);
      }

      /* Registro de medicamento: a quantidade pertence às compras/estoque. */
      #doseFields.rm-beta-dose-compact {
        display: grid !important;
        grid-template-columns: minmax(0, 1.35fr) minmax(0, .65fr) !important;
        gap: 10px !important;
        align-items: end !important;
      }
      #doseFields.rm-beta-dose-compact .field-grid { display: contents !important; }
      #doseFields.rm-beta-dose-compact .field-grid > .field,
      #doseFields.rm-beta-dose-compact > .field {
        min-width: 0 !important;
        margin: 0 !important;
      }
      #doseFields.rm-beta-dose-compact label {
        font-size: 11px !important;
        line-height: 1.15 !important;
        min-height: 26px;
        display: flex;
        align-items: flex-end;
      }
      #doseFields.rm-beta-dose-compact input,
      #doseFields.rm-beta-dose-compact select {
        width: 100% !important;
        min-width: 0 !important;
        padding-left: 11px !important;
        padding-right: 11px !important;
      }
      #doseFields.rm-beta-dose-compact .dose-result {
        grid-column: 1 / -1 !important;
        margin-top: 2px !important;
        min-height: 48px !important;
        padding: 10px 13px !important;
        border-radius: 15px !important;
        border: 1px solid rgba(125, 92, 255, .18) !important;
        background: rgba(125, 92, 255, .08) !important;
        box-shadow: none !important;
      }
      #doseFields.rm-beta-dose-compact .dose-result span {
        opacity: .72 !important;
        font-size: 12px !important;
      }
      #doseFields.rm-beta-dose-compact .dose-result strong {
        font-size: 16px !important;
        color: var(--accent, #7d5cff) !important;
      }

      /* Seletor de modo de dose: mais próximo da linguagem visual dos campos. */
      #doseMode.rm-beta-dose-mode {
        min-height: 44px !important;
        padding: 3px !important;
        border: 1px solid rgba(142, 142, 147, .28) !important;
        border-radius: 14px !important;
        background: rgba(142, 142, 147, .08) !important;
        box-shadow: none !important;
      }
      #doseMode.rm-beta-dose-mode::before {
        border-radius: 11px !important;
        background: rgba(125, 92, 255, .16) !important;
        border: 1px solid rgba(125, 92, 255, .20) !important;
        box-shadow: none !important;
      }
      #doseMode.rm-beta-dose-mode button {
        min-height: 36px !important;
        padding: 7px 8px !important;
        font-size: 12px !important;
      }

      /* Dados e atualização: ações importantes continuam legíveis sem competir. */
      .rm-beta-update-row {
        display: grid !important;
        grid-template-columns: auto minmax(0, 1fr) auto !important;
        align-items: center !important;
        gap: 11px !important;
        padding: 12px 14px !important;
      }
      .rm-beta-update-row .rm-update-button {
        min-height: 34px !important;
        padding: 7px 11px !important;
        border: 0 !important;
        border-radius: 999px !important;
        white-space: nowrap;
      }
      #rmBetaUndoImportBtn[hidden],
      #rmBetaUndoImportSeparator[hidden] { display: none !important; }
      #rmBetaUndoImportBtn strong { color: var(--accent, #7d5cff); }
      .rm-beta-import-choice {
        display: grid;
        gap: 6px;
        margin-bottom: 13px;
      }
      .rm-beta-import-choice small {
        padding: 0 4px;
        color: var(--secondary);
        font-size: 12px;
        line-height: 1.35;
      }
      .rm-beta-import-choice.is-destructive button {
        color: var(--danger) !important;
        border-color: color-mix(in srgb, var(--danger) 32%, var(--separator)) !important;
        background: color-mix(in srgb, var(--danger) 6%, var(--surface)) !important;
      }

      /* Editor de aparência: a prévia fica visível enquanto os controles são ajustados. */
      .rm-beta-visual-editor { display: grid; gap: 14px; padding-top: 4px; }
      .rm-beta-visual-preview {
        position: sticky;
        top: -10px;
        z-index: 4;
        padding: 9px;
        border: 1px solid var(--separator);
        border-radius: 20px;
        background: color-mix(in srgb, var(--surface) 94%, transparent);
        box-shadow: 0 10px 22px rgba(0,0,0,.10);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }
      .rm-beta-visual-preview-copy { padding: 2px 4px 8px; }
      .rm-beta-visual-preview-copy strong { display: block; font-size: 13px; }
      .rm-beta-visual-preview-copy small { display: block; margin-top: 2px; color: var(--secondary); font-size: 11px; }
      .rm-beta-preview-stage {
        position: relative;
        min-height: 148px;
        overflow: hidden;
        border: 1px solid var(--separator);
        border-radius: 15px;
        background: var(--bg);
      }
      .rm-beta-preview-cards { position: absolute; top: 13px; left: 12px; right: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .rm-beta-preview-cards span { height: 59px; border: 1px solid var(--separator); border-radius: 14px; background: var(--surface); }
      .rm-beta-preview-bar {
        position: absolute;
        z-index: 1;
        display: grid;
        align-items: stretch;
        isolation: isolate;
        overflow: hidden;
      }
      .rm-beta-preview-bubble { position: absolute; z-index: 0; pointer-events: none; }
      .rm-beta-preview-tab {
        z-index: 1;
        min-width: 0;
        border: 0;
        background: transparent;
        color: inherit;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0;
      }
      .rm-beta-preview-tab > span { display: grid; place-items: center; line-height: 0; }
      .rm-beta-preview-tab svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
      .rm-beta-preview-tab small { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1; }
      .rm-beta-editor-section { padding: 13px; border: 1px solid var(--separator); border-radius: 18px; background: var(--surface-2); }
      .rm-beta-editor-section h3 { margin: 0 0 5px; font-size: 14px; }
      .rm-beta-editor-section > p { margin: 0 0 9px; color: var(--secondary); font-size: 11px; line-height: 1.35; }
      .rm-beta-editor-control { padding: 10px 0; border-top: 1px solid var(--separator); }
      .rm-beta-editor-control:first-of-type { border-top: 0; }
      .rm-beta-editor-control-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 5px; }
      .rm-beta-editor-control label { font-size: 13px; font-weight: 700; }
      .rm-beta-editor-control output { color: var(--secondary); font-size: 11px; font-variant-numeric: tabular-nums; }
      .rm-beta-editor-control input[type=range] { width: 100%; accent-color: var(--accent); }
      .rm-beta-editor-switch { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 6px 0 9px; }
      .rm-beta-editor-switch button { width: 48px; height: 29px; border: 0; border-radius: 999px; padding: 2px; background: var(--tertiary); }
      .rm-beta-editor-switch button span { display: block; width: 25px; height: 25px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.22); transition: transform .16s ease; }
      .rm-beta-editor-switch button.is-on { background: var(--accent); }
      .rm-beta-editor-switch button.is-on span { transform: translateX(19px); }
      .rm-beta-editor-tabs { display: grid; gap: 8px; }
      .rm-beta-editor-tab { display: grid; grid-template-columns: 1fr 104px; gap: 8px; }
      .rm-beta-editor-tab input, .rm-beta-editor-tab select { min-width: 0; width: 100%; border: 1px solid var(--separator); border-radius: 11px; padding: 9px 10px; background: var(--surface); color: var(--text); }
      .rm-beta-editor-actions { margin-top: -1px; }

      @media (max-width: 370px) {
        #doseFields.rm-beta-dose-compact {
          gap: 7px !important;
          grid-template-columns: minmax(0, 1.35fr) minmax(0, .65fr) !important;
        }
        #doseFields.rm-beta-dose-compact input,
        #doseFields.rm-beta-dose-compact select {
          padding-left: 8px !important;
          padding-right: 8px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function replaceCloseIcons() {
    document.querySelectorAll('.sheet-close').forEach(button => {
      if (button.dataset.rmBetaSimpleX === '1') return;
      button.dataset.rmBetaSimpleX = '1';
      button.innerHTML = `
        <svg class="rm-beta-x-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <path d="M7 7L25 25M25 7L7 25"
            fill="none"
            stroke="currentColor"
            stroke-width="2.6"
            stroke-linecap="round" />
        </svg>`;
    });
  }

  function presentationSummaryWithoutRepeatedReference(presentation, medication) {
    const strength = presentation?.strengthValue
      ? `${presentation.strengthValue} ${presentation.strengthUnit || ''}`.trim()
      : 'Sem dosagem';

    const reference = normalize(medication?.referenceName);
    const extras = [presentation?.brand, presentation?.lab]
      .filter(Boolean)
      .filter(value => !reference || normalize(value) !== reference);

    return extras.length ? `${strength} · ${extras.join(' · ')}` : strength;
  }

  async function refineMedicationRegistry() {
    let meds = [];
    try {
      if (typeof window.allMedications === 'function') meds = await window.allMedications();
    } catch (error) {
      console.warn('Beta: não foi possível ler os medicamentos para refinar a lista.', error);
    }

    const byId = new Map(meds.map(med => [String(med.id), med]));

    const addButton = document.getElementById('addMedicationBtn');
    const toolbar = addButton?.closest('.registry-toolbar');
    if (toolbar) {
      toolbar.querySelector('[data-cancel]')?.remove();
      toolbar.classList.add('rm-beta-single-action');
    }

    document.querySelectorAll('.registry-card[data-open-med]').forEach(card => {
      const med = byId.get(String(card.dataset.openMed));
      if (!med) return;

      const count = Array.isArray(med.notes) ? med.notes.length : 0;
      const meta = card.querySelector('.registry-meta');
      if (meta) meta.textContent = `${count} ${count === 1 ? 'nota' : 'notas'}`;

      const subtitle = card.querySelector('small');
      if (subtitle) {
        const summaries = (med.presentations || [])
          .map(presentation => presentationSummaryWithoutRepeatedReference(presentation, med));
        subtitle.textContent = summaries.length ? summaries.join(' · ') : 'Sem apresentações';
      }
    });
  }

  function updateVisualModeNotes() {
    const control = document.getElementById('visualModeControl');
    const notes = control?.parentElement?.querySelector('.rm-beta-visual-notes');
    if (!control || !notes) return;

    const selected = control.querySelector('[data-visual-mode].selected')?.dataset.visualMode;
    notes.querySelectorAll('[data-note-mode]').forEach(note => {
      note.classList.toggle('is-active', note.dataset.noteMode === selected);
    });
  }

  function refineSettingsUI() {
    const settingsView = document.querySelector('.view[data-view="settings"]');
    if (settingsView) {
      const groups = [...settingsView.querySelectorAll(':scope > .settings-group')];
      const byTitle = title => groups.find(group => normalize(group.querySelector(':scope > h2')?.textContent) === normalize(title));
      const appearance = byTitle('Aparência');
      const medication = byTitle('Medicamentos');
      const health = byTitle('Saúde e sono') || byTitle('Saúde');
      const advanced = byTitle('Personalização avançada');
      const data = byTitle('Dados') || byTitle('Dados e atualização');
      const development = byTitle('Desenvolvimento');
      const about = byTitle('Sobre');

      if (medication && health) {
        const medicationRow = medication.querySelector('#medicationRegistryBtn');
        const healthCard = health.querySelector('.settings-card');
        if (medicationRow && healthCard) {
          const separator = document.createElement('div');
          separator.className = 'setting-separator inset';
          healthCard.prepend(separator);
          healthCard.prepend(medicationRow);
        }
        medication.remove();
      }
      if (health?.querySelector(':scope > h2')) health.querySelector(':scope > h2').textContent = 'Saúde';
      if (data?.querySelector(':scope > h2')) data.querySelector(':scope > h2').textContent = 'Dados e atualização';

      const header = settingsView.querySelector(':scope > .page-header');
      let anchor = header;
      [health, data, appearance, advanced, development, about].filter(Boolean).forEach(group => {
        anchor.insertAdjacentElement('afterend', group);
        anchor = group;
      });

      const updateButton = document.getElementById('rmForceUpdateBtn');
      const dataCard = data?.querySelector('.settings-card');
      if (updateButton && dataCard && !document.getElementById('rmBetaUpdateRow')) {
        const previousHandler = updateButton.onclick;
        const row = document.createElement('div');
        row.id = 'rmBetaUpdateRow';
        row.className = 'settings-row rm-beta-update-row';
        row.innerHTML = `<span class="settings-row-icon" data-icon="clock"></span><span><strong>Atualizar aplicativo</strong><small>Busca a versão mais recente sem apagar seus dados</small></span>`;
        updateButton.closest('.rm-update-row')?.remove();
        row.appendChild(updateButton);
        updateButton.onclick = previousHandler;
        const separator = document.createElement('div');
        separator.className = 'setting-separator inset';
        dataCard.prepend(separator);
        dataCard.prepend(row);
        try { if (typeof hydrateIcons === 'function') hydrateIcons(row); } catch (_) {}
      }

      ensureUndoImportRow(dataCard);
      // O editor seguro é instalado por appearance-editor.js.
    }

    const themeControl = document.getElementById('themeControl');
    const themeBlock = themeControl?.closest('.setting-block');
    if (themeBlock) themeBlock.classList.add('rm-beta-theme-row');

    const visualControl = document.getElementById('visualModeControl');
    const visualBlock = visualControl?.closest('.setting-block');
    if (visualControl && visualBlock) {
      visualBlock.classList.add('rm-beta-visual-setting');
      document.getElementById('visualModeHelp')?.setAttribute('aria-hidden', 'true');

      let notes = visualBlock.querySelector('.rm-beta-visual-notes');
      if (!notes) {
        notes = document.createElement('div');
        notes.className = 'rm-beta-visual-notes';
        visualControl.insertAdjacentElement('afterend', notes);
      }

      const copy = {
        optimized: 'Menos efeitos, mais fluidez',
        ultra: 'Mais efeitos e profundidade'
      };
      const buttons = [...visualControl.querySelectorAll('[data-visual-mode]')];
      notes.innerHTML = buttons.map(button =>
        `<span class="rm-beta-visual-note" data-note-mode="${button.dataset.visualMode}">${copy[button.dataset.visualMode] || ''}</span>`
      ).join('');

      if (!visualControl.dataset.rmBetaNotesObserved) {
        visualControl.dataset.rmBetaNotesObserved = '1';
        new MutationObserver(updateVisualModeNotes).observe(visualControl, {
          subtree: true,
          attributes: true,
          attributeFilter: ['class']
        });
        visualControl.addEventListener('click', () => requestAnimationFrame(updateVisualModeNotes));
      }
      updateVisualModeNotes();
    }
  }

  const BETA_NAVIGATION = [
    { key: 'home', fallback: 'Início' },
    { key: 'history', fallback: 'Histórico' },
    { key: 'chart', fallback: 'Análises' },
    { key: 'settings', fallback: 'Ajustes' }
  ];

  const BETA_ICON_CHOICES = [
    ['home', 'Casa'], ['history', 'Histórico'], ['chart', 'Gráfico'], ['settings', 'Ajustes'],
    ['note', 'Anotação'], ['pill', 'Medicamento'], ['moon', 'Lua'], ['bag', 'Compra'],
    ['spark', 'Brilho'], ['heart', 'Saúde']
  ];

  function betaNavIconMarkup(key) {
    let markup = '';
    try { markup = window.REGISTRO_NAV_ICONS?.[key] || (typeof baseIcons !== 'undefined' ? baseIcons[key] : ''); } catch (_) {}
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${markup || ''}</svg>`;
  }

  function betaEditorTheme(settings) {
    try {
      if (typeof effectiveRegistroTheme === 'function') return effectiveRegistroTheme(settings);
    } catch (_) {}
    return settings.theme === 'dark' ? 'dark' : 'light';
  }

  function betaCurrentNavigationLabels(settings) {
    const saved = settings.betaNavigationLabels || {};
    return Object.fromEntries(BETA_NAVIGATION.map(({ key, fallback }) => {
      const current = document.querySelector(`.tab-item[data-tab="${key}"] small`)?.textContent?.trim();
      return [key, saved[key] || current || fallback];
    }));
  }

  function applyBetaNavigationLabels(settings = getSettings()) {
    const labels = settings.betaNavigationLabels || {};
    BETA_NAVIGATION.forEach(({ key, fallback }) => {
      const target = document.querySelector(`.tab-item[data-tab="${key}"] small`);
      if (target) target.textContent = labels[key] || fallback;
    });
  }

  function betaEditorDefaults(theme) {
    return theme === 'dark'
      ? { barWidth: 95, barHeight: 52, bottomOffset: 10, barPadding: 1, barRadius: 80, barX: 0, barOpacity: .11, bubbleOpacity: .5, iconSize: 31, activeScale: 1.32, iconY: -1, textSize: 8, textWeight: 650, itemGap: 1, hideLabels: true, activeColor: '#000000', inactiveColor: '#ffffff', inactiveOpacity: .48 }
      : { barWidth: 95, barHeight: 52, bottomOffset: 10, barPadding: 1, barRadius: 80, barX: 0, barOpacity: .11, bubbleOpacity: .25, iconSize: 28, activeScale: 1.32, iconY: -1, textSize: 8, textWeight: 650, itemGap: 1, hideLabels: true, activeColor: '#000000', inactiveColor: '#000000', inactiveOpacity: .61 };
  }

  function prepareAdvancedPersonalizationUI(group) {
    if (!group) return;
    const heading = group.querySelector(':scope > h2');
    const card = group.querySelector('.settings-card');
    if (!heading || !card || card.dataset.rmBetaVisualEditor === '1') return;

    heading.textContent = 'Personalizar aparência';
    card.dataset.rmBetaVisualEditor = '1';
    card.innerHTML = `
      <button class="settings-row" id="rmBetaVisualEditorBtn" type="button">
        <span class="settings-row-icon" data-icon="settings"></span>
        <span><strong>Editar aparência</strong><small>Ícones, nomes, tamanho, posição e barra inferior</small></span>
        <span class="chevron">›</span>
      </button>`;
    const button = document.getElementById('rmBetaVisualEditorBtn');
    button.onclick = openBetaVisualEditor;
    try { if (typeof hydrateIcons === 'function') hydrateIcons(card); } catch (_) {}
  }

  function installSettingsObserver() {
    const settingsView = document.querySelector('.view[data-view="settings"]');
    if (!settingsView || settingsView.dataset.rmBetaSettingsObserved === '1') return;
    settingsView.dataset.rmBetaSettingsObserved = '1';
    let scheduled = false;
    new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        refineSettingsUI();
      });
    }).observe(settingsView, { childList: true, subtree: true });
  }

  function betaRangeControl(key, label, min, max, step, unit = '') {
    return `<div class="rm-beta-editor-control"><div class="rm-beta-editor-control-head"><label for="rmBetaEdit-${key}">${label}</label><output id="rmBetaOutput-${key}"></output></div><input id="rmBetaEdit-${key}" data-beta-editor-range="${key}" type="range" min="${min}" max="${max}" step="${step}" data-unit="${unit}"></div>`;
  }

  function openBetaVisualEditor() {
    const settings = getSettings();
    const theme = betaEditorTheme(settings);
    const draft = {
      ...betaEditorDefaults(theme),
      ...(settings.tabBarStyles?.[theme] || {}),
      labels: betaCurrentNavigationLabels(settings),
      icons: Object.fromEntries(BETA_NAVIGATION.map(({ key }) => [key, settings.iconOverrides?.[key]?.type === 'bank' ? settings.iconOverrides[key].value : key]))
    };
    let selected = 0;

    openBackdrop('Editar aparência', `
      <div class="rm-beta-visual-editor" id="rmBetaVisualEditor">
        <section class="rm-beta-visual-preview">
          <div class="rm-beta-visual-preview-copy"><strong>Prévia ao vivo</strong><small>Toque numa aba da prévia para mover a seleção.</small></div>
          <div class="rm-beta-preview-stage">
            <div class="rm-beta-preview-cards"><span></span><span></span></div>
            <nav class="rm-beta-preview-bar" id="rmBetaPreviewBar" aria-label="Prévia da barra inferior"><span class="rm-beta-preview-bubble" id="rmBetaPreviewBubble"></span></nav>
          </div>
        </section>

        <section class="rm-beta-editor-section">
          <h3>Ícones</h3><p>Ajustes valem para a barra inferior inteira.</p>
          ${betaRangeControl('iconSize', 'Tamanho dos ícones', 18, 40, 1, 'px')}
          ${betaRangeControl('iconY', 'Posição vertical', -10, 10, 1, 'px')}
          ${betaRangeControl('activeScale', 'Destaque da aba ativa', 1, 1.6, .01, '×')}
        </section>

        <section class="rm-beta-editor-section">
          <h3>Textos e ícones das abas</h3><p>Você pode renomear cada aba e trocar seu ícone. Nada é aplicado antes de salvar.</p>
          <div class="rm-beta-editor-switch"><label for="rmBetaEdit-hideLabels">Mostrar nomes das abas</label><button type="button" id="rmBetaEdit-hideLabels" aria-pressed="false"><span></span></button></div>
          ${betaRangeControl('textSize', 'Tamanho dos textos', 7, 14, 1, 'px')}
          <div class="rm-beta-editor-tabs">${BETA_NAVIGATION.map(({ key, fallback }) => `<div class="rm-beta-editor-tab"><input id="rmBetaLabel-${key}" data-beta-editor-label="${key}" maxlength="18" aria-label="Nome da aba ${fallback}"><select id="rmBetaIcon-${key}" data-beta-editor-icon="${key}" aria-label="Ícone da aba ${fallback}">${BETA_ICON_CHOICES.map(([value, name]) => `<option value="${value}">${name}</option>`).join('')}</select></div>`).join('')}</div>
        </section>

        <section class="rm-beta-editor-section">
          <h3>Barra inferior</h3><p>Altere somente o essencial; os detalhes avançados continuam preservados.</p>
          ${betaRangeControl('barWidth', 'Largura da barra', 70, 100, 1, '%')}
          ${betaRangeControl('barHeight', 'Altura da barra', 44, 86, 1, 'px')}
          ${betaRangeControl('bottomOffset', 'Distância inferior', 2, 34, 1, 'px')}
          ${betaRangeControl('bubbleOpacity', 'Visibilidade da seleção', 0, 1, .01, '')}
        </section>

        <div class="form-actions rm-beta-editor-actions"><button type="button" class="secondary-button" id="rmBetaVisualCancel">Cancelar</button><button type="button" class="primary-button" id="rmBetaVisualApply">Salvar e aplicar</button></div>
      </div>
    `);

    const render = () => {
      const bar = document.getElementById('rmBetaPreviewBar');
      const bubble = document.getElementById('rmBetaPreviewBubble');
      if (!bar || !bubble) return;
      bar.innerHTML = '<span class="rm-beta-preview-bubble" id="rmBetaPreviewBubble"></span>';
      const freshBubble = document.getElementById('rmBetaPreviewBubble');
      BETA_NAVIGATION.forEach(({ key }, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'rm-beta-preview-tab';
        button.innerHTML = `<span>${betaNavIconMarkup(draft.icons[key])}</span><small>${esc(draft.labels[key])}</small>`;
        button.onclick = () => { selected = index; render(); };
        bar.appendChild(button);
      });
      const tabs = [...bar.querySelectorAll('.rm-beta-preview-tab')];
      const count = tabs.length || 1;
      bar.style.width = `${Math.min(98, Number(draft.barWidth))}%`;
      bar.style.height = `${draft.barHeight}px`;
      bar.style.left = '50%';
      bar.style.bottom = `${Math.max(2, Number(draft.bottomOffset))}px`;
      bar.style.padding = `${draft.barPadding}px`;
      bar.style.borderRadius = `${draft.barRadius}px`;
      bar.style.transform = `translateX(calc(-50% + ${draft.barX}px))`;
      bar.style.gridTemplateColumns = `repeat(${count}, minmax(0, 1fr))`;
      bar.style.background = `color-mix(in srgb, var(--surface) ${Math.round(Number(draft.barOpacity) * 100)}%, transparent)`;
      bar.style.border = '1px solid var(--separator)';
      requestAnimationFrame(() => {
        const innerWidth = Math.max(0, bar.clientWidth - Number(draft.barPadding) * 2);
        const innerHeight = Math.max(0, bar.clientHeight - Number(draft.barPadding) * 2);
        const cell = innerWidth / count;
        const width = cell * .99;
        freshBubble.style.left = `${Number(draft.barPadding) + selected * cell + (cell - width) / 2}px`;
        freshBubble.style.top = `${Number(draft.barPadding)}px`;
        freshBubble.style.width = `${width}px`;
        freshBubble.style.height = `${innerHeight}px`;
        freshBubble.style.borderRadius = `${draft.barRadius}px`;
        freshBubble.style.background = `color-mix(in srgb, var(--accent) ${Math.round(Number(draft.bubbleOpacity) * 100)}%, transparent)`;
      });
      tabs.forEach((tab, index) => {
        const active = index === selected;
        const icon = tab.querySelector('span');
        const label = tab.querySelector('small');
        tab.style.color = active ? draft.activeColor : draft.inactiveColor;
        tab.style.opacity = String(active ? 1 : draft.inactiveOpacity);
        tab.style.gap = draft.hideLabels ? '0' : `${draft.itemGap}px`;
        icon.style.width = `${draft.iconSize}px`;
        icon.style.height = `${draft.iconSize}px`;
        icon.style.transform = `translateY(${draft.iconY}px) scale(${active ? draft.activeScale : 1})`;
        label.style.display = draft.hideLabels ? 'none' : 'block';
        label.style.fontSize = `${draft.textSize}px`;
        label.style.fontWeight = String(draft.textWeight);
      });
      document.querySelectorAll('[data-beta-editor-range]').forEach(input => {
        const key = input.dataset.betaEditorRange;
        input.value = draft[key];
        const output = document.getElementById(`rmBetaOutput-${key}`);
        if (output) output.textContent = `${draft[key]}${input.dataset.unit || ''}`;
      });
      const switchButton = document.getElementById('rmBetaEdit-hideLabels');
      if (switchButton) {
        switchButton.classList.toggle('is-on', !draft.hideLabels);
        switchButton.setAttribute('aria-pressed', String(!draft.hideLabels));
      }
      BETA_NAVIGATION.forEach(({ key }) => {
        const label = document.getElementById(`rmBetaLabel-${key}`);
        const icon = document.getElementById(`rmBetaIcon-${key}`);
        if (label && document.activeElement !== label) label.value = draft.labels[key];
        if (icon) icon.value = draft.icons[key];
      });
    };

    document.querySelectorAll('[data-beta-editor-range]').forEach(input => {
      input.oninput = () => { draft[input.dataset.betaEditorRange] = Number(input.value); render(); };
    });
    document.getElementById('rmBetaEdit-hideLabels').onclick = () => { draft.hideLabels = !draft.hideLabels; render(); };
    document.querySelectorAll('[data-beta-editor-label]').forEach(input => {
      input.oninput = () => { draft.labels[input.dataset.betaEditorLabel] = input.value.slice(0, 18) || BETA_NAVIGATION.find(tab => tab.key === input.dataset.betaEditorLabel).fallback; render(); };
    });
    document.querySelectorAll('[data-beta-editor-icon]').forEach(select => {
      select.onchange = () => { draft.icons[select.dataset.betaEditorIcon] = select.value; render(); };
    });
    document.getElementById('rmBetaVisualCancel').onclick = closeSheet;
    document.getElementById('rmBetaVisualApply').onclick = () => {
      const next = getSettings();
      next.tabBarStyles = { ...(next.tabBarStyles || {}), [theme]: { ...(next.tabBarStyles?.[theme] || {}), ...Object.fromEntries(Object.entries(draft).filter(([key]) => key !== 'labels' && key !== 'icons')) } };
      next.hideTabLabels = Boolean(draft.hideLabels);
      next.betaNavigationLabels = { ...draft.labels };
      next.iconOverrides = { ...(next.iconOverrides || {}) };
      BETA_NAVIGATION.forEach(({ key }) => {
        if (draft.icons[key] === key) delete next.iconOverrides[key];
        else next.iconOverrides[key] = { type: 'bank', value: draft.icons[key] };
      });
      saveSettings(next);
      applyBetaNavigationLabels(next);
      try { if (typeof hydrateIcons === 'function') hydrateIcons(document.querySelector('.tab-bar')); } catch (_) {}
      try { if (typeof applyRegistroTabBar === 'function') applyRegistroTabBar(); } catch (_) {}
      closeSheet();
      toast('Aparência aplicada.');
    };
    render();
    replaceCloseIcons();
  }

  const IMPORT_UNDO_ID = '__rm_beta_last_import_undo_v1__';

  async function readImportUndo() {
    try { return await req(store(AUDIO).get(IMPORT_UNDO_ID)); }
    catch (_) { return null; }
  }

  async function writeImportUndo(record) {
    return req(store(AUDIO, 'readwrite').put({ id: IMPORT_UNDO_ID, ...record }));
  }

  async function deleteImportUndo() {
    try { await req(store(AUDIO, 'readwrite').delete(IMPORT_UNDO_ID)); } catch (_) {}
  }

  function ensureUndoImportRow(dataCard) {
    if (!dataCard) return;
    let button = document.getElementById('rmBetaUndoImportBtn');
    if (!button) {
      const importButton = document.getElementById('importBtn');
      if (!importButton) return;
      const separator = document.createElement('div');
      separator.id = 'rmBetaUndoImportSeparator';
      separator.className = 'setting-separator inset';
      separator.hidden = true;
      button = document.createElement('button');
      button.id = 'rmBetaUndoImportBtn';
      button.className = 'settings-row';
      button.hidden = true;
      button.innerHTML = `<span class="settings-row-icon" data-icon="history"></span><span><strong>Desfazer última importação</strong><small id="rmBetaUndoImportStatus">Restaura os dados anteriores</small></span><span class="chevron">›</span>`;
      importButton.insertAdjacentElement('afterend', separator);
      separator.insertAdjacentElement('afterend', button);
      button.onclick = openUndoImportConfirmation;
      try { if (typeof hydrateIcons === 'function') hydrateIcons(button); } catch (_) {}
    }
    refreshUndoImportRow();
  }

  async function refreshUndoImportRow() {
    const button = document.getElementById('rmBetaUndoImportBtn');
    const separator = document.getElementById('rmBetaUndoImportSeparator');
    if (!button || !separator || typeof db === 'undefined' || !db) return;
    const undo = await readImportUndo();
    button.hidden = !undo?.snapshot;
    separator.hidden = !undo?.snapshot;
    const status = document.getElementById('rmBetaUndoImportStatus');
    if (status && undo?.createdAt) {
      status.textContent = `Voltar ao estado anterior à importação de ${new Date(undo.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`;
    }
  }

  async function currentBackupSnapshot() {
    return {
      events: await allEvents(),
      medications: await allMedications(),
      settings: { ...getSettings() }
    };
  }

  function replaceDataWithSnapshot(snapshot) {
    const events = Array.isArray(snapshot?.events) ? snapshot.events : [];
    const medications = Array.isArray(snapshot?.medications) ? snapshot.medications : [];
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EVENTS, MEDICATIONS], 'readwrite');
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Falha ao restaurar os dados anteriores.'));
      transaction.onabort = () => reject(transaction.error || new Error('A restauração foi cancelada.'));
      const eventStore = transaction.objectStore(EVENTS);
      const medicationStore = transaction.objectStore(MEDICATIONS);
      eventStore.clear();
      medicationStore.clear();
      events.forEach(item => eventStore.put({ ...item }));
      medications.forEach(item => medicationStore.put({ ...item }));
    });
  }

  function validBackupEvent(item) {
    return Boolean(item && typeof item.id === 'string' && item.id && typeof item.timestamp === 'string' && item.timestamp && ['note', 'medication', 'sleep', 'purchase'].includes(item.type));
  }

  function validBackupMedication(item) {
    return Boolean(item && typeof item.id === 'string' && item.id && typeof item.activeIngredient === 'string' && item.activeIngredient.trim());
  }

  function uniqueById(items) {
    return [...new Map(items.map(item => [item.id, { ...item }])).values()];
  }

  async function importBackupParsed(parsed, mode) {
    const sourceEvents = Array.isArray(parsed) ? parsed : parsed?.events;
    const events = uniqueById(sourceEvents.filter(validBackupEvent));
    const medications = uniqueById(Array.isArray(parsed?.medications) ? parsed.medications.filter(validBackupMedication) : []);
    const before = await currentBackupSnapshot();
    const previousUndo = await readImportUndo();

    await writeImportUndo({ createdAt: new Date().toISOString(), snapshot: before });
    try {
      await new Promise((resolve, reject) => {
        const transaction = db.transaction([EVENTS, MEDICATIONS], 'readwrite');
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error || new Error('Falha ao gravar o backup.'));
        transaction.onabort = () => reject(transaction.error || new Error('A importação foi cancelada.'));
        const eventStore = transaction.objectStore(EVENTS);
        const medicationStore = transaction.objectStore(MEDICATIONS);
        if (mode === 'replace') {
          eventStore.clear();
          medicationStore.clear();
        }
        events.forEach(item => eventStore.put(item));
        medications.forEach(item => medicationStore.put(item));
      });

      const storedEvents = await allEvents();
      const storedMedications = await allMedications();
      const eventIds = new Set(storedEvents.map(item => item.id));
      const medicationIds = new Set(storedMedications.map(item => item.id));
      const verifiedEvents = events.filter(item => eventIds.has(item.id)).length;
      const verifiedMedications = medications.filter(item => medicationIds.has(item.id)).length;
      const exact = mode !== 'replace' || (storedEvents.length === events.length && storedMedications.length === medications.length);
      if (verifiedEvents !== events.length || verifiedMedications !== medications.length || !exact) throw new Error('A verificação final não confirmou todos os dados importados.');

      if (mode === 'replace') {
        const settings = parsed?.settings && typeof parsed.settings === 'object' && !Array.isArray(parsed.settings) ? parsed.settings : {};
        saveSettings({ ...defaultSettings, ...settings });
      }
      localStorage.setItem('registro-beta-demo-seeded', 'yes');
      closeSheet();
      if (typeof rmInvalidate === 'function') rmInvalidate();
      switchTab('history');
      if (typeof rmRenderActive === 'function') await rmRenderActive('history', { force: true });
      else await renderAll();
      await refreshUndoImportRow();
      const action = mode === 'replace' ? 'Backup restaurado' : 'Backup adicionado aos dados atuais';
      toast(`${action}: ${verifiedEvents} registro${verifiedEvents === 1 ? '' : 's'} e ${verifiedMedications} medicamento${verifiedMedications === 1 ? '' : 's'}.`);
    } catch (error) {
      try {
        await replaceDataWithSnapshot(before);
        saveSettings(before.settings || {});
        if (previousUndo) await writeImportUndo(previousUndo);
        else await deleteImportUndo();
      } catch (rollbackError) {
        console.error('Beta: também falhou ao reverter a importação.', rollbackError);
      }
      throw error;
    }
  }

  function openImportChoice(parsed, events, medications, ignored) {
    const count = `${events.length} registro${events.length === 1 ? '' : 's'} e ${medications.length} medicamento${medications.length === 1 ? '' : 's'}`;
    openBackdrop('Como importar?', `
      <div class="analysis-row rm-v34-import-summary"><strong>O backup contém ${esc(count)}</strong><span>Já existem dados neste aparelho.${ignored ? ` ${ignored} item${ignored === 1 ? '' : 's'} inválido${ignored === 1 ? '' : 's'} será${ignored === 1 ? '' : 'ão'} ignorado${ignored === 1 ? '' : 's'}.` : ''}</span></div>
      <div class="rm-beta-import-choice">
        <button type="button" class="primary-button full-button" id="rmBetaImportMerge">Manter os atuais e adicionar o backup</button>
        <small>Opção recomendada. Preserva seus registros atuais e evita duplicações.</small>
      </div>
      <div class="rm-beta-import-choice is-destructive">
        <button type="button" class="secondary-button full-button" id="rmBetaImportReplace">Apagar os atuais e restaurar o backup</button>
        <small>Deixa somente o conteúdo do backup. Uma cópia para desfazer será criada antes.</small>
      </div>
      <button type="button" class="secondary-button full-button" data-cancel>Cancelar</button>
    `);
    document.getElementById('rmBetaImportMerge').onclick = () => runParsedImport(parsed, 'merge');
    document.getElementById('rmBetaImportReplace').onclick = () => runParsedImport(parsed, 'replace');
    replaceCloseIcons();
  }

  async function runParsedImport(parsed, mode) {
    try {
      toast(mode === 'replace' ? 'Restaurando backup…' : 'Adicionando backup…');
      await importBackupParsed(parsed, mode);
    } catch (error) {
      console.error('Beta: falha ao importar backup.', error);
      alert(`O backup não foi importado.\n\n${error?.message || 'Não foi possível concluir a importação.'}\n\nOs dados anteriores foram restaurados.`);
      toast('Falha ao importar o backup.');
    }
  }

  async function betaImportData(file) {
    try {
      const parsed = JSON.parse(await file.text());
      const sourceEvents = Array.isArray(parsed) ? parsed : parsed?.events;
      if (!Array.isArray(sourceEvents)) throw new Error('O arquivo não contém uma lista de registros.');
      const events = uniqueById(sourceEvents.filter(validBackupEvent));
      const medications = uniqueById(Array.isArray(parsed?.medications) ? parsed.medications.filter(validBackupMedication) : []);
      if (!events.length && !medications.length) throw new Error('Nenhum registro válido foi encontrado no backup.');
      const [currentEvents, currentMedications] = await Promise.all([allEvents(), allMedications()]);
      if (!currentEvents.length && !currentMedications.length) {
        await runParsedImport(parsed, 'replace');
        return;
      }
      openImportChoice(parsed, events, medications, sourceEvents.length - events.length);
    } catch (error) {
      console.error('Beta: arquivo de backup inválido.', error);
      alert(`Este arquivo não pode ser importado.\n\n${error?.message || 'Não foi possível ler o arquivo.'}\n\nNenhum dado atual foi alterado.`);
      toast('Arquivo de backup inválido.');
    }
  }

  function openUndoImportConfirmation() {
    openBackdrop('Desfazer importação?', `
      <div class="analysis-row"><strong>Voltar ao estado anterior</strong><span>Os dados ficarão exatamente como estavam antes da última importação. Registros criados depois dela serão removidos.</span></div>
      <div class="form-actions">
        <button type="button" class="secondary-button" data-cancel>Cancelar</button>
        <button type="button" class="primary-button" id="rmBetaConfirmUndo">Desfazer importação</button>
      </div>
    `);
    document.getElementById('rmBetaConfirmUndo').onclick = undoLastImport;
    replaceCloseIcons();
  }

  async function undoLastImport() {
    const undo = await readImportUndo();
    if (!undo?.snapshot) return toast('Não há uma importação para desfazer.');
    try {
      toast('Desfazendo importação…');
      await replaceDataWithSnapshot(undo.snapshot);
      saveSettings(undo.snapshot.settings || {});
      await deleteImportUndo();
      closeSheet();
      if (typeof rmInvalidate === 'function') rmInvalidate();
      switchTab('history');
      if (typeof rmRenderActive === 'function') await rmRenderActive('history', { force: true });
      else await renderAll();
      await refreshUndoImportRow();
      toast('Última importação desfeita.');
    } catch (error) {
      console.error('Beta: falha ao desfazer importação.', error);
      alert('Não foi possível desfazer a importação. Nenhuma exclusão adicional foi feita.');
    }
  }

  function installBackupImportPatch() {
    if (typeof window.importData !== 'function' || !document.getElementById('importFile')) return false;
    if (window.importData.__rmBetaSafeImport) return true;
    betaImportData.__rmBetaSafeImport = true;
    window.importData = betaImportData;
    document.getElementById('importFile').onchange = event => {
      const file = event.target.files?.[0];
      if (file) betaImportData(file);
      event.target.value = '';
    };
    refreshUndoImportRow();
    return true;
  }

  function removeMedicationQuantityField() {
    const quantity = document.getElementById('unitsTaken');
    if (!quantity || quantity.type === 'hidden') return;

    const quantityField = quantity.closest('.field');
    const hiddenQuantity = document.createElement('input');
    hiddenQuantity.type = 'hidden';
    hiddenQuantity.id = 'unitsTaken';
    hiddenQuantity.value = '1';
    hiddenQuantity.dataset.rmBetaFixedQuantity = '1';
    quantityField?.replaceWith(hiddenQuantity);

    const doseLabel = document.querySelector('label[for="unitDoseValue"]')
      || document.getElementById('unitDoseValue')?.closest('.field')?.querySelector('label');
    if (doseLabel) doseLabel.textContent = 'Dose';

    document.querySelector('#doseFields .dose-result')?.remove();
  }

  function refineMedicationSheet() {
    const note = document.getElementById('medNote');
    if (note) {
      note.placeholder = 'Motivo desta administração, como você estava se sentindo ou algo fora do comum…';
    }

    document.getElementById('doseMode')?.classList.add('rm-beta-dose-mode');

    const doseFields = document.getElementById('doseFields');
    if (doseFields && document.getElementById('unitsTaken')) {
      doseFields.classList.add('rm-beta-dose-compact');
      removeMedicationQuantityField();
    }
  }

  function installNoteCardPatch() {
    const original = window.eventCard;
    if (typeof original !== 'function') return false;
    if (original.__rmBetaNoteHeaderRefined) return true;

    const wrapped = function(event, ...rest) {
      const html = original.call(this, event, ...rest);
      if (!event || event.type !== 'note' || event.moodScore == null) return html;

      const template = document.createElement('template');
      template.innerHTML = String(html).trim();
      const card = template.content.firstElementChild;
      if (!card) return html;

      const header = card.querySelector('.rm-card-header-main');
      const meta = card.querySelector('.rm-meta-badges');
      const mood = meta?.querySelector('.rm-mini-mood');
      if (header && mood) {
        mood.classList.add('rm-beta-header-mood');
        header.appendChild(mood);
        if (meta && !meta.children.length && !meta.textContent.trim()) meta.remove();
      }
      return card.outerHTML;
    };

    wrapped.__rmBetaNoteHeaderRefined = true;
    wrapped.__rmBetaOriginal = original;
    window.eventCard = wrapped;

    queueMicrotask(() => {
      try { if (typeof window.renderAll === 'function') window.renderAll(); } catch (_) {}
    });
    return true;
  }

  function installMedicationRegistryPatch() {
    const original = window.openMedicationRegistry;
    if (typeof original !== 'function') return false;
    if (original.__rmBetaRegistryRefined) return true;

    const wrapped = async function(...args) {
      const result = await original.apply(this, args);
      await refineMedicationRegistry();
      replaceCloseIcons();
      return result;
    };
    wrapped.__rmBetaRegistryRefined = true;
    wrapped.__rmBetaOriginal = original;
    window.openMedicationRegistry = wrapped;

    const registryButton = document.getElementById('medicationRegistryBtn');
    if (registryButton) registryButton.onclick = () => window.openMedicationRegistry();

    return true;
  }

  function installMedicationSheetPatch() {
    const original = window.openMedicationSheet;
    if (typeof original !== 'function') return false;
    if (original.__rmBetaMedicationSheetRefined) return true;

    const wrapped = async function(...args) {
      const result = await original.apply(this, args);
      refineMedicationSheet();
      replaceCloseIcons();
      return result;
    };
    wrapped.__rmBetaMedicationSheetRefined = true;
    wrapped.__rmBetaOriginal = original;
    window.openMedicationSheet = wrapped;
    return true;
  }

  function installDoseFieldsPatch() {
    const original = window.renderDoseFields;
    if (typeof original !== 'function') return false;
    if (original.__rmBetaDoseFieldsRefined) return true;

    const wrapped = async function(...args) {
      const result = await original.apply(this, args);
      refineMedicationSheet();
      return result;
    };
    wrapped.__rmBetaDoseFieldsRefined = true;
    wrapped.__rmBetaOriginal = original;
    window.renderDoseFields = wrapped;
    return true;
  }

  installBetaUIStyles();
  replaceCloseIcons();
  refineSettingsUI();

  let attempts = 0;
  const installer = setInterval(() => {
    attempts += 1;
    replaceCloseIcons();
    refineSettingsUI();
    refineMedicationSheet();

    const noteCardsReady = installNoteCardPatch();
    const registryReady = installMedicationRegistryPatch();
    const sheetReady = installMedicationSheetPatch();
    const doseReady = installDoseFieldsPatch();
    const backupReady = installBackupImportPatch();

    if ((noteCardsReady && registryReady && sheetReady && doseReady && backupReady) || attempts >= 200) {
      clearInterval(installer);
    }
  }, 75);

  document.addEventListener('registro:release-ready', () => {
    replaceCloseIcons();
    refineSettingsUI();
    installNoteCardPatch();
    installMedicationRegistryPatch();
    installMedicationSheetPatch();
    installDoseFieldsPatch();
    installBackupImportPatch();
  }, { once: true });
})();

/* RM_BETA_SAFARI_CHROME_FIX_V1
   Mantém o chrome do Safari coerente com o tema sem reduzir os efeitos do modo Ultra. */
(() => {
  'use strict';

  const STYLE_ID = 'rm-beta-safari-chrome-fix-v1';
  const mqDark = window.matchMedia?.('(prefers-color-scheme: dark)');

  function ensureViewportStyle() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = `
      html, body {
        background-color: var(--rm-safari-viewport-bg, var(--bg, #f5f5f7)) !important;
      }
    `;
  }

  function currentTheme() {
    const attr = document.documentElement.dataset.theme;
    if (attr === 'dark' || attr === 'light' || attr === 'system') return attr;
    try {
      const settings = typeof getSettings === 'function' ? getSettings() : null;
      if (settings?.theme === 'dark' || settings?.theme === 'light' || settings?.theme === 'system') return settings.theme;
    } catch (_) {}
    return 'system';
  }

  function syncSafariChrome() {
    ensureViewportStyle();
    const theme = currentTheme();
    const dark = theme === 'dark' || (theme === 'system' && Boolean(mqDark?.matches));
    const color = dark ? '#000000' : '#f5f5f7';
    const root = document.documentElement;

    root.style.setProperty('--rm-safari-viewport-bg', color);
    root.style.setProperty('background-color', color, 'important');
    if (document.body) document.body.style.setProperty('background-color', color, 'important');

    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', color);
  }

  const observer = new MutationObserver(syncSafariChrome);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-visual-mode']
  });

  try { mqDark?.addEventListener?.('change', syncSafariChrome); } catch (_) {}
  document.addEventListener('registro:release-ready', syncSafariChrome);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncSafariChrome, { once: true });
  else syncSafariChrome();
  requestAnimationFrame(syncSafariChrome);
})();
