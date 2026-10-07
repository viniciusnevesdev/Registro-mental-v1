/* Registro Mental Beta — anotações relacionadas no detalhe do medicamento.
   Relações temporais organizam contexto; não representam inferência clínica. */
(() => {
  'use strict';

  // Reutiliza a janela já usada em “Associações temporais” da aba Análises.
  // É somente uma janela de contexto para organizar o histórico, não uma regra médica.
  const CONTEXT_WINDOW_MS = 8 * 60 * 60 * 1000;

  const uniqueIds = value => [...new Set((Array.isArray(value) ? value : []).filter(Boolean))];
  const timestampMs = value => new Date(value).getTime();
  const validTime = value => Number.isFinite(value);

  function elapsedLabel(milliseconds) {
    const minutes = Math.max(0, Math.round(milliseconds / 60000));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return `${hours}h${remainder ? ` ${remainder} min` : ''}`;
  }

  function noteDateLabel(timestamp) {
    return typeof window.registroDetailDate === 'function'
      ? window.registroDetailDate(timestamp)
      : new Date(timestamp).toLocaleString('pt-BR', { dateStyle:'short', timeStyle:'short' });
  }

  function emotionalNoteLabel(note) {
    if (note.moodScore != null) return `Nota emocional: ${note.moodScore}`;
    const scores = Object.entries(note.emotionScores || {});
    if (!scores.length) return '';
    return scores.map(([key, value]) => {
      const dimension = typeof window.emotionDimensions === 'function'
        ? window.emotionDimensions().find(item => item.id === key)
        : null;
      return `${dimension?.label || note.emotionLabels?.[key] || key}: ${value}/4`;
    }).join(' · ');
  }

  function relatedNotesForMedication(medication, events) {
    const administrations = events
      .filter(event => event.type === 'medication' && window.medMatchesEvent(medication, event))
      .map(event => ({ event, time:timestampMs(event.timestamp) }))
      .filter(item => validTime(item.time));

    return events
      .filter(event => event.type === 'note')
      .map(note => {
        const noteTime = timestampMs(note.timestamp);
        if (!validTime(noteTime)) return null;
        const mentioned = uniqueIds(note.medicationMentions).includes(medication.id);
        // A administração mais próxima antes da anotação evita repetir o mesmo registro.
        const administration = administrations.reduce((closest, candidate) => {
          const elapsed = noteTime - candidate.time;
          if (elapsed < 0 || elapsed > CONTEXT_WINDOW_MS) return closest;
          return !closest || elapsed < closest.elapsed ? { ...candidate, elapsed } : closest;
        }, null);
        if (!mentioned && !administration) return null;
        return { note, mentioned, administration };
      })
      .filter(Boolean)
      .sort((a, b) => timestampMs(b.note.timestamp) - timestampMs(a.note.timestamp));
  }

  function relatedNoteCard(item) {
    const { note, mentioned, administration } = item;
    const relations = [
      mentioned ? '<span class="rm-related-note-badge">Mencionado na anotação</span>' : '',
      administration ? `<span class="rm-related-note-badge context">Registrado ${window.esc(elapsedLabel(administration.elapsed))} após uma administração</span>` : ''
    ].filter(Boolean).join('');
    const emotional = emotionalNoteLabel(note);
    return `<button type="button" class="rm-related-note-card" data-related-note="${window.esc(note.id)}">
      <time>${window.esc(noteDateLabel(note.timestamp))}</time>
      ${note.text ? `<span class="rm-related-note-text">${window.esc(note.text)}</span>` : ''}
      ${emotional ? `<span class="rm-related-note-emotion">${window.esc(emotional)}</span>` : ''}
      <span class="rm-related-note-badges">${relations}</span>
    </button>`;
  }

  function installStyles() {
    if (document.getElementById('rm-related-notes-style')) return;
    const style = document.createElement('style');
    style.id = 'rm-related-notes-style';
    style.textContent = `
      .rm-related-notes-list{display:grid;gap:8px}
      .rm-related-note-card{appearance:none;width:100%;display:grid;gap:6px;text-align:left;padding:11px 12px;border:1px solid color-mix(in srgb,var(--separator) 82%,var(--accent) 18%);border-radius:18px;background:color-mix(in srgb,var(--surface-2) 94%,var(--accent) 6%);color:var(--text);font:inherit;cursor:pointer}
      .rm-related-note-card:active{transform:scale(.99)}
      .rm-related-note-card time{font-size:11px;line-height:1.2;font-weight:720;color:var(--secondary)}
      .rm-related-note-text{font-size:14px;line-height:1.35;font-weight:620;overflow-wrap:anywhere}
      .rm-related-note-emotion{font-size:12px;line-height:1.3;color:var(--secondary);overflow-wrap:anywhere}
      .rm-related-note-badges{display:flex;flex-wrap:wrap;gap:5px}
      .rm-related-note-badge{display:inline-flex;align-items:center;min-height:22px;padding:3px 7px;border-radius:8px;background:color-mix(in srgb,var(--accent) 10%,transparent);color:var(--accent);font-size:10.5px;line-height:1.2;font-weight:760}
      .rm-related-note-badge.context{background:color-mix(in srgb,var(--record-med,var(--med)) 10%,transparent);color:var(--record-med,var(--med))}
      .rm-related-notes-context{margin:6px 2px 0;color:var(--secondary);font-size:10.5px;line-height:1.3}
      .rm-related-notes-empty{padding:2px 2px 0;color:var(--secondary);font-size:12px;line-height:1.35}
    `;
    document.head.appendChild(style);
  }

  function install() {
    if (typeof window.openMedicationDetail !== 'function' || window.openMedicationDetail.__rmRelatedNotes) return false;
    const previous = window.openMedicationDetail;
    const wrapped = async function(id, ...args) {
      const result = await previous.call(this, id, ...args);
      const [medications, events] = await Promise.all([window.allMedications(), window.allEvents()]);
      const medication = medications.find(item => item.id === id);
      if (!medication || !document.getElementById('form')) return result;

      const title = [...document.querySelectorAll('#form .section-mini-title')]
        .find(element => element.textContent.trim() === 'Anotações sobre o medicamento');
      if (!title || document.getElementById('rmRelatedNotesSection')) return result;

      const related = relatedNotesForMedication(medication, events);
      const section = document.createElement('section');
      section.id = 'rmRelatedNotesSection';
      section.innerHTML = `<p class="section-mini-title">Anotações relacionadas</p><div class="rm-related-notes-list">${related.length ? related.map(relatedNoteCard).join('') : '<p class="rm-related-notes-empty">Nenhuma anotação relacionada ainda.</p>'}</div><p class="rm-related-notes-context">Relações por menção ou proximidade temporal; a janela de contexto não indica causalidade.</p>`;
      title.before(section);
      section.querySelectorAll('[data-related-note]').forEach(button => {
        button.onclick = () => window.openEventViewer(button.dataset.relatedNote);
      });
      return result;
    };
    wrapped.__rmRelatedNotes = true;
    wrapped.__rmRelatedNotesOriginal = previous;
    window.openMedicationDetail = wrapped;
    return true;
  }

  // API pequena para extensões da Beta reutilizarem a mesma relação temporal.
  window.rmMedicationRelatedNotes = { CONTEXT_WINDOW_MS, relatedNotesForMedication };
  installStyles();
  const timer = setInterval(() => { if (install()) clearInterval(timer); }, 80);
  setTimeout(() => clearInterval(timer), 5000);
})();
