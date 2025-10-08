/* ===== tiny helpers ===== */
const $  = (s, r=document)=> r.querySelector(s);
const $$ = (s, r=document)=> Array.from(r.querySelectorAll(s));
const state = { lang: 'en', dict: null };

async function loadDict(){
  if(state.dict) return state.dict;
  const res = await fetch('assets/data/content.json', {cache:'no-store'});
  state.dict = await res.json();
  return state.dict;
}

function applyLang(lang){
  state.lang = lang;
  $$('.pill').forEach(p=> p.classList.toggle('is-active', p.dataset.lang===lang));
  const i18n = state.dict.i18n?.[lang];
  if(!i18n) return;

  // nav
  Object.entries(i18n.nav||{}).forEach(([k,v])=>{
    $$(`[data-t="nav.${k}"]`).forEach(n=> n.textContent=v);
  });
  // home copy
  const H = i18n.home || {};
  $('[data-t="home.headline"]').textContent = H.headline || '';
  $('[data-t="home.lede"]').textContent = H.lede || '';
  $('[data-t-html="home.cta_html"]').innerHTML = H.cta_html || '';

  // buttons
  const B = i18n.buttons || {};
  $$('[data-t="buttons.openPoster"]').forEach(b=> b.textContent = B.openPoster || 'Open Program Poster');
  $$('[data-t="buttons.downloadPoster"]').forEach(b=> b.textContent = B.downloadPoster || 'Download Poster');

  // program list
  const list = $('.js-program'); list.innerHTML = '';
  const base = state.dict.program || [];
  const localized = (i18n.program && i18n.program.length)? i18n.program : base;
  (localized||[]).forEach(row=>{
    const li = document.createElement('li');
    li.innerHTML = `<strong>${row.time}</strong> — ${row.title}${row.desc?` <span class="m">${row.desc}</span>`:''}`;
    list.appendChild(li);
  });

  // maps
  const maps = $('.js-maps'); maps.innerHTML='';
  (state.dict.maps||[]).forEach(m=>{
    const fig=document.createElement('figure'); fig.className='card';
    fig.innerHTML = `<img src="${m.src}" alt="${m.title}"><figcaption>${(i18n.maps||[])[(state.dict.maps||[]).indexOf(m)]||m.title}</figcaption>`;
    maps.appendChild(fig);
  });

  // history
  const hg = $('.js-history'); hg.innerHTML='';
  (state.dict.history_panels||[]).forEach(p=>{
    const img = document.createElement('img'); img.src=p.src; img.alt=p.alt||'';
    hg.appendChild(img);
  });

  // vendors
  const vwrap = $('.js-vendors'); vwrap.innerHTML='';
  (state.dict.vendors||[]).forEach(v=>{
    const el = document.createElement('div'); el.className='vendor';
    el.innerHTML = `
      <img class="logo" src="${v.logo}" alt="${v.name}">
      <div><strong>${v.name}</strong></div>
      <div class="meta">${v.items||''}</div>
      <div class="links">
        ${v.instagram?`<a target="_blank" href="${v.instagram}">Instagram</a>`:''}
        ${v.url?` · <a target="_blank" href="${v.url}">Website</a>`:''}
      </div>`;
    vwrap.appendChild(el);
  });

  // mascot bubbles
  const BUB = i18n.bubbles || {};
  $('.js-bubble-yui').textContent = BUB.yui || 'Hi! Check the Program →';
  $('.js-bubble-jas').textContent = BUB.jas || BUB.jasmine || 'Welcome! See Vendors →';
}

function initLangSwitch(){
  $$('.pill').forEach(p=> p.addEventListener('click', async ()=>{
    await loadDict(); applyLang(p.dataset.lang);
    history.replaceState(null,'',location.pathname+`?lang=${p.dataset.lang}`);
  }));
  // default from query or browser
  const url = new URL(location.href);
  const q = url.searchParams.get('lang');
  const prefer = q || (navigator.language||'en').slice(0,2);
  state.lang = ['ja','en','es'].includes(prefer)? prefer : 'en';
}

function initHeroFit(){
  // 何もしない：CSSが object-fit: contain で常に全体表示
  // 画像の全体が見えるように、ヘッダー高さを考慮してスクロールマージンを確保
  document.querySelectorAll('section').forEach(s=>{
    s.style.scrollMarginTop = '76px';
  });
}

function initPeek(){
  const y = $('#peek-yui'), j = $('#peek-jasmine');
  if(!y||!j) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show(){ y.classList.add('show'); j.classList.add('show'); }
  function hide(){ y.classList.remove('show'); j.classList.remove('show'); }

  // 少しスクロールしたら出す
  let timer=null, last=window.scrollY;
  function onScroll(){
    clearTimeout(timer);
    timer=setTimeout(()=>{
      const sc = window.scrollY;
      if(sc>140) show(); else hide();
      last=sc;
    }, 60);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('load', onScroll);

  // 閉じる
  $$('.peek .close').forEach(b=> b.addEventListener('click', ()=> b.closest('.peek').classList.remove('show') ));

  if(reduce){ y.style.transition='none'; j.style.transition='none'; }
}

async function boot(){
  initLangSwitch();
  await loadDict();
  applyLang(state.lang);
  initHeroFit();
  initPeek();
}
document.addEventListener('DOMContentLoaded', boot);
