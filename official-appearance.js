/* Registro Mental Oficial 1.2.5 — aparência segura, paleta fixa e últimos registros. */
(() => {
  'use strict';

  const RELEASE = '1.2.5';
  const SETTINGS_KEY = 'registro-settings-v2';
  const COLORS = {
    accent: '#7259D6',
    accentSoft: '#EEEAFF',
    accentStrong: '#533AB7',
    accentSoftDark: '#2D2741',
    accentStrongDark: '#C9BFFF',
    note: '#0188FE',
    med: '#00C0E7',
    sleep: '#6155F4',
    buy: '#FF4900'
  };

  function paintRelease() {
    window.REGISTRO_V1_RELEASE = RELEASE;
    window.REGISTRO_EXPECTED_RELEASE = RELEASE;
    window.REGISTRO_CURRENT_RELEASE = RELEASE;
    const top = document.getElementById('topVersion');
    const about = document.getElementById('versionLabel');
    if (top) top.textContent = `v${RELEASE}`;
    if (about) about.textContent = RELEASE;
    let style = document.getElementById('rm-official-release-current');
    if (!style) {
      style = document.createElement('style');
      style.id = 'rm-official-release-current';
      document.head.appendChild(style);
    }
    style.textContent = `#topVersion::after{content:"v${RELEASE}"!important}#versionLabel::after{content:"${RELEASE}"!important}`;
  }

  function normalizeSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const settings = JSON.parse(raw);
      let changed = false;
      ['accent','palette','paleta','colorPalette','colourPalette','visualPalette','themePalette','semanticPalette'].forEach(key => {
        if (Object.prototype.hasOwnProperty.call(settings, key)) {
          delete settings[key];
          changed = true;
        }
      });
      if (!Object.prototype.hasOwnProperty.call(settings, 'hideTabLabels')) {
        settings.hideTabLabels = false;
        changed = true;
      }
      if (changed) localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (_) {}
  }

  function applyColors() {
    const html = document.documentElement;
    delete html.dataset.accent;
    delete html.dataset.semanticPalette;
    html.style.setProperty('--accent', COLORS.accent, 'important');
    html.style.setProperty('--record-note', COLORS.note, 'important');
    html.style.setProperty('--record-med', COLORS.med, 'important');
    html.style.setProperty('--record-sleep', COLORS.sleep, 'important');
    html.style.setProperty('--record-buy', COLORS.buy, 'important');
    html.style.setProperty('--note', COLORS.note, 'important');
    html.style.setProperty('--med', COLORS.med, 'important');
    html.style.setProperty('--sleep', COLORS.sleep, 'important');
    html.style.setProperty('--buy', COLORS.buy, 'important');
  }

  function installStyles() {
    let style = document.getElementById('rm-official-fixed-palette');
    if (!style) {
      style = document.createElement('style');
      style.id = 'rm-official-fixed-palette';
      document.head.appendChild(style);
    }
    style.textContent = `
      :root,html,html[data-theme="light"],html[data-theme="system"]{
        --accent:${COLORS.accent}!important;--accent-soft:${COLORS.accentSoft}!important;--accent-strong:${COLORS.accentStrong}!important;
        --record-note:${COLORS.note}!important;--record-med:${COLORS.med}!important;--record-sleep:${COLORS.sleep}!important;--record-buy:${COLORS.buy}!important;
        --note:${COLORS.note}!important;--med:${COLORS.med}!important;--sleep:${COLORS.sleep}!important;--buy:${COLORS.buy}!important
      }
      html[data-theme="dark"]{
        --accent:${COLORS.accent}!important;--accent-soft:${COLORS.accentSoftDark}!important;--accent-strong:${COLORS.accentStrongDark}!important;
        --record-note:${COLORS.note}!important;--record-med:${COLORS.med}!important;--record-sleep:${COLORS.sleep}!important;--record-buy:${COLORS.buy}!important;
        --note:${COLORS.note}!important;--med:${COLORS.med}!important;--sleep:${COLORS.sleep}!important;--buy:${COLORS.buy}!important
      }
      @media(prefers-color-scheme:dark){html[data-theme="system"]{--accent-soft:${COLORS.accentSoftDark}!important;--accent-strong:${COLORS.accentStrongDark}!important}}

      [data-icon="note"]{color:var(--record-note)!important}
      [data-icon="pill"]{color:var(--record-med)!important}
      [data-icon="moon"]{color:var(--record-sleep)!important}
      [data-icon="bag"]{color:var(--record-buy)!important}
      .kind-note{color:var(--record-note)!important}
      .kind-medication{color:var(--record-med)!important}
      .kind-sleep{color:var(--record-sleep)!important}
      .kind-purchase{color:var(--record-buy)!important}
      .primary-action{--rm-card-accent:var(--record-note)!important}
      .primary-action .action-icon,.primary-action strong{color:var(--record-note)!important}
      .med-action{--rm-card-accent:var(--record-med)!important}.med-action .action-icon{color:var(--record-med)!important}
      .sleep-action{--rm-card-accent:var(--record-sleep)!important}.sleep-action .action-icon{color:var(--record-sleep)!important}
      .buy-action{--rm-card-accent:var(--record-buy)!important}.buy-action .action-icon{color:var(--record-buy)!important}

      .tab-bar,.capsule-tabbar{background:color-mix(in srgb,var(--surface) 94%,transparent)!important;border-color:color-mix(in srgb,var(--separator) 88%,var(--surface))!important;backdrop-filter:blur(24px) saturate(145%)!important;-webkit-backdrop-filter:blur(24px) saturate(145%)!important}
      .tab-item{opacity:1!important}.tab-item:not(.selected){color:var(--secondary)!important}
      html:not([data-hide-tab-labels="true"]) .tab-item small,html:not([data-hide-tab-labels="true"]) .tab-item .tab-label{display:block!important;visibility:visible!important;opacity:.92!important;font-size:8px!important;line-height:1.05!important}
      html[data-hide-tab-labels="true"] .tab-item small,html[data-hide-tab-labels="true"] .tab-item .tab-label{display:none!important}
      html:not([data-theme="dark"]) .tab-item.selected{color:#17171A!important}
      html[data-theme="dark"] .tab-item.selected{color:#F2F2F4!important}
      @media(prefers-color-scheme:dark){html[data-theme="system"] .tab-item.selected{color:#F2F2F4!important}}

      #historyFilters.filter-scroll{
        /* Espaço interno para o halo: as margens compensam a altura e não deslocam a página. */
        overflow-x:auto!important;
        overflow-y:hidden!important;
        padding-top:42px!important;
        padding-bottom:42px!important;
        margin-top:-42px!important;
        margin-bottom:-42px!important;
        scroll-padding-inline:4px
      }
      #historyFilters .filter-chip{position:relative!important}

      #homeTimeline .timeline-item{grid-template-columns:68px minmax(0,1fr) 28px}
      #homeTimeline .rm-home-recent-day{display:block;color:var(--secondary);font-size:10px;font-weight:750;line-height:1.15;white-space:nowrap}
      #homeTimeline .rm-home-recent-hour{display:block;margin-top:3px;color:var(--secondary);font-size:11px;line-height:1.15;font-variant-numeric:tabular-nums}

      /* Fundo único: todas as telas usam exatamente o mesmo fundo da tela Início. */
      html,body,.app-shell,#content,.content,.view,.view.active{
        background:var(--bg)!important;
      }

      /* Filtros do Histórico: sem sombra no modo Otimizado; glow temático apenas no Ultra. */
      #historyFilters .filter-chip{
        box-shadow:none!important;
      }
      #historyFilters .filter-chip[data-filter="all"]{--rm-filter-tone:var(--accent)}
      #historyFilters .filter-chip[data-filter="note"]{--rm-filter-tone:var(--record-note)}
      #historyFilters .filter-chip[data-filter="medication"]{--rm-filter-tone:var(--record-med)}
      #historyFilters .filter-chip[data-filter="sleep"]{--rm-filter-tone:var(--record-sleep)}
      #historyFilters .filter-chip[data-filter="purchase"]{--rm-filter-tone:var(--record-buy)}
      /* Filtros: área não selecionada usa sua cor; área selecionada fica preenchida e branca. */
      #historyFilters .filter-chip:not(.selected){
        color:var(--rm-filter-tone,var(--accent))!important;
        border-color:color-mix(in srgb,var(--rm-filter-tone,var(--accent)) 34%,var(--separator))!important;
      }
      #historyFilters .filter-chip.selected{
        background:var(--rm-filter-tone,var(--accent))!important;
        color:#fff!important;
        border-color:color-mix(in srgb,var(--rm-filter-tone,var(--accent)) 78%,transparent)!important;
      }

      /* Ícone e texto usam sempre a mesma cor, inclusive nos temas claro e escuro. */
      #historyFilters .rm-filter-icon,
      #historyFilters .rm-filter-icon svg{
        color:inherit!important;
      }
      /* Ícones dos filtros: 30% maiores; tipografia e espaçamento do texto não mudam. */
      #historyFilters .rm-filter-icon{
        width:22.1px!important;
        height:22.1px!important;
        flex:0 0 22.1px!important;
      }
      #historyFilters .rm-filter-icon svg{
        width:20.8px!important;
        height:20.8px!important;
      }

      html[data-visual-mode="ultra"] #historyFilters .filter-chip.selected{
        background:var(--rm-filter-tone,var(--accent))!important;
        color:#fff!important;
        box-shadow:
          0 0 0 1.5px color-mix(in srgb,var(--rm-filter-tone,var(--accent)) 88%,transparent),
          0 0 14px 1px color-mix(in srgb,var(--rm-filter-tone,var(--accent)) 82%,transparent),
          0 0 30px 5px color-mix(in srgb,var(--rm-filter-tone,var(--accent)) 58%,transparent)!important;
      }

      /* Local de compra: ícone da loja à esquerda, com a mesma cor adaptativa do texto. */
      .rm-purchase-meta{display:flex!important;align-items:center;gap:7px;min-width:0;flex-wrap:nowrap}
      .rm-purchase-quantity,.rm-purchase-separator{flex:0 0 auto;white-space:nowrap}
      .rm-purchase-place{display:inline-flex;align-items:center;gap:5px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .rm-purchase-place-icon{width:16px;height:16px;display:inline-grid;place-items:center;flex:0 0 16px;color:currentColor}
      .rm-v28-timeline.rm-type-purchase .rm-purchase-place-icon{color:var(--rm-record-tone,var(--record-buy,var(--buy)))!important}
      .rm-purchase-place-svg{display:block;width:16px;height:16px;fill:currentColor}

      /* Valor pago de compras: verde consistente em todos os temas. */
      .rm-v28-timeline.rm-type-purchase .rm-purchase-price{color:#4AD968!important}

      /* Tema claro: dados principais dos cartões com contraste máximo. */
      html[data-theme="light"] .rm-v28-timeline .timeline-title,
      html[data-theme="light"] .rm-v28-timeline .rm-record-name,
      html[data-theme="light"] .rm-v28-timeline .rm-record-subline:not(.rm-purchase-price),
      html[data-theme="light"] .rm-v28-timeline .timeline-time{color:#000!important}
      @media(prefers-color-scheme:light){
        html[data-theme="system"] .rm-v28-timeline .timeline-title,
        html[data-theme="system"] .rm-v28-timeline .rm-record-name,
        html[data-theme="system"] .rm-v28-timeline .rm-record-subline:not(.rm-purchase-price),
        html[data-theme="system"] .rm-v28-timeline .timeline-time{color:#000!important}
      }

      /* Nunca esconder html/body por atributos de aparência. */
      #accentControl,.accent-options,#semanticPaletteControl,
      button[data-accent],button[data-semantic-palette],
      .setting-block:has(#accentControl),.setting-block:has(#semanticPaletteControl),
      .semantic-palette-swatches,.semantic-palette-note{display:none!important}
    `;
  }

  function localDayKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function compactRecentDay(timestamp) {
    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime())) return '';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const key = localDayKey(date);
    if (key === localDayKey(today)) return 'Hoje';
    if (key === localDayKey(yesterday)) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }).replace('.', '');
  }

  async function renderLastSix(events) {
    const box = document.getElementById('homeTimeline');
    if (!box || typeof window.eventCard !== 'function') return;

    const recent = (Array.isArray(events) ? events : [])
      .slice()
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0,6);

    box.innerHTML = recent.map(event => window.eventCard(event)).join('');
    const cards = [...box.querySelectorAll('.timeline-item')];
    cards.forEach((card,index) => {
      const event = recent[index];
      const time = card.querySelector('.timeline-time');
      if (!event || !time) return;
      const date = new Date(event.timestamp);
      const hour = Number.isFinite(date.getTime())
        ? date.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
        : '';
      time.innerHTML = `<span class="rm-home-recent-day">${compactRecentDay(event.timestamp)}</span><span class="rm-home-recent-hour">${hour}</span>`;
    });

    const empty = document.getElementById('homeEmpty');
    if (empty) {
      empty.textContent = 'Nenhum registro ainda.';
      empty.classList.toggle('hidden', recent.length > 0);
    }

    if (typeof window.hydrateAudio === 'function') await window.hydrateAudio(box);
  }

  function installRecentSixBehavior() {
    const current = window.renderHome;
    if (typeof current !== 'function' || current.__rmRecentSix === true) return;

    const wrapped = async function(events) {
      await current.apply(this, arguments);
      try { await renderLastSix(events); }
      catch (error) { console.warn('Registro Oficial: últimos registros não bloquearam a tela', error); }
    };
    wrapped.__rmRecentSix = true;
    wrapped.__rmRecentSixBase = current;
    window.renderHome = wrapped;

    if (typeof window.allEvents === 'function') {
      Promise.resolve(window.allEvents()).then(renderLastSix).catch(() => {});
    }
  }

  function applyAll() {
    paintRelease();
    normalizeSettings();
    installStyles();
    applyColors();
    installRecentSixBehavior();
  }

  try { applyAll(); } catch (error) { console.warn('Registro Oficial: aparência não bloqueante', error); }
  document.addEventListener('DOMContentLoaded', () => { try { applyAll(); } catch (_) {} }, { once:true });
  window.addEventListener('registro:release-ready', () => { try { applyAll(); } catch (_) {} });
  [100,500,1500,3000].forEach(ms => setTimeout(() => { try { applyAll(); } catch (_) {} }, ms));
  document.addEventListener('click', event => {
    if (event.target.closest('.tab-item,[data-theme-value],#hideTabLabelsToggle,#homeOptionsBtn')) {
      setTimeout(() => { try { applyAll(); } catch (_) {} }, 0);
    }
  }, { passive:true });

  window.REGISTRO_OFFICIAL_APPEARANCE_READY = true;
})();

/* Integração aditiva da barra emocional aprovada. Falha deste módulo nunca bloqueia a Oficial. */
(() => {
  try {
    if (document.querySelector('script[data-rm-mood-v2]')) return;
    const script = document.createElement('script');
    script.dataset.rmMoodV2 = '1';
    script.src = `./mood-bar-v2.js?v=1.2.5&load=${Date.now()}`;
    script.async = true;
    script.onerror = () => console.warn('Registro Oficial: barra emocional 0–10 não carregou; interface estável mantida.');
    document.head.appendChild(script);
  } catch (error) {
    console.warn('Registro Oficial: integração emocional não bloqueante', error);
  }
})();


/* Mantém o filtro selecionado longe da lateral reservada ao indicador de rolagem do iOS. */
(() => {
  if (window.__RM_HISTORY_FILTER_VISIBILITY__) return;
  window.__RM_HISTORY_FILTER_VISIBILITY__ = true;
  document.addEventListener('click', event => {
    const filter = event.target.closest('#historyFilters [data-filter]');
    if (!filter) return;
    requestAnimationFrame(() => {
      filter.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    });
  }, { passive: true });
})();


/* Correção de contraste prioritária: tinta quase branca vira preto puro no tema claro. */
(() => {
  if (window.__RM_LIGHT_INK_CONTRAST__) return;
  window.__RM_LIGHT_INK_CONTRAST__ = true;
  const MARK_ATTR = 'data-rm-light-ink-fix';
  const originals = new WeakMap();
  const protectedSelector = [
    '.primary-button','.full-button','.filter-chip.selected','.mood-score.selected',
    '.sleep-quality button.selected','.emotion-scale button.selected','[aria-pressed="true"]',
    '.kind-note','.kind-medication','.kind-sleep','.kind-purchase',
    '.rm-purchase-price','.rm-purchase-place-icon'
  ].join(',');
  const rgb = value => {
    const match = String(value || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
  };
  const isNearlyWhiteGray = value => {
    const color = rgb(value);
    return Boolean(color) && Math.min(...color) >= 205 && Math.max(...color) - Math.min(...color) <= 28;
  };
  const isLight = () => {
    const theme = document.documentElement.dataset.theme || 'system';
    return theme === 'light' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches);
  };
  const saveOriginal = element => {
    if (originals.has(element)) return;
    originals.set(element, {
      color:[element.style.getPropertyValue('color'),element.style.getPropertyPriority('color')],
      fill:[element.style.getPropertyValue('fill'),element.style.getPropertyPriority('fill')],
      stroke:[element.style.getPropertyValue('stroke'),element.style.getPropertyPriority('stroke')]
    });
  };
  const restore = element => {
    const saved = originals.get(element);
    if (!saved) return;
    for (const [property,[value,priority]] of Object.entries(saved)) {
      if (value) element.style.setProperty(property,value,priority);
      else element.style.removeProperty(property);
    }
    element.removeAttribute(MARK_ATTR);
    originals.delete(element);
  };
  const enforceBlack = element => {
    saveOriginal(element);
    element.setAttribute(MARK_ATTR,'');
    element.style.setProperty('color','#000','important');
    if (element instanceof SVGElement) {
      element.style.setProperty('fill','#000','important');
      element.style.setProperty('stroke','#000','important');
    }
  };
  let scheduled = false;
  const apply = () => {
    scheduled = false;
    if (!isLight()) {
      document.querySelectorAll('[' + MARK_ATTR + ']').forEach(restore);
      return;
    }
    document.querySelectorAll('body *').forEach(element => {
      if (element.closest(protectedSelector)) return;
      const computed = getComputedStyle(element);
      if (element.hasAttribute(MARK_ATTR) || isNearlyWhiteGray(computed.color) || (element instanceof SVGElement && isNearlyWhiteGray(computed.fill))) {
        enforceBlack(element);
      }
    });
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(apply);
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  const begin = () => {
    observer.observe(document.body,{childList:true,subtree:true});
    schedule();
  };
  if (document.body) begin(); else document.addEventListener('DOMContentLoaded',begin,{once:true});
  window.matchMedia('(prefers-color-scheme: light)').addEventListener?.('change',schedule);
  window.addEventListener('registro:release-ready',schedule);
  [0,250,900,1800,3200].forEach(ms => setTimeout(schedule,ms));
})();


/* Beta 38: superfícies utilitárias usam a mesma linguagem dos cartões de Análise atual. */
(() => {
  if (window.__RM_REFERENCE_CARD_FAMILY__) return;
  window.__RM_REFERENCE_CARD_FAMILY__ = true;

  const typeIcon = { text:'note', mood:'spark', purchase:'bag', medication:'pill', sleep:'moon' };
  const decorate = root => {
    (root || document).querySelectorAll?.('.continuity-alert-row[data-gap-action]').forEach(row => {
      row.classList.add('rm-reference-surface');
      if (!row.querySelector(':scope > .rm-continuity-row-icon')) {
        const icon = document.createElement('span');
        icon.className = 'rm-continuity-row-icon';
        icon.dataset.icon = typeIcon[row.dataset.gapAction] || 'clock';
        icon.setAttribute('aria-hidden','true');
        row.insertBefore(icon, row.firstElementChild);
      }
    });
    (root || document).querySelectorAll?.('.learning-context,.dose-result,.med-suggestion-card,.rm-health-source-card').forEach(card => {
      card.classList.add('rm-reference-surface');
    });
    if (typeof window.hydrateIcons === 'function') window.hydrateIcons(root || document);
  };

  const style = document.createElement('style');
  style.id = 'rm-reference-card-family-style';
  style.textContent = `
    .continuity-alert{
      --rm-reference-tone:var(--accent);
      position:relative;isolation:isolate;overflow:visible!important;
      padding:16px!important;margin:14px 0!important;
      border:1px solid color-mix(in srgb,var(--rm-reference-tone) 34%,var(--separator))!important;
      background:linear-gradient(145deg,color-mix(in srgb,var(--surface) 92%,var(--rm-reference-tone) 8%),var(--surface))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 10px 24px color-mix(in srgb,var(--rm-reference-tone) 9%,transparent)!important;
    }
    .continuity-alert::before{
      content:'';position:absolute;z-index:-1;pointer-events:none;inset:18% auto auto 7%;
      width:48%;height:38%;border-radius:999px;
      background:radial-gradient(ellipse,color-mix(in srgb,var(--rm-reference-tone) 16%,transparent),transparent 70%);
      filter:blur(18px);
    }
    .continuity-alert .notice-icon,.continuity-alert .section-kicker{color:var(--rm-reference-tone)!important}
    .continuity-alert h2{color:var(--text)!important}
    .continuity-disclaimer{color:var(--secondary)!important;opacity:1!important;margin:9px 0 14px!important}
    .continuity-alert-list{gap:10px!important}
    .rm-reference-surface,.continuity-alert-row{
      --rm-reference-tone:var(--accent);
      position:relative;isolation:isolate;
      background:linear-gradient(145deg,color-mix(in srgb,var(--surface-2) 90%,var(--rm-reference-tone) 10%),var(--surface-2))!important;
      border:1px solid color-mix(in srgb,var(--rm-reference-tone) 31%,var(--separator))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.20),0 7px 16px color-mix(in srgb,var(--rm-reference-tone) 7%,transparent)!important;
      border-radius:20px!important;color:var(--text)!important;
    }
    .continuity-alert-row[data-gap-action="text"],.continuity-alert-row[data-gap-action="mood"]{--rm-reference-tone:var(--record-note,var(--accent))}
    .continuity-alert-row[data-gap-action="medication"],.dose-result,.med-suggestion-card{--rm-reference-tone:var(--record-med,var(--med))}
    .continuity-alert-row[data-gap-action="sleep"],.rm-health-source-card{--rm-reference-tone:var(--record-sleep,var(--sleep))}
    .continuity-alert-row[data-gap-action="purchase"]{--rm-reference-tone:var(--record-buy,var(--buy))}
    .learning-context{--rm-reference-tone:var(--accent)}
    .continuity-alert-row{
      display:grid!important;grid-template-columns:38px minmax(0,1fr) auto;align-items:center!important;
      min-height:72px;padding:11px 12px!important;gap:11px!important;text-decoration:none;
    }
    .rm-continuity-row-icon{
      width:38px;height:38px;border-radius:13px;display:grid;place-items:center;
      color:var(--rm-reference-tone)!important;
      background:color-mix(in srgb,var(--rm-reference-tone) 13%,transparent);
      box-shadow:0 0 14px color-mix(in srgb,var(--rm-reference-tone) 18%,transparent);
    }
    .rm-continuity-row-icon .svg-icon,.rm-continuity-row-icon svg{width:20px!important;height:20px!important}
    .continuity-alert-row>span:first-of-type{min-width:0;gap:3px!important}
    .continuity-alert-row strong{font-size:14px!important;color:var(--text)!important}
    .continuity-alert-row small{color:var(--secondary)!important;opacity:1!important}
    .continuity-alert-row>span:last-child{
      color:var(--rm-reference-tone)!important;font-size:13px;font-weight:750;white-space:nowrap;
      padding:7px 9px;border-radius:11px;
      background:color-mix(in srgb,var(--rm-reference-tone) 11%,transparent);
      border:1px solid color-mix(in srgb,var(--rm-reference-tone) 19%,transparent);
    }
    .continuity-alert-row:active{transform:scale(.985)}
    .learning-context{padding:12px 13px!important}
    .learning-context small{color:var(--rm-reference-tone)!important;opacity:1!important}
    .learning-context p{color:var(--text)!important}
    .dose-result{padding:12px 13px!important}
    .dose-result span{color:var(--secondary)!important}.dose-result strong{color:var(--rm-reference-tone)!important}
    .med-suggestion-card{padding:12px!important}
    .med-suggestion-card .mini-icon,.med-suggestion-card .svg-icon{color:var(--rm-reference-tone)!important}
    .rm-health-source-card{padding:13px 14px!important}
    html[data-visual-mode="ultra"] .rm-reference-surface,html[data-visual-mode="ultra"] .continuity-alert-row{
      box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 0 18px color-mix(in srgb,var(--rm-reference-tone) 15%,transparent),0 9px 20px color-mix(in srgb,var(--rm-reference-tone) 10%,transparent)!important;
    }
    html[data-visual-mode="optimized"] .rm-reference-surface,html[data-visual-mode="optimized"] .continuity-alert-row{
      box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 4px 10px color-mix(in srgb,var(--rm-reference-tone) 6%,transparent)!important;
    }
  `;
  document.head.appendChild(style);

  const observe = () => {
    decorate(document);
    const observer = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node.nodeType === 1) decorate(node);
      }
    });
    observer.observe(document.body,{childList:true,subtree:true});
  };
  if (document.body) observe(); else document.addEventListener('DOMContentLoaded',observe,{once:true});
  window.addEventListener('registro:release-ready',() => decorate(document));
  [150,700,1800,3600].forEach(ms => setTimeout(() => decorate(document),ms));
})();


