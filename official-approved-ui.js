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


/* RM_SLEEP_DURATION_SCORE_V1 */
(() => {
  if (window.__RM_SLEEP_DURATION_SCORE_V1) return;
  window.__RM_SLEEP_DURATION_SCORE_V1 = true;

  const kindOf = e => (e?.sleepKind === 'nap' || e?.sleepType === 'nap' || e?.isNap === true) ? 'nap' : 'main';
  const score = h => {
    h=Number(h); if(!Number.isFinite(h)||h<=0)return null;
    if(h<2)return{n:1,t:'Extremamente curto',l:'alert'};
    if(h<3)return{n:2,t:'Muito curto',l:'alert'};
    if(h<4)return{n:3,t:'Muito curto',l:'alert'};
    if(h<5)return{n:4,t:'Insuficiente',l:'caution'};
    if(h<6)return{n:5,t:'Abaixo do ideal',l:'caution'};
    if(h<7)return{n:7,t:'Quase adequado',l:'near'};
    if(h<=9)return{n:10,t:'Ideal',l:'ideal'};
    if(h<=10)return{n:9,t:'Duração longa',l:'near'};
    if(h<=11)return{n:8,t:'Sono prolongado',l:'near'};
    if(h<=12)return{n:7,t:'Muito prolongado',l:'caution'};
    if(h<=13)return{n:6,t:'Duração incomum',l:'caution'};
    return{n:5,t:'Duração muito longa',l:'alert'};
  };
  const scoreEvent = e => e?.type==='sleep' && kindOf(e)!=='nap' && typeof durationHours==='function'
    ? score(durationHours(e.startTime,e.endTime)) : null;
  window.rmSleepDurationScore=score;
  window.rmSleepDurationScoreForEvent=scoreEvent;

  if(!document.getElementById('rm-sleep-score-style')){
    const st=document.createElement('style'); st.id='rm-sleep-score-style'; st.textContent=`
      .rm-sleep-title-score{display:flex!important;align-items:center;gap:8px;flex-wrap:wrap}
      .rm-sleep-score,.rm-sleep-nap{display:inline-flex;align-items:center;min-height:24px;padding:3px 8px;border-radius:999px;font-size:12px;font-weight:700;line-height:1.15;white-space:nowrap;border:1px solid transparent}
      .rm-sleep-score[data-level="ideal"]{color:#18772f;background:rgba(52,199,89,.13);border-color:rgba(52,199,89,.24)}
      .rm-sleep-score[data-level="near"]{color:#8a6100;background:rgba(255,204,0,.15);border-color:rgba(255,204,0,.28)}
      .rm-sleep-score[data-level="caution"]{color:#a94d00;background:rgba(255,159,10,.14);border-color:rgba(255,159,10,.28)}
      .rm-sleep-score[data-level="alert"]{color:#c5221f;background:rgba(255,69,58,.12);border-color:rgba(255,69,58,.24)}
      .rm-sleep-nap{color:var(--sleep,var(--accent));background:rgba(120,100,255,.10);border-color:rgba(120,100,255,.20)}
      .rm-sleep-kind-control{display:grid!important;grid-template-columns:1fr 1fr}
      .rm-sleep-score-detail{display:flex;flex-direction:column;gap:4px}
      .rm-sleep-score-note{font-size:11px;line-height:1.3;opacity:.62;font-weight:500}
    `; document.head.appendChild(st);
  }

  function setKind(k){
    k=k==='nap'?'nap':'main';
    const v=document.getElementById('rmSleepKindValue'); if(v)v.value=k;
    document.querySelectorAll('#rmSleepKindControl [data-sleep-kind]').forEach(b=>{
      const on=b.dataset.sleepKind===k; b.classList.toggle('selected',on); b.setAttribute('aria-pressed',String(on));
    });
  }
  function addKind(k='main'){
    const form=document.getElementById('form'); if(!form||!document.getElementById('sleepStart'))return;
    if(document.getElementById('rmSleepKindControl'))return setKind(k);
    const box=document.createElement('div'); box.className='field rm-sleep-kind-field';
    box.innerHTML='<label>Tipo de sono</label><div class="segmented animated-segmented rm-sleep-kind-control" id="rmSleepKindControl"><button type="button" data-sleep-kind="main">Sono principal</button><button type="button" data-sleep-kind="nap">Soneca</button></div><input type="hidden" id="rmSleepKindValue" value="main"><p class="helper">A nota automática de duração é aplicada apenas ao sono principal.</p>';
    const q=document.getElementById('sleepQuality')?.closest('.field'); q?q.before(box):form.prepend(box);
    box.querySelectorAll('[data-sleep-kind]').forEach(b=>b.onclick=()=>setKind(b.dataset.sleepKind)); setKind(k);
  }

  if(typeof window.openSleepSheet==='function'){
    const prev=window.openSleepSheet;
    window.openSleepSheet=function(payload=null){const r=prev.apply(this,arguments);addKind(payload?.sleepKind==='nap'?'nap':'main');return r};
  }
  if(typeof window.openEventEditor==='function'&&typeof window.allEvents==='function'){
    const prev=window.openEventEditor;
    window.openEventEditor=async function(id){const e=(await window.allEvents()).find(x=>x.id===id);const r=await prev.apply(this,arguments);if(e?.type==='sleep')addKind(kindOf(e));return r};
  }
  if(typeof window.putEvent==='function'){
    const prev=window.putEvent;
    window.putEvent=async function(e){let n=e;if(e?.type==='sleep'){const v=document.getElementById('rmSleepKindValue')?.value;n={...e,sleepKind:v==='nap'?'nap':v==='main'?'main':kindOf(e)}}return prev.call(this,n)};
  }

  const badge=e=>{
    if(kindOf(e)==='nap')return'<span class="rm-sleep-nap">Soneca</span>';
    const s=scoreEvent(e); if(!s)return'';
    return'<span class="rm-sleep-score" data-level="'+s.l+'" title="Nota automática baseada apenas no tempo dormido">'+s.n+'/10 · '+s.t+'</span>';
  };
  if(typeof window.eventCard==='function'){
    const prev=window.eventCard;
    window.eventCard=function(e){let h=prev.apply(this,arguments);if(e?.type!=='sleep'||typeof h!=='string')return h;const b=badge(e);if(!b)return h;return h.replace(/<div class="timeline-title rm-record-name">([\s\S]*?)<\/div>/,'<div class="timeline-title rm-record-name rm-sleep-title-score"><span>$1</span>'+b+'</div>')};
  }
  if(typeof window.openEventViewer==='function'&&typeof window.allEvents==='function'){
    const prev=window.openEventViewer;
    window.openEventViewer=async function(id){
      const e=(await window.allEvents()).find(x=>x.id===id);const r=await prev.apply(this,arguments);if(e?.type!=='sleep')return r;
      const grid=document.querySelector('#form .rm-v28-detail-grid,.rm-v28-detail-grid');if(!grid)return r;
      const d=[...grid.children].find(x=>x.querySelector('small')?.textContent.trim()==='Duração');
      let html='';
      if(kindOf(e)==='nap')html='<div class="rm-v28-detail-card rm-sleep-score-card"><small>Tipo</small><div class="rm-sleep-score-detail"><strong>Soneca</strong><span class="rm-sleep-score-note">Sem nota automática de duração.</span></div></div>';
      else{const s=scoreEvent(e);if(s)html='<div class="rm-v28-detail-card rm-sleep-score-card"><small>Nota da duração</small><div class="rm-sleep-score-detail"><strong>'+s.n+'/10 · '+s.t+'</strong><span class="rm-sleep-score-note">Baseada apenas no tempo dormido.</span></div></div>'}
      if(html)d?d.insertAdjacentHTML('afterend',html):grid.insertAdjacentHTML('beforeend',html);return r;
    };
  }
  setTimeout(()=>{try{const r=window.renderAll?.();r?.catch?.(()=>{})}catch(_){}},250);
})();
