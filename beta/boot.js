/* Registro Mental V1 — bootloader resiliente + diagnóstico pós-inicialização */
(() => {
  'use strict';

  const RELEASE = '1.2.0-beta.48';
  const STARTED = performance.now();
  const scopeToken = '/Registro-mental-v1/beta/';
  const DIAG_KEY = 'registro-beta-last-diagnostic-v1';
  const hadControllerAtStart = Boolean(navigator.serviceWorker?.controller);
  const bootNonce = Date.now();

  const boot = document.getElementById('rmBoot');
  const headline = document.getElementById('rmBootHeadline');
  const detail = document.getElementById('rmBootDetail');
  const progress = document.getElementById('rmBootProgress');
  const diagnostics = document.getElementById('rmBootDiagnostics');
  const actions = document.getElementById('rmBootActions');
  const retryButton = document.getElementById('rmBootRetry');
  const safeButton = document.getElementById('rmBootSafe');
  const recoverButton = document.getElementById('rmBootRecover');
  const copyButton = document.getElementById('rmBootCopy');

  window.__RM_BOOT_STARTED = true;
  window.__RM_BOOT_DIAGNOSTICS = [];
  window.REGISTRO_SHELL_RELEASE = RELEASE;

  const fakeRegistration = {
    update: async () => undefined,
    unregister: async () => true,
    waiting: null,
    installing: null,
    active: null,
    scope: location.href
  };
  window.__RM_DISABLED_SW_REGISTER = async () => fakeRegistration;

  let appScriptLoaded = false;
  let releaseEventSeen = false;
  let lastFatal = null;
  let currentStage = 'boot';
  let diagnosticOpen = false;
  let lastDiagnosticPayload = '';
  let watchdogTimer = null;
  let badVisualChecks = 0;

  const nowMs = () => Math.round(performance.now() - STARTED);
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const twoPaints = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const withTimeout = (promise, ms, label) => Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} excedeu ${ms} ms`)), ms))
  ]);

  function log(kind, message, extra = '') {
    const entry = { t: nowMs(), kind, message, extra: extra ? String(extra) : '' };
    window.__RM_BOOT_DIAGNOSTICS.push(entry);
    if (window.__RM_BOOT_DIAGNOSTICS.length > 120) window.__RM_BOOT_DIAGNOSTICS.shift();
    if (diagnostics) {
      diagnostics.textContent = window.__RM_BOOT_DIAGNOSTICS
        .map(item => `${String(item.t).padStart(4, ' ')} ms  ${item.kind.toUpperCase().padEnd(5, ' ')}  ${item.message}${item.extra ? ` — ${item.extra}` : ''}`)
        .join('\n');
    }
  }

  function setStep(name, state, text) {
    const row = document.querySelector(`[data-boot-step="${name}"]`);
    if (!row) return;
    row.dataset.state = state;
    const value = row.querySelector('[data-boot-value]');
    if (value) value.textContent = text;
  }

  function setProgress(value) {
    if (progress) progress.style.width = `${Math.max(4, Math.min(100, value))}%`;
  }

  function setMessage(title, subtitle) {
    if (headline) headline.textContent = title;
    if (detail) detail.textContent = subtitle;
  }

  function cssState(node) {
    if (!node) return { exists:false };
    let style = null;
    try { style = getComputedStyle(node); } catch (_) {}
    const rect = node.getBoundingClientRect?.() || { width:0, height:0, top:0, left:0 };
    return {
      exists:true,
      tag:node.tagName || '',
      id:node.id || '',
      className:String(node.className || '').slice(0,160),
      display:style?.display || '',
      visibility:style?.visibility || '',
      opacity:style?.opacity || '',
      position:style?.position || '',
      width:Math.round(rect.width || 0),
      height:Math.round(rect.height || 0),
      top:Math.round(rect.top || 0),
      left:Math.round(rect.left || 0)
    };
  }

  function visualSnapshot() {
    const html = document.documentElement;
    const body = document.body;
    const shell = document.querySelector('.app-shell');
    const content = document.getElementById('content') || document.querySelector('.content');
    const activeView = document.querySelector('.view.active');
    const tabbar = document.querySelector('.tab-bar,.capsule-tabbar');
    let center = '';
    try {
      const el = document.elementFromPoint(Math.max(1, innerWidth / 2), Math.max(1, innerHeight / 2));
      center = el ? `${el.tagName}${el.id ? '#'+el.id : ''}${el.className ? '.'+String(el.className).trim().replace(/\s+/g,'.').slice(0,100) : ''}` : 'nenhum';
    } catch (_) {}
    return {
      at:new Date().toISOString(),
      viewport:`${innerWidth}x${innerHeight}`,
      html:cssState(html),
      body:cssState(body),
      shell:cssState(shell),
      content:cssState(content),
      activeView:cssState(activeView),
      tabbar:cssState(tabbar),
      centerElement:center,
      activeViewName:activeView?.dataset?.view || '',
      bodyClass:String(body?.className || ''),
      htmlAttrs:html ? Array.from(html.attributes).map(a => `${a.name}=${a.value}`).join(' | ') : ''
    };
  }

  function nodeLooksVisible(state, minW = 40, minH = 30) {
    if (!state?.exists) return false;
    const opacity = Number.parseFloat(state.opacity || '1');
    return state.display !== 'none' && state.visibility !== 'hidden' && state.visibility !== 'collapse' && !(Number.isFinite(opacity) && opacity <= 0.01) && state.width >= minW && state.height >= minH;
  }

  function diagnoseVisual(snapshot = visualSnapshot()) {
    const reasons = [];
    if (!nodeLooksVisible(snapshot.html, 100, 100)) reasons.push(`html invisível (${snapshot.html.display}/${snapshot.html.visibility}/opacidade ${snapshot.html.opacity}, ${snapshot.html.width}x${snapshot.html.height})`);
    if (!nodeLooksVisible(snapshot.body, 100, 100)) reasons.push(`body invisível (${snapshot.body.display}/${snapshot.body.visibility}/opacidade ${snapshot.body.opacity}, ${snapshot.body.width}x${snapshot.body.height})`);
    if (!snapshot.shell.exists) reasons.push('app-shell ausente');
    else if (!nodeLooksVisible(snapshot.shell, 100, 100)) reasons.push(`app-shell invisível (${snapshot.shell.display}/${snapshot.shell.visibility}/opacidade ${snapshot.shell.opacity}, ${snapshot.shell.width}x${snapshot.shell.height})`);
    if (!snapshot.content.exists) reasons.push('content ausente');
    else if (!nodeLooksVisible(snapshot.content, 100, 100)) reasons.push(`content invisível (${snapshot.content.display}/${snapshot.content.visibility}/opacidade ${snapshot.content.opacity}, ${snapshot.content.width}x${snapshot.content.height})`);
    if (!snapshot.activeView.exists) reasons.push('nenhuma view ativa');
    else if (!nodeLooksVisible(snapshot.activeView, 100, 80)) reasons.push(`view ativa invisível (${snapshot.activeView.display}/${snapshot.activeView.visibility}/opacidade ${snapshot.activeView.opacity}, ${snapshot.activeView.width}x${snapshot.activeView.height})`);
    if (!snapshot.tabbar.exists) reasons.push('barra de abas ausente');
    else if (!nodeLooksVisible(snapshot.tabbar, 100, 30)) reasons.push(`barra de abas invisível (${snapshot.tabbar.display}/${snapshot.tabbar.visibility}/opacidade ${snapshot.tabbar.opacity}, ${snapshot.tabbar.width}x${snapshot.tabbar.height})`);
    return reasons;
  }

  function loadedScripts() {
    try {
      return performance.getEntriesByType('resource')
        .map(e => e.name)
        .filter(name => /(?:app|patches|official-approved-ui|official-appearance|boot)\.js/i.test(name))
        .map(name => name.split('/').pop())
        .slice(-12);
    } catch (_) { return []; }
  }

  function buildDiagnostic(reason, snapshot = visualSnapshot(), extra = '') {
    const visualReasons = diagnoseVisual(snapshot);
    const lines = [
      `Registro Mental ${RELEASE}`,
      `Falha: ${reason}`,
      `Etapa: ${currentStage}`,
      `Horário: ${new Date().toISOString()}`,
      `URL: ${location.href}`,
      `Standalone: ${window.matchMedia?.('(display-mode: standalone)')?.matches ? 'sim' : 'não'}`,
      `Online: ${navigator.onLine ? 'sim' : 'não'}`,
      `Service Worker ao abrir: ${hadControllerAtStart ? 'sim' : 'não'}`,
      `Service Worker agora: ${navigator.serviceWorker?.controller ? 'sim' : 'não'}`,
      `Release event recebido: ${releaseEventSeen ? 'sim' : 'não'}`,
      `app.js carregado: ${appScriptLoaded ? 'sim' : 'não'}`,
      `Último erro: ${lastFatal ? `${lastFatal.message} (${lastFatal.source || 'runtime'})` : 'nenhum erro JS capturado'}`,
      `Motivos visuais: ${visualReasons.length ? visualReasons.join(' | ') : 'nenhum detectado'}`,
      `Elemento no centro: ${snapshot.centerElement || 'desconhecido'}`,
      `View ativa: ${snapshot.activeViewName || 'nenhuma'}`,
      `html: display=${snapshot.html.display}; visibility=${snapshot.html.visibility}; opacity=${snapshot.html.opacity}; size=${snapshot.html.width}x${snapshot.html.height}`,
      `body: display=${snapshot.body.display}; visibility=${snapshot.body.visibility}; opacity=${snapshot.body.opacity}; size=${snapshot.body.width}x${snapshot.body.height}`,
      `app-shell: ${snapshot.shell.exists ? `display=${snapshot.shell.display}; visibility=${snapshot.shell.visibility}; opacity=${snapshot.shell.opacity}; size=${snapshot.shell.width}x${snapshot.shell.height}` : 'ausente'}`,
      `content: ${snapshot.content.exists ? `display=${snapshot.content.display}; visibility=${snapshot.content.visibility}; opacity=${snapshot.content.opacity}; size=${snapshot.content.width}x${snapshot.content.height}` : 'ausente'}`,
      `view ativa: ${snapshot.activeView.exists ? `display=${snapshot.activeView.display}; visibility=${snapshot.activeView.visibility}; opacity=${snapshot.activeView.opacity}; size=${snapshot.activeView.width}x${snapshot.activeView.height}` : 'ausente'}`,
      `tabbar: ${snapshot.tabbar.exists ? `display=${snapshot.tabbar.display}; visibility=${snapshot.tabbar.visibility}; opacity=${snapshot.tabbar.opacity}; size=${snapshot.tabbar.width}x${snapshot.tabbar.height}` : 'ausente'}`,
      `Atributos html: ${snapshot.htmlAttrs || 'nenhum'}`,
      `Scripts recentes: ${loadedScripts().join(', ') || 'não identificados'}`,
      `User agent: ${navigator.userAgent}`
    ];
    if (extra) lines.push(`Detalhe: ${extra}`);
    lines.push('', 'LOG DO BOOT:', ...window.__RM_BOOT_DIAGNOSTICS.map(item => `${item.t}ms ${item.kind}: ${item.message}${item.extra ? ` — ${item.extra}` : ''}`));
    return lines.join('\n');
  }

  function persistDiagnostic(payload) {
    lastDiagnosticPayload = payload;
    try { sessionStorage.setItem(DIAG_KEY, payload); } catch (_) {}
    try { localStorage.setItem(DIAG_KEY, payload); } catch (_) {}
  }

  function forceDocumentVisibleForDiagnostics() {
    const html = document.documentElement;
    const body = document.body;
    const force = (node, prop, value) => { try { node?.style?.setProperty(prop, value, 'important'); } catch (_) {} };
    force(html, 'display', 'block');
    force(html, 'visibility', 'visible');
    force(html, 'opacity', '1');
    force(html, 'min-height', '100%');
    force(body, 'display', 'block');
    force(body, 'visibility', 'visible');
    force(body, 'opacity', '1');
    force(body, 'min-height', '100%');
    force(body, 'overflow', 'auto');
    force(body, 'background', '#f5f5f7');
    if (boot) {
      boot.classList.remove('rm-boot-hide');
      force(boot, 'display', 'grid');
      force(boot, 'visibility', 'visible');
      force(boot, 'opacity', '1');
      force(boot, 'pointer-events', 'auto');
      force(boot, 'position', 'fixed');
      force(boot, 'inset', '0');
      force(boot, 'z-index', '2147483647');
      force(boot, 'overflow', 'auto');
      force(boot, 'background', '#f5f5f7');
    }
    const card = boot?.querySelector('.rm-boot-card');
    force(card, 'display', 'block');
    force(card, 'visibility', 'visible');
    force(card, 'opacity', '1');
    force(card, 'position', 'relative');
    force(card, 'z-index', '2147483647');
  }

  function ensureIndependentDiagnosticLink() {
    if (!actions || document.getElementById('rmBootIndependentDiag')) return;
    const a = document.createElement('a');
    a.id = 'rmBootIndependentDiag';
    a.href = `./diagnostico.html?v=${encodeURIComponent(RELEASE)}&t=${Date.now()}`;
    a.textContent = 'Abrir diagnóstico independente';
    a.style.cssText = 'grid-column:1/-1;text-align:center;text-decoration:none;border-radius:13px;padding:12px 10px;background:#ededf2;color:#17171a;font:600 13px/1.2 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif';
    actions.appendChild(a);
  }

  function showDiagnostic(reason, extra = '') {
    if (diagnosticOpen) return;
    diagnosticOpen = true;
    currentStage = 'diagnóstico';
    const snap = visualSnapshot();
    const payload = buildDiagnostic(reason, snap, extra);
    persistDiagnostic(payload);
    forceDocumentVisibleForDiagnostics();
    document.body?.classList.add('rm-boot-failed');
    setMessage('Falha detectada automaticamente', reason);
    setProgress(100);
    if (actions) actions.hidden = false;
    if (diagnostics) {
      diagnostics.hidden = false;
      diagnostics.textContent = payload;
    }
    if (copyButton) copyButton.textContent = 'Copiar diagnóstico';
    setStep('ready', 'error', 'diagnóstico');
    ensureIndependentDiagnosticLink();
    log('error', 'Watchdog abriu diagnóstico', reason);
    clearInterval(watchdogTimer);
    watchdogTimer = setInterval(forceDocumentVisibleForDiagnostics, 350);
  }

  async function getRuntimeState() {
    let registrations = [];
    let cacheKeys = [];
    try {
      if ('serviceWorker' in navigator) {
        registrations = (await navigator.serviceWorker.getRegistrations()).filter(reg => String(reg.scope || '').includes(scopeToken));
      }
    } catch (_) {}
    try {
      if ('caches' in window) cacheKeys = (await caches.keys()).filter(key => key.startsWith('registro-beta-v1-'));
    } catch (_) {}
    return { registrations, cacheKeys };
  }

  async function clearObsoleteRuntime() {
    setStep('cache', 'active', 'limpando');
    let removedWorkers = 0;
    let removedCaches = 0;
    try {
      const before = await getRuntimeState();
      if (before.registrations.length) {
        const results = await Promise.allSettled(before.registrations.map(reg => reg.unregister()));
        removedWorkers = results.filter(r => r.status === 'fulfilled' && r.value).length;
      }
      if (before.cacheKeys.length) {
        const results = await Promise.allSettled(before.cacheKeys.map(key => caches.delete(key)));
        removedCaches = results.filter(r => r.status === 'fulfilled' && r.value).length;
      }
      const after = await getRuntimeState();
      const clean = after.registrations.length === 0 && after.cacheKeys.length === 0;
      setStep('cache', clean ? 'ok' : 'warn', clean ? 'limpo' : 'parcial');
      log(clean ? 'ok' : 'warn', 'Runtime antigo neutralizado', `${removedWorkers} worker(s), ${removedCaches} cache(s); restantes: ${after.registrations.length} worker(s), ${after.cacheKeys.length} cache(s)`);
      return { clean, ...after };
    } catch (error) {
      setStep('cache', 'warn', 'parcial');
      log('warn', 'Falha parcial ao limpar runtime antigo', error?.message || error);
      return { clean:false, registrations:[], cacheKeys:[] };
    }
  }

  async function checkStorage() {
    let localOk = false;
    try {
      const key = '__rm_boot_storage_test__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      localOk = true;
    } catch (error) { log('warn', 'localStorage indisponível', error?.message || error); }
    const idbOk = 'indexedDB' in window;
    setStep('storage', localOk && idbOk ? 'ok' : 'warn', localOk && idbOk ? 'disponível' : 'limitado');
    log(localOk && idbOk ? 'ok' : 'warn', 'Armazenamento local', localOk && idbOk ? 'IndexedDB + localStorage' : 'com limitação');
  }

  function loadScript(path, timeoutMs) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const sep = path.includes('?') ? '&' : '?';
      const src = `${path}${sep}v=${encodeURIComponent(RELEASE)}&boot=${bootNonce}`;
      const timer = setTimeout(() => { script.remove(); reject(new Error(`Tempo excedido ao carregar ${path}`)); }, timeoutMs);
      script.src = src;
      script.async = true;
      script.onload = () => { clearTimeout(timer); resolve(); };
      script.onerror = () => { clearTimeout(timer); reject(new Error(`Falha ao carregar ${path}`)); };
      document.head.appendChild(script);
    });
  }

  function appLooksFunctional() {
    const shell = document.querySelector('.app-shell');
    const content = document.getElementById('content') || document.querySelector('.content');
    const activeView = document.querySelector('.view.active');
    const tabbar = document.querySelector('.tab-bar,.capsule-tabbar');
    const action = document.querySelector('.action-card');
    const visible = node => {
      if (!node) return false;
      try {
        const st = getComputedStyle(node);
        const r = node.getBoundingClientRect();
        const opacity = Number.parseFloat(st.opacity || '1');
        return st.display !== 'none' && st.visibility !== 'hidden' && !(Number.isFinite(opacity) && opacity <= .01) && r.width > 40 && r.height > 24;
      } catch (_) { return true; }
    };
    return Boolean(visible(shell) && visible(content) && visible(activeView) && visible(tabbar) && action);
  }

  async function waitForFunctionalState(timeoutMs = 6500) {
    const started = performance.now();
    while (performance.now() - started < timeoutMs) {
      if (releaseEventSeen || appLooksFunctional()) return true;
      await sleep(100);
    }
    return appLooksFunctional();
  }

  function showFailure(title, subtitle, error) {
    if (error) lastFatal = { message:error?.message || String(error), source:'boot' };
    const payload = buildDiagnostic(title, visualSnapshot(), error?.message || subtitle || '');
    persistDiagnostic(payload);
    forceDocumentVisibleForDiagnostics();
    document.body?.classList.add('rm-boot-failed');
    setMessage(title, subtitle);
    setProgress(100);
    if (actions) actions.hidden = false;
    if (diagnostics) { diagnostics.hidden = false; diagnostics.textContent = payload; }
    setStep('ready', 'error', 'falhou');
    ensureIndependentDiagnosticLink();
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) {}
    ta.remove();
    return ok;
  }

  async function finishSuccess() {
    currentStage = 'pós-inicialização';
    setStep('ready', 'ok', 'pronto');
    setProgress(100);
    setMessage('Tudo pronto', `Registro ${RELEASE} iniciado em ${nowMs()} ms`);
    log('ok', 'Aplicativo pronto para uso', `${nowMs()} ms`);
    await sleep(100);
    document.body.classList.remove('rm-booting', 'rm-boot-failed');
    document.body.classList.add('rm-boot-complete');
    if (boot) {
      boot.setAttribute('aria-hidden', 'true');
      boot.classList.add('rm-boot-hide');
    }
    startVisualWatchdog();
  }

  function runVisualWatchdog() {
    if (diagnosticOpen || document.hidden) return;
    const snap = visualSnapshot();
    const reasons = diagnoseVisual(snap);
    if (reasons.length) {
      badVisualChecks += 1;
      log('warn', 'Watchdog visual detectou inconsistência', reasons.join(' | '));
      if (badVisualChecks >= 2) showDiagnostic('Interface ficou invisível ou incompleta após o carregamento', reasons.join(' | '));
    } else {
      badVisualChecks = 0;
    }
  }

  function startVisualWatchdog() {
    clearInterval(watchdogTimer);
    badVisualChecks = 0;
    setTimeout(runVisualWatchdog, 250);
    setTimeout(runVisualWatchdog, 700);
    setTimeout(runVisualWatchdog, 1500);
    watchdogTimer = setInterval(runVisualWatchdog, 2000);
    try {
      const headObserver = new MutationObserver(() => setTimeout(runVisualWatchdog, 30));
      headObserver.observe(document.head, { childList:true, subtree:true, attributes:true, attributeFilter:['media','disabled'] });
      const rootObserver = new MutationObserver(() => setTimeout(runVisualWatchdog, 30));
      rootObserver.observe(document.documentElement, { attributes:true, attributeFilter:['style','class','data-theme','data-accent','data-semantic-palette'] });
      if (document.body) rootObserver.observe(document.body, { attributes:true, attributeFilter:['style','class'] });
    } catch (_) {}
  }

  window.addEventListener('error', event => {
    const source = String(event.filename || '');
    const message = event.message || 'Erro JavaScript';
    if (/app\.js|patches\.js|official-appearance\.js|official-approved-ui\.js|boot\.js/i.test(source) || appScriptLoaded) {
      lastFatal = { message, source };
      log('error', message, source ? source.split('/').pop() : 'runtime');
      if (document.body?.classList.contains('rm-boot-complete')) setTimeout(runVisualWatchdog, 30);
    }
  });

  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason?.message || String(event.reason || 'Promise rejeitada');
    lastFatal = { message:reason, source:'promise' };
    log('error', 'Promise rejeitada', reason);
    if (document.body?.classList.contains('rm-boot-complete')) setTimeout(runVisualWatchdog, 30);
  });

  window.addEventListener('registro:release-ready', event => {
    releaseEventSeen = true;
    log('ok', 'Evento de versão recebido', event.detail?.release || RELEASE);
  });

  retryButton?.addEventListener('click', () => location.replace(`./?v=${encodeURIComponent(RELEASE)}&retry=${Date.now()}`));
  safeButton?.addEventListener('click', () => { location.href = `./safe.html?v=${encodeURIComponent(RELEASE)}&safe=${Date.now()}`; });
  recoverButton?.addEventListener('click', () => { location.href = `./recover.html?v=${encodeURIComponent(RELEASE)}&from=boot&recover=${Date.now()}`; });
  copyButton?.addEventListener('click', async () => {
    const payload = lastDiagnosticPayload || buildDiagnostic('Diagnóstico solicitado manualmente');
    persistDiagnostic(payload);
    if (diagnostics) {
      diagnostics.hidden = false;
      diagnostics.textContent = payload;
      diagnostics.setAttribute('tabindex','0');
    }
    if (copyButton) {
      copyButton.disabled = true;
      copyButton.textContent = 'Copiando…';
    }
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await withTimeout(navigator.clipboard.writeText(payload), 1200, 'Cópia do diagnóstico');
        ok = true;
      }
    } catch (_) {}
    if (!ok) ok = fallbackCopy(payload);
    if (copyButton) copyButton.textContent = ok ? 'Diagnóstico copiado' : 'Texto exibido abaixo';
    if (!ok && diagnostics) {
      try {
        const range = document.createRange();
        range.selectNodeContents(diagnostics);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (_) {}
    }
    setTimeout(() => {
      if (!copyButton) return;
      copyButton.disabled = false;
      copyButton.textContent = 'Copiar diagnóstico';
    }, 2400);
  });

  async function start() {
    currentStage = 'shell';
    setStep('shell', 'ok', 'visível');
    setProgress(10);
    log('ok', 'Tela de inicialização exibida');
    if (hadControllerAtStart) log('warn', 'Aba nasceu controlada por Service Worker antigo');

    await twoPaints();
    setProgress(18);

    currentStage = 'ambiente';
    const storagePromise = checkStorage();
    const cleanupPromise = clearObsoleteRuntime();
    let runtime;
    try {
      runtime = await withTimeout(cleanupPromise, 1800, 'Limpeza do ambiente web');
    } catch (error) {
      runtime = { clean:false };
      setStep('cache', 'warn', 'em segundo plano');
      log('warn', 'Limpeza excedeu o limite e deixou de bloquear a abertura', error.message);
    }
    Promise.allSettled([storagePromise, cleanupPromise]).catch(() => {});

    if (hadControllerAtStart && runtime.clean && navigator.serviceWorker?.controller) {
      log('warn', 'Controlador residual do Safari ignorado', 'nenhuma inscrição ou cache antigo permanece ativo');
      setMessage('Abrindo com segurança', 'A versão antiga já foi removida; continuando nesta aba…');
    } else if (!runtime.clean) {
      log('warn', 'Runtime antigo não foi totalmente confirmado', 'continuando com arquivos de URL única');
    }

    try {
      currentStage = 'app.js';
      setStep('engine', 'active', 'carregando');
      setMessage('Abrindo o Registro', 'Carregando o motor principal…');
      setProgress(32);
      log('info', 'Carregando app.js com URL única');
      await loadScript('./app.js', 18000);
      appScriptLoaded = true;
      setStep('engine', 'ok', 'carregado');
      setProgress(64);
      log('ok', 'Motor principal carregado');
    } catch (error) {
      showFailure('O motor do app não abriu', 'Seus dados continuam preservados. Use Recuperar ou Modo seguro.', error);
      return;
    }

    try {
      currentStage = 'patches';
      setStep('patches', 'active', 'aplicando');
      setMessage('Finalizando', 'Aplicando correções e personalizações…');
      setProgress(74);
      await loadScript('./patches.js', 8000);
      currentStage = 'official-approved-ui.js';
      await loadScript('./official-approved-ui.js', 8000);
      currentStage = 'official-appearance.js';
      await loadScript('./official-appearance.js', 8000);
      currentStage = 'sleep-wake.js';
      await loadScript('./sleep-wake.js', 8000);
      currentStage = 'drug-interactions.js';
      await loadScript('./drug-interactions.js', 10000);
      setStep('patches', 'ok', 'aplicadas');
      log('ok', 'Correções finais, refinamentos aprovados e aparência consolidada carregados');
    } catch (error) {
      setStep('patches', 'warn', 'parcial');
      lastFatal = { message:error?.message || String(error), source:currentStage };
      log('warn', 'Correções finais não carregaram', error?.message || error);
    }

    currentStage = 'verificação inicial';
    setStep('ready', 'active', 'verificando');
    setProgress(86);
    setMessage('Quase pronto', 'Verificando se a interface respondeu…');

    const functional = await waitForFunctionalState();
    if (!functional) {
      showFailure('A interface não respondeu', 'Os arquivos carregaram, mas o app não confirmou funcionamento. Seus dados não foram apagados.', lastFatal ? new Error(lastFatal.message) : null);
      return;
    }

    await twoPaints();
    const initialVisualProblems = diagnoseVisual(visualSnapshot());
    if (initialVisualProblems.length) {
      showDiagnostic('A interface carregou, mas não ficou visível', initialVisualProblems.join(' | '));
      return;
    }

    await finishSuccess();
  }

  start().catch(error => showFailure('Falha inesperada na inicialização', 'Seus dados locais permanecem preservados.', error));
})();
