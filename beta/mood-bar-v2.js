/* Registro Mental — barra emocional 0–10 da versão Oficial.
   Módulo aditivo: preserva moodScore e apenas normaliza valores válidos. */
(() => {
  'use strict';
  if (window.__RM_MOOD_BAR_V2_STARTED) return;
  window.__RM_MOOD_BAR_V2_STARTED = true;

  const RELEASE = '1.2.0-beta.51';
  const COLORS = {0:'#2A223A',1:'#FF4B4B',2:'#FF7A1A',3:'#FF9F0A',4:'#FFD60A',5:'#FFE119',6:'#BEEA2E',7:'#57D65A',8:'#31C46C',9:'#20D6A3',10:'#39E6D4'};
  let decorateTimer = 0, observer = null, eventMap = new Map(), eventMapAt = 0;
  const valid = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
  const clamp = value => Math.max(0, Math.min(10, Math.round(Number(value) || 0)));
  const colorFor = value => COLORS[clamp(value)];

  function paintRelease() {
    window.REGISTRO_MOOD_UI_RELEASE = RELEASE;
  }

  function installStyles() {
    if (document.getElementById('rm-mood-v2-style')) return;
    const style = document.createElement('style');
    style.id = 'rm-mood-v2-style';
    style.textContent = `
      .rm-mood-v2{padding:3px 0 2px}.rm-mood-v2-row{display:grid;grid-template-columns:40px minmax(0,1fr);gap:8px;align-items:center;margin:8px 0 6px}
      .rm-mood-v2-zero,.rm-mood-v2-track button{appearance:none;border:0;cursor:pointer;-webkit-tap-highlight-color:transparent;font:800 12px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}
      .rm-mood-v2-zero{width:40px;height:40px;border-radius:50%;background:color-mix(in srgb,var(--surface,#fff) 90%,transparent);color:var(--secondary,#6e6e73);border:1px solid var(--separator,rgba(60,60,67,.14));box-shadow:0 8px 22px rgba(0,0,0,.08);transition:transform .18s ease,background .18s ease,color .18s ease,box-shadow .18s ease,filter .18s ease}
      .rm-mood-v2,.rm-mood-v2-row,.rm-mood-v2-shell{overflow:visible!important;clip-path:none!important}.rm-mood-v2-shell{position:relative;height:40px;--rm-mood-v2-color:#57D65A;--rm-mood-v2-progress:0%;--rm-mood-v2-glow-opacity:0}
      /* Keep the glow outside the clipped fill. A shadow with physical paint bounds avoids WebKit's stale/clipped filtered layer. */
      .rm-mood-v2-glow{position:absolute;z-index:0;inset:0 auto 0 0;width:var(--rm-mood-v2-progress);border-radius:999px;background:var(--rm-mood-v2-color);box-shadow:0 0 9px 3px var(--rm-mood-v2-color);opacity:0;pointer-events:none;transition:width .26s cubic-bezier(.2,.8,.2,1),opacity .18s ease}
      html[data-visual-mode="ultra"] .rm-mood-v2-glow{opacity:var(--rm-mood-v2-glow-opacity)}
      .rm-mood-v2-track{position:absolute;z-index:1;inset:0;border-radius:999px;background:color-mix(in srgb,var(--surface,#fff) 90%,transparent);border:1px solid rgba(120,120,128,.20);overflow:hidden;box-shadow:0 8px 22px rgba(0,0,0,.08);backdrop-filter:blur(24px) saturate(145%);-webkit-backdrop-filter:blur(24px) saturate(145%)}
      .rm-mood-v2-fill{position:absolute;z-index:1;inset:0 auto 0 0;width:var(--rm-mood-v2-progress);border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,0) 45%),var(--rm-mood-v2-color);transition:width .26s cubic-bezier(.2,.8,.2,1)}
      .rm-mood-v2-grid{position:relative;z-index:2;display:grid;grid-template-columns:repeat(10,minmax(0,1fr));height:100%}.rm-mood-v2-track button{min-width:0;padding:0;background:transparent;color:var(--secondary,#6e6e73);transition:color .16s ease,transform .16s ease,text-shadow .16s ease}.rm-mood-v2-track button.filled{color:rgba(255,255,255,.94)}.rm-mood-v2-track button.selected{color:#fff;transform:scale(1.08);text-shadow:0 1px 3px rgba(0,0,0,.25)}
      .rm-mood-v2-zero.selected{background:linear-gradient(180deg,rgba(255,255,255,.13),transparent 48%),var(--rm-mood-v2-color);color:#fff;transform:scale(1.05);box-shadow:0 0 0 2px color-mix(in srgb,var(--rm-mood-v2-color) 28%,transparent),0 8px 22px rgba(0,0,0,.08)}html[data-visual-mode="ultra"] .rm-mood-v2-zero.selected{filter:drop-shadow(0 0 9px var(--rm-mood-v2-color)) drop-shadow(0 0 18px color-mix(in srgb,var(--rm-mood-v2-color) 60%,transparent))}
      html[data-visual-mode="optimized"] .rm-mood-v2-track{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:0 2px 8px rgba(0,0,0,.06)}html[data-visual-mode="optimized"] .rm-mood-v2-zero{box-shadow:0 2px 8px rgba(0,0,0,.06)}
      .rm-mood-v2-caption{display:flex;justify-content:space-between;gap:10px;color:var(--secondary,#6e6e73);font-size:10px;line-height:1.25;opacity:.68}.rm-mood-v2-caption span:last-child{text-align:right}.rm-mood-v2 .tiny-clear{margin-top:4px}
      .timeline-kind.kind-note{display:inline-flex!important;vertical-align:middle}.rm-record-mood-v2{--rm-card-mood:#57D65A;display:inline-flex;align-items:center;gap:4px;margin-left:7px;vertical-align:middle;line-height:1;transform:translateY(-1px)}.rm-record-mood-v2-bar{position:relative;display:inline-block;width:var(--rm-card-mood-width,60px);height:13px;min-width:13px;max-width:112px;border-radius:999px;background:var(--rm-card-mood);box-shadow:0 1px 0 rgba(255,255,255,.24) inset;overflow:hidden}.rm-record-mood-v2-bar::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.20),transparent 55%);pointer-events:none}.rm-record-mood-v2-inside{position:absolute;z-index:2;inset:0;display:grid;place-items:center;color:rgba(0,0,0,.48);font-size:9px;font-weight:680;line-height:1;font-variant-numeric:tabular-nums}.rm-record-mood-v2-outside{color:var(--secondary,#6e6e73);font-size:10px;font-weight:650;line-height:1;opacity:.82;min-width:9px;text-align:center;font-variant-numeric:tabular-nums}html[data-visual-mode="ultra"] .rm-record-mood-v2-bar{box-shadow:0 0 9px color-mix(in srgb,var(--rm-card-mood) 55%,transparent),0 1px 0 rgba(255,255,255,.25) inset}html[data-visual-mode="optimized"] .rm-record-mood-v2-bar{box-shadow:0 1px 0 rgba(255,255,255,.20) inset!important}
      @media(max-width:430px){.rm-mood-v2-row{grid-template-columns:36px minmax(0,1fr);gap:6px}.rm-mood-v2-zero{width:36px;height:36px}.rm-mood-v2-shell{height:36px}.rm-mood-v2-zero,.rm-mood-v2-track button{font-size:11px}}@media(max-width:350px){.rm-mood-v2-row{grid-template-columns:32px minmax(0,1fr);gap:5px}.rm-mood-v2-zero{width:32px;height:32px}.rm-mood-v2-shell{height:32px}.rm-mood-v2-zero,.rm-mood-v2-track button{font-size:10px}}@media(prefers-reduced-motion:reduce){.rm-mood-v2-zero,.rm-mood-v2-fill,.rm-mood-v2-glow,.rm-mood-v2-track button{transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  function selectorHTML(value=null) {
    const score=valid(value)?clamp(value):null, color=score===null?COLORS[7]:colorFor(score), progress=score&&score>0?score*10:0;
    const buttons=Array.from({length:10},(_,i)=>{const n=i+1,selected=score===n,filled=score!==null&&score>0&&n<=score;return `<button type="button" data-mood-score="${n}" class="${selected?'selected ':''}${filled?'filled':''}" aria-pressed="${selected}">${n}</button>`}).join('');
    return `<div class="mood-block rm-mood-v2"><div class="rm-mood-v2-row" role="group" aria-label="Estado emocional de zero a dez"><button type="button" class="rm-mood-v2-zero${score===0?' selected':''}" data-mood-score="0" aria-pressed="${score===0}" aria-label="Humor zero, estado excepcionalmente ruim" style="--rm-mood-v2-color:${color}">0</button><div class="rm-mood-v2-shell" style="--rm-mood-v2-color:${color};--rm-mood-v2-progress:${progress}%;--rm-mood-v2-glow-opacity:${progress?'.42':'0'}"><div class="rm-mood-v2-glow" aria-hidden="true"></div><div class="rm-mood-v2-track"><div class="rm-mood-v2-fill" aria-hidden="true"></div><div class="rm-mood-v2-grid">${buttons}</div></div></div></div><div class="rm-mood-v2-caption"><span>0 · excepcionalmente ruim</span><span>1–10 · escala comum</span></div><button type="button" class="tiny-clear" id="clearMoodScore">Limpar nota</button></div>`;
  }

  function selectMood(value) {
    const score=valid(value)?clamp(value):null, color=score===null?COLORS[7]:colorFor(score), progress=score&&score>0?score*10:0;
    document.querySelectorAll('.rm-mood-v2').forEach(block=>{
      const shell=block.querySelector('.rm-mood-v2-shell'),zero=block.querySelector('.rm-mood-v2-zero');
      if(shell){shell.style.setProperty('--rm-mood-v2-color',color);shell.style.setProperty('--rm-mood-v2-progress',`${progress}%`);shell.style.setProperty('--rm-mood-v2-glow-opacity',progress?'.42':'0')}
      if(zero)zero.style.setProperty('--rm-mood-v2-color',color);
      block.querySelectorAll('[data-mood-score]').forEach(button=>{const n=Number(button.dataset.moodScore),selected=score!==null&&n===score;button.classList.toggle('selected',selected);button.classList.toggle('filled',score!==null&&score>0&&n>0&&n<=score);button.setAttribute('aria-pressed',String(selected))});
    });
    try{navigator.vibrate?.(10)}catch(_){ }
  }

  function scoreForRecord(event){if(!event||!valid(event.moodScore))return null;if(valid(event.moodScoreLegacy10))return clamp(event.moodScoreLegacy10);return clamp(event.moodScore)}
  function indicatorNode(score){const color=colorFor(score),outside=score<=3,wrap=document.createElement('span');wrap.className='rm-record-mood-v2';wrap.dataset.rmMood=String(score);wrap.style.setProperty('--rm-card-mood',color);wrap.style.setProperty('--rm-card-mood-width',`${score===0?13:Math.round((12+score*9.4)*10)/10}px`);wrap.setAttribute('role','img');wrap.setAttribute('aria-label',`Humor ${score} de 10`);wrap.innerHTML=`<span class="rm-record-mood-v2-bar">${outside?'':`<span class="rm-record-mood-v2-inside" aria-hidden="true">${score}</span>`}</span>${outside?`<span class="rm-record-mood-v2-outside" aria-hidden="true">${score}</span>`:''}`;return wrap}
  async function refreshEventMap(force=false){const now=Date.now();if(!force&&eventMap.size&&now-eventMapAt<1200)return eventMap;if(typeof window.allEvents!=='function')return eventMap;try{const events=await window.allEvents();eventMap=new Map((Array.isArray(events)?events:[]).map(event=>[String(event.id),event]));eventMapAt=now}catch(_){}return eventMap}
  async function decorateCards(root=document){const map=await refreshEventMap();root.querySelectorAll?.('.timeline-item').forEach(card=>{const id=card.querySelector('[data-menu]')?.dataset.menu||card.dataset.id||'',event=map.get(String(id)),score=scoreForRecord(event),existing=card.querySelector('.rm-record-mood-v2');if(event?.type!=='note'||score===null){existing?.remove();return}if(existing?.dataset.rmMood===String(score))return;existing?.remove();const kind=card.querySelector('.timeline-kind.kind-note,.timeline-kind');if(kind)kind.insertAdjacentElement('afterend',indicatorNode(score))})}
  function scheduleDecorate(forceMap=false){clearTimeout(decorateTimer);decorateTimer=setTimeout(async()=>{if(forceMap)await refreshEventMap(true);await decorateCards(document)},70)}
  function wrapPutEvent(){const current=window.putEvent;if(typeof current!=='function'||current.__rmMoodBarV2)return;const wrapped=async function(record){let next=record;if(record?.type==='note'&&valid(record.moodScore))next={...record,moodScore:clamp(record.moodScore),moodScaleModel:'0-10'};const result=await current.call(this,next);eventMapAt=0;scheduleDecorate(true);return result};wrapped.__rmMoodBarV2=true;wrapped.__rmMoodBarV2Base=current;window.putEvent=wrapped}
  function installOverrides(){if(typeof window.emotionMoodSelectorHTML!=='function'||typeof window.emotionSelectMood!=='function')return false;window.emotionMoodSelectorHTML=selectorHTML;window.emotionSelectMood=selectMood;wrapPutEvent();return true}
  function installObserver(){if(observer)return;observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes?.length))scheduleDecorate(false)});observer.observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('click',event=>{if(event.target.closest('[data-mood-score],.tab-item,[data-go],[data-filter],.item-menu'))scheduleDecorate(false)},{passive:true})}
  function boot(){installStyles();paintRelease();installObserver();let attempts=0;const timer=setInterval(()=>{attempts+=1;if(installOverrides()){clearInterval(timer);scheduleDecorate(true);[250,900,2200].forEach(ms=>setTimeout(()=>{wrapPutEvent();scheduleDecorate(true)},ms));window.REGISTRO_MOOD_BAR_V2_READY=true;window.dispatchEvent(new CustomEvent('registro:mood-bar-ready',{detail:{release:RELEASE,scale:'0-10'}}))}else if(attempts>120){clearInterval(timer);console.warn('Registro Mental: barra emocional 0–10 não encontrou os controles base; app mantido sem bloqueio.')}},100)}
  try{boot()}catch(error){console.warn('Registro Mental: barra emocional 0–10 não bloqueante',error)}
})();
