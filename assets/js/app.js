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
