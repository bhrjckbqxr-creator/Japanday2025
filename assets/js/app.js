// Minimal client loader for JSON-driven site
(async function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // Load content
  const data = await fetch('assets/data/content.json', { cache: 'no-store' }).then(r => r.json());

  // Build nav
  const sections = [
    { id:'home', label:'Home' },
    { id:'program', label:'Program' },
    { id:'characters', label:'Characters' },
    { id:'vendors', label:'Vendors' },
    { id:'history', label:'History' },
    { id:'map', label:'Map' },
    { id:'sponsors', label:'Sponsors' },
    { id:'gallery', label:'Gallery' },
    { id:'contact', label:'Contact' },
  ];
  const nav = $('#nav-list');
  nav.innerHTML = sections.map(s => `<li><a href="#${s.id}">${s.label}</a></li>`).join('');
  // nav active on click
  nav.addEventListener('click', e => {
    if (e.target.tagName !== 'A') return;
    $$('#nav-list a').forEach(a => a.classList.remove('active'));
    e.target.classList.add('active');
  });

  // Home texts
  $('#home-headline').textContent = data.home.headline;
  $('#home-lede').textContent = data.home.lede;
  $('#event-meta').innerHTML = `
    <strong>${data.event.title}</strong><br>
    ${data.event.date} &nbsp; ${data.event.time}<br>
    ${data.event.venue}
  `;
  $('#home-cta').innerHTML = data.home.cta_html;

  // Contacts
  $('#contact-email').href = `mailto:${data.contact.email}`;
  $('#contact-email').textContent = data.contact.email;
  $('#contact-wa').href = data.contact.whatsapp;
  $('#contact-wa').textContent = data.contact.whatsapp_label || 'WhatsApp';

  // Program
  const programWrap = $('#program-list');
  programWrap.innerHTML = data.program.map(item => `
    <div class="card">
      <div class="time">${item.time}</div>
      <div class="title"><strong>${item.title}</strong></div>
      <div class="desc">${item.desc || ''}</div>
    </div>
  `).join('');

  // Characters
  const charGrid = $('#character-grid');
  charGrid.innerHTML = data.characters.map(c => `
    <div class="char-card">
      <img src="${c.image}" alt="${c.name}" loading="lazy">
      <h3>${c.name}</h3>
      <p>${c.bio}</p>
    </div>
  `).join('');

  // Vendors (cards with logo, product tags, instagram link)
  const vendorWrap = $('#vendor-cards');
  function renderVendors(filter='all'){
    const list = data.vendors.filter(v => filter==='all' || v.type===filter);
    vendorWrap.innerHTML = list.map(v => `
      <article class="vendor-card">
        <div class="logo"><img src="${v.logo}" alt="${v.name} logo"></div>
        <div class="v-body">
          <h3>${v.name}</h3>
          <p class="v-desc">${v.desc || ''}</p>
          <div class="products">
            ${ (v.products||[]).map(p=>`<span class="tag">${p}</span>`).join('') }
          </div>
          <div class="v-links">
            ${ v.instagram ? `<a class="insta" href="${v.instagram}" target="_blank" rel="noopener">Instagram</a>` : '' }
            ${ v.site ? `<a class="site" href="${v.site}" target="_blank" rel="noopener">Website</a>` : '' }
          </div>
        </div>
      </article>
    `).join('');
  }
  renderVendors();
  $('#vendor-filter').addEventListener('change', e => renderVendors(e.target.value));

  // Timeline (history)
  const timeline = $('#timeline');
  timeline.innerHTML = data.history.map(block => `
    <section class="year-block">
      <div class="year">${block.year}</div>
      <div class="year-items">
        ${block.items.map(it => `
          <div class="y-card">
            ${ it.image ? `<img src="${it.image}" alt="${it.caption||''}" loading="lazy">` : '' }
            ${ it.caption ? `<p>${it.caption}</p>` : '' }
          </div>
        `).join('')}
      </div>
    </section>
  `).join('');

  // Light gallery (simple)
  const lightbox = $('#lightbox'), lightImg = $('#lightbox img'), closeBtn = $('#lightbox .close');
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.matches('.masonry img, .timeline img')) {
      lightImg.src = t.src; lightbox.classList.add('open');
    }
  });
  closeBtn.addEventListener('click', ()=> lightbox.classList.remove('open'));
  lightbox.addEventListener('click', e => { if(e.target===lightbox) lightbox.classList.remove('open'); });

  // Reveal on scroll
  const io = new IntersectionObserver(entries=>{
    entries.forEach(en=> en.isIntersecting && en.target.classList.add('revealed'));
  },{threshold:.1});
  $$('.reveal-up').forEach(el=> io.observe(el));
})();
/* ====== Peek Mascots logic ====== */
(function(){
  const yui = document.getElementById('peek-yui');
  const jas = document.getElementById('peek-jasmine');
  const yMsg = document.getElementById('yui-msg');
  const jMsg = document.getElementById('jas-msg');

  // メッセージ（多言語）
  const msgs = {
    en: { yui: "Hi! I’m Yui. Check the Program!", jas: "Welcome! I’m Jasmine. Vendors →" },
    ja: { yui: "やっほー！ユイだよ。プログラム見てね！", jas: "こんにちは、ジャスミンです。ベンダーへ→" },
    es: { yui: "¡Hola! Soy Yui. ¡Mira el programa!", jas: "¡Bienvenida! Soy Jasmine. Vendedores →" }
  };
  // 言語ボタンの状態から設定
  function currentLang(){
    const btn = document.querySelector('.lang-switch button.active');
    return btn?.dataset.lang || 'en';
  }
  function setMsgs(){
    const l = currentLang();
    yMsg.textContent = msgs[l].yui;
    jMsg.textContent = msgs[l].jas;
  }
  setMsgs();
  document.querySelectorAll('.lang-switch button').forEach(b=>{
    b.addEventListener('click', ()=>{
      document.querySelectorAll('.lang-switch button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      setMsgs();
    });
  });

  // 自動で交互に「ひょこっ」
  let t1, t2;
  function autoPeek(){
    clearTimeout(t1); clearTimeout(t2);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce) return;
    // Yui → Jasmine の順で出したり引っ込めたり
    const showY = ()=> yui.classList.add('show');
    const hideY = ()=> yui.classList.remove('show');
    const showJ = ()=> jas.classList.add('show');
    const hideJ = ()=> jas.classList.remove('show');

    showY();
    t1 = setTimeout(()=>{ hideY(); showJ(); }, 4200);
    t2 = setTimeout(()=>{ hideJ(); }, 8400);
  }
  autoPeek();
  // 周期的に（12秒ごと）
  setInterval(autoPeek, 12000);

  // タップ/ホバーで手動開閉
  function wire(el){
    el.addEventListener('mouseenter', ()=> el.classList.add('show'));
    el.addEventListener('mouseleave', ()=> el.classList.remove('show'));
    el.addEventListener('click', ()=> el.classList.toggle('tapped'));
    el.querySelector('.close').addEventListener('click', (e)=>{
      e.stopPropagation();
      el.classList.remove('show','tapped');
    });
  }
  wire(yui); wire(jas);

  // スクロール上部では見せすぎない（ポスターが見えている間は控えめ）
  const poster = document.querySelector('#poster-top');
  if (poster) {
    const io = new IntersectionObserver(entries=>{
      const onTop = entries[0].isIntersecting;
      if(onTop){ yui.classList.remove('show'); jas.classList.remove('show'); }
    }, { threshold: 0.2 });
    io.observe(poster);
  }
})();
