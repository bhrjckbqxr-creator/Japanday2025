/* Japan Day 2025 - app.js v32
   - loads assets/data/content.json
   - full-screen poster + parallax
   - floating sakura background (canvas)
   - peek mascots (Yui & Jasmine)
   - sections: Program / Characters / History / Maps / Vendors / Contact
   - image lightbox
   - Party Mode (confetti)
*/
(async function () {
  // ---------- small helpers ----------
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

  // ---------- load JSON ----------
  let data;
  try {
    const res = await fetch('assets/data/content.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('content.json not found');
    data = await res.json();
  } catch (e) {
    console.error('[JSON] load error:', e);
    return;
  }

  // ---------- NAV ----------
  const sections = [
    {id:'home',label:'Home'},
    {id:'program',label:'Program'},
    {id:'characters',label:'Characters'},
    {id:'history',label:'History'},
    {id:'map',label:'Maps'},
    {id:'vendors',label:'Vendors'},
    {id:'contact',label:'Contact'}
  ];
  const nav = $('#nav-list');
  if (nav) nav.innerHTML = sections.map(s=>`<li><a href="#${s.id}">${s.label}</a></li>`).join('');

  // ---------- HOME ----------
  $('#home-headline') && ($('#home-headline').textContent = data.home?.headline || '');
  $('#home-lede')     && ($('#home-lede').textContent     = data.home?.lede || '');
  $('#home-cta')      && ($('#home-cta').innerHTML        = data.home?.cta_html || '');

  const em = $('#event-meta');
  if (em && data.event){
    em.innerHTML = `<strong>${data.event.title||''}</strong><br>${data.event.date||''}
      &nbsp; ${data.event.time||''}<br>${data.event.venue||''}`;
  }

  // ---------- POSTER + actions ----------
  const posterEl = $('.poster-img');
  if (posterEl) {
    // 画像は CSS 側で top-hero.jpg を参照。存在チェックだけしておく
    const testImg = new Image();
    testImg.src = getComputedStyle(posterEl).backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    testImg.onerror = ()=> console.warn('[poster] top-hero.jpg を確認してください');
  }

  // Program poster open / download
  if (data.program_poster){
    const openBtn = $('#open-program-poster');
    const dlBtn   = $('#download-program-poster');
    if (openBtn){
      openBtn.addEventListener('click',()=>{
        const lb = $('#lightbox'); const img = $('#lightbox img');
        img.src = data.program_poster; lb.classList.add('open');
      });
    }
    if (dlBtn){ dlBtn.href = data.program_poster; }
  }

  // ---------- PROGRAM ----------
  const prg = $('#program-list');
  if (prg){
    prg.innerHTML = (data.program||[]).map(p=>`
      <div class="card">
        <div class="time">${p.time||''}</div>
        <div><strong>${p.title||''}</strong><div class="desc">${p.desc||''}</div></div>
      </div>
    `).join('');
  }

  // ---------- CHARACTERS ----------
  const cg = $('#character-grid');
  if (cg){
    cg.innerHTML = (data.characters||[]).map(c=>`
      <div class="char-card">
        <img src="${c.image}" alt="${c.name}">
        <h3>${c.name||''}</h3>
      </div>
    `).join('');
  }

  // ---------- HISTORY (images only) ----------
  const hp = $('#history-panels');
  if (hp){
    hp.innerHTML = (data.history_panels||[]).map(p=>`
      <figure class="panel"><img src="${p.src}" alt="${p.alt||''}"></figure>
    `).join('');
  }
  const hg = $('#history-highlights');
  if (hg){
    hg.innerHTML = (data.history_highlights||[]).map(h=>`
      <div class="y-card"><span class="badge">${h.year||''}</span>
        <img src="${h.src}" alt="History ${h.year||''}">
      </div>
    `).join('');
  }

  // ---------- MAPS (tabs + image) ----------
  const tabs = $('#map-tabs');
  const mapBox = $('#map-images');
  function showMap(i){ if (!mapBox || !data.maps?.[i]) return;
    mapBox.innerHTML = `<img src="${data.maps[i].src}" alt="${data.maps[i].title}">`;
  }
  if (tabs){
    tabs.innerHTML = (data.maps||[]).map((m,i)=>`
      <button class="tab ${i===0?'active':''}" data-i="${i}">${m.title}</button>
    `).join('');
    showMap(0);
    tabs.addEventListener('click',e=>{
      const b=e.target.closest('.tab'); if(!b) return;
      $$('.tab',tabs).forEach(x=>x.classList.remove('active'));
      b.classList.add('active'); showMap(+b.dataset.i);
    });
  }

  // ---------- VENDORS ----------
  const vg = $('#vendor-cards');
  if (vg){
    vg.innerHTML = (data.vendors||[]).map(v=>`
      <article class="vendor-card">
        <div class="logo"><img src="${v.logo}" alt="${v.name} logo"></div>
        <div class="v-body">
          <h3>${v.name||''}</h3>
          <div class="v-links">
            ${v.instagram?`<a class="insta" href="${v.instagram}" target="_blank" rel="noopener">Instagram</a>`:''}
            ${v.site?`<a class="site" href="${v.site}" target="_blank" rel="noopener">Website</a>`:''}
          </div>
        </div>
      </article>
    `).join('');
  }

  // ---------- CONTACT ----------
  if (data.contact){
    const eml = $('#contact-email'); const wa = $('#contact-wa');
    if (eml){ eml.href=`mailto:${data.contact.email}`; eml.textContent=data.contact.email; }
    if (wa){ wa.href=data.contact.whatsapp; wa.textContent=data.contact.whatsapp_label||data.contact.whatsapp; }
  }

  // ---------- LIGHTBOX ----------
  const lb = $('#lightbox');
  if (lb){
    $('#lightbox .close').addEventListener('click',()=>lb.classList.remove('open'));
    lb.addEventListener('click',e=>{ if(e.target.id==='lightbox') lb.classList.remove('open'); });
    // 画像クリックで拡大
    document.addEventListener('click',e=>{
      const t = e.target;
      if (t.tagName==='IMG' && t.closest('.map-images, .history-panels, .history-grid')){
        $('#lightbox img').src = t.src; lb.classList.add('open');
      }
    });
  }

  // ---------- REVEAL on scroll ----------
  const io = new IntersectionObserver(es=>{
    es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target);} });
  },{threshold:.12});
  $$('.reveal').forEach(el=>io.observe(el));

  // ---------- PARALLAX poster ----------
  const poster = $('.poster-img');
  if (poster){
    window.addEventListener('scroll', ()=>{
      const y = Math.min(1, window.scrollY / window.innerHeight);
      poster.style.transform = `translateY(${y * -14}px) scale(${1 + y*0.02})`;
    }, {passive:true});
  }

  // ---------- SAKURA background (light) ----------
  const cvs = $('#bg-sakura'); const ctx = cvs?.getContext('2d');
  if (cvs && ctx){
    let W=innerWidth, H=innerHeight;
    const resize = ()=>{ W=cvs.width=innerWidth; H=cvs.height=innerHeight; };
    resize(); addEventListener('resize', resize);
    const N=70, S= ()=>Math.random()*0.6+0.3;
    const petals = Array.from({length:N},()=>({
      x:Math.random()*W, y:Math.random()*H, s:S(),
      vx:Math.random()*0.4-0.2, vy:Math.random()*0.7+0.2, rot:Math.random()*6
    }));
    (function loop(){
      ctx.clearRect(0,0,W,H);
      petals.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy; p.rot+=0.01+p.s*0.01;
        if(p.y>H+20){ p.y=-20; p.x=Math.random()*W; }
        if(p.x<-20) p.x=W+20; if(p.x>W+20) p.x=-20;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
        ctx.fillStyle='rgba(255,182,193,.75)';
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.bezierCurveTo(6*p.s,-8*p.s, 10*p.s,6*p.s, 0,10*p.s);
        ctx.bezierCurveTo(-10*p.s,6*p.s, -6*p.s,-8*p.s, 0,0);
        ctx.fill(); ctx.restore();
      });
      requestAnimationFrame(loop);
    })();

    // Confetti reuse same canvas (draw after sakura each frame)
    let confettiOn=false, confetti=[];
    const btn=$('#party-btn');
    function toggleConfetti(){
      confettiOn=!confettiOn;
      if(btn) btn.textContent = confettiOn ? '🛑 Stop Party' : '🎉 Party Mode';
      if(confettiOn){
        confetti = Array.from({length:120},()=>({
          x:Math.random()*W, y:Math.random()*-H,
          s:Math.random()*6+3, vy:Math.random()*2+1.5, vx:Math.random()*1-0.5,
          c:`hsl(${Math.random()*360},90%,60%)`, r:Math.random()*Math.PI
        }));
      }
    }
    btn && btn.addEventListener('click', toggleConfetti);

    (function conf(){
      if(confettiOn){
        confetti.forEach(p=>{
          p.y+=p.vy; p.x+=p.vx; p.r+=0.08;
          if(p.y>H+10){ p.y=-10; p.x=Math.random()*W; }
          ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r);
          ctx.fillStyle=p.c; ctx.fillRect(-p.s/2,-p.s/2,p.s,p.s*0.6);
          ctx.restore();
        });
      }
      requestAnimationFrame(conf);
    })();
  }

  // ---------- PEEK MASCOTS (natural) ----------
  const yui = $('#peek-yui'), jas = $('#peek-jasmine');

  function showPeek(el, ms=4200){
    if(!el) return;
    el.classList.add('show');
    const t=setTimeout(()=>el.classList.remove('show'), ms);
    const close = el.querySelector('.close');
    if(close){
      close.onclick = (e)=>{ e.stopPropagation(); el.classList.remove('show'); clearTimeout(t); };
    }
  }
  function cycle(){
    showPeek(yui, 4200);
    setTimeout(()=>showPeek(jas, 4200), 4800);
  }
  cycle();
  setInterval(cycle, 12000 + Math.random()*6000);

  // user interaction
  ['mouseenter','touchstart'].forEach(ev=>{
    yui && yui.addEventListener(ev, ()=> yui.classList.add('show'), {passive:true});
    jas && jas.addEventListener(ev, ()=> jas.classList.add('show'), {passive:true});
  });
  ['mouseleave','touchend'].forEach(ev=>{
    yui && yui.addEventListener(ev, ()=> yui.classList.remove('show'));
    jas && jas.addEventListener(ev, ()=> jas.classList.remove('show'));
  });

})();
