/* Registro Mental Oficial — refinamentos aprovados na Beta, sem ferramentas experimentais. */
(() => {
  'use strict';

  const normalize = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  function installStyles() {
    if (document.getElementById('rm-official-approved-ui')) return;
    const style = document.createElement('style');
    style.id = 'rm-official-approved-ui';
    style.textContent = `
      /* Fechamento das sheets: somente o X, sem caixa/círculo. */
      .sheet-close,.sheet-header .sheet-close,button.sheet-close{
        width:48px!important;height:48px!important;min-width:48px!important;
        padding:0!important;border:0!important;border-radius:0!important;
        background:transparent!important;box-shadow:none!important;color:var(--text)!important;
        display:grid!important;place-items:center!important
      }
      .sheet-close::before,.sheet-close::after{content:none!important}
      .sheet-close:active{transform:scale(.90);opacity:.62}
      .sheet-close .rm-official-x-icon{width:33px!important;height:33px!important;display:block;overflow:visible}

      /* Um único design para cartões de registros: Histórico e Mais recentes. */
      .rm-v28-timeline .timeline-main{padding-left:0!important}

      /* Anotações: alinhamento óptico do conteúdo, sem badge de humor. */
      .rm-v28-timeline.rm-type-note .rm-card-header-main{gap:5px!important}
      .rm-v28-timeline.rm-type-note .timeline-main{padding-left:8px!important}

      /* Cadastro de medicamentos: ação única ocupa toda a largura. */
      .registry-toolbar.rm-official-single-action{display:block!important}
      .registry-toolbar.rm-official-single-action #addMedicationBtn{
        display:block!important;width:100%!important;min-width:0!important;margin:0!important
      }

      /* Tema mais compacto, como validado na Beta. */
      .setting-block.rm-official-theme-row{
        display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;
        align-items:center!important;gap:16px!important;padding-top:14px!important;padding-bottom:14px!important
      }
      .rm-official-theme-row .setting-label{margin:0!important;min-width:max-content!important}
      .rm-official-theme-row .setting-label small{display:none!important}
      .rm-official-theme-row #themeControl{margin:0!important;width:100%!important;min-height:42px!important}
      .rm-official-theme-row #themeControl button{min-height:38px!important;padding-top:7px!important;padding-bottom:7px!important}

      /* Efeitos visuais com descrição individual. */
      #visualModeSetting.rm-official-visual-setting,.setting-block.rm-official-visual-setting{
        padding-top:16px!important;padding-bottom:16px!important
      }
      .rm-official-visual-setting #visualModeHelp{display:none!important}
      .rm-official-visual-setting #visualModeControl{margin-bottom:8px!important}
      .rm-official-visual-notes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:0 6px}
      .rm-official-visual-note{text-align:center;font-size:11px;line-height:1.28;color:var(--secondary);opacity:.42;transition:opacity .18s ease,color .18s ease}
      .rm-official-visual-note.is-active{opacity:.95;color:var(--text)}

      /* Formulário de administração de medicamento. */
      #doseFields.rm-official-dose-compact{
        display:grid!important;grid-template-columns:minmax(0,1.35fr) minmax(0,.65fr)!important;
        gap:10px!important;align-items:end!important
      }
      #doseFields.rm-official-dose-compact .field-grid{display:contents!important}
      #doseFields.rm-official-dose-compact .field-grid>.field,#doseFields.rm-official-dose-compact>.field{
        min-width:0!important;margin:0!important
      }
      #doseFields.rm-official-dose-compact label{
        font-size:11px!important;line-height:1.15!important;min-height:26px;display:flex;align-items:flex-end
      }
      #doseFields.rm-official-dose-compact input,#doseFields.rm-official-dose-compact select{
        width:100%!important;min-width:0!important;padding-left:11px!important;padding-right:11px!important
      }
      #doseMode.rm-official-dose-mode{
        min-height:44px!important;padding:3px!important;border:1px solid rgba(142,142,147,.28)!important;
        border-radius:14px!important;background:rgba(142,142,147,.08)!important;box-shadow:none!important
      }
      #doseMode.rm-official-dose-mode::before{
        border-radius:11px!important;background:rgba(125,92,255,.16)!important;
        border:1px solid rgba(125,92,255,.20)!important;box-shadow:none!important
      }
      #doseMode.rm-official-dose-mode button{min-height:36px!important;padding:7px 8px!important;font-size:12px!important}

      /* Atualização integrada ao cartão de Dados. */
      .rm-official-update-row{
        display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;
        align-items:center!important;gap:11px!important;padding:12px 14px!important
      }
      .rm-official-update-row .rm-update-button{min-height:34px!important;padding:7px 11px!important;white-space:nowrap}

      @media(max-width:370px){
        #doseFields.rm-official-dose-compact{gap:7px!important}
        #doseFields.rm-official-dose-compact input,#doseFields.rm-official-dose-compact select{
          padding-left:8px!important;padding-right:8px!important
        }
      }
    `;
    document.head.appendChild(style);
  }

  function replaceCloseIcons() {
    document.querySelectorAll('.sheet-close').forEach(button => {
      if (button.dataset.rmOfficialSimpleX === '1') return;
      button.dataset.rmOfficialSimpleX = '1';
      button.innerHTML = `<svg class="rm-official-x-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M7 7L25 25M25 7L7 25" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`;
    });
  }

  function presentationSummary(presentation, medication) {
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
    try { if (typeof window.allMedications === 'function') meds = await window.allMedications(); }
    catch (_) {}
    const byId = new Map(meds.map(med => [String(med.id), med]));
    const addButton = document.getElementById('addMedicationBtn');
    const toolbar = addButton?.closest('.registry-toolbar');
    if (toolbar) {
      toolbar.querySelector('[data-cancel]')?.remove();
      toolbar.classList.add('rm-official-single-action');
    }
    document.querySelectorAll('.registry-card[data-open-med]').forEach(card => {
      const med = byId.get(String(card.dataset.openMed));
      if (!med) return;
      const count = Array.isArray(med.notes) ? med.notes.length : 0;
      const meta = card.querySelector('.registry-meta');
      if (meta) meta.textContent = `${count} ${count === 1 ? 'nota' : 'notas'}`;
      const subtitle = card.querySelector('small');
      if (subtitle) {
        const summaries = (med.presentations || []).map(p => presentationSummary(p, med));
        subtitle.textContent = summaries.length ? summaries.join(' · ') : 'Sem apresentações';
      }
    });
  }

  function updateVisualModeNotes() {
    const control = document.getElementById('visualModeControl');
    const notes = control?.parentElement?.querySelector('.rm-official-visual-notes');
    if (!control || !notes) return;
    const selected = control.querySelector('[data-visual-mode].selected')?.dataset.visualMode;
    notes.querySelectorAll('[data-note-mode]').forEach(note => note.classList.toggle('is-active', note.dataset.noteMode === selected));
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
      if (updateButton && dataCard && !document.getElementById('rmOfficialUpdateRow')) {
        const previousHandler = updateButton.onclick;
        const row = document.createElement('div');
        row.id = 'rmOfficialUpdateRow';
        row.className = 'settings-row rm-official-update-row';
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
    }

    const themeControl = document.getElementById('themeControl');
    themeControl?.closest('.setting-block')?.classList.add('rm-official-theme-row');

    const visualControl = document.getElementById('visualModeControl');
    const visualBlock = visualControl?.closest('.setting-block');
    if (visualControl && visualBlock) {
      visualBlock.classList.add('rm-official-visual-setting');
      let notes = visualBlock.querySelector('.rm-official-visual-notes');
      if (!notes) {
        notes = document.createElement('div');
        notes.className = 'rm-official-visual-notes';
        visualControl.insertAdjacentElement('afterend', notes);
      }
      const copy = { optimized: 'Menos efeitos, mais fluidez', ultra: 'Mais efeitos e profundidade' };
      const buttons = [...visualControl.querySelectorAll('[data-visual-mode]')];
      notes.innerHTML = buttons.map(button => `<span class="rm-official-visual-note" data-note-mode="${button.dataset.visualMode}">${copy[button.dataset.visualMode] || ''}</span>`).join('');
      if (!visualControl.dataset.rmOfficialNotesObserved) {
        visualControl.dataset.rmOfficialNotesObserved = '1';
        new MutationObserver(updateVisualModeNotes).observe(visualControl,{subtree:true,attributes:true,attributeFilter:['class']});
        visualControl.addEventListener('click',()=>requestAnimationFrame(updateVisualModeNotes));
      }
      updateVisualModeNotes();
    }
  }

  function removeMedicationQuantityField() {
    const quantity = document.getElementById('unitsTaken');
    if (!quantity || quantity.type === 'hidden') return;
    const field = quantity.closest('.field');
    const hidden = document.createElement('input');
    hidden.type = 'hidden'; hidden.id = 'unitsTaken'; hidden.value = '1';
    field?.replaceWith(hidden);
    const doseLabel = document.querySelector('label[for="unitDoseValue"]') || document.getElementById('unitDoseValue')?.closest('.field')?.querySelector('label');
    if (doseLabel) doseLabel.textContent = 'Dose';
    document.querySelector('#doseFields .dose-result')?.remove();
  }

  function refineMedicationSheet() {
    const note = document.getElementById('medNote');
    if (note) note.placeholder = 'Motivo desta administração, como você estava se sentindo ou algo fora do comum…';
    document.getElementById('doseMode')?.classList.add('rm-official-dose-mode');
    const doseFields = document.getElementById('doseFields');
    if (doseFields && document.getElementById('unitsTaken')) {
      doseFields.classList.add('rm-official-dose-compact');
      removeMedicationQuantityField();
    }
  }

  function installNoteCardPatch() {
    const original = window.eventCard;
    if (typeof original !== 'function') return false;
    if (original.__rmOfficialNoteHeaderRefined) return true;
    const wrapped = function(event, ...rest) {
      const html = original.call(this, event, ...rest);
      if (!event || event.type !== 'note' || event.moodScore == null) return html;
      const template = document.createElement('template');
      template.innerHTML = String(html).trim();
      const card = template.content.firstElementChild;
      if (!card) return html;
      const meta = card.querySelector('.rm-meta-badges');
      meta?.querySelectorAll('.rm-mini-mood,.rm-official-header-mood,.rm-beta-header-mood').forEach(node => node.remove());
      if (meta && !meta.children.length && !meta.textContent.trim()) meta.remove();
      return card.outerHTML;
    };
    wrapped.__rmOfficialNoteHeaderRefined = true;
    wrapped.__rmOfficialOriginal = original;
    window.eventCard = wrapped;
    queueMicrotask(() => { try { if (typeof window.renderAll === 'function') window.renderAll(); } catch (_) {} });
    return true;
  }

  function installMedicationRegistryPatch() {
    const original = window.openMedicationRegistry;
    if (typeof original !== 'function') return false;
    if (original.__rmOfficialRegistryRefined) return true;
    const wrapped = async function(...args) {
      const result = await original.apply(this,args);
      await refineMedicationRegistry(); replaceCloseIcons(); return result;
    };
    wrapped.__rmOfficialRegistryRefined = true;
    window.openMedicationRegistry = wrapped;
    const button = document.getElementById('medicationRegistryBtn');
    if (button) button.onclick = () => window.openMedicationRegistry();
    return true;
  }

  function installMedicationSheetPatch() {
    const original = window.openMedicationSheet;
    if (typeof original !== 'function') return false;
    if (original.__rmOfficialMedicationSheetRefined) return true;
    const wrapped = async function(...args) {
      const result = await original.apply(this,args);
      refineMedicationSheet(); replaceCloseIcons(); return result;
    };
    wrapped.__rmOfficialMedicationSheetRefined = true;
    window.openMedicationSheet = wrapped;
    return true;
  }

  function installDoseFieldsPatch() {
    const original = window.renderDoseFields;
    if (typeof original !== 'function') return false;
    if (original.__rmOfficialDoseFieldsRefined) return true;
    const wrapped = async function(...args) {
      const result = await original.apply(this,args); refineMedicationSheet(); return result;
    };
    wrapped.__rmOfficialDoseFieldsRefined = true;
    window.renderDoseFields = wrapped;
    return true;
  }

  function syncSafariChrome() {
    const theme = document.documentElement.dataset.theme || 'system';
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
    const color = dark ? '#000000' : '#f5f5f7';
    document.documentElement.style.setProperty('--rm-safari-viewport-bg',color);
    document.documentElement.style.setProperty('background-color',color,'important');
    if (document.body) document.body.style.setProperty('background-color',color,'important');
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    meta.setAttribute('content',color);
  }

  function apply() {
    installStyles(); replaceCloseIcons(); refineSettingsUI(); refineMedicationSheet();
    installNoteCardPatch(); installMedicationRegistryPatch(); installMedicationSheetPatch(); installDoseFieldsPatch(); syncSafariChrome();
  }

  apply();
  let attempts = 0;
  const installer = setInterval(() => {
    attempts += 1; apply();
    if (attempts >= 120 || (typeof window.eventCard === 'function' && typeof window.openMedicationRegistry === 'function' && typeof window.openMedicationSheet === 'function')) clearInterval(installer);
  },75);

  window.addEventListener('registro:release-ready',apply);
  document.addEventListener('DOMContentLoaded',apply,{once:true});
  document.addEventListener('click',event => {
    if (event.target.closest('.tab-item,#medicationRegistryBtn,.action-card,[data-menu]')) setTimeout(apply,0);
  },{passive:true});

  window.REGISTRO_OFFICIAL_APPROVED_UI_READY = true;
})();


