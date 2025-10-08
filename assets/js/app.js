(async function () {
  const $ = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>[...r.querySelectorAll(s)];

  // ===== Load JSON =====
  let data;
  try {
    const res = await fetch('assets/data/content.json', { cache: 'no-store' });
    data = await res.json();
  } catch (e) {
    console.error('JSON load error', e); return;
  }

  // ===== Build nav =====
  const sections = [
    {id:'home',label:'Home'},{id:'program',label:'Program'},
    {id:'characters',label:'Characters'},{id:'history',label:'History'},
    {id:'map',label:'Maps'},{id:'vendors',label:'Vendors'},{id:'contact',label:'Contact'}
  ];
  $('#nav-list').innerHTML = sections.map(s=>`<li><a href="#${s.id}">${s.label}</a></li>`).join('');

  // ===== Home texts =====
  $('#home-headline').textContent = data.home.headline;
  $('#home-lede').textContent = data.home.lede;
  $('#event-meta').innerHTML = `<strong>${data.event.title}</strong><br>${data.event.date} &nbsp; ${data.event.time}<br>${data.event.venue}`;
  $('#home-cta').innerHTML = data.home.cta_html;

  // ===== Program =====
  const prg = $('#program-list');
  prg.innerHTML = (data.program||[]).map(p=>`
    <div class="card"><div class="time">${p.time||''}</div>
      <div><strong>${p.title||''}</strong><div class="desc">${p.desc||''}</div></div>
    </div>`).join('');
  if (data.program_poster){
    $('#download-program-poster').href = data.program_poster;
    $('#open-program-poster').addEventListener('click',()=>{
      $('#lightbox img').src = data.program_poster;
      $('#lightbox').classList.add('open');
    });
  }

  // ===== Characters =====
  $('#character-grid').innerHTML = (data.characters||[]).map(c=>`
    <div class="char-card"><img src="${c.image}" alt="${c.name}"><h3>${c.name||''}</h3></div>
  `).join('');

  // ===== History (images only) =====
  $('#history-panels').innerHTML = (data.history_panels||[]).map(p=>`
    <figure class="panel"><img src="${p.src}" alt="${p.alt||''}"></figure>
  `).join('');
  $('#history-highlights').innerHTML = (data.history_highlights||[]).map(h=>`
    <div class="y-card"><span class="badge">${h.year||''}</span><img src="${h.src}" alt="History ${h.year||''}"></div>
  `).join('');

  // ===== Maps (tabs) =====
  const tabs = $('#map-tabs'), mapBox = $('#map-images');
  tabs.innerHTML = (data.maps||[]).map((m,i)=>`<button class="tab ${i? '' : 'active'}" data-i="${i}">${m.title}</button>`).join('');
  function showMap(i=0){ mapBox.innerHTML = `<img src="${data.maps[i].src}" alt="${data.maps[i].title}">`; }
  if (data.maps?.length){ showMap(0); }
  tabs.addEventListener('click',e=>{
    const b=e.target.closest('.tab'); if(!b) return;
    $$('.tab',tabs).forEach(x=>x.classList.remove('active')); b.classList.add('active');
    showMap(+b.dataset.i);
  });

  // ===== Vendors =====
  $('#vendor-cards').innerHTML = (data.vendors||[]).map(v=>`
    <article class="vendor-card">
      <div class="logo"><img src="${v.logo}" alt="${v.name} logo"></div>
      <div class="v-body">
        <h3>${v.name}</h3>
        <div class="v-links">
          ${v.instagram?`<a class="insta" href="${v.instagram}" target="_blank" rel="noopener">Instagram</a>`:''}
          ${v.site?`<a class="site" href="${v.site}" target="_blank" rel="noopener">Website</a>`:''}
        </div>
      </div>
    </article>
  `).join('');

  // ===== Lightbox close =====
  $('#lightbox .close').addEventListener('click',()=>$('#lightbox').classList.remove('open'));
  $('#lightbox').addEventListener('click',e=>{ if(e.target.id==='lightbox') $('#lightbox').classList.remove('open'); });

  // ===== Reveal on scroll =====
  const io = new IntersectionObserver(es=>es.forEach(en=>en.isIntersecting&&en.target.classList.add('in')),{threshold:.1});
  $$('.reveal').forEach(el=>io.observe(el));

  // ===== Parallax poster =====
  const poster = $('.poster-img');
  window.addEventListener('scroll', ()=>{
    const y = Math.min(1, window.scrollY / window.innerHeight);
    poster.style.transform = `translateY(${y * -14}px) scale(${1 + y*0.02})`;
  }, {passive:true});

  // ===== Sakura background (very light) =====
  const cvs = $('#bg-sakura'); const ctx = cvs.getContext('2d');
  let W=innerWidth, H=innerHeight; function resize(){ W=cvs.width=innerWidth; H=cvs.height=innerHeight; }
  resize(); addEventListener('resize', resize);
  const N=70, S= ()=>Math.random()*0.6+0.3;
  const petals = Array.from({length:N},()=>({x:Math.random()*W,y:Math.random()*H,s:S(),vx:Math.random()*0.4-0.2,vy:Math.random()*0.7+0.2,rot:Math.random()*6}));
  (function loop(){
    ctx.clearRect(0,0,W,H);
    petals.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.rot+=0.01+p.s*0.01;
      if(p.y>H+20){ p.y=-20; p.x=Math.random()*W; }
      if(p.x<-20) p.x=W+20; if(p.x>W+20) p.x=-20;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.fillStyle='rgba(255,182,193,.75)';
      ctx.beginPath();
      ctx.moveTo(0,0); ctx.bezierCurveTo(6*p.s,-8*p.s, 10*p.s,6*p.s, 0,10*p.s);
      ctx.bezierCurveTo(-10*p.s,6*p.s, -6*p.s,-8*p.s, 0,0); ctx.fill();
      ctx.restore();
    });
    requestAnimationFrame(loop);
  })();

  // ===== Peek mascots =====
  const yui = $('#peek-yui'), jas = $('#peek-jasmine');
  function autoPeek(){
    yui.classList.add('show');
    setTimeout(()=>{ yui.classList.remove('show'); jas.classList.add('show'); }, 4200);
    setTimeout(()=>{ jas.classList.remove('show'); }, 8400);
  }
  autoPeek(); setInterval(autoPeek, 12000);
  function wirePeek(el){ 
    el.querySelector('.close').addEventListener('click',e=>{e.stopPropagation(); el.classList.remove('show');});
    el.addEventListener('mouseenter',()=>el.classList.add('show'));
    el.addEventListener('mouseleave',()=>el.classList.remove('show'));
  }
  wirePeek(yui); wirePeek(jas);

  // ===== Party Mode (confetti) =====
  let confettiOn=false, confetti=[];
  const btn=$('#party-btn');
  const confCtx = ctx; // 同じcanvasに描く（軽量）
  function toggleConfetti(){
    confettiOn=!confettiOn;
    btn.textContent = confettiOn ? '🛑 Stop Party' : '🎉 Party Mode';
    if(confettiOn){
      confetti = Array.from({length:120},()=>({
        x:Math.random()*W, y:Math.random()*-H, s:Math.random()*6+3, vy:Math.random()*2+1.5, vx:Math.random()*1-0.5, c:`hsl(${Math.random()*360},90%,60%)`, r:Math.random()*Math.PI
      }));
    }
  }
  btn.addEventListener('click', toggleConfetti);
  // confetti描画（桜ループに混ぜるより別で上描き）
  (function conf(){
    if(confettiOn){
      confCtx.save();
      confetti.forEach(p=>{
        p.y+=p.vy; p.x+=p.vx; p.r+=0.08;
        if(p.y>H+10){ p.y=-10; p.x=Math.random()*W; }
        confCtx.translate(p.x,p.y); confCtx.rotate(p.r);
        confCtx.fillStyle=p.c;
        confCtx.fillRect(-p.s/2,-p.s/2,p.s,p.s*0.6);
        confCtx.setTransform(1,0,0,1,0,0);
      });
      confCtx.restore();
    }
    requestAnimationFrame(conf);
  })();
})();