/* Beta 39: composição compacta e legível dos itens de continuidade. */
(() => {
  if (window.__RM_CONTINUITY_ROW_REFINEMENT__) return;
  window.__RM_CONTINUITY_ROW_REFINEMENT__ = true;
  const style=document.createElement('style');
  style.id='rm-continuity-row-refinement';
  style.textContent=`
    .continuity-alert-row{
      grid-template-columns:34px minmax(0,1fr) auto!important;
      column-gap:9px!important;
    }
    .rm-continuity-row-icon{
      width:34px!important;height:34px!important;
      align-self:center!important;justify-self:center!important;
      border-radius:12px!important;
    }
    .rm-continuity-row-icon .svg-icon,.rm-continuity-row-icon svg{
      width:18px!important;height:18px!important;
    }
    .continuity-alert-row>span:nth-child(2){
      min-width:0;display:flex!important;flex-direction:column!important;
      align-items:flex-start!important;justify-content:center!important;
      gap:3px!important;
    }
    .continuity-alert-row>span:nth-child(2)>strong,
    .continuity-alert-row>span:nth-child(2)>small{
      display:block!important;max-width:100%;
    }
    .continuity-alert-row>span:nth-child(2)>small{
      white-space:nowrap!important;overflow:visible!important;
      font-size:10.5px!important;line-height:1.2!important;
      letter-spacing:-.01em;
    }
  `;
  document.head.appendChild(style);
})();


