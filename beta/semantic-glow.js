/* Registro Mental Beta — glow semântico estático e econômico para o Modo Ultra. */
(() => {
  'use strict';
  if (document.getElementById('rm-semantic-glow-style')) return;

  const style = document.createElement('style');
  style.id = 'rm-semantic-glow-style';
  style.textContent = `
    /* Uma família de cor por categoria, reutilizando somente tokens existentes. */
    .rm-v28-timeline.rm-type-note{--rm-semantic-tone:var(--record-note,var(--accent))}
    .rm-v28-timeline.rm-type-medication{--rm-semantic-tone:var(--record-med,var(--med))}
    .rm-v28-timeline.rm-type-sleep{--rm-semantic-tone:var(--record-sleep,var(--sleep))}
    .rm-v28-timeline.rm-type-purchase{--rm-semantic-tone:var(--record-buy,var(--buy))}
    .compact-summary-list .summary-row:nth-child(1){--rm-semantic-tone:var(--record-note,var(--accent))}
    .compact-summary-list .summary-row:nth-child(2){--rm-semantic-tone:var(--record-med,var(--med))}
    .compact-summary-list .summary-row:nth-child(3){--rm-semantic-tone:var(--record-sleep,var(--sleep))}
    .compact-summary-list .summary-row:nth-child(4){--rm-semantic-tone:var(--record-buy,var(--buy))}

    /* Mesma borda discreta e padronizada da versão Oficial em todos os registros. */
    .timeline-item.rm-v28-timeline{border:1px solid var(--rm-line)!important}

    /* Ultra: uma única sombra colorida, suave e estática, abaixo da borda. */
    html[data-visual-mode="ultra"] .rm-v28-timeline{
      border:1px solid var(--rm-line)!important;
      box-shadow:0 5px 15px color-mix(in srgb,var(--rm-semantic-tone) 9%,transparent)!important;
    }
    html[data-visual-mode="ultra"] .rm-v28-timeline .timeline-type-icon,
    html[data-visual-mode="ultra"] .rm-v28-timeline .timeline-kind{color:var(--rm-semantic-tone)!important}
    html[data-visual-mode="ultra"] .compact-summary-list .summary-row-icon{
      border-radius:8px;
      box-shadow:0 0 6px color-mix(in srgb,var(--rm-semantic-tone) 12%,transparent);
    }
    html[data-visual-mode="ultra"] .action-card:not(.primary-action){
      border-color:color-mix(in srgb,var(--rm-card-accent,var(--accent)) 22%,var(--separator))!important;
      box-shadow:0 5px 14px color-mix(in srgb,var(--rm-card-accent,var(--accent)) 10%,transparent)!important;
    }
    html[data-visual-mode="ultra"] #historyFilters .filter-chip.selected{
      box-shadow:
        0 0 0 1.5px color-mix(in srgb,var(--rm-filter-tone,var(--accent)) 88%,transparent),
        0 0 14px 1px color-mix(in srgb,var(--rm-filter-tone,var(--accent)) 82%,transparent),
        0 0 30px 5px color-mix(in srgb,var(--rm-filter-tone,var(--accent)) 58%,transparent)!important;
    }

    /* No escuro, a mesma família de cor fica um pouco mais legível — sem ampliar o blur. */
    html[data-theme="dark"][data-visual-mode="ultra"] .rm-v28-timeline{border-color:var(--rm-line)!important;box-shadow:0 5px 15px color-mix(in srgb,var(--rm-semantic-tone) 17%,transparent)!important}
    html[data-theme="dark"][data-visual-mode="ultra"] .compact-summary-list .summary-row-icon{box-shadow:0 0 7px color-mix(in srgb,var(--rm-semantic-tone) 20%,transparent)}
    html[data-theme="dark"][data-visual-mode="ultra"] .action-card:not(.primary-action){box-shadow:0 5px 14px color-mix(in srgb,var(--rm-card-accent,var(--accent)) 17%,transparent)!important}
    @media(prefers-color-scheme:dark){html[data-theme="system"][data-visual-mode="ultra"] .rm-v28-timeline{border-color:var(--rm-line)!important;box-shadow:0 5px 15px color-mix(in srgb,var(--rm-semantic-tone) 17%,transparent)!important}html[data-theme="system"][data-visual-mode="ultra"] .compact-summary-list .summary-row-icon{box-shadow:0 0 7px color-mix(in srgb,var(--rm-semantic-tone) 20%,transparent)}html[data-theme="system"][data-visual-mode="ultra"] .action-card:not(.primary-action){box-shadow:0 5px 14px color-mix(in srgb,var(--rm-card-accent,var(--accent)) 17%,transparent)!important}}

    /* Otimizado: conserva cor, ícone e borda; elimina o halo externo e filtros decorativos. */
    html[data-visual-mode="optimized"] .rm-v28-timeline{
      border:1px solid var(--rm-line)!important;
      box-shadow:0 2px 8px rgba(38,43,70,.055)!important;
    }
    html[data-theme="dark"][data-visual-mode="optimized"] .rm-v28-timeline{box-shadow:0 2px 8px rgba(0,0,0,.18)!important}
    @media(prefers-color-scheme:dark){html[data-theme="system"][data-visual-mode="optimized"] .rm-v28-timeline{box-shadow:0 2px 8px rgba(0,0,0,.18)!important}}
    html[data-visual-mode="optimized"] .compact-summary-list .summary-row-icon{box-shadow:none}
    html[data-visual-mode="optimized"] .action-card:not(.primary-action){box-shadow:0 2px 8px rgba(38,43,70,.055)!important}
    html[data-visual-mode="optimized"] #historyFilters .filter-chip.rm-filter-type.selected{box-shadow:0 1px 4px color-mix(in srgb,var(--rm-filter-tone) 10%,transparent)!important}

    /* Observação do registro de medicamento: uma linha, expandindo só quando necessário. */
    #medNote.rm-med-note-autogrow{
      min-height:44px!important;
      height:44px;
      overflow-y:hidden!important;
      resize:none!important;
      box-sizing:border-box!important;
    }
  `;
  document.head.appendChild(style);
})();

