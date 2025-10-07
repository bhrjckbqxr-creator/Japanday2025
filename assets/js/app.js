(async function(){
  const $ = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>[...r.querySelectorAll(s)];
  const data = await fetch('assets/data/content.json', {cache:'no-store'}).then(r=>r.json());

  // ナビ
  const sections = [
    {id:'home',label:'Home'},{id:'program',label:'Program'},
    {id:'characters',label:'Characters'},{id:'history',label:'History'},
    {id:'map',label:'Maps'},{id:'vendors',label:'Vendors'},{id:'contact',label:'Contact'}
  ];
  $('#nav-list').innerHTML = sections.map(s=>`<li><a href="#${s.id}">${s.label}</a></li>`).join('');

  // Home
  $('#home-headline').textContent = data.home.headline;
  $('#home-lede').textContent = data.home.lede;
  $('#event-meta').innerHTML = `<strong>${data.event.title}</strong><br>${data.event.date} &nbsp; ${data.event.time}<br>${data.event.venue}`;
  $('#home-cta').innerHTML = data.home.cta_html;

  // Program（リストは参考表示、ポスター中心）
  const programList = $('#program-list');
  if (data.program) {
    programList.innerHTML = data.program.map(p=>`
      <div class="card"><div class="time">${p.time||''}</div><div><strong>${p.title||''}</strong><div class="desc">${p.desc||''}</div></div></div>
    `).join('');
  }
  if (data.program_poster){
    $('#download-program-poster').href = data.program_poster;
    $('#open-program-poster').addEventListener('click',()=>{
      $('#lightbox img').src = data.program_poster;
      $('#lightbox').classList.add('open');
    });
  }

  // Characters（画像だけ）
  $('#character-grid').innerHTML = (data.characters||[]).map(c=>`
    <div class="char-card">
      <img src="${c.image}" alt="${c.name}">
      <h3>${c.name||''}</h3>
    </div>
  `).join('');

  // History：長尺パネルを縦に、その下にハイライトをカードで
  const hp = $('#history-panels');
  hp.innerHTML = (data.history_panels||[]).map(p=>`
    <figure class="panel"><img src="${p.src}" alt="${p.alt||''}"></figure>
  `).join('');
  const hg = $('#history-highlights');
  hg.innerHTML = (data.history_highlights||[]).map(h=>`
    <div class="y-card">
      <span class="badge">${h.year||''}</span>
      <img src="${h.src}" alt="History ${h.year||''}">
    </div>
  `).join('');

  // Maps：タブ切替（画像だけ）
  const tabs = $('#map-tabs'), mapBox = $('#map-images');
  tabs.innerHTML = data.maps.map((m,i)=>`<button class="tab ${i===0?'active':''}" data-i="${i}">${m.title}</button>`).join('');
  function showMap(i=0){ mapBox.innerHTML = `<img src="${data.maps[i].src}" alt="${data.maps[i].title}">`; }
  showMap(0);
  tabs.addEventListener('click',e=>{
    const b=e.target.closest('.tab'); if(!b) return;
    tabs.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); showMap(+b.dataset.i);
  });

  // Vendors：ロゴ＋リンクだけ
  const vwrap = $('#vendor-cards');
  vwrap.innerHTML = (data.vendors||[]).map(v=>`
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

  // Lightbox（maps/パネル/ハイライト どれでも拡大）
  const lb = $('#lightbox'), img = $('#lightbox img');
  document.addEventListener('click', e=>{
    const t = e.target;
    if (t.matches('.map-images img, .history-panels img, .history-grid img')) {
      img.src = t.src; lb.classList.add('open');
    }
  });
  $('#lightbox .close').addEventListener('click',()=>lb.classList.remove('open'));
  lb.addEventListener('click',e=>{ if(e.target===lb) lb.classList.remove('open'); });

  // reveal
  const io = new IntersectionObserver(es=>es.forEach(en=>en.isIntersecting&&en.target.classList.add('revealed')), {threshold:.1});
  $$('.reveal-up').forEach(el=>io.observe(el));
})();
