// ===== STATE =====
let STATE = { lang: 'en', content: null, vendors: [] };

// ===== BOOT =====
document.addEventListener('DOMContentLoaded', loadContent);

async function loadContent(){
  const res = await fetch('assets/data/content.json');
  STATE.content = await res.json();
  buildNav();
  setLang(STATE.lang);
  hydrateHome();
  hydrateProgram();
  hydrateVendors();
  hydrateSponsors();
  hydrateContact();
  wireLangSwitch();
  wireNav();
  wireMap();
  wireReveal();
  wireGallery();
  initPetals(); // 背景の桜
  document.querySelector('.contact-form').addEventListener('submit', handleContactSubmit);
}

// ===== NAV / LANG =====
function buildNav(){
  const navList = document.getElementById('nav-list');
  navList.innerHTML = '';
  const labels = STATE.content.nav[STATE.lang];
  const sections = ['home','program','map','vendors','sponsors','gallery','contact'];
  sections.forEach((id, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + id;
    a.textContent = labels[i];
    if(i===0) a.classList.add('active');
    a.addEventListener('click', (e) => {
      e.preventDefault();
      showSection(id);
      document.querySelectorAll('.nav a').forEach(el => el.classList.remove('active'));
      a.classList.add('active');
    });
    li.appendChild(a);
    navList.appendChild(li);
  });
}

function showSection(id){
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  el.classList.add('active');
  el.classList.add('revealed');
  if(id === 'vendors') renderVendors();
}

function setLang(lang){
  STATE.lang = lang;
  document.querySelectorAll('.lang-switch button').forEach(b=>{
    b.classList.toggle('active', b.dataset.lang===lang);
    b.setAttribute('aria-pressed', b.dataset.lang===lang ? 'true':'false');
  });
  buildNav();
  hydrateHome(); hydrateProgram(); hydrateSponsors();
}

function wireLangSwitch(){
  document.querySelectorAll('.lang-switch button').forEach(b=>{
    b.addEventListener('click', ()=> setLang(b.dataset.lang));
  });
}

function wireNav(){
  const hash = (location.hash || '#home').replace('#','');
  showSection(hash);
  const idx = ['home','program','map','vendors','sponsors','gallery','contact'].indexOf(hash);
  if(idx>=0){
    document.querySelectorAll('.nav a').forEach(el => el.classList.remove('active'));
    const navA = document.querySelectorAll('.nav a')[idx];
    if(navA) navA.classList.add('active');
  }
}

// ===== HOME / CONTENT =====
function hydrateHome(){
  const {event, home} = STATE.content;
  document.getElementById('home-headline').textContent = home[STATE.lang].headline;
  document.getElementById('home-lede').textContent = home[STATE.lang].lede;
  document.getElementById('home-cta').textContent = home[STATE.lang].cta;
  document.getElementById('event-meta').innerHTML = `
    <strong>${event.title}</strong><br>
    ${event.date} • ${event.time}<br>
    ${event.venue}
  `;
}

function hydrateProgram(){
  const list = document.getElementById('program-list');
  list.innerHTML = '';
  (STATE.content.program||[]).forEach(item=>{
    const card = document.createElement('div');
    card.className = 'card';
    const title = item[STATE.lang] || item.en;
    card.innerHTML = `<div class="time">${item.time}</div><div>${title}</div>`;
    list.appendChild(card);
  });
  document.querySelector('#program .section-title').textContent =
    {'en':'Program','ja':'プログラム','es':'Programa'}[STATE.lang];
}

