/* Registro Mental — verificador de interações medicamentosas
   Fontes:
   - openFDA Drug Labeling API (rótulos/bulas públicas; atualização frequente)
   - ANVISA RDC 1.036/2026, listas A/B para prioridade de controle especial no Brasil
   Importante: ausência de achado não prova ausência de interação.
*/
(() => {
  'use strict';
  if (window.__RM_DRUG_INTERACTIONS_V1__) return;
  window.__RM_DRUG_INTERACTIONS_V1__ = true;

  const CACHE_PREFIX = 'registro-drug-label-v1:';
  const CACHE_MS = 7 * 24 * 60 * 60 * 1000;
  const RECENT_MS = 14 * 24 * 60 * 60 * 1000;
  const MAX_LABELS = 5;

  const PT_TO_EN = {
    'acido valproico':'valproic acid','valproato sodico':'valproate sodium','alprazolam':'alprazolam',
    'amitriptilina':'amitriptyline','aripiprazol':'aripiprazole','armodafinila':'armodafinil',
    'bupropiona':'bupropion','buprenorfina':'buprenorphine','carbamazepina':'carbamazepine',
    'carisoprodol':'carisoprodol','cetamina':'ketamine','citalopram':'citalopram',
    'clobazam':'clobazam','clonazepam':'clonazepam','clozapina':'clozapine','codeina':'codeine',
    'desvenlafaxina':'desvenlafaxine','diazepam':'diazepam','duloxetina':'duloxetine',
    'escetamina':'esketamine','escitalopram':'escitalopram','eszopiclona':'eszopiclone',
    'fenobarbital':'phenobarbital','fentanila':'fentanyl','fluoxetina':'fluoxetine',
    'fluvoxamina':'fluvoxamine','gabapentina':'gabapentin','hidrocodona':'hydrocodone',
    'hidromorfona':'hydromorphone','lamotrigina':'lamotrigine','lisdexanfetamina':'lisdexamfetamine',
    'litio':'lithium','lorazepam':'lorazepam','metadona':'methadone','metilfenidato':'methylphenidate',
    'midazolam':'midazolam','mirtazapina':'mirtazapine','modafinila':'modafinil',
    'morfina':'morphine','olanzapina':'olanzapine','oxicodona':'oxycodone',
    'paroxetina':'paroxetine','petidina':'meperidine','pregabalina':'pregabalin',
    'quetiapina':'quetiapine','risperidona':'risperidone','sertralina':'sertraline',
    'sibutramina':'sibutramine','tapentadol':'tapentadol','tramadol':'tramadol',
    'trazodona':'trazodone','venlafaxina':'venlafaxine','vortioxetina':'vortioxetine',
    'ziprasidona':'ziprasidone','zolpidem':'zolpidem','zopiclona':'zopiclone'
  };

  /* Prioridade brasileira: listas A3, B1 e B2 + entorpecentes de uso medicamentoso frequente
     constantes das listas A1/A2. Isto serve para destacar combinações; não substitui a
     classificação regulatória completa da apresentação comercial. */
  const BR_PRIORITY_CONTROLLED = new Set([
    'anfetamina','catina','clorfentermina','dexanfetamina','dronabinol','femetrazina','fenciclidina',
    'fenetilina','fenfluramina','levanfetamina','lisdexanfetamina','metilfenidato','metilsinefrina','tanfetamina',
    'alfaxalona','alobarbital','alprazolam','amineptina','amobarbital','aprobarbital','armodafinila',
    'barbexaclona','barbital','bromazepam','bromazolam','brotizolam','butabarbital','butalbital','camazepam',
    'carisoprodol','cetamina','cetazolam','ciclobarbital','clobazam','clonazepam','clonazolam','clorazepam',
    'clorazepato','clordiazepoxido','clotiazepam','cloxazolam','delorazepam','diazepam','diclazepam',
    'escetamina','estazolam','eszopiclona','etclorvinol','etilanfetamina','etinamato','etizolam','fenazepam',
    'fenobarbital','flualprazolam','flubromazolam','fludiazepam','flunitrazepam','flunitrazolam','flurazepam',
    'gbl','ghb','glutetimida','halazepam','haloxazolam','lefetamina','lemborexante','loflazepato de etila',
    'loprazolam','lorazepam','lormetazepam','medazepam','meprobamato','mesocarbo','metilfenobarbital',
    'metiprilona','midazolam','modafinila','nimetazepam','nitrazepam','norcanfano','nordazepam','oxazepam',
    'oxazolam','pemolina','pentazocina','pentobarbital','perampanel','pinazepam','pipradrol','pirovalerona',
    'prazepam','prolintano','propilexedrina','remimazolam','secbutabarbital','secobarbital','temazepam',
    'tetrazepam','tiamilal','tiopental','triazolam','triexifenidil','vinilbital','zaleplona','zolpidem','zopiclona',
    'aminorex','anfepramona','femproporex','fendimetrazina','fentermina','mazindol','mefenorex','sibutramina',
    'buprenorfina','fentanila','hidrocodona','hidromorfona','metadona','morfina','oxicodona','petidina',
    'remifentanila','sufentanila','tapentadol','codeina','tramadol'
  ]);

  function norm(value='') {
    return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
      .replace(/[^a-z0-9]+/g,' ').trim();
  }
  function html(value='') {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function uniq(values) {
    return [...new Set(values.filter(Boolean).map(v => String(v).trim()).filter(Boolean))];
  }
  function translated(name) {
    const n = norm(name);
    return PT_TO_EN[n] || name;
  }
  function isBrazilPriorityControlled(name) {
    return BR_PRIORITY_CONTROLLED.has(norm(name));
  }
  function stripClass(value='') {
    return norm(String(value).replace(/\[[^\]]+\]/g,'').replace(/\([^\)]+\)/g,''));
  }
  function cacheKey(name) { return CACHE_PREFIX + norm(translated(name)); }

  function readCache(name) {
    try {
      const raw = localStorage.getItem(cacheKey(name));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.savedAt || Date.now() - parsed.savedAt > CACHE_MS) return null;
      return parsed.value || null;
    } catch (_) { return null; }
  }
  function writeCache(name,value) {
    try { localStorage.setItem(cacheKey(name), JSON.stringify({savedAt:Date.now(),value})); } catch (_) {}
  }

  async function queryOpenFDA(field, term) {
    const search = `${field}:"${String(term).replace(/"/g,'')}"`;
    const url = 'https://api.fda.gov/drug/label.json?search=' + encodeURIComponent(search) + '&limit=' + MAX_LABELS;
    const response = await fetch(url, {headers:{'Accept':'application/json'}});
    if (response.status === 404) return [];
    if (!response.ok) throw new Error('openFDA ' + response.status);
    const data = await response.json();
    return Array.isArray(data?.results) ? data.results : [];
  }

  async function loadDrugInfo(name) {
    const cached = readCache(name);
    if (cached) return cached;

    const term = translated(name);
    let results = [];
    const attempts = [
      ['openfda.generic_name',term],
      ['openfda.brand_name',term],
      ['openfda.substance_name',term]
    ];
    for (const [field,q] of attempts) {
      try {
        results = await queryOpenFDA(field,q);
        if (results.length) break;
      } catch (_) {}
    }

    const sections = [];
    const names = [name,term];
    const classes = [];
    let controlledUS = false;

    for (const r of results) {
      const of = r.openfda || {};
      names.push(...(of.generic_name||[]), ...(of.brand_name||[]), ...(of.substance_name||[]));
      classes.push(...(of.pharm_class_epc||[]), ...(of.pharm_class_moa||[]), ...(of.pharm_class_cs||[]));
      if ((r.controlled_substance||[]).length) controlledUS = true;
      for (const [key,label] of [
        ['boxed_warning','Alerta máximo'],
        ['contraindications','Contraindicações'],
        ['drug_interactions','Interações medicamentosas'],
        ['warnings_and_cautions','Advertências e precauções'],
        ['warnings','Advertências']
      ]) {
        for (const text of (r[key]||[])) {
          if (text) sections.push({key,label,text:String(text)});
        }
      }
    }

    const value = {
      requested:name,
      queryName:term,
      found:Boolean(results.length),
      names:uniq(names),
      classes:uniq(classes),
      controlledUS,
      sections
    };
    writeCache(name,value);
    return value;
  }

  function classTerms(info) {
    return uniq((info?.classes||[])
      .map(stripClass)
      .filter(x => x.length >= 7 && !['drug','agent','agents','inhibitor','inhibitors','receptor'].includes(x)));
  }
  function nameTerms(info) {
    return uniq((info?.names||[]).map(norm).filter(x => x.length >= 4));
  }

  function findEvidence(source, target) {
    if (!source?.found || !target?.found) return null;
    const targetNames = nameTerms(target);
    const targetClasses = classTerms(target);
    const sections = source.sections || [];

    for (const section of sections) {
      const t = norm(section.text);
      const matchedName = targetNames.find(n => t.includes(n));
      const matchedClass = targetClasses.find(n => t.includes(n));
      if (!matchedName && !matchedClass) continue;

      const needle = matchedName || matchedClass;
      const raw = section.text;
      const rawNorm = norm(raw);
      let idx = rawNorm.indexOf(needle);
      if (idx < 0) idx = 0;
      const start = Math.max(0, idx - 180);
      const end = Math.min(raw.length, start + 520);
      return {
        section:section.key,
        sectionLabel:section.label,
        text:raw.slice(start,end).replace(/\s+/g,' ').trim(),
        matched:matchedName ? 'medicamento' : 'classe'
      };
    }
    return null;
  }

  function severityFromEvidence(evidence) {
    if (!evidence) return 'none';
    const t = norm(evidence.text);
    if (evidence.section === 'contraindications' || evidence.section === 'boxed_warning') return 'critical';
    const critical = [
      'contraindicated','do not use','should not be used','avoid concomitant','avoid combination',
      'fatal','death','respiratory depression','serotonin syndrome','torsade','qt prolong',
      'hypertensive crisis','coma'
    ];
    if (critical.some(x => t.includes(norm(x)))) return 'critical';
    const high = ['serious','severe','life threatening','increase the risk','potentiate','profound sedation','seizure'];
    if (high.some(x => t.includes(norm(x)))) return 'high';
    return 'moderate';
  }

  function severityRank(s) {
    return ({critical:3,high:2,moderate:1,none:0,unknown:-1})[s] ?? 0;
  }
  function severityLabel(s) {
    return ({critical:'Muito importante',high:'Importante',moderate:'Atenção',unknown:'Não verificado'})[s] || 'Sem achado';
  }
  function severityClass(s) {
    return s === 'critical' ? 'critical' : s === 'high' ? 'high' : 'moderate';
  }
  function mechanism(text='') {
    const t = norm(text);
    if (t.includes('respiratory depression')) return 'Pode aumentar depressão respiratória.';
    if (t.includes('serotonin syndrome')) return 'Pode aumentar o risco de síndrome serotoninérgica.';
    if (t.includes('qt prolong') || t.includes('torsade')) return 'Pode aumentar o risco de alteração importante do ritmo cardíaco.';
    if (t.includes('hypertensive crisis')) return 'Pode aumentar o risco de crise hipertensiva.';
    if (t.includes('profound sedation') || t.includes('cns depression') || t.includes('sedation')) return 'Pode aumentar sedação ou depressão do sistema nervoso central.';
    if (t.includes('seizure')) return 'Pode aumentar o risco de convulsão.';
    if (t.includes('bleeding')) return 'Pode aumentar o risco de sangramento.';
    return 'Há uma interação descrita em bula que merece revisão.';
  }

  async function checkPair(aName,bName) {
    const [a,b] = await Promise.all([loadDrugInfo(aName),loadDrugInfo(bName)]);
    if (!a.found && !b.found) return {a:aName,b:bName,severity:'unknown',controlled:false,evidence:null,source:'openFDA'};
    const e1 = findEvidence(a,b);
    const e2 = findEvidence(b,a);
    const best = severityRank(severityFromEvidence(e1)) >= severityRank(severityFromEvidence(e2)) ? e1 : e2;
    const severity = best ? severityFromEvidence(best) : 'none';
    return {
      a:aName,b:bName,severity,
      controlled:isBrazilPriorityControlled(aName)||isBrazilPriorityControlled(bName)||a.controlledUS||b.controlledUS,
      evidence:best,
      source:'openFDA'
    };
  }

  function eventMedicationName(event, meds) {
    const m = meds.find(x => x.id === event.medicationId);
    return m?.activeIngredient || event.medication || '';
  }

  async function recentMedicationNames(excludeId=null) {
    const [events,meds] = await Promise.all([allEvents(),allMedications()]);
    const cutoff = Date.now() - RECENT_MS;
    return uniq(events.filter(e =>
      e.type === 'medication' && e.id !== excludeId && !e.demo &&
      Number.isFinite(new Date(e.timestamp).getTime()) && new Date(e.timestamp).getTime() >= cutoff
    ).map(e => eventMedicationName(e,meds)));
  }

  async function scanNames(names) {
    names = uniq(names);
    const out = [];
    for (let i=0;i<names.length;i++) {
      for (let j=i+1;j<names.length;j++) {
        try { out.push(await checkPair(names[i],names[j])); }
        catch (_) { out.push({a:names[i],b:names[j],severity:'unknown',controlled:false,evidence:null,source:'openFDA'}); }
      }
    }
    return out.sort((x,y)=>severityRank(y.severity)-severityRank(x.severity));
  }

  function sourceNote() {
    return 'Fonte automática: bulas públicas do openFDA/FDA. Prioridade de controle especial: listas A/B da Anvisa. A ausência de alerta não significa que a combinação seja segura.';
  }

  function resultCard(r) {
    const badge = r.severity === 'none' ? 'Sem menção explícita' : severityLabel(r.severity);
    const control = r.controlled ? '<span class="rm-ddi-control">controle especial</span>' : '';
    const evidence = r.evidence
      ? `<p class="rm-ddi-summary">${html(mechanism(r.evidence.text))}</p><details><summary>Ver trecho da bula</summary><p class="rm-ddi-evidence">${html(r.evidence.text)}</p><small>${html(r.evidence.sectionLabel)} · texto original em inglês</small></details>`
      : r.severity === 'unknown'
        ? '<p class="rm-ddi-summary">Não foi possível localizar bula suficiente para verificar esta combinação.</p>'
        : '<p class="rm-ddi-summary">Nenhuma menção explícita entre estes dois ativos foi localizada nas bulas consultadas. Isso não prova ausência de interação.</p>';
    return `<article class="rm-ddi-card rm-ddi-${severityClass(r.severity)}"><div class="rm-ddi-head"><div><strong>${html(r.a)} + ${html(r.b)}</strong><div class="rm-ddi-badges"><span>${html(badge)}</span>${control}</div></div></div>${evidence}</article>`;
  }

  async function openInteractionCenter() {
    const [events,meds] = await Promise.all([allEvents(),allMedications()]);
    const recent = await recentMedicationNames();
    const registered = uniq(meds.map(m=>m.activeIngredient).filter(Boolean));
    const names = uniq([...recent,...registered]).slice(0,16);

    openBackdrop('Interações medicamentosas',
      '<p class="helper">O app verifica pares de princípios ativos usando seções de interação, contraindicação e alertas de bulas públicas. Medicamentos usados nos últimos 14 dias aparecem primeiro.</p>' +
      '<div class="rm-ddi-toolbar"><button type="button" class="primary-button" id="rmDdiScanBtn">Verificar agora</button><button type="button" class="secondary-button" data-cancel>Fechar</button></div>' +
      '<div id="rmDdiStatus" class="rm-ddi-status">' + (names.length >= 2 ? html(names.length + ' medicamentos disponíveis para comparação.') : 'Cadastre ou registre pelo menos dois medicamentos.') + '</div>' +
      '<div id="rmDdiResults"></div><p class="group-footnote">' + html(sourceNote()) + '</p>',
      ev => ev.preventDefault()
    );

    const button = document.getElementById('rmDdiScanBtn');
    if (!button) return;
    button.disabled = names.length < 2;
    button.onclick = async () => {
      const status = document.getElementById('rmDdiStatus');
      const box = document.getElementById('rmDdiResults');
      button.disabled = true;
      button.textContent = 'Verificando…';
      if (status) status.textContent = 'Consultando bulas e comparando combinações…';
      const results = await scanNames(names);
      const relevant = results.filter(r => r.severity !== 'none');
      if (status) status.textContent = relevant.length
        ? relevant.length + ' combinação(ões) com alerta ou verificação incompleta.'
        : 'Nenhuma interação explícita foi encontrada nas bulas consultadas.';
      if (box) box.innerHTML = (relevant.length ? relevant : results.slice(0,Math.min(8,results.length))).map(resultCard).join('');
      button.disabled = false;
      button.textContent = 'Verificar novamente';
    };
  }

  async function warnAfterUse(record) {
    if (!record || record.type !== 'medication' || record.demo) return;
    const meds = await allMedications();
    const current = eventMedicationName(record,meds);
    if (!current) return;

    const others = (await recentMedicationNames(record.id)).filter(n => norm(n) !== norm(current));
    if (!others.length) return;

    const results = [];
    for (const other of others.slice(0,10)) {
      try {
        const r = await checkPair(current,other);
        if (severityRank(r.severity) >= 1) results.push(r);
      } catch (_) {}
    }
    if (!results.length) return;

    results.sort((a,b)=>severityRank(b.severity)-severityRank(a.severity));
    const top = results[0];
    const title = top.severity === 'critical' ? 'Possível interação muito importante' : 'Possível interação medicamentosa';
    const cards = results.slice(0,4).map(resultCard).join('');

    openBackdrop(title,
      '<div class="rm-ddi-warning-intro"><strong>O app encontrou uma combinação descrita em bula.</strong><p>Não altere dose nem interrompa medicamento apenas por este aviso. Confirme a combinação com médico ou farmacêutico.</p></div>' +
      cards +
      '<p class="group-footnote">' + html(sourceNote()) + '</p>' +
      '<div class="form-actions"><button type="button" class="secondary-button" id="rmDdiDismiss">Entendi</button><button type="button" class="primary-button" id="rmDdiOpenCenter">Ver todas</button></div>',
      ev => ev.preventDefault()
    );
    document.getElementById('rmDdiDismiss')?.addEventListener('click',closeSheet);
    document.getElementById('rmDdiOpenCenter')?.addEventListener('click',openInteractionCenter);
  }

  function installStyles() {
    if (document.getElementById('rm-ddi-styles')) return;
    const s = document.createElement('style');
    s.id = 'rm-ddi-styles';
    s.textContent = `
      .rm-ddi-toolbar{display:flex;gap:8px;margin:8px 0 12px}.rm-ddi-status{color:var(--secondary);font-size:12px;margin-bottom:10px}
      #rmDdiResults{display:grid;gap:10px}.rm-ddi-card{border:1px solid var(--separator);border-radius:18px;padding:12px;background:var(--surface-2)}
      .rm-ddi-card.rm-ddi-critical{border-color:rgba(255,69,58,.55);box-shadow:0 0 16px rgba(255,69,58,.12)}
      .rm-ddi-card.rm-ddi-high{border-color:rgba(255,149,0,.55);box-shadow:0 0 14px rgba(255,149,0,.10)}
      .rm-ddi-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.rm-ddi-head strong{font-size:14px}
      .rm-ddi-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.rm-ddi-badges span{font-size:10px;font-weight:800;padding:4px 7px;border-radius:999px;background:color-mix(in srgb,var(--accent) 10%,transparent)}
      .rm-ddi-control{color:#ff9f0a!important;background:rgba(255,159,10,.10)!important}.rm-ddi-summary{font-size:12px;line-height:1.4;margin:9px 0 0;color:var(--text)}
      .rm-ddi-card details{margin-top:8px}.rm-ddi-card summary{font-size:11px;color:var(--secondary);cursor:pointer}.rm-ddi-evidence{font-size:11px;line-height:1.45;color:var(--secondary)}
      .rm-ddi-warning-intro{padding:12px;border-radius:16px;background:rgba(255,69,58,.08);border:1px solid rgba(255,69,58,.22);margin-bottom:10px}.rm-ddi-warning-intro p{font-size:12px;line-height:1.4;margin:6px 0 0;color:var(--secondary)}
      html[data-visual-mode="ultra"] .rm-ddi-card.rm-ddi-critical{box-shadow:0 0 18px rgba(255,69,58,.18),0 8px 22px rgba(255,69,58,.08)}
      html[data-visual-mode="ultra"] .rm-ddi-card.rm-ddi-high{box-shadow:0 0 16px rgba(255,149,0,.15),0 8px 20px rgba(255,149,0,.07)}
    `;
    document.head.appendChild(s);
  }

  function installRegistryButton() {
    if (typeof window.openMedicationRegistry !== 'function' || window.openMedicationRegistry.__rmDdiWrapped) return;
    const previous = window.openMedicationRegistry;
    const wrapped = async function(...args) {
      const result = await previous.apply(this,args);
      const toolbar = document.querySelector('.registry-toolbar');
      if (toolbar && !document.getElementById('rmMedicationInteractionsBtn')) {
        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'rmMedicationInteractionsBtn';
        button.className = 'secondary-button';
        button.textContent = 'Interações';
        button.onclick = openInteractionCenter;
        toolbar.insertBefore(button, toolbar.querySelector('[data-cancel]') || null);
      }
      return result;
    };
    wrapped.__rmDdiWrapped = true;
    wrapped.__rmDdiPrevious = previous;
    window.openMedicationRegistry = wrapped;
  }

  function installUseHook() {
    if (typeof window.putEvent !== 'function' || window.putEvent.__rmDdiWrapped) return;
    const previous = window.putEvent;
    const wrapped = async function(event) {
      const result = await previous.apply(this,arguments);
      const manualMedicationForm = event?.type === 'medication' && !event.demo && document.querySelector('#form #medName');
      if (manualMedicationForm) setTimeout(() => warnAfterUse(event).catch(()=>{}), 500);
      return result;
    };
    wrapped.__rmDdiWrapped = true;
    wrapped.__rmDdiPrevious = previous;
    window.putEvent = wrapped;
  }

  function install() {
    installStyles();
    installRegistryButton();
    installUseHook();
    window.openMedicationInteractions = openInteractionCenter;
    window.checkMedicationInteractionPair = checkPair;
    window.REGISTRO_DRUG_INTERACTION_SOURCE = {
      label:'openFDA/FDA Drug Labeling',
      controlledBrazil:'ANVISA RDC 1.036/2026 — listas A/B',
      recentWindowDays:14
    };
  }

  install();
  [250,800,1600,3200].forEach(ms => setTimeout(install,ms));
  window.addEventListener('registro:release-ready',install);
})();