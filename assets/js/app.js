/* ===== helpers ===== */
const $  = (s, r=document)=> r.querySelector(s);
const $$ = (s, r=document)=> Array.from(r.querySelectorAll(s));
const state = { lang:'en', dict:null };

/* ===== data loader ===== */
async function loadDict(){
  if(state.dict) return state.dict;
  const res = await fetch('assets/data/content.json', {cache:'no-store'});
  state.dict = await res.json();
  return state.dict;
}

/* ===== i18n apply ===== */
function applyLang(lang){
  state.lang = lang;
  $$('.pill').forEach(p=> p.classList.toggle('is-active', p.dataset.lang===lang));
  const I = state.dict.i18n?.[lang] || {};

  // nav
  Object.entries(I.nav||{}).forEach(([k,v])=>{
    $$(`[data-t="nav.${k}"]`).forEach(n=> n.textContent=v);
  });

  // hero copy & buttons
  $('[data-t="home.headline"]').textContent = I.home?.headline || '';
  $('[data-t="home.lede"]').textContent     = I.home?.lede || '';
  $('[data-t-html="home.cta_html"]').innerHTML = I.home?.cta_html || '';
  $$('[data-t="buttons.openPoster"]').forEach(b=> b.textContent = I.buttons?.openPoster || 'Open Program Poster');
  $$('[data-t="buttons.downloadPoster"]').forEach(b=> b.textContent = I.buttons?.downloadPoster || 'Download Poster');

  // mascot bubbles
  $('.js-bubble-yui').textContent = I.bubbles?.yui || 'Hi! Check the Program →';
  $('.js-bubble-jas').textContent = I.bubbles?.jas || 'Welcome! See Vendors →';

  // history title
  if (I.history?.title) $('#history h2').textContent = I.history.title;
}

/* ===== program (2025優先) ===== */
function renderProgram(){
  const d = state.dict;
  const list = $('.js-program'); if(!list) return;

  const i18nProg = d.i18n?.[state.lang]?.program || [];
  const data = (Array.isArray(d.program_2025) && d.program_2025.length) ? d.program_2025
             : (i18nProg.length ? i18nProg : (d.program || []));

  list.innerHTML = data.map(p=> `
    <li>
      <strong>${p.time||''}</strong>
      <div>${p.title||''}${p.desc?` <span class="m">${p.desc}</span>`:''}</div>
    </li>
  `).join('');
}

/* ===== history text-first ===== */
function renderHistory(){
  const d = state.dict;
  const tl = $('.js-history-text');
  const imgs = $('.js-history-img');
  if (tl){
    const rows = d.history_entries || [];
    tl.innerHTML = rows.map(r=> `
      <li>
        <div class="year">${r.year}</div>
        <div class="box">
          <div class="head">${r.headline||''}</div>
          <div class="text">${r.text||''}</div>
        </div>
      </li>
    `).join('');
  }
  if (imgs){
    const ps = d.history_panels || [];
    imgs.innerHTML = ps.map(p=> `<img src="${p.src}" alt="${p.alt||''}" loading="lazy" />`).join('');
  }
}

/* ===== maps & vendors ===== */
function renderMapsVendors(){
  const d = state.dict;
  const maps = $('.js-maps'); if (maps) {
    maps.innerHTML = (d.maps||[]).map(m=> `
      <figure class="card">
        <img src="${m.src}" alt="${m.title||''}" loading="lazy" />
        <figcaption style="opacity:.85">${m.title||''}</figcaption>
      </figure>
    `).join('');
  }

  const vwrap = $('.js-vendors'); if (vwrap) {
    vwrap.innerHTML = (d.vendors||[]).map(v=> `
      <div class="vendor">
        <img class="logo" src="${v.logo}" alt="${v.name}" />
        <div><strong>${v.name}</strong></div>
        <div class="meta">${v.items||''}</div>
        <div class="links">
          ${v.instagram?`<a target="_blank" rel="noopener" href="${v.instagram}">Instagram</a>`:''}
          ${v.url?` · <a target="_blank" rel="noopener" href="${v.url}">Website</a>`:''}
        </div>
      </div>
    `).join('');
  }
}