/* Beta — visualização de anotações e ações circulares sincronizadas. */
(() => {
  'use strict';
  const editIcon='<svg viewBox="0 0 23.9375 23.6221" aria-hidden="true" focusable="false"><path d="M17.5156 3.43031L16.2334 4.71341L7.1133 4.71341C5.33986 4.71341 4.33986 5.71341 4.33986 7.48685L4.33986 16.7915C4.33986 18.5728 5.33986 19.5728 7.1133 19.5728L16.418 19.5728C18.1914 19.5728 19.1914 18.5728 19.1914 16.7915L19.1914 7.73493L20.4838 6.44073C20.5449 6.76632 20.5742 7.11882 20.5742 7.49466L20.5742 16.7915C20.5742 19.4634 19.0899 20.9556 16.418 20.9556L7.1133 20.9556C4.44142 20.9556 2.95705 19.4634 2.95705 16.7915L2.95705 7.49466C2.95705 4.82279 4.44142 3.3306 7.1133 3.3306L16.418 3.3306C16.811 3.3306 17.1782 3.36288 17.5156 3.43031Z" fill="currentColor" fill-opacity=".85"/><path d="M9.83986 14.3306L11.6524 13.5259L21.0508 4.12748L19.8086 2.8931L10.418 12.2915L9.56642 14.0494C9.4883 14.1978 9.6758 14.4009 9.83986 14.3306ZM21.7617 3.43216L22.4414 2.72904C22.7695 2.3931 22.7774 1.96341 22.457 1.6431L22.2617 1.44779C21.9649 1.15091 21.5195 1.18998 21.207 1.50248L20.5195 2.18216Z" fill="currentColor" fill-opacity=".85"/></svg>';
  const deleteIcon='<svg viewBox="0 0 19.7734 24.0234" aria-hidden="true" focusable="false"><path d="M6.67969 19.1484C7.01562 19.1484 7.23438 18.9297 7.22656 18.625L6.90625 7.60156C6.89844 7.29688 6.67188 7.09375 6.35938 7.09375C6.02344 7.09375 5.80469 7.30469 5.8125 7.61719L6.13281 18.625C6.14062 18.9375 6.35938 19.1484 6.67969 19.1484ZM9.6875 19.1484C10.0156 19.1484 10.25 18.9297 10.25 18.625L10.25 7.61719C10.25 7.30469 10.0156 7.09375 9.6875 7.09375C9.35938 7.09375 9.125 7.30469 9.125 7.61719L9.125 18.625C9.125 18.9297 9.35938 19.1484 9.6875 19.1484ZM12.6875 19.1484C13.0078 19.1484 13.2266 18.9453 13.2344 18.6328L13.5547 7.61719C13.5625 7.30469 13.3438 7.10156 13.0156 7.10156C12.7031 7.10156 12.4766 7.29688 12.4688 7.60938L12.1484 18.625C12.1406 18.9297 12.3516 19.1484 12.6875 19.1484ZM5.33594 4.46875L6.70312 4.46875L6.70312 2.32031C6.70312 1.69531 7.13281 1.28906 7.80469 1.28906L11.5469 1.28906C12.2188 1.28906 12.6484 1.69531 12.6484 2.32031L12.6484 4.46875L14.0156 4.46875L14.0156 2.24219C14.0156.851562 13.1172 0 11.625 0L7.72656 0C6.24219 0 5.33594.851562 5.33594 2.24219ZM.648438 5.14844L18.7188 5.14844C19.0781 5.14844 19.3672 4.85156 19.3672 4.5C19.3672 4.14062 19.0781 3.84375 18.7188 3.84375L.648438 3.84375C.304688 3.84375 0 4.14844 0 4.5C0 4.85938.304688 5.14844.648438 5.14844ZM5.10156 22.3125L14.2812 22.3125C15.625 22.3125 16.5703 21.3984 16.6406 20.0547L17.3828 4.96875L15.9844 4.96875L15.2812 19.9141C15.25 20.5469 14.7734 21.0078 14.1484 21.0078L5.21094 21.0078C4.60156 21.0078 4.11719 20.5391 4.08594 19.9141L3.34375 4.97656L1.99219 4.97656L2.73438 20.0625C2.80469 21.4062 3.73438 22.3125 5.10156 22.3125Z" fill="currentColor" fill-opacity=".85"/></svg>';
  function installStyles(){if(document.getElementById('rm-note-viewer-ui'))return;const s=document.createElement('style');s.id='rm-note-viewer-ui';s.textContent='.rm-note-detail-view{display:grid;gap:12px}.rm-note-view-mood{padding:15px 13px 13px;border:1px solid color-mix(in srgb,var(--rm-note-mood-color,#7657ff) 38%,var(--separator));border-radius:19px;background:color-mix(in srgb,var(--rm-note-mood-color,#7657ff) 10%,var(--surface));box-shadow:0 7px 21px color-mix(in srgb,var(--rm-note-mood-color,#7657ff) 14%,transparent)}.rm-note-view-mood-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:0 0 11px}.rm-note-view-mood-head strong{font-size:15px;line-height:1.1;color:var(--text)}.rm-note-view-mood-head b{font-size:25px;line-height:1;font-weight:850;color:var(--rm-note-mood-color,#7657ff);letter-spacing:-.04em}.rm-note-view-mood-head b small{font-size:12px;letter-spacing:0;color:var(--secondary);font-weight:700}.rm-note-view-scale{display:grid;grid-template-columns:repeat(11,minmax(0,1fr));gap:5px;align-items:center}.rm-note-view-score{height:31px;min-width:0;display:grid;place-items:center;border-radius:9px;border:1px solid color-mix(in srgb,var(--secondary) 23%,transparent);background:color-mix(in srgb,var(--surface) 88%,transparent);color:var(--secondary);font-size:12px;font-weight:760;line-height:1}.rm-note-view-score.selected{color:#fff;background:var(--rm-note-mood-color,#7657ff);border-color:var(--rm-note-mood-color,#7657ff);box-shadow:0 0 13px color-mix(in srgb,var(--rm-note-mood-color,#7657ff) 62%,transparent);transform:translateY(-2px)}.rm-note-view-caption{display:flex;justify-content:space-between;gap:8px;margin-top:8px;color:var(--secondary);font-size:10px;font-weight:650}.rm-note-view-date{padding:8px 3px 1px;text-align:center;color:var(--secondary);font-size:15.5px;line-height:1.25;font-weight:740}.rm-note-detail-view .rm-v28-detail-card{margin:0}.rm-note-detail-view .rm-v28-detail-card.wide{grid-column:auto}.form-actions:has(#viewerEditBtn),.form-actions:has(#editMedBtn),.sheet-options:has(#editEventBtn){display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;margin-top:14px!important}.rm-unified-card-action{width:52px!important;height:52px!important;min-width:52px!important;min-height:52px!important;flex:0 0 52px!important;padding:0!important;border-radius:50%!important;display:inline-grid!important;place-items:center!important;line-height:1!important}.rm-unified-card-action svg{display:block!important;width:24px!important;height:24px!important;overflow:visible!important}.rm-unified-card-action--delete{margin-right:auto!important}.rm-unified-card-action--edit{margin-left:auto!important}.rm-unified-card-action:active{transform:scale(.93)!important}@media(max-width:370px){.rm-note-view-scale{gap:3px}.rm-note-view-score{height:28px;font-size:11px}.rm-note-view-mood{padding:13px 10px 11px}}';document.head.appendChild(s)}
  function applyActionIcons(root=document){[['viewerEditBtn','edit','Editar registro',editIcon],['editEventBtn','edit','Editar registro',editIcon],['editMedBtn','edit','Editar medicamento',editIcon],['viewerDeleteBtn','delete','Excluir registro',deleteIcon],['deleteBtn','delete','Excluir registro',deleteIcon],['deleteMedBtn','delete','Excluir medicamento',deleteIcon]].forEach(d=>{const b=root.getElementById?root.getElementById(d[0]):root.querySelector('#'+d[0]);if(!b||b.dataset.rmUnifiedAction===d[1])return;b.dataset.rmUnifiedAction=d[1];b.classList.add('rm-unified-card-action','rm-unified-card-action--'+d[1]);b.setAttribute('aria-label',d[2]);b.title=d[2];b.innerHTML=d[3]})}
  function moodColor(v){try{return typeof rmMood==='function'?(rmMood(v).color||'#7657ff'):'#7657ff'}catch(_){return'#7657ff'}}
  function moodViewer(score){if(score===null||score===undefined||Number.isNaN(Number(score)))return'';const v=Math.max(0,Math.min(10,Number(score))),scores=Array.from({length:11},(_,n)=>'<span class="rm-note-view-score '+(n===v?'selected':'')+'">'+n+'</span>').join('');return'<section class="rm-note-view-mood" style="--rm-note-mood-color:'+moodColor(v)+'" aria-label="Avaliação de humor: '+v+' de 10"><div class="rm-note-view-mood-head"><strong>Avaliação do humor</strong><b>'+v+'<small>/10</small></b></div><div class="rm-note-view-scale" aria-hidden="true">'+scores+'</div><div class="rm-note-view-caption"><span>0 · muito mal</span><span>5 · neutro</span><span>10 · muito bem</span></div></section>'}
  function installNoteViewer(){const previous=window.openEventViewer;if(typeof previous!=='function'||previous.__rmNoteViewerRefined)return;const refined=async function(id){const event=(await allEvents()).find(item=>item.id===id);if(!event||event.type!=='note')return previous.apply(this,arguments);const details=[];if(event.tag&&typeof rmV28DetailCard==='function')details.push(rmV28DetailCard('Tag',typeof rmV27TagChip==='function'?rmV27TagChip(event.tag):event.tag,{html:true}));for(const [key,value] of Object.entries(event.emotionScores||{})){const dim=typeof emotionDimensions==='function'?emotionDimensions():[],label=event.emotionLabels?.[key]||(dim.find(d=>d.id===key)?.label)||key;if(typeof rmV28DetailCard==='function')details.push(rmV28DetailCard(label,String(value)+' de 4'))}const audio=event.hasAudio?'<div class="rm-v28-detail-card wide"><small>Áudio</small><span data-audio="'+esc(event.id)+'"></span></div>':'',note=typeof rmV28DetailCard==='function'?rmV28DetailCard('Anotação',event.text||'Anotação de voz',{wide:true}):'<div>'+esc(event.text||'Anotação de voz')+'</div>',buttons=typeof rmV28DetailButtons==='function'?rmV28DetailButtons():'<div class="form-actions"><button type="button" class="secondary-button danger-row" id="viewerDeleteBtn">Excluir</button><button type="button" class="primary-button" id="viewerEditBtn">Editar</button></div>';openBackdrop(event.text?'Anotação':'Check-in emocional','<div class="rm-note-detail-view">'+moodViewer(event.moodScore)+note+'<div class="rm-v28-detail-grid">'+details.join('')+audio+'</div><time class="rm-note-view-date">'+esc(registroDetailDate(event.timestamp))+'</time></div>'+buttons,ev=>ev.preventDefault());rmV28ViewerActions?.(id);applyActionIcons(document);if(event.hasAudio)await hydrateAudio(document.getElementById('form'))};refined.__rmNoteViewerRefined=true;window.openEventViewer=refined}
  function apply(){installStyles();installNoteViewer();applyActionIcons(document)}
  apply();new MutationObserver(()=>applyActionIcons(document)).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('click',()=>setTimeout(applyActionIcons,0),{passive:true});window.addEventListener('registro:release-ready',apply);
})();
