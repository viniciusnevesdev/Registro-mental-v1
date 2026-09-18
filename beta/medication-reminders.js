/* Lembretes configurados pelo usuário para medicamentos — somente Beta.
   Não sugere tratamento: apenas avalia regras salvas no próprio cadastro. */
(() => {
  'use strict';

  const DISMISSALS_KEY = 'medicationReminderDismissals';
  const MANUAL_WAKE_KEY = 'registro-beta-awake-monitor-v1';
  const DAY = 86400000;

  const safeConfig = medication => {
    const source = medication?.reminders;
    return {
      enabled: Boolean(source?.enabled),
      timeWindow: { enabled: Boolean(source?.timeWindow?.enabled), start: source?.timeWindow?.start || '', end: source?.timeWindow?.end || '' },
      afterWake: { enabled: Boolean(source?.afterWake?.enabled) },
      trigger: { enabled: Boolean(source?.trigger?.enabled), terms: Array.isArray(source?.trigger?.terms) ? source.trigger.terms.filter(Boolean) : [] }
    };
  };
  const minutes = value => {
    const match = String(value || '').match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const result = Number(match[1]) * 60 + Number(match[2]);
    return result >= 0 && result < 1440 && Number(match[2]) < 60 ? result : null;
  };
  const dateKey = date => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const readDismissals = () => {
    const settings = getSettings();
    return settings[DISMISSALS_KEY] && typeof settings[DISMISSALS_KEY] === 'object' ? settings[DISMISSALS_KEY] : {};
  };
  const dismiss = key => {
    const settings = getSettings();
    settings[DISMISSALS_KEY] = { ...readDismissals(), [key]: new Date().toISOString() };
    saveSettings(settings);
  };
  const normalizeTerms = value => [...new Set(String(value || '').split(',').map(item => item.trim()).filter(Boolean))].slice(0, 20);
  const hasAdministration = (events, medication, from, to = Date.now()) => events.some(event => {
    if (event?.type !== 'medication') return false;
    const timestamp = new Date(event.timestamp).getTime();
    return timestamp >= from && timestamp <= to && (event.medicationId === medication.id || (!event.medicationId && medMatchesEvent(medication, event)));
  });
  const manualWake = () => {
    try {
      const value = JSON.parse(localStorage.getItem(MANUAL_WAKE_KEY) || '{}').manualWakeAt;
      const parsed = new Date(value);
      return Number.isFinite(parsed.getTime()) ? parsed : null;
    } catch (_) { return null; }
  };
  const recordedWake = events => events.filter(event => event?.type === 'sleep' && event.endTime)
    .map(event => new Date(event.endTime)).filter(date => Number.isFinite(date.getTime()) && date <= new Date())
    .sort((a, b) => b - a)[0] || null;
  const wakeToday = events => {
    const now = new Date(), manual = manualWake(), registered = recordedWake(events);
    const wake = manual && (!registered || manual >= registered) ? manual : registered;
    return wake && wake <= now && dateKey(wake) === dateKey(now) ? wake : null;
  };

  function timeWindowPeriod(config, now = new Date()) {
    const start = minutes(config.start), end = minutes(config.end);
    if (start === null || end === null || start === end) return null;
    const current = now.getHours() * 60 + now.getMinutes();
    const overnight = start > end;
    const relevant = overnight ? (current >= start || current <= end) : (current >= start && current <= end);
    if (!relevant) return null;
    const base = startOfDay(now);
    if (overnight && current <= end) base.setDate(base.getDate() - 1);
    const from = new Date(base); from.setMinutes(start, 0, 0);
    const to = new Date(base); to.setMinutes(end, 59, 999); if (overnight) to.setDate(to.getDate() + 1);
    return { from: from.getTime(), to: to.getTime(), period: `${dateKey(base)}-${config.start}-${config.end}` };
  }

  function configuredReminders(medications, events, now = new Date()) {
    const dismissed = readDismissals(), output = [];
    for (const medication of medications) {
      const config = safeConfig(medication);
      if (!config.enabled) continue;
      if (config.timeWindow.enabled) {
        const window = timeWindowPeriod(config.timeWindow, now);
        const key = `window:${medication.id}:${window?.period}`;
        if (window && !dismissed[key] && !hasAdministration(events, medication, window.from, window.to)) output.push({ key, medication, reason: 'Dentro do horário configurado', rule: 'window' });
      }
      if (config.afterWake.enabled) {
        const wake = wakeToday(events), key = `wake:${medication.id}:${wake ? dateKey(wake) : ''}`;
        if (wake && !dismissed[key] && !hasAdministration(events, medication, wake.getTime())) output.push({ key, medication, reason: 'Lembrete após acordar', rule: 'wake' });
      }
      if (config.trigger.enabled && config.trigger.terms.length) {
        const cutoff = now.getTime() - DAY;
        const notes = events.filter(event => event?.type === 'note' && new Date(event.timestamp).getTime() >= cutoff && new Date(event.timestamp).getTime() <= now.getTime())
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const match = notes.map(note => ({ note, term: config.trigger.terms.find(term => normalizeText(`${note.text || ''} ${note.tag || ''}`).includes(normalizeText(term))) })).find(item => item.term);
        const key = `trigger:${medication.id}:${match?.note.id || ''}`;
        if (match && !dismissed[key] && !hasAdministration(events, medication, new Date(match.note.timestamp).getTime())) output.push({ key, medication, reason: `Relacionado ao gatilho configurado: ${match.term}`, rule: 'trigger' });
      }
    }
    return output;
  }

  function reminderCard(reminders) {
    if (!reminders.length) return '';
    return `<section id="medicationReminderCard" class="medication-reminder-card"><div class="medication-reminder-heading"><span data-icon="pill"></span><div><p class="section-kicker">LEMBRETES</p><h2>Lembretes configurados</h2></div></div><p class="medication-reminder-copy">Estas regras foram configuradas por você. Elas não indicam necessidade, dose ou tratamento.</p><div class="medication-reminder-list">${reminders.map(reminder => `<article class="medication-reminder-row"><div><strong>${esc(medicationDisplay(reminder.medication))}</strong><small>${esc(reminder.reason)}</small></div><div class="medication-reminder-actions"><button type="button" class="secondary-button" data-reminder-dismiss="${esc(reminder.key)}">Dispensar</button><button type="button" class="primary-button" data-reminder-register="${esc(reminder.medication.id)}">Registrar</button></div></article>`).join('')}</div></section>`;
  }
  function ensureStyles() {
    if (document.getElementById('medication-reminders-style')) return;
    const style = document.createElement('style'); style.id = 'medication-reminders-style';
    style.textContent = `.medication-reminder-card{margin:14px 0;padding:14px;border:1px solid color-mix(in srgb,var(--record-med,var(--med,#ff9f0a)) 28%,var(--separator));border-radius:22px;background:color-mix(in srgb,var(--record-med,var(--med,#ff9f0a)) 7%,var(--surface))}.medication-reminder-heading{display:flex;gap:9px;align-items:center;color:var(--record-med,var(--med,#ff9f0a))}.medication-reminder-heading>span{width:25px;height:25px}.medication-reminder-heading svg{width:23px;height:23px}.medication-reminder-heading .section-kicker{margin:0;font-size:10px}.medication-reminder-heading h2{margin:1px 0 0;font-size:16px}.medication-reminder-copy{margin:9px 0 11px;color:var(--secondary);font-size:11.5px;line-height:1.35}.medication-reminder-list{display:grid;gap:8px}.medication-reminder-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 11px;border-radius:15px;background:color-mix(in srgb,var(--surface-2) 90%,var(--record-med,var(--med,#ff9f0a)) 10%)}.medication-reminder-row strong,.medication-reminder-row small{display:block}.medication-reminder-row strong{font-size:13px}.medication-reminder-row small{margin-top:2px;color:var(--secondary);font-size:11px}.medication-reminder-actions{display:flex;gap:6px;flex-shrink:0}.medication-reminder-actions button{min-height:32px;padding:6px 8px;font-size:11px}.reminder-rules{padding:11px;border:1px solid var(--separator);border-radius:15px;background:var(--surface-2)}.reminder-rules[disabled]{opacity:.52}.reminder-rule-toggle{display:flex;gap:8px;align-items:center;margin:9px 0 7px;font-size:13px;font-weight:700}.reminder-rule-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px}.reminder-rule-fields .field{margin:0}.reminder-rule-fields input{min-width:0}.reminder-rules .helper{margin:7px 0 0}@media(max-width:420px){.medication-reminder-row{align-items:flex-start;flex-direction:column}.medication-reminder-actions{width:100%}.medication-reminder-actions button{flex:1}}`;
    document.head.appendChild(style);
  }
  async function openPreselectedAdministration(medicationId) {
    await openMedicationSheet();
    if (typeof window.selectMedicationForAdministration === 'function') await window.selectMedicationForAdministration(medicationId);
  }
  async function renderHomeReminders(events, medications) {
    const home = document.querySelector('[data-view="home"]');
    if (!home) return;
    const old = document.getElementById('medicationReminderCard'); if (old) old.remove();
    const reminders = configuredReminders(medications, events);
    if (!reminders.length) return;
    const anchor = home.querySelector('.summary-card') || home.firstElementChild;
    anchor?.insertAdjacentHTML('afterend', reminderCard(reminders));
    const card = document.getElementById('medicationReminderCard'); hydrateIcons(card);
    card.querySelectorAll('[data-reminder-dismiss]').forEach(button => button.onclick = async () => { dismiss(button.dataset.reminderDismiss); await renderAll(); });
    card.querySelectorAll('[data-reminder-register]').forEach(button => button.onclick = () => void openPreselectedAdministration(button.dataset.reminderRegister));
  }

  function reminderEditorHTML(medication = {}) {
    const config = safeConfig(medication), first = (medication.presentations || [])[0] || {};
    const selected = unit => first.strengthUnit === unit ? ' selected' : '';
    return `<div class="field"><label>Princípio ativo</label><input id="regActive" value="${esc(medication.activeIngredient || '')}" placeholder="Ex.: Lisdexanfetamina"></div><div class="field"><label>Marca/referência opcional</label><input id="regReference" value="${esc(medication.referenceName || '')}" placeholder="Ex.: Venvanse"></div><div class="field"><label>Laboratório opcional</label><input id="regLab" value="${esc(medication.lab || '')}"></div><p class="section-mini-title">Primeira apresentação</p><div class="field-grid"><div class="field"><label>Dosagem</label><input id="regStrength" inputmode="decimal" value="${esc(first.strengthValue || '')}"></div><div class="field"><label>Unidade</label><select id="regStrengthUnit"><option${selected('mg')}>mg</option><option${selected('mcg')}>mcg</option><option${selected('g')}>g</option><option${selected('mL')}>mL</option></select></div></div><div class="field"><label>Forma</label><input id="regForm" value="${esc(first.form || '')}" placeholder="cápsula, comprimido…"></div><div class="field-grid"><div class="field"><label>Unidades por caixa</label><input id="regUnits" inputmode="numeric" value="${esc(first.unitsPerPackage || '')}"></div><div class="field"><label>Unidades por cartela</label><input id="regBlister" inputmode="numeric" value="${esc(first.unitsPerBlister || '')}"></div></div><p class="section-mini-title">Lembretes</p><div class="field"><label class="reminder-rule-toggle"><input id="remindersEnabled" type="checkbox" ${config.enabled ? 'checked' : ''}> Lembretes configurados para este medicamento</label><p class="helper">Opcional. O app somente mostra regras que você ativar; não sugere dose, frequência ou tratamento.</p></div><fieldset id="reminderRules" class="reminder-rules" ${config.enabled ? '' : 'disabled'}><label class="reminder-rule-toggle"><input id="reminderWindowEnabled" type="checkbox" ${config.timeWindow.enabled ? 'checked' : ''}> Janela de horário</label><div class="reminder-rule-fields"><div class="field"><label for="reminderStart">Horário inicial</label><input id="reminderStart" type="time" value="${esc(config.timeWindow.start)}"></div><div class="field"><label for="reminderEnd">Horário final</label><input id="reminderEnd" type="time" value="${esc(config.timeWindow.end)}"></div></div><label class="reminder-rule-toggle"><input id="reminderWakeEnabled" type="checkbox" ${config.afterWake.enabled ? 'checked' : ''}> Após acordar</label><p class="helper">Usa apenas um despertar registrado hoje (sono ou horário manual). Sem registro, nenhum lembrete é criado.</p><label class="reminder-rule-toggle"><input id="reminderTriggerEnabled" type="checkbox" ${config.trigger.enabled ? 'checked' : ''}> Após gatilho em anotação</label><div class="field"><label for="reminderTerms">Palavras ou termos de gatilho</label><input id="reminderTerms" value="${esc(config.trigger.terms.join(', '))}" placeholder="Ex.: dor, dor de cabeça"></div><p class="helper">Separados por vírgula. Um lembrete só aparece após uma anotação recente correspondente.</p></fieldset>${formButtons(medication.id ? 'Salvar' : 'Cadastrar')}`;
  }
  const originalEditor = window.openMedicationEditor;
  window.openMedicationEditor = function openMedicationEditorWithReminders(medication = null) {
    const base = medication ? { ...medication } : {};
    openBackdrop(medication ? 'Editar medicamento' : 'Novo medicamento', reminderEditorHTML(base), async event => {
      event.preventDefault();
      const active = document.getElementById('regActive').value.trim(); if (!active) return toast('Informe o princípio ativo.');
      const enabled = document.getElementById('remindersEnabled').checked;
      const windowEnabled = document.getElementById('reminderWindowEnabled').checked;
      const start = document.getElementById('reminderStart').value, end = document.getElementById('reminderEnd').value;
      if (enabled && windowEnabled && (minutes(start) === null || minutes(end) === null || minutes(start) === minutes(end))) return toast('Informe horários inicial e final diferentes para a janela.');
      const triggerEnabled = document.getElementById('reminderTriggerEnabled').checked, terms = normalizeTerms(document.getElementById('reminderTerms').value);
      if (enabled && triggerEnabled && !terms.length) return toast('Informe ao menos um termo de gatilho.');
      const saved = { ...base, id: base.id || uid('med'), activeIngredient: active, referenceName: document.getElementById('regReference').value.trim(), lab: document.getElementById('regLab').value.trim(), notes: base.notes || [], presentations: base.presentations || [] };
      const strength = document.getElementById('regStrength').value.trim();
      if (strength) { const old = saved.presentations[0] || { id: uid('presentation') }; saved.presentations[0] = { ...old, strengthValue: Number(String(strength).replace(',', '.')) || strength, strengthUnit: document.getElementById('regStrengthUnit').value, form: document.getElementById('regForm').value.trim(), unitsPerPackage: Number(document.getElementById('regUnits').value) || '', unitsPerBlister: Number(document.getElementById('regBlister').value) || '', brand: saved.referenceName, lab: saved.lab }; }
      saved.reminders = { version: 1, enabled, timeWindow: { enabled: enabled && windowEnabled, start, end }, afterWake: { enabled: enabled && document.getElementById('reminderWakeEnabled').checked }, trigger: { enabled: enabled && triggerEnabled, terms } };
      await putMedication(saved); toast('Medicamento salvo.'); openMedicationDetail(saved.id);
    });
    document.getElementById('remindersEnabled').onchange = event => { document.getElementById('reminderRules').disabled = !event.target.checked; };
  };
  void originalEditor;

  const previousRenderAll = renderAll;
  renderAll = async function renderAllWithMedicationReminders(...args) {
    const result = await previousRenderAll(...args);
    await renderHomeReminders(await allEvents(), await allMedications());
    return result;
  };
  window.medicationReminderEngine = { configuredReminders, timeWindowPeriod, safeConfig };
  ensureStyles();
  if (db) void renderAll(); else setTimeout(() => { if (db) void renderAll(); }, 350);
})();