// ===== VENDORS =====
function hydrateVendors(){
  STATE.vendors = (STATE.content.vendors || []).slice().sort((a,b)=>a.booth-b.booth);
  const select = document.getElementById('vendor-filter');
  select.addEventListener('change', renderVendors);
  document.querySelector('#vendors .section-title').textContent =
    {'en':'Vendors','ja':'出店者','es':'Vendedores'}[STATE.lang];
}
function renderVendors(){
  const cat = document.getElementById('vendor-filter').value;
  const data = STATE.vendors.filter(v => cat==='all' ? true : v.category===cat);
  const wrap = document.getElementById('vendor-list');
  wrap.innerHTML = '';
  const table = document.createElement('table');
  table.innerHTML = `<thead><tr>
    <th>${({'en':'Booth','ja':'ブース','es':'Puesto'})[STATE.lang]}</th>
    <th>${({'en':'Name','ja':'名称','es':'Nombre'})[STATE.lang]}</th>
    <th>${({'en':'Category','ja':'カテゴリ','es':'Categoría'})[STATE.lang]}</th>
  </tr></thead><tbody></tbody>`;
  const tbody = table.querySelector('tbody');
  data.forEach(v=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${v.booth}</td><td>${v.name}</td><td>${v.category}</td>`;
    tbody.appendChild(tr);
  });
  wrap.appendChild(table);
}

// ===== SPONSORS =====
function hydrateSponsors(){
  const tiers = document.getElementById('sponsor-tiers');
  tiers.innerHTML = '';
  const t = (STATE.content.sponsors && STATE.content.sponsors.tiers) || [];
  t.forEach(tier=>{
    const div = document.createElement('div');
    div.className = 'tier';
    const meta = tier[STATE.lang] || tier.en;
    div.innerHTML = `<h3>${meta.title}</h3><div class="price">${meta.price}</div><ul></ul>`;
    const ul = div.querySelector('ul');
    tier.benefits.forEach(b=>{
      const li = document.createElement('li');
      li.textContent = b[STATE.lang] || b.en;
      ul.appendChild(li);
    });
    tiers.appendChild(div);
  });
  document.querySelector('#sponsors .section-title').textContent =
    {'en':'Sponsors','ja':'スポンサー','es':'Patrocinios'}[STATE.lang];
}

// ===== CONTACT =====
function hydrateContact(){
  const c = STATE.content.contact;
  const email = document.getElementById('contact-email');
  const wa = document.getElementById('contact-wa');
  email.href = `mailto:${c.email}`; email.textContent = c.email;
  wa.href = c.whatsapp;   wa.textContent = c.phone;
  document.querySelector('#contact .section-title').textContent =
    {'en':'Contact','ja':'お問い合わせ','es':'Contacto'}[STATE.lang];
}
function handleContactSubmit(e){
  e.preventDefault();
  const data = new FormData(e.target);
  const subject = encodeURIComponent('Japan Day Inquiry');
  const body = encodeURIComponent([...data.entries()].map(([k,v])=>`${k}: ${v}`).join('\n'));
  window.location.href = `mailto:${STATE.content.contact.email}?subject=${subject}&body=${body}`;
}

// ===== MAP =====
function wireMap(){
  const obj = document.getElementById('booth-map');
  obj.addEventListener('load', ()=>{
    const svgDoc = obj.contentDocument;
    if(!svgDoc) return;
    svgDoc.querySelectorAll('.booth').forEach(g=>{
      g.addEventListener('click', ev=>{ selectBooth(g.getAttribute('data-booth')); ripple(ev); });
      g.addEventListener('keypress', e=>{ if(e.key==='Enter'){ selectBooth(g.getAttribute('data-booth')); } });
    });
  });
}
function selectBooth(num){
  const info = document.getElementById('booth-info');
  const v = STATE.vendors.find(x=>String(x.booth)===String(num));
  info.textContent = v ? `Booth ${v.booth}: ${v.name} — ${v.category}` : `Booth ${num}: (unassigned)`;
}
function ripple(e){
  const obj = document.querySelector('.map-wrap');
  const circle = document.createElement('span');
  circle.style.position='absolute';circle.style.width=circle.style.height='8px';
  circle.style.borderRadius='50%';circle.style.background='rgba(233,30,99,.35)';circle.style.pointerEvents='none';
  const rect = obj.getBoundingClientRect();
  circle.style.left=(e.clientX-rect.left)+'px';circle.style.top=(e.clientY-rect.top)+'px';
  obj.appendChild(circle);
  circle.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:'translate(-50%,-50%) scale(12)',opacity:0}],{duration:600,easing:'ease-out'}).onfinish=()=>circle.remove();
}

// ===== GALLERY =====
function wireGallery(){
  const grid = document.getElementById('gallery-grid');
  const lb = document.getElementById('lightbox'); if(!grid) return;
  const img = lb.querySelector('img'); const close = lb.querySelector('.close');
  grid.addEventListener('click', (e)=>{ const t=e.target; if(t.tagName==='IMG'){ img.src=t.src; lb.classList.add('open'); lb.setAttribute('aria-hidden','false'); }});
  const closeFn = ()=>{ lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); };
  close.addEventListener('click', closeFn); lb.addEventListener('click', e=>{ if(e.target===lb) closeFn(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && lb.classList.contains('open')) closeFn(); });
}

// ===== SCROLL REVEAL =====
function wireReveal(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(ent=>{ if(ent.isIntersecting){ ent.target.classList.add('revealed'); io.unobserve(ent.target); }});
  }, {threshold:.1});
  document.querySelectorAll('.reveal-up').forEach(el=>io.observe(el));
}

// ===== SAKURA BACKGROUND (fixed, behind everything) =====
function initPetals(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cvs = document.getElementById('petals');
  const ctx = cvs.getContext('2d');
  function size(){ cvs.width = innerWidth; cvs.height = innerHeight; }
  size(); addEventListener('resize', size);

  const petals = [];
  const count = reduce ? 0 : Math.min(80, Math.floor(innerWidth/16));
  for(let i=0;i<count;i++){
    petals.push({ x: Math.random()*innerWidth, y: Math.random()*innerHeight, r: Math.random()*2+1.2, vx: Math.random()*0.6+0.15, vy: Math.random()*0.6+0.3, rot: Math.random()*Math.PI });
  }
  function step(){
    ctx.clearRect(0,0,cvs.width,cvs.height);
    ctx.fillStyle='rgba(233,30,99,.15)';
    petals.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.rot+=0.02;
      if(p.x>cvs.width) p.x=-10;
      if(p.y>cvs.height) p.y=-10;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.beginPath(); ctx.moveTo(0,-p.r);
      ctx.bezierCurveTo(p.r,-p.r,p.r,p.r,0,p.r);
      ctx.bezierCurveTo(-p.r,p.r,-p.r,-p.r,0,-p.r);
      ctx.fill(); ctx.restore();
    });
    requestAnimationFrame(step);
  }
  if(!reduce) step();
}
