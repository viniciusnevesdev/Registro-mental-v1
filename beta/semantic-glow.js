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
  `;
  document.head.appendChild(style);
})();