/* Beta 41: ícones de continuidade sem caixa de fundo. */
(() => {
  if (window.__RM_CONTINUITY_BARE_ICONS__) return;
  window.__RM_CONTINUITY_BARE_ICONS__ = true;
  const style=document.createElement('style');
  style.id='rm-continuity-bare-icons';
  style.textContent=`
    .continuity-alert-row{
      grid-template-columns:28px minmax(0,1fr) auto!important;
      column-gap:8px!important;
    }
    .rm-continuity-row-icon{
      width:28px!important;height:28px!important;padding:0!important;
      display:grid!important;place-items:center!important;
      align-self:center!important;justify-self:center!important;
      color:var(--rm-reference-tone)!important;
      background:transparent!important;border:0!important;border-radius:0!important;
      box-shadow:none!important;filter:none!important;
    }
    .rm-continuity-row-icon .svg-icon,.rm-continuity-row-icon svg{
      width:21px!important;height:21px!important;
      filter:none!important;
    }
  `;
  document.head.appendChild(style);
})();


/* Beta 42: cabeçalho do lembrete com título e relógio em uma única linha. */
(() => {
  if (window.__RM_CONTINUITY_HEADER_LAYOUT__) return;
  window.__RM_CONTINUITY_HEADER_LAYOUT__ = true;
  const style=document.createElement('style');
  style.id='rm-continuity-header-layout';
  style.textContent=`
    .continuity-alert{--rm-continuity-alert-red:#FF453A}
    .continuity-alert-head{display:block!important}
    .continuity-alert-titleline{
      display:flex;align-items:center;gap:8px;
      min-width:0;margin:0 0 7px;
    }
    .continuity-alert .continuity-alert-titleline .notice-icon,
    .continuity-alert .continuity-alert-titleline .section-kicker{
      color:var(--rm-continuity-alert-red)!important;
    }
    .continuity-alert .continuity-alert-titleline .notice-icon{
      flex:0 0 auto;margin:0!important;padding:0!important;
    }
    .continuity-alert .continuity-alert-titleline .section-kicker{
      margin:0!important;font-size:11px!important;line-height:1.2!important;
      letter-spacing:.115em;font-weight:800;
    }
    .continuity-alert .continuity-alert-head>h2{
      margin:0!important;color:var(--text)!important;
      text-align:left!important;font-size:19px!important;line-height:1.18!important;
    }
  `;
  document.head.appendChild(style);
})();


