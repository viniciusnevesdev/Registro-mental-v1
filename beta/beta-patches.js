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

      const meta = card.querySelector('.rm-meta-badges');
      card.querySelectorAll('.rm-mini-mood,.rm-beta-header-mood').forEach(node => node.remove());
      if (meta && !meta.children.length && !meta.textContent.trim()) meta.remove();
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

/* RM_BETA_APPEARANCE_CONTROLS_V4
   Seletor estático, persistente e estável: somente Otimizado e Ultra. */
(() => {
  'use strict';

  const SETTINGS_KEY = 'registro-beta-settings-v1';
  const MODES = new Set(['optimized', 'ultra']);

  function readSettings() {
    try {
      if (typeof getSettings === 'function') return getSettings() || {};
      return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    } catch (_) { return {}; }
  }

  function writeSettings(next) {
    try {
      if (typeof saveSettings === 'function') saveSettings(next);
      else localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch (_) {}
  }

  function markup() {
    return `
      <div class="setting-separator" data-rm-visual-separator></div>
      <div class="setting-block rm-beta-visual-setting" id="visualModeSetting">
        <div class="setting-label"><strong>Efeitos visuais</strong></div>
        <div class="segmented animated-segmented" id="visualModeControl" role="group" aria-label="Efeitos visuais">
          <button type="button" data-visual-mode="optimized">Otimizado</button>
          <button type="button" data-visual-mode="ultra">Ultra</button>
        </div>
        <div class="rm-beta-visual-notes" aria-hidden="true">
          <span class="rm-beta-visual-note" data-note-mode="optimized">Menos efeitos, mais fluidez</span>
          <span class="rm-beta-visual-note" data-note-mode="ultra">Mais efeitos e profundidade</span>
        </div>
      </div>`;
  }

  function appearanceCard() {
    const group = [...document.querySelectorAll('.settings-group')].find(item =>
      /apar[eê]ncia/i.test(item.querySelector(':scope > h2')?.textContent || '')
    );
    return group?.querySelector('.settings-card') || null;
  }

  function ensureControl() {
    let control = document.getElementById('visualModeControl');
    if (control) return control;
    const card = appearanceCard();
    const themeBlock = document.getElementById('themeControl')?.closest('.setting-block');
    if (!card || !themeBlock) return null;
    themeBlock.insertAdjacentHTML('afterend', markup());
    control = document.getElementById('visualModeControl');
    return control;
  }

  function selectedMode() {
    const mode = readSettings().visualMode;
    return MODES.has(mode) ? mode : 'optimized';
  }

  function render(mode = selectedMode()) {
    const control = ensureControl();
    if (!control) return;
    control.querySelector('[data-visual-mode="basic"]')?.remove();
    control.querySelectorAll('[data-visual-mode]').forEach(button => {
      const selected = button.dataset.visualMode === mode;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    const notes = control.parentElement?.querySelector('.rm-beta-visual-notes');
    notes?.querySelectorAll('[data-note-mode]').forEach(note => {
      note.classList.toggle('is-active', note.dataset.noteMode === mode);
    });
  }

  function apply(mode, announce = true) {
    mode = mode === 'ultra' ? 'ultra' : 'optimized';
    const next = { ...readSettings(), visualMode: mode };
    writeSettings(next);
    try {
      if (typeof rmApplyVisualMode === 'function') rmApplyVisualMode(mode);
      else document.documentElement.dataset.visualMode = mode;
      if (typeof rmV25EnsureStyles === 'function') rmV25EnsureStyles();
    } catch (_) {
      document.documentElement.dataset.visualMode = mode;
    }
    document.documentElement.dataset.visualMode = mode;
    render(mode);
    if (announce && typeof toast === 'function') {
      toast(mode === 'optimized' ? 'Visual otimizado ativado.' : 'Visual Ultra ativado.');
    }
  }

  function installStyles() {
    if (document.getElementById('rm-beta-visual-control-v4-style')) return;
    const style = document.createElement('style');
    style.id = 'rm-beta-visual-control-v4-style';
    style.textContent = `
      #visualModeSetting.rm-beta-visual-setting {
        padding: 16px 24px 18px !important;
        text-align: center !important;
      }
      #visualModeSetting .setting-label {
        display: block !important;
        margin: 0 0 12px !important;
        text-align: center !important;
      }
      #visualModeControl {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        width: 100% !important;
        margin: 0 !important;
      }
      #visualModeControl button {
        min-width: 0 !important;
        min-height: 38px !important;
        white-space: nowrap !important;
      }
      #visualModeSetting .rm-beta-visual-notes {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        width: 100% !important;
        box-sizing: border-box !important;
        gap: 12px !important;
        margin: 9px 0 0 !important;
        padding: 0 4px !important;
      }
      #visualModeSetting .rm-beta-visual-note {
        display: block !important;
        min-width: 0 !important;
        margin: 0 !important;
        text-align: center !important;
        font-size: 11px !important;
        line-height: 1.28 !important;
        white-space: normal !important;
        overflow-wrap: normal !important;
        word-break: normal !important;
        hyphens: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function install() {
    installStyles();
    const control = ensureControl();
    if (!control) return false;

    control.querySelector('[data-visual-mode="basic"]')?.remove();
    const oldMode = readSettings().visualMode;
    if (!MODES.has(oldMode)) {
      writeSettings({ ...readSettings(), visualMode: 'optimized' });
    }
    render(selectedMode());

    if (!control.dataset.rmVisualBound) {
      control.dataset.rmVisualBound = '1';
      control.addEventListener('click', event => {
        const button = event.target.closest('[data-visual-mode]');
        if (button && control.contains(button)) apply(button.dataset.visualMode);
      });
    }
    return true;
  }

  function start() {
    if (!install()) {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts += 1;
        if (install() || attempts >= 30) clearInterval(timer);
      }, 100);
    }
    apply(selectedMode(), false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
  document.addEventListener('registro:release-ready', () => {
    install();
    apply(selectedMode(), false);
  });

  window.REGISTRO_BETA_APPEARANCE_CONTROLS_RELEASE = '1.2.0-beta.18';
})();
