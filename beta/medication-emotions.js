/* Registro Mental Beta — emoções/sensações em contexto de administrações. */
(() => {
  'use strict';

  let pendingAdministrationEmotions = null;
  let pendingTrackedEmotionIds = null;
  const selectedDimensionIds = () => [...document.querySelectorAll('[data-track-emotion]:checked')].map(input => input.value);
  const scoresFromAdministrationForm = () => window.emotionScoresFromForm?.() || {};
  const labelsFor = scores => window.emotionLabelsSnapshot?.(scores) || {};
  const hasScores = event => Object.keys(event?.emotionScores || {}).length > 0;
  const elapsedLabel = milliseconds => {
    const minutes = Math.max(0, Math.round(milliseconds / 60000));
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60} min` : ''}`;
  };

  function dimensionsById() {
    return new Map((window.emotionDimensions?.() || []).map(dimension => [dimension.id, dimension]));
  }

  function scoreChips(scores, labels, trackedIds = []) {
    const dimensions = dimensionsById(), tracked = new Set(trackedIds || []);
    return Object.entries(scores || {}).map(([id, value]) => {
      const label = dimensions.get(id)?.label || labels?.[id] || id;
      return `<span class="rm-med-emotion-chip${tracked.has(id) ? ' tracked' : ''}">${window.esc(label)} ${window.esc(value)}</span>`;
    }).join('');
  }

  function administrationEmotionsMarkup() {
    return `<div class="rm-med-emotions-field"><label>Como você está se sentindo?</label>${window.emotionAdvancedHTML({})}<p class="helper">Opcional. Estes valores descrevem o momento do registro, sem indicar causa.</p></div>`;
  }

  function trackingMarkup(medication) {
    const selected = new Set(medication?.trackedEmotionIds || []);
    const dimensions = (window.emotionDimensions?.() || []).filter(dimension => dimension.active !== false);
    return `<section class="rm-med-tracking"><p class="section-mini-title">Emoções para acompanhar</p><p class="helper">Preferência pessoal para facilitar a leitura do histórico; não cria associação automática.</p><div class="rm-med-tracking-list">${dimensions.map(dimension => `<label><input type="checkbox" data-track-emotion value="${window.esc(dimension.id)}" ${selected.has(dimension.id) ? 'checked' : ''}><span>${window.esc(dimension.label)}</span></label>`).join('') || '<span class="helper">Nenhuma dimensão disponível.</span>'}</div></section>`;
  }

  function insertAdministrationEmotions(values = null) {
    const noteField = document.getElementById('medNote')?.closest('.field');
    if (!noteField) return;
    if (document.getElementById('rmMedicationEmotionField')) {
      Object.entries(values || {}).forEach(([id, value]) => window.emotionSelectDimension?.(id, value));
      return;
    }
    noteField.insertAdjacentHTML('beforebegin', administrationEmotionsMarkup());
    const field = noteField.previousElementSibling;
    if (field) field.id = 'rmMedicationEmotionField';
    window.wireEmotionControls?.();
    Object.entries(values || {}).forEach(([id, value]) => window.emotionSelectDimension?.(id, value));
  }

  function renderEmotionProfile(medication, events) {
    const hostTitle = [...document.querySelectorAll('#form .section-mini-title')]
      .find(title => title.textContent.trim() === 'Anotações relacionadas');
    if (!hostTitle || document.getElementById('rmMedicationEmotionsSection')) return;
    const tracked = medication.trackedEmotionIds || [];
    const administrations = events.filter(event => event.type === 'medication' && window.medMatchesEvent(medication, event) && hasScores(event));
    const related = window.rmMedicationRelatedNotes?.relatedNotesForMedication(medication, events) || [];
    const laterNotes = related.filter(item => item.administration && hasScores(item.note));
    const rows = [
      ...administrations.map(event => ({ timestamp:event.timestamp, html:`<div class="rm-med-emotion-row"><time>${window.esc(window.registroDetailDate(event.timestamp))}</time><small>No momento do registro</small><div>${scoreChips(event.emotionScores, event.emotionLabels, tracked)}</div></div>` })),
      ...laterNotes.map(item => ({ timestamp:item.note.timestamp, html:`<div class="rm-med-emotion-row later"><time>${window.esc(window.registroDetailDate(item.note.timestamp))}</time><small>${window.esc(`Registrado ${elapsedLabel(item.administration.elapsed)} após administração`)}</small><div>${scoreChips(item.note.emotionScores, item.note.emotionLabels, tracked)}</div></div>` }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const section = document.createElement('section');
    section.id = 'rmMedicationEmotionsSection';
    section.innerHTML = `<p class="section-mini-title">Emoções e sensações</p><div class="rm-med-emotion-list">${rows.length ? rows.map(row => row.html).join('') : '<p class="rm-med-emotions-empty">Nenhuma emoção ou sensação registrada ainda.</p>'}</div><p class="rm-med-emotions-context">Os dados apenas organizam registros no momento ou depois da administração; não indicam causalidade.</p>`;
    hostTitle.before(section);
  }

  function installStyles() {
    if (document.getElementById('rm-medication-emotions-style')) return;
    const style = document.createElement('style');
    style.id = 'rm-medication-emotions-style';
    style.textContent = `
      .rm-med-emotions-field{display:grid;gap:6px}.rm-med-emotions-field>label{font-size:13px;font-weight:720}.rm-med-emotions-field .emotion-advanced{margin:0!important}
      .rm-med-tracking{display:grid;gap:7px}.rm-med-tracking .section-mini-title{margin-bottom:0}.rm-med-tracking-list{display:flex;flex-wrap:wrap;gap:7px}.rm-med-tracking-list label{display:inline-flex;align-items:center;gap:6px;padding:7px 9px;border:1px solid var(--separator);border-radius:10px;font-size:12px}.rm-med-tracking-list input{accent-color:var(--accent)}
      .rm-med-emotion-list{display:grid;gap:8px}.rm-med-emotion-row{display:grid;gap:5px;padding:10px 11px;border:1px solid color-mix(in srgb,var(--accent) 22%,var(--separator));border-radius:16px;background:color-mix(in srgb,var(--accent) 5%,var(--surface-2))}.rm-med-emotion-row.later{border-color:color-mix(in srgb,var(--record-med,var(--med)) 24%,var(--separator));background:color-mix(in srgb,var(--record-med,var(--med)) 5%,var(--surface-2))}.rm-med-emotion-row time{font-size:11px;font-weight:730;color:var(--secondary)}.rm-med-emotion-row small{font-size:11px;font-weight:730;color:var(--accent)}.rm-med-emotion-row.later small{color:var(--record-med,var(--med))}.rm-med-emotion-row>div{display:flex;flex-wrap:wrap;gap:5px}.rm-med-emotion-chip{display:inline-flex;padding:4px 7px;border-radius:8px;background:color-mix(in srgb,var(--accent) 11%,transparent);color:var(--accent);font-size:11px;font-weight:760}.rm-med-emotion-chip.tracked{outline:2px solid color-mix(in srgb,var(--accent) 38%,transparent);background:color-mix(in srgb,var(--accent) 18%,transparent)}.rm-med-emotions-empty,.rm-med-emotions-context{margin:2px;color:var(--secondary);font-size:11px;line-height:1.35}
    `;
    document.head.appendChild(style);
  }

  function install() {
    if (!window.openMedicationSheet || window.openMedicationSheet.__rmMedicationEmotions) return false;
    const previousOpenSheet = window.openMedicationSheet;
    window.openMedicationSheet = async function(...args) {
      const result = await previousOpenSheet.apply(this, args);
      insertAdministrationEmotions();
      return result;
    };
    window.openMedicationSheet.__rmMedicationEmotions = true;

    const previousOpenEditor = window.openEventEditor;
    window.openEventEditor = async function(id, ...args) {
      const result = await previousOpenEditor.call(this, id, ...args);
      const event = (await window.allEvents()).find(item => item.id === id);
      if (event?.type === 'medication') insertAdministrationEmotions(event.emotionScores || {});
      return result;
    };

    const previousOpenMedicationEditor = window.openMedicationEditor;
    window.openMedicationEditor = function(medication, ...args) {
      const result = previousOpenMedicationEditor.call(this, medication, ...args);
      const form = document.getElementById('form');
      if (!form || document.getElementById('rmMedicationTracking')) return result;
      const actions = form.querySelector('.form-actions');
      actions?.insertAdjacentHTML('beforebegin', trackingMarkup(medication));
      const originalSubmit = form.onsubmit;
      form.onsubmit = async event => {
        pendingTrackedEmotionIds = selectedDimensionIds();
        try { return await originalSubmit.call(form, event); } finally { pendingTrackedEmotionIds = null; }
      };
      return result;
    };

    const previousSaveForm = window.saveForm;
    window.saveForm = async function(...args) {
      if (window.currentType === 'medication' || document.getElementById('medNote')) pendingAdministrationEmotions = scoresFromAdministrationForm();
      try { return await previousSaveForm.apply(this, args); } finally { pendingAdministrationEmotions = null; }
    };
    const previousSaveEdited = window.saveEditedEvent;
    window.saveEditedEvent = async function(...args) {
      const existing = args[1];
      if (existing?.type === 'medication') pendingAdministrationEmotions = scoresFromAdministrationForm();
      try { return await previousSaveEdited.apply(this, args); } finally { pendingAdministrationEmotions = null; }
    };
    const previousPutEvent = window.putEvent;
    window.putEvent = async function(record, ...args) {
      if (record?.type === 'medication' && pendingAdministrationEmotions !== null) record = { ...record, emotionScores:pendingAdministrationEmotions, emotionLabels:labelsFor(pendingAdministrationEmotions) };
      return previousPutEvent.call(this, record, ...args);
    };
    const previousPutMedication = window.putMedication;
    window.putMedication = async function(medication, ...args) {
      if (pendingTrackedEmotionIds !== null) medication = { ...medication, trackedEmotionIds:[...new Set(pendingTrackedEmotionIds)] };
      return previousPutMedication.call(this, medication, ...args);
    };
    const previousDetail = window.openMedicationDetail;
    window.openMedicationDetail = async function(id, ...args) {
      const result = await previousDetail.call(this, id, ...args);
      const [medications, events] = await Promise.all([window.allMedications(), window.allEvents()]);
      const medication = medications.find(item => item.id === id);
      if (medication) renderEmotionProfile(medication, events);
      return result;
    };
    return true;
  }

  installStyles();
  let tries = 0;
  const timer = setInterval(() => { if (install() || ++tries > 80) clearInterval(timer); }, 80);
})();