/* ===== language switch ===== */
function initLangSwitch(){
  $$('.pill').forEach(p=> p.addEventListener('click', async ()=>{
    await loadDict(); applyLang(p.dataset.lang);
    renderProgram(); renderHistory(); renderMapsVendors();
    const u=new URL(location.href); u.searchParams.set('lang', p.dataset.lang);
    history.replaceState(null,'',u);
  }));
  const q = new URL(location.href).searchParams.get('lang');
  const prefer = q || (navigator.language||'en').slice(0,2);
  state.lang = ['ja','en','es'].includes(prefer)? prefer : 'en';
}

/* ===== peek mascots: “常時は出ない／5秒おきに交互で時々だけ出る” =====
   仕様:
   - 最初は非表示
   - 5秒ごとに Yui/Jasmine を交互に「抽選表示」(表示確率 60%)
   - ヒーロー(ポスター)が画面内に見えている間は表示しない（被り防止）
   - 表示されたら 3.5秒後に自動でフェードアウト
*/
function initPeekOccasional(){
  const y = $('#peek-yui'), j = $('#peek-jasmine'), hero = $('#home');
  if(!y || !j || !hero) return;

  let showYuiNext = true;  // 交互
  const SHOW_MS = 3500;    // 表示時間
  const TICK_MS = 5000;    // 抽選間隔
  const PROB    = 0.6;     // 出る確率（時々：60%）

  function inView(el){
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.9 && r.bottom > window.innerHeight * 0.1;
  }
  function hideAll(){ y.classList.remove('show'); j.classList.remove('show'); }
  function showOnce(el){
    el.classList.add('show');
    setTimeout(()=> el.classList.remove('show'), SHOW_MS);
  }

  // 閉じるボタン → その回は即終了
  $$('.peek .close').forEach(b=> b.addEventListener('click', e=>{
    e.stopPropagation();
    b.closest('.peek').classList.remove('show');
  }));

  // 5秒ごとに抽選実行
  setInterval(()=>{
    // ポスターが見えている間は出さない
    if (inView(hero)) { hideAll(); return; }

    // 交互ターンで確率表示
    const target = showYuiNext ? y : j;
    showYuiNext = !showYuiNext;

    // すでに表示中ならスキップ
    if (target.classList.contains('show')) return;

    if (Math.random() < PROB){
      // 相手が出てたら消してから出す
      hideAll();
      showOnce(target);
    }
  }, TICK_MS);

  // スクロール中は一旦隠す（視界の邪魔をしない）
  let st=null, lastY=window.scrollY;
  addEventListener('scroll', ()=>{
    const dy = Math.abs(window.scrollY - lastY); lastY = window.scrollY;
    if (dy > 10) hideAll();
    clearTimeout(st);
    st = setTimeout(()=>{/* no-op, 次の抽選に任せる */}, 180);
  }, {passive:true});
}

/* ===== boot ===== */
async function boot(){
  initLangSwitch();
  await loadDict();

  // assets
  if (state.dict.top_hero) {
    const img = document.querySelector('.poster-img');
    if (img) img.src = state.dict.top_hero;
  }
  if (state.dict.program_poster) {
    const a1 = document.querySelector('[data-t="buttons.openPoster"]');
    const a2 = document.querySelector('[data-t="buttons.downloadPoster"]');
    if (a1) a1.href = state.dict.program_poster;
    if (a2) a2.href = state.dict.program_poster;
  }

  applyLang(state.lang);
  renderProgram();
  renderHistory();
  renderMapsVendors();
  initPeekOccasional();
}
document.addEventListener('DOMContentLoaded', boot);