/* Interações do app: bloqueia zoom e compacta a observação de medicamento. */
(() => {
  'use strict';

  function lockViewportZoom() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.setAttribute('content', 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover');

    const prevent = event => event.preventDefault();
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(type => {
      document.addEventListener(type, prevent, { passive:false });
    });
    document.addEventListener('touchmove', event => {
      if (event.touches && event.touches.length > 1) event.preventDefault();
    }, { passive:false });
    document.addEventListener('dblclick', prevent, { passive:false });

    let lastTouchEnd = 0;
    document.addEventListener('touchend', event => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) event.preventDefault();
      lastTouchEnd = now;
    }, { passive:false });

    document.addEventListener('wheel', event => {
      if (event.ctrlKey || event.metaKey) event.preventDefault();
    }, { passive:false });
    document.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && ['+', '=', '-', '0'].includes(event.key)) event.preventDefault();
    });
  }

  function resizeMedicationNote(note) {
    note.style.height = '44px';
    if (note.value) note.style.height = `${Math.max(44, note.scrollHeight)}px`;
  }

  function refineMedicationNote() {
    const note = document.getElementById('medNote');
    if (!note) return;

    const field = note.closest('.field');
    const label = field?.querySelector(`label[for="${note.id}"]`) || field?.querySelector(':scope > label');
    if (label) label.remove();

    note.placeholder = 'Observação opcional';
    note.rows = 1;
    note.classList.add('rm-med-note-autogrow');
    if (!note.dataset.rmAutoGrow) {
      note.dataset.rmAutoGrow = '1';
      note.addEventListener('input', () => resizeMedicationNote(note));
    }
    resizeMedicationNote(note);
  }

  lockViewportZoom();
  refineMedicationNote();
  new MutationObserver(refineMedicationNote).observe(document.body, { childList:true, subtree:true });
  document.addEventListener('registro:release-ready', refineMedicationNote);
})();
