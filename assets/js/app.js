/* Japan Day app – mobile-first / safe vM1 */
(function(){
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>[...r.querySelectorAll(s)];

  /* ===== 0. JSON ロード（必須ではない/無くても落ちない） ===== */
  async function loadData(){
    try{
      const res = await fetch('assets/data/content.json', {cache:'no-store'});
      if(!res.ok) throw new Error(res.status);
      const data = await res.json();
      window.__DATA = data;  // 他のIIFEからも参照可
    }catch(e){
      console.warn('[data] fallback (no JSON)', e);
      window.__DATA = window.__DATA || {}; // 最低限
    }
  }

  /* ===== 1. 画面レンダリング（データがあれば差し替え） ===== */
  function renderFromData(){
    const D = window.__DATA || {};

    // Home
    if (D.home){
      if ($('#home-headline') && D.home.headline) $('#home-headline').textContent = D.home.headline;
      if ($('#home-lede')     && D.home.lede)     $('#home-lede').textContent     = D.home.lede;
      if ($('#home-cta')      && D.home.cta_html) $('#home-cta').innerHTML        = D.home.cta_html;
    }

    // Program list
    const list = $('#program-list');
    if (list && Array.isArray(D.program)){
      list.innerHTML = D.program.map(p=>`
        <div class="card">
          <div class="time">${p.time||''}</div>
          <div><strong>${p.title||''}</strong><div class="desc">${p.desc||''}</div></div>
        </div>
      `).join('');
    }

    // Poster override
    if (D.program_poster){
      const open = $('#open-program-poster');
      const dl   = $('#download-program-poster');
      if (open) open.href = D.program_poster;
      if (dl)   dl.href   = D.program_poster;
    }
    if (D.top_hero){
      const hero = $('.poster-img');
      if (hero) hero.style.backgroundImage = `url("${D.top_hero}")`;
    }

    // History
    const hp = $('#history-panels');
    if (hp && Array.isArray(D.history_panels)){
      hp.innerHTML = D.history_panels.map(it=>`
        <figure class="panel">
          <img src="${it.src}" alt="${it.alt||''}">
        </figure>
      `).join('');
      // クリックでLightbox
      hp.addEventListener('click', e=>{
        const img = e.target.closest('img'); if(!img) return;
        openLightbox(img.src, img.alt||'');
      });
    }

    // Maps
    const tabs = $('#map-tabs'); const img = $('#map-image');
    if (tabs && img && Array.isArray(D.maps) && D.maps.length){
      tabs.innerHTML = D.maps.map((m,i)=>`<button class="tab ${i===0?'active':''}">${m.title||('Map '+(i+1))}</button>`).join('');
      img.src = D.maps[0].src;
      tabs.addEventListener('click', e=>{
        const b = e.target.closest('.tab'); if(!b) return;
        const idx = [...tabs.children].indexOf(b);
        $$('.tab', tabs).forEach(x=>x.classList.remove('active'));
        b.classList.add('active'); img.src = D.maps[idx].src;
      });
    }else{
      // 既定ボタン（index.htmlのデフォルト4タブ）に画像紐付け
      const fallback = [
        'assets/img/map-inside.jpg',
        'assets/img/map-outside.jpg',
        'assets/img/map-topfloor.jpg',
        'assets/img/booths-list.jpg'
      ];
      $('#map-tabs')?.addEventListener('click', e=>{
        const b=e.target.closest('.tab'); if(!b) return;
        const idx=[...$('#map-tabs').children].indexOf(b);
        $$('#map-tabs .tab').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        $('#map-image').src = fallback[idx] || fallback[0];
      });
    }

    // Vendors
    const vc = $('#vendor-cards');
    if (vc && Array.isArray(D.vendors)){
      vc.innerHTML = D.vendors.map(v=>`
        <article class="vendor-card">
          <div class="logo"><img src="${v.logo||'assets/img/vendor-placeholder.png'}" alt=""></div>
          <div>
            <h3>${v.name||''}</h3>
            <div class="v-links">
              ${v.instagram?`<a href="${v.instagram}" target="_blank" rel="noopener">Instagram</a>`:''}
              ${v.url?`<a href="${v.url}" target="_blank" rel="noopener">Website</a>`:''}
            </div>
            <div class="desc">${v.items||''}</div>
          </div>
        </article>
      `).join('');
    }
  }

  /* ===== 2. 多言語（安全版） ===== */
  function i18nInit(){
    const D = window.__DATA || {};
    const I = D.i18n || null;
    const state = { lang: localStorage.getItem('lang') || 'en' };

    function t(pathArr, fb){
      if(!I || !I[state.lang]) return fb;
      try{ return pathArr.reduce((o,k)=>o?.[k], I[state.lang]) ?? fb; }catch{ return fb; }
    }

    function apply(){
      // nav & titles
      const navMap = t(['nav'], null);
      if (navMap){
        const map = [['#title-program','program'],['#title-characters','characters'],['#title-history','history'],['#title-maps','maps'],['#title-vendors','vendors'],['#title-contact','contact']];
        map.forEach(([sel,key])=>{ const el=$(sel); if(el && navMap[key]) el.textContent=navMap[key]; });
        const order=['home','program','characters','history','maps','vendors','contact'];
        $$('#nav-list a').forEach((a,i)=>{ const k=order[i]; if(navMap[k]) a.textContent=navMap[k]; });
      }
      // home
      const head=t(['home','headline'],null), lede=t(['home','lede'],null), cta=t(['home','cta_html'],null);
      if($('#home-headline') && head) $('#home-headline').textContent=head;
      if($('#home-lede') && lede) $('#home-lede').textContent=lede;
      if($('#home-cta') && cta) $('#home-cta').innerHTML=cta;
      // buttons
      const btns=t(['buttons'],null);
      if(btns){
        if($('#open-program-poster') && btns.openPoster) $('#open-program-poster').textContent=btns.openPoster;
        if($('#download-program-poster') && btns.downloadPoster) $('#download-program-poster').textContent=btns.downloadPoster;
      }
      // maps
      const ml=t(['maps'],null);
      if(ml && $('#map-tabs')) $$('#map-tabs .tab').forEach((b,i)=>{ if(ml[i]) b.textContent=ml[i]; });
      // bubbles
      const bub=t(['bubbles'],null);
      if(bub){
        const y=$('#peek-yui .bubble p'), j=$('#peek-jasmine .bubble p');
        if(y && bub.yui) y.textContent=bub.yui; if(j && bub.jas) j.textContent=bub.jas;
      }
      // program per language
      const prog=t(['program'],null);
      if(Array.isArray(prog) && $('#program-list')){
        $('#program-list').innerHTML = prog.map(p=>`
          <div class="card"><div class="time">${p.time||''}</div><div><strong>${p.title||''}</strong><div class="desc">${p.desc||''}</div></div></div>
        `).join('');
      }
      // active
      $$('.lang-switch button').forEach(b=> b.classList.toggle('active', b.dataset.lang===state.lang));
      localStorage.setItem('lang', state.lang);
    }

    document.addEventListener('click', (e)=>{
      const btn = e.target.closest('.lang-switch button'); if(!btn) return;
      const lang = btn.dataset.lang; if(!lang) return;
      if(lang!==localStorage.getItem('lang')){ localStorage.setItem('lang', lang); state.lang=lang; apply(); }
    });

    try{ apply(); }catch(e){ console.warn('[i18n] skipped', e); }
  }

  /* ===== 3. ひょこっとマスコット（右=Yui / 左=Jasmine） ===== */
  function mascots(){
    const y = $('#peek-yui'), j = $('#peek-jasmine');
    if(!y || !j) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    function show(el){ el.classList.add('show','float'); }
    function hide(el){ el.classList.remove('show'); }

    // 初回登場
    setTimeout(()=>show(j), 900);
    setTimeout(()=>show(y), 1400);

    // スクロールで一旦隠し→下で再表示
    let lastY=0;
    addEventListener('scroll', ()=>{
      const dy = Math.abs(scrollY-lastY);
      if(dy>20){ hide(j); hide(y); }
      lastY=scrollY;
      if(scrollY>400){ show(j); show(y); }
    }, {passive:true});

    // 閉じる
    $$('.peek .close').forEach(b=> b.addEventListener('click', e=> hide(b.closest('.peek')) ));

    if(reduce){
      y.classList.remove('float'); j.classList.remove('float');
    }
  }

  /* ===== 4. 桜（軽量） ===== */
  function sakura(){
    const c = $('#petals'); if(!c) return;
    const ctx = c.getContext('2d', {alpha:true});
    let W=innerWidth,H=innerHeight, petals=[];
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    function reset(){ W=innerWidth; H=innerHeight; c.width=W; c.height=H; }
    function spawn(){
      const n = Math.max(8, Math.floor(W/180));
      petals = new Array(n).fill(0).map(()=>({
        x: Math.random()*W,
        y: Math.random()*H,
        r: 3+Math.random()*2.5,
        vx: -0.3 + Math.random()*0.6,
        vy: 0.4 + Math.random()*0.8,
        rot: Math.random()*Math.PI*2,
        vr: -0.02 + Math.random()*0.04
      }));
    }
    function step(){
      ctx.clearRect(0,0,W,H);
      for(const p of petals){
        p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr;
        if(p.y>H+10) { p.y=-10; p.x=Math.random()*W; }
        if(p.x<-10)  p.x=W+10;
        if(p.x>W+10) p.x=-10;
        ctx.save();
        ctx.translate(p.x,p.y); ctx.rotate(p.rot);
        ctx.fillStyle='rgba(233,30,99,.12)'; ctx.beginPath();
        ctx.ellipse(0,0,p.r*1.2,p.r,.4,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
      !reduce && requestAnimationFrame(step);
    }
    reset(); spawn(); step(); addEventListener('resize', ()=>{ reset(); spawn(); });
  }

  /* ===== 5. 画像ライトボックス ===== */
  function lightbox(){
    const lb = $('#lightbox'); if(!lb) return;
    const img = $('#lightbox img'), closeBtn = $('#lightbox .close');
    function open(src,alt){ img.src=src; img.alt=alt||''; lb.classList.add('open'); }
    function close(){ lb.classList.remove('open'); img.src=''; }
    window.openLightbox=open;
    closeBtn.addEventListener('click', close);
    lb.addEventListener('click', e=>{ if(e.target===lb) close(); });
    addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
  }

  /* ===== 6. スクロール表示演出 ===== */
  function reveal(){
    const io = new IntersectionObserver(es=>{
      es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, {threshold:.12});
    $$('.reveal').forEach(el=> io.observe(el));
  }

  /* ===== 7. Header 小さく ===== */
  function headerPolish(){
    const h = $('.site-header'); if(!h) return;
    addEventListener('scroll', ()=>{
      h.style.boxShadow = scrollY>8 ? '0 6px 18px rgba(0,0,0,.08)' : 'none';
      h.style.paddingTop = scrollY>8 ? '6px' : 'var(--pad-top)';
      h.style.paddingBottom = scrollY>8 ? '6px' : '8px';
    }, {passive:true});
  }

  /* ===== Boot ===== */
  (async function(){
    await loadData();
    renderFromData();
    i18nInit();
    sakura();
    mascots();
    lightbox();
    reveal();
    headerPolish();
    // 画像遅延
    $$('img:not(#lightbox img)').forEach(i=>{ if(!i.loading) i.loading='lazy'; });
  })();
})();