/* Beta 43: título do lembrete de continuidade mais legível. */
(() => {
  if (window.__RM_CONTINUITY_TITLE_SIZE__) return;
  window.__RM_CONTINUITY_TITLE_SIZE__ = true;
  const style=document.createElement('style');
  style.id='rm-continuity-title-size';
  style.textContent=`
    .continuity-alert .continuity-alert-titleline .section-kicker{
      font-size:13px!important;
      line-height:1.2!important;
      letter-spacing:.10em!important;
      white-space:nowrap!important;
    }
  `;
  document.head.appendChild(style);
})();


/* Beta 44: centraliza o conjunto de título e relógio. */
(() => {
  if (window.__RM_CONTINUITY_TITLE_CENTER__) return;
  window.__RM_CONTINUITY_TITLE_CENTER__ = true;
  const style=document.createElement('style');
  style.id='rm-continuity-title-center';
  style.textContent=`
    .continuity-alert .continuity-alert-titleline{
      width:100%!important;
      justify-content:center!important;
    }
  `;
  document.head.appendChild(style);
})();


/* Beta 45: lembrete de continuidade expansível; Ultra anima, Otimizado responde sem transição. */
(() => {
  if (window.__RM_CONTINUITY_COLLAPSE_V45__) return;
  window.__RM_CONTINUITY_COLLAPSE_V45__ = true;

  const expanded = card => card?.dataset.rmContinuityExpanded === '1';

  function updateState(card, next) {
    if (!card) return;
    card.dataset.rmContinuityExpanded = next ? '1' : '0';
    card.classList.toggle('rm-continuity-expanded', next);
    card.setAttribute('aria-expanded', String(next));
    const head = card.querySelector('.continuity-alert-head');
    const button = card.querySelector('.rm-continuity-toggle');
    head?.setAttribute('aria-expanded', String(next));
    if (button) {
      button.setAttribute('aria-expanded', String(next));
      button.setAttribute('aria-label', next ? 'Recolher lembrete de continuidade' : 'Expandir lembrete de continuidade');
    }
  }

  function toggle(card) {
    updateState(card, !expanded(card));
  }

  function enhance(card) {
    if (!card || card.classList.contains('hidden')) return;
    const head = card.querySelector('.continuity-alert-head');
    const titleline = head?.querySelector('.continuity-alert-titleline');
    if (!head || !titleline) return;

    if (!card.querySelector(':scope > .rm-continuity-body')) {
      const disclaimer = card.querySelector(':scope > .continuity-disclaimer');
      const list = card.querySelector(':scope > .continuity-alert-list');
      if (disclaimer || list) {
        const body = document.createElement('div');
        body.className = 'rm-continuity-body';
        const clip = document.createElement('div');
        clip.className = 'rm-continuity-body-clip';
        if (disclaimer) clip.appendChild(disclaimer);
        if (list) clip.appendChild(list);
        body.appendChild(clip);
        head.after(body);
      }
    }

    let button = titleline.querySelector('.rm-continuity-toggle');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'rm-continuity-toggle';
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17.4688 10.2891" width="24" height="24" aria-hidden="true" focusable="false"><path d="M1.05 8.93L8.7344 1.22L16.4188 8.93" fill="none" stroke="currentColor" stroke-width="1.62" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        toggle(card);
      });
      titleline.appendChild(button);
    }

    if (head.dataset.rmContinuityToggleWired !== '1') {
      head.dataset.rmContinuityToggleWired = '1';
      head.tabIndex = 0;
      head.addEventListener('click', event => {
        if (event.target.closest('.rm-continuity-toggle')) return;
        toggle(card);
      });
      head.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        toggle(card);
      });
    }

    if (!card.dataset.rmContinuityExpanded) card.dataset.rmContinuityExpanded = '0';
    updateState(card, expanded(card));
  }

  function enhanceCurrent() {
    enhance(document.getElementById('continuityAlertCard'));
  }

  const style = document.createElement('style');
  style.id = 'rm-continuity-collapse-v45-style';
  style.textContent = [
    '.continuity-alert .continuity-alert-head{position:relative!important;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none}',
    '.continuity-alert .continuity-alert-head:focus-visible{outline:2px solid color-mix(in srgb,var(--accent) 65%,transparent);outline-offset:5px;border-radius:12px}',
    '.continuity-alert .continuity-alert-titleline{display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;width:100%!important;padding:0!important;box-sizing:border-box;min-width:0}',
    '.rm-continuity-toggle{position:static!important;flex:0 0 26px;width:26px;height:26px;padding:0;border:0;background:transparent;color:var(--rm-continuity-alert-red,#FF453A);display:grid;place-items:center;border-radius:999px;z-index:2;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
    '.rm-continuity-toggle svg{display:block;width:18px;height:18px;overflow:visible;transform:rotate(180deg);transform-origin:50% 50%}',
    '.continuity-alert.rm-continuity-expanded .rm-continuity-toggle svg{transform:rotate(0deg)}',
    '.continuity-alert .continuity-alert-head>h2{font-size:clamp(12.5px,3.9vw,16px)!important;line-height:1.2!important;letter-spacing:-.025em!important;white-space:nowrap!important;margin-top:8px!important}',
    '.rm-continuity-body{display:grid;grid-template-rows:0fr;opacity:0;pointer-events:none}',
    '.rm-continuity-body-clip{min-height:0;overflow:hidden;transform:translateY(-8px)}',
    '.continuity-alert.rm-continuity-expanded .rm-continuity-body{grid-template-rows:1fr;opacity:1;pointer-events:auto}',
    '.continuity-alert.rm-continuity-expanded .rm-continuity-body-clip{transform:translateY(0)}',
    'html[data-visual-mode="ultra"] .continuity-alert{border-color:color-mix(in srgb,#FF5A3D 48%,var(--separator))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 0 0 1px rgba(255,90,61,.10),0 0 18px rgba(255,69,58,.20),0 12px 34px rgba(255,132,44,.14)!important}',
    'html[data-visual-mode="ultra"] .rm-continuity-body{transition:grid-template-rows .26s cubic-bezier(.22,.75,.18,1),opacity .18s ease}',
    'html[data-visual-mode="ultra"] .rm-continuity-body-clip{transition:transform .26s cubic-bezier(.22,.75,.18,1)}',
    'html[data-visual-mode="ultra"] .rm-continuity-toggle svg{transition:transform .21s cubic-bezier(.22,.75,.18,1)}',
    'html[data-visual-mode="optimized"] .rm-continuity-body,html[data-visual-mode="optimized"] .rm-continuity-body-clip,html[data-visual-mode="optimized"] .rm-continuity-toggle svg{transition:none!important}',
    '@media (prefers-reduced-motion:reduce){.rm-continuity-body,.rm-continuity-body-clip,.rm-continuity-toggle svg{transition:none!important}}'
  ].join('\n');
  document.head.appendChild(style);

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; enhanceCurrent(); });
  };

  const observer = new MutationObserver(mutations => {
    if (mutations.some(m => m.addedNodes.length || m.removedNodes.length)) schedule();
  });
  if (document.body) observer.observe(document.body,{childList:true,subtree:true});
  else document.addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{childList:true,subtree:true}),{once:true});

  schedule();
  window.addEventListener('registro:release-ready', schedule);
  [150,500,1200].forEach(ms => setTimeout(schedule, ms));
})();