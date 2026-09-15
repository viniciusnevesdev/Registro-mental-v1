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
  const ALCOHOL_INTERACTION_RULES = [
    {
      id:'alcohol-benzodiazepine',
      names:['clonazepam','alprazolam','diazepam','lorazepam','bromazepam','midazolam','clobazam','clordiazepoxido','clordiazepóxido','flunitrazepam','oxazepam','temazepam','triazolam'],
      severity:'critical',
      defaultWindowHours:24,
      windows:{clonazepam:48},
      title:'Álcool + benzodiazepínico',
      message:'A combinação pode intensificar a depressão do sistema nervoso central e da respiração, aumentando o risco de sedação profunda, overdose, respiração lenta ou difícil, coma e morte.',
      source:'NIAAA · bula de clonazepam/DailyMed'
    },
    {
      id:'alcohol-opioid',
      names:['codeina','codeína','tramadol','morfina','oxicodona','hidrocodona','hidromorfona','fentanila','metadona','buprenorfina','tapentadol','petidina','meperidina'],
      severity:'critical',
      defaultWindowHours:24,
      title:'Álcool + opioide',
      message:'Álcool e opioides podem deprimir a respiração de forma aditiva ou sinérgica, aumentando o risco de overdose, coma e morte.',
      source:'NIAAA'
    },
    {
      id:'alcohol-sedative',
      names:['zolpidem','zopiclona','eszopiclona','fenobarbital','carisoprodol'],
      severity:'critical',
      defaultWindowHours:24,
      title:'Álcool + sedativo',
      message:'A combinação pode aumentar muito a sonolência, a perda de coordenação e a depressão do sistema nervoso central, com risco de overdose e dificuldade para respirar.',
      source:'NIAAA'
    },
    {
      id:'alcohol-paracetamol',
      names:['paracetamol','acetaminofeno','acetaminophen'],
      severity:'high',
      defaultWindowHours:24,
      title:'Álcool + paracetamol',
      message:'Pode aumentar o risco de lesão no fígado, especialmente com consumo frequente ou elevado de álcool, doença hepática ou doses altas/repetidas de paracetamol.',
      source:'NIAAA/FDA'
    },
    {
      id:'alcohol-liver',
      names:['acido valproico','ácido valproico','valproato','valproato de sodio','valproato de sódio','duloxetina'],
      severity:'high',
      defaultWindowHours:24,
      title:'Álcool + medicamento com risco hepático',
      message:'O álcool pode aumentar efeitos adversos e o risco de lesão hepática associado a este medicamento.',
      source:'NIAAA'
    }
  ];

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
  function alcoholRuleFor(name) {
    const n=norm(name);
    for(const rule of ALCOHOL_INTERACTION_RULES){
      const hit=rule.names.find(x=>norm(x)===n);
      if(hit){
        const windowHours=rule.windows?.[n] ?? rule.windows?.[norm(hit)] ?? rule.defaultWindowHours;
        return {...rule,windowHours};
      }
    }
    return null;
  }
  function formatElapsed(ms) {
    const mins=Math.max(0,Math.round(ms/60000));
    if(mins<60)return mins+' min';
    const hours=mins/60;
    if(hours<24)return (Math.round(hours*10)/10).toLocaleString('pt-BR')+' h';
    return (Math.round(hours/24*10)/10).toLocaleString('pt-BR')+' dias';
  }
  function isExposure(event,key=null) {
    if(event?.type!=='note'||event?.exposure?.kind!=='substance')return false;
    return key ? event.exposure.substanceKey===key : true;
  }
  function exposureLabel(event) {
    return event?.exposure?.substance || event?.text || 'Substância';
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

  function installExposureAction() {
    const grid=document.querySelector('[data-view="home"] .action-grid');
    if(!grid)return; const existing=document.getElementById('rmSubstanceAction'); if(existing) existing.remove(); return;
    const button=document.createElement('button');
    button.type='button';
    button.id='rmSubstanceAction';
    button.className='action-card compact-action rm-substance-action';
    button.innerHTML='<span class="action-icon" data-icon="spark"></span><strong>Substância</strong>';
    const buy=grid.querySelector('[data-type="purchase"]');
    if(buy)grid.insertBefore(button,buy);else grid.appendChild(button);
    button.onclick=openExposureSheet;
    if(typeof hydrateIcons==='function')hydrateIcons(button);
  }

  function exposureFormHtml(now) {
    return '<div class="field"><label for="rmExposureSubstance">Substância</label><select id="rmExposureSubstance"><option value="alcohol">Álcool</option><option value="caffeine">Cafeína</option><option value="nicotine">Nicotina</option><option value="cannabis">Cannabis</option><option value="other">Outra</option></select></div>' +
      '<div class="field hidden" id="rmExposureOtherField"><label for="rmExposureOther">Qual substância?</label><input id="rmExposureOther" placeholder="Nome da substância"></div>' +
      '<div class="field"><label for="rmExposureAmount">Quantidade opcional</label><input id="rmExposureAmount" placeholder="Ex.: 1 lata, 2 taças, 200 mg"></div>' +
      '<div class="field"><label for="rmExposureNote">Observação opcional</label><textarea id="rmExposureNote" rows="2" placeholder="Ex.: bebi rápido, junto com comida…"></textarea></div>' +
      dateField('recordTime','Data e horário',now,{showNow:true,reserveNow:true}) +
      '<p class="helper">Esses registros também são usados pelos alertas de interação. A janela de alerta é preventiva e não representa um horário a partir do qual a combinação se torna segura.</p>' +
      formButtons('Registrar');
  }

  function openExposureSheet() {
    const now=toLocalInput();
    openBackdrop('Registrar substância',exposureFormHtml(now),saveExposure);
    const select=document.getElementById('rmExposureSubstance');
    const other=document.getElementById('rmExposureOtherField');
    select?.addEventListener('change',()=>other?.classList.toggle('hidden',select.value!=='other'));
  }

  async function saveExposure(event) {
    event.preventDefault();
    const select=document.getElementById('rmExposureSubstance');
    const key=select?.value||'alcohol';
    const labels={alcohol:'Álcool',caffeine:'Cafeína',nicotine:'Nicotina',cannabis:'Cannabis'};
    const custom=document.getElementById('rmExposureOther')?.value.trim();
    const substance=key==='other'?(custom||'Outra substância'):(labels[key]||key);
    const amount=document.getElementById('rmExposureAmount')?.value.trim()||'';
    const note=document.getElementById('rmExposureNote')?.value.trim()||'';
    const when=new Date(document.getElementById('recordTime')?.value);
    if(Number.isNaN(when.getTime()))return toast('Informe uma data e horário válidos.');
    if(key==='other'&&!custom)return toast('Informe qual substância foi usada.');
    const record={
      id:uid('exposure'),type:'note',timestamp:when.toISOString(),
      text:'Uso de '+substance+(amount?' · '+amount:''),
      tag:'substância',demo:false,
      exposure:{kind:'substance',substanceKey:key,substance,amount,note}
    };
    await putEvent(record);
    closeSheet();
    await renderAll();
    toast('Substância registrada.');
  }

  function localAlcoholInteraction(medName,alcoholEvent,medEvent) {
    const rule=alcoholRuleFor(medName);
    if(!rule)return null;
    const a=new Date(alcoholEvent.timestamp).getTime();
    const b=new Date(medEvent.timestamp).getTime();
    if(!Number.isFinite(a)||!Number.isFinite(b))return null;
    const delta=Math.abs(a-b);
    const windowMs=rule.windowHours*60*60*1000;
    if(delta>windowMs)return null;
    return {
      a:'Álcool',b:medName,severity:rule.severity,controlled:isBrazilPriorityControlled(medName),
      evidence:{section:'alcohol-local-rule',sectionLabel:rule.source,text:rule.message,matched:'substância'},
      source:rule.source,elapsedMs:delta,windowHours:rule.windowHours,ruleTitle:rule.title
    };
  }

  function alcoholWarningCard(r) {
    const critical=r.severity==='critical';
    return '<article class="rm-ddi-card '+(critical?'rm-ddi-critical':'rm-ddi-high')+'">' +
      '<div class="rm-ddi-head"><div><strong>'+html(r.ruleTitle||('Álcool + '+r.b))+'</strong>' +
      '<div class="rm-ddi-badges"><span>'+(critical?'ALTO RISCO':'ATENÇÃO IMPORTANTE')+'</span>' +
      (r.controlled?'<span class="rm-ddi-control">controle especial</span>':'')+'</div></div></div>' +
      '<p class="rm-ddi-summary">'+html(r.evidence?.text||'Interação relevante.')+'</p>' +
      '<p class="rm-ddi-time">Registros separados por '+html(formatElapsed(r.elapsedMs||0))+'. Janela preventiva usada pelo app: '+html(String(r.windowHours))+' h.</p>' +
      '<small>'+html(r.source||'Fonte clínica pública')+' · a janela do app não define um horário seguro.</small></article>';
  }

  async function recentAlcoholMedicationInteractions(triggerRecord) {
    const [events,meds]=await Promise.all([allEvents(),allMedications()]);
    const triggerTime=new Date(triggerRecord.timestamp).getTime();
    if(!Number.isFinite(triggerTime))return[];
    const maxWindow=48*60*60*1000;
    const candidates=events.filter(e=>e.id!==triggerRecord.id&&!e.demo&&Math.abs(new Date(e.timestamp).getTime()-triggerTime)<=maxWindow);
    const out=[];
    if(isExposure(triggerRecord,'alcohol')){
      for(const e of candidates.filter(e=>e.type==='medication')){
        const medName=eventMedicationName(e,meds);
        const match=localAlcoholInteraction(medName,triggerRecord,e);
        if(match)out.push(match);
      }
    }else if(triggerRecord.type==='medication'){
      const medName=eventMedicationName(triggerRecord,meds);
      for(const e of candidates.filter(e=>isExposure(e,'alcohol'))){
        const match=localAlcoholInteraction(medName,e,triggerRecord);
        if(match)out.push(match);
      }
    }
    return out.sort((x,y)=>severityRank(y.severity)-severityRank(x.severity)||x.elapsedMs-y.elapsedMs);
  }

  async function warnExposureCombination(record) {
    const matches=await recentAlcoholMedicationInteractions(record);
    if(!matches.length)return false;
    const top=matches[0];
    const critical=top.severity==='critical';
    openBackdrop(critical?'Combinação de alto risco':'Possível interação com álcool',
      '<div class="rm-ddi-warning-intro"><strong>Há sobreposição temporal entre substâncias que podem interagir.</strong><p>Este aviso é preventivo. Não use a janela mostrada como um “tempo seguro” para misturar substâncias.</p></div>' +
      matches.slice(0,4).map(alcoholWarningCard).join('') +
      (critical?'<div class="rm-ddi-emergency"><strong>Sinais de emergência</strong><p>Se houver dificuldade para acordar, respiração lenta, irregular ou difícil, desmaio ou lábios arroxeados, procure atendimento de emergência imediatamente (SAMU 192 no Brasil).</p></div>':'') +
      '<div class="form-actions"><button type="button" class="primary-button" id="rmDdiDismiss">Entendi</button><button type="button" class="secondary-button" id="rmDdiOpenCenter">Ver interações</button></div>',
      ev=>ev.preventDefault()
    );
    document.getElementById('rmDdiDismiss')?.addEventListener('click',closeSheet);
    document.getElementById('rmDdiOpenCenter')?.addEventListener('click',openInteractionCenter);
    return true;
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
      .rm-ddi-time{font-size:11px;line-height:1.35;color:var(--secondary);margin:7px 0}.rm-ddi-emergency{padding:12px;border-radius:16px;background:rgba(255,69,58,.10);border:1px solid rgba(255,69,58,.35);margin:10px 0}.rm-ddi-emergency p{font-size:12px;line-height:1.4;margin:5px 0 0}
      .rm-substance-action .action-icon{color:#ff9f0a!important}
      html[data-visual-mode="ultra"] .rm-ddi-card.rm-ddi-critical{box-shadow:0 0 18px rgba(255,69,58,.18),0 8px 22px rgba(255,69,58,.08)}
      html[data-visual-mode="ultra"] .rm-ddi-card.rm-ddi-high{box-shadow:0 0 16px rgba(255,149,0,.15),0 8px 20px rgba(255,149,0,.07)}
    `;
    document.head.appendChild(s);
  }

  async function openInteractionsForMedication(name) {
    const meds = await allMedications();
    const others = uniq(meds.map(m=>m.activeIngredient).filter(n=>n && norm(n)!==norm(name))).slice(0,15);
    openBackdrop('Interações · ' + name,
      '<p class="helper">Verifica este princípio ativo contra os outros medicamentos cadastrados no app.</p>' +
      '<div id="rmDdiStatus" class="rm-ddi-status">' + (others.length ? html(others.length + ' medicamento(s) para comparar.') : 'Nenhum outro medicamento cadastrado.') + '</div>' +
      '<div id="rmDdiResults"></div><p class="group-footnote">' + html(sourceNote()) + '</p>' +
      '<div class="form-actions"><button type="button" class="secondary-button" data-cancel>Fechar</button><button type="button" class="primary-button" id="rmDdiSingleScan">Verificar</button></div>',
      ev=>ev.preventDefault()
    );
    const button=document.getElementById('rmDdiSingleScan');
    if(!button)return;
    button.disabled=!others.length;
    button.onclick=async()=>{
      button.disabled=true;button.textContent='Verificando…';
      const status=document.getElementById('rmDdiStatus'),box=document.getElementById('rmDdiResults');
      const results=[];
      for(const other of others){
        try{results.push(await checkPair(name,other))}
        catch(_){results.push({a:name,b:other,severity:'unknown',controlled:false,evidence:null,source:'openFDA'})}
      }
      results.sort((a,b)=>severityRank(b.severity)-severityRank(a.severity));
      const relevant=results.filter(r=>r.severity!=='none');
      if(status)status.textContent=relevant.length?relevant.length+' combinação(ões) com alerta ou verificação incompleta.':'Nenhuma interação explícita foi encontrada nas bulas consultadas.';
      if(box)box.innerHTML=(relevant.length?relevant:results.slice(0,8)).map(resultCard).join('');
      button.disabled=false;button.textContent='Verificar novamente';
    };
  }

  function installDetailButton() {
    if (typeof window.openMedicationDetail !== 'function' || window.openMedicationDetail.__rmDdiWrapped) return;
    const previous=window.openMedicationDetail;
    const wrapped=async function(id){
      const result=await previous.apply(this,arguments);
      try{
        const meds=await allMedications(),m=meds.find(x=>x.id===id);
        const toolbar=[...document.querySelectorAll('.registry-toolbar')][0];
        if(m&&toolbar&&!document.getElementById('rmMedicationDetailInteractionsBtn')){
          const button=document.createElement('button');
          button.type='button';button.id='rmMedicationDetailInteractionsBtn';button.className='secondary-button';button.textContent='Interações';
          button.onclick=()=>openInteractionsForMedication(m.activeIngredient);
          toolbar.appendChild(button);
        }
      }catch(_){}
      return result;
    };
    wrapped.__rmDdiWrapped=true;wrapped.__rmDdiPrevious=previous;
    window.openMedicationDetail=wrapped;
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
      const manualExposureForm = isExposure(event) && !event.demo && document.querySelector('#form #rmExposureSubstance');
      if (manualMedicationForm || manualExposureForm) {
        setTimeout(async()=>{
          try{
            const shown=await warnExposureCombination(event);
            if(!shown && manualMedicationForm) await warnAfterUse(event);
          }catch(_){}
        },500);
      }
      return result;
    };
    wrapped.__rmDdiWrapped = true;
    wrapped.__rmDdiPrevious = previous;
    window.putEvent = wrapped;
  }

  function installExposureIsolation() {
    try{
      if(typeof window.renderAnalysis==='function'&&!window.renderAnalysis.__rmExposureIsolated){
        const previous=window.renderAnalysis;
        const wrapped=async function(events,...rest){
          return previous.call(this,(events||[]).filter(e=>!isExposure(e)),...rest);
        };
        wrapped.__rmExposureIsolated=true;wrapped.__rmExposurePrevious=previous;
        window.renderAnalysis=wrapped;
      }
      if(typeof window.learningCollectObservations==='function'&&!window.learningCollectObservations.__rmExposureIsolated){
        const previous=window.learningCollectObservations;
        const wrapped=async function(events,...rest){
          return previous.call(this,(events||[]).filter(e=>!isExposure(e)),...rest);
        };
        wrapped.__rmExposureIsolated=true;wrapped.__rmExposurePrevious=previous;
        window.learningCollectObservations=wrapped;
      }
      if(typeof window.medicationNoteSuggestions==='function'&&!window.medicationNoteSuggestions.__rmExposureIsolated){
        const previous=window.medicationNoteSuggestions;
        const wrapped=function(m,events,...rest){
          return previous.call(this,m,(events||[]).filter(e=>!isExposure(e)),...rest);
        };
        wrapped.__rmExposureIsolated=true;wrapped.__rmExposurePrevious=previous;
        window.medicationNoteSuggestions=wrapped;
      }
      if(typeof window.renderHome==='function'&&!window.renderHome.__rmExposureSummary){
        const previous=window.renderHome;
        const wrapped=async function(events,...rest){
          const result=await previous.call(this,events,...rest);
          try{
            const day=(events||[]).filter(e=>eventDay(e)===localDate(new Date()));
            const notes=day.filter(e=>e.type==='note'&&!isExposure(e));
            const exposures=day.filter(e=>isExposure(e));
            const rows=[...document.querySelectorAll('#summaryList .summary-row')];
            const noteRow=rows.find(row=>row.querySelector('.summary-row-label')?.textContent.trim()==='Anotações');
            if(noteRow)noteRow.querySelector('.summary-row-value').textContent=String(notes.length);
            document.getElementById('rmExposureSummaryRow')?.remove();
            if(exposures.length&&typeof summaryRow==='function'){
              const holder=document.createElement('div');
              holder.innerHTML=summaryRow('spark','Substâncias',String(exposures.length));
              const row=holder.firstElementChild;
              if(row){row.id='rmExposureSummaryRow';document.getElementById('summaryList')?.appendChild(row)}
            }
          }catch(_){}
          return result;
        };
        wrapped.__rmExposureSummary=true;wrapped.__rmExposurePrevious=previous;
        window.renderHome=wrapped;
      }
    }catch(_){}
  }

  function installExposurePresentation() {
    try{
      if(typeof window.kindInfo==='function'&&!window.kindInfo.__rmExposureWrapped){
        const previous=window.kindInfo;
        const wrapped=function(event){
          if(isExposure(event)){
            const amount=event.exposure?.amount;
            return {kind:'SUBSTÂNCIA',className:'note',title:exposureLabel(event),meta:[amount,event.exposure?.note].filter(Boolean)};
          }
          return previous(event);
        };
        wrapped.__rmExposureWrapped=true;wrapped.__rmExposurePrevious=previous;
        window.kindInfo=wrapped;
      }
    }catch(_){}
  }

  function install() {
    installStyles();
    installExposureAction();
    installExposureIsolation();
    installExposurePresentation();
    installRegistryButton();
    installDetailButton();
    installUseHook();
    window.openMedicationInteractions = openInteractionCenter;
    window.openMedicationInteractionsFor = openInteractionsForMedication;
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

;(()=>{const V='1.2.0-beta.49';function stamp(){const a=document.getElementById('topVersion'),b=document.getElementById('versionLabel');if(a)a.textContent='v'+V;if(b)b.textContent=V}function bar(){const f=document.getElementById('form');if(!f||f.querySelector('.rm-restored-mood-bar'))return;const c=[...f.querySelectorAll('.rm-v28-detail-card')].find(x=>x.querySelector('small')?.textContent.trim()==='Humor');const n=Number(c?.querySelector('.rm-mini-mood')?.textContent);if(!c||!Number.isFinite(n))return;const p=Math.max(0,Math.min(10,n))*10;c.classList.add('rm-restored-mood-bar');c.innerHTML='<small>Avaliação do humor</small><div class="rm-restored-track"><span style="width:'+p+'%"></span><b style="left:'+p+'%">'+n+'</b></div><div class="rm-restored-caption"><span>0 · muito mal</span><span>5 · neutro</span><span>10 · muito bem</span></div>'}if(!document.getElementById('rm-restored-mood-style')){const s=document.createElement('style');s.id='rm-restored-mood-style';s.textContent=' .rm-v28-detail-grid:has(.rm-restored-mood-bar),.rm-restored-mood-bar,.rm-restored-track{overflow:visible!important}.rm-restored-mood-bar{position:relative;isolation:isolate;grid-column:1/-1!important;padding:14px!important;border-radius:18px!important;background:color-mix(in srgb,var(--rm-detail-tone,#7657ff) 10%,var(--surface))!important;border-color:color-mix(in srgb,var(--rm-detail-tone,#7657ff) 38%,var(--separator))!important}.rm-restored-track{position:relative;height:18px;margin-top:11px;border-radius:999px;background:color-mix(in srgb,var(--secondary) 20%,transparent)} .rm-restored-track span{position:relative;z-index:1;display:block;height:100%;border-radius:inherit;background:var(--rm-detail-tone,#7657ff);box-shadow:0 0 18px 5px color-mix(in srgb,var(--rm-detail-tone,#7657ff) 58%,transparent);filter:drop-shadow(0 0 10px color-mix(in srgb,var(--rm-detail-tone,#7657ff) 82%,transparent))}.rm-restored-track b{position:absolute;top:50%;width:34px;height:34px;display:grid;place-items:center;border-radius:50%;transform:translate(-50%,-50%);font-size:13px;color:#fff;background:var(--rm-detail-tone,#7657ff);box-shadow:0 0 19px color-mix(in srgb,var(--rm-detail-tone,#7657ff) 90%,transparent)}.rm-restored-caption{display:flex;justify-content:space-between;margin-top:10px;color:var(--secondary);font-size:10px;font-weight:650}';document.head.appendChild(s)}new MutationObserver(()=>{bar();stamp()}).observe(document.documentElement,{childList:true,subtree:true});[0,400,1200,3000,5000].forEach(x=>setTimeout(stamp,x));bar()})();