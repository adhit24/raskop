/* =====================================================
   RASKOP — Landing Page Logic
   script.js (index.html only)
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initAreaTabs();
  initMenuCarousel();
  initGallerySlider();
  initGoogleReviews();
  initScrollAnimations();
  loadQuotaUI();
  loadCapacityUI();

  // Date for progress section
  const dateEl = document.getElementById('progress-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }
});

/* ─── QUOTA (from data.js fetchQuota) ─────────────── */
async function loadQuotaUI() {
  const quota = await fetchQuota();

  const pct        = quota.percentage;
  const heroFill   = document.getElementById('hero-fill');
  const heroPct    = document.getElementById('hero-pct');
  const heroBadge  = document.getElementById('quota-badge-hero');
  const heroSub    = document.getElementById('hero-quota-sub');
  const mainFill   = document.getElementById('main-fill');
  const fillLabel  = document.getElementById('fill-label');
  const urgBadge   = document.getElementById('urgency-badge');
  const filledEl   = document.getElementById('filled-count');
  const leftEl     = document.getElementById('left-count');

  const label = pct >= 90 ? '🔴 HAMPIR PENUH' : pct >= 70 ? '🔥 HAMPIR PENUH' : pct >= 50 ? '⚡ CUKUP RAMAI' : '✅ MASIH ADA SLOT';
  const sub   = pct >= 90 ? 'Hanya tersisa sedikit slot!' : pct >= 70 ? `${quota.reservedSeats - quota.totalGuests} kursi tersisa` : `${quota.totalGuests} dari ${quota.reservedSeats} kursi sudah dipesan`;

  if (heroBadge) heroBadge.textContent = label;
  if (heroSub)   heroSub.textContent   = sub;
  if (urgBadge)  urgBadge.textContent  = label;
  if (filledEl)  filledEl.textContent  = quota.totalGuests;
  if (leftEl)    leftEl.textContent    = Math.max(0, quota.reservedSeats - quota.totalGuests);

  // Animate bars
  setTimeout(() => {
    if (heroFill)  heroFill.style.width  = pct + '%';
    if (heroPct)   heroPct.textContent   = pct + '%';
    if (mainFill)  mainFill.style.width  = pct + '%';
    if (fillLabel) fillLabel.textContent = pct + '%';
  }, 400);
}

/* ─── NAVBAR ──────────────────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

/* ─── MOBILE MENU ─────────────────────────────────── */
function initMobileMenu() {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileClose = document.getElementById('mobile-close');
  const links = document.querySelectorAll('.mobile-link, .mobile-cta-btn');

  function openMenu() {
    mobileMenu?.classList.add('open');
    hamburger?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    mobileMenu?.classList.remove('open');
    hamburger?.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', () => {
    mobileMenu?.classList.contains('open') ? closeMenu() : openMenu();
  });
  mobileClose?.addEventListener('click', closeMenu);
  links.forEach(l => l.addEventListener('click', closeMenu));
}

/* ─── AREA TABS ───────────────────────────────────── */
function initAreaTabs() {
  const tabs   = document.querySelectorAll('.area-tab');
  const panels = document.querySelectorAll('.area-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`panel-${tab.dataset.tab}`)?.classList.add('active');
    });
  });
}

/* ─── MENU SWIPE CAROUSEL ─────────────────────────── */
function initMenuCarousel() {
  const track    = document.getElementById('menu-swipe-track');
  const dotsWrap = document.getElementById('menu-swipe-dots');
  const catTabs  = document.querySelectorAll('.menu-cat-tab');
  if (!track || !dotsWrap) return;

  let current = 0, autoplay;

  const catLabels = { kopi: 'Kopi', nonkopi: 'Non-Kopi', mocktail: 'Mocktail', makanan: 'Makanan' };
  const catStyles = {
    kopi:     { bg: 'rgba(224,135,86,.15)', color: '#E08756', border: 'rgba(224,135,86,.35)' },
    nonkopi:  { bg: 'rgba(22,85,72,.2)',    color: '#4db88a', border: 'rgba(22,85,72,.45)'   },
    mocktail: { bg: 'rgba(100,60,180,.18)', color: '#a78bfa', border: 'rgba(100,60,180,.35)' },
    makanan:  { bg: 'rgba(194,107,56,.15)', color: '#f0a876', border: 'rgba(194,107,56,.35)' },
  };

  function getAllItems() {
    const all = [];
    Object.entries(RASKOP.menu).forEach(([cat, items]) => {
      items.forEach(item => all.push({ ...item, _cat: cat }));
    });
    return all;
  }

  function renderCarousel(cat) {
    current = 0;
    clearInterval(autoplay);
    const items = cat === 'all'
      ? getAllItems()
      : (RASKOP.menu[cat] || []).map(i => ({ ...i, _cat: cat }));

    track.innerHTML = '';
    dotsWrap.innerHTML = '';
    track.style.transform = 'translateX(0)';

    items.forEach(item => {
      const s = catStyles[item._cat];
      const card = document.createElement('div');
      card.className = 'menu-swipe-card';
      card.innerHTML = `
        <div class="msc-emoji">${item.emoji}</div>
        <div class="msc-meta">
          <span class="msc-cat" style="background:${s.bg};color:${s.color};border:1px solid ${s.border}">${catLabels[item._cat]}</span>
          ${item.bestseller ? '<span class="menu-badge">Best Seller</span>' : ''}
        </div>
        <div class="msc-name">${item.name}</div>
        <div class="msc-desc">${item.desc}</div>
        <div class="msc-price">${formatRupiah(item.price)}</div>
      `;
      track.appendChild(card);
    });

    items.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.className = 'testi-dot' + (i === 0 ? ' active' : '');
      btn.setAttribute('aria-label', `Menu ${i + 1}`);
      btn.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(btn);
    });

    autoplay = setInterval(next, 3000);
  }

  function getCardW() {
    const card = track.querySelector('.menu-swipe-card');
    return card ? card.getBoundingClientRect().width + 16 : 256;
  }

  function goTo(idx) {
    const total = track.querySelectorAll('.menu-swipe-card').length;
    current = (idx + total) % total;
    track.style.transform = `translateX(-${current * getCardW()}px)`;
    dotsWrap.querySelectorAll('.testi-dot').forEach((d, i) => d.classList.toggle('active', i === current));
    clearInterval(autoplay);
    autoplay = setInterval(next, 3000);
  }

  function next() {
    goTo(current + 1);
  }

  let tx = 0;
  track.addEventListener('touchstart', e => { tx = e.changedTouches[0].clientX; clearInterval(autoplay); }, { passive: true });
  track.addEventListener('touchend',   e => {
    const diff = tx - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : goTo(current - 1);
    else autoplay = setInterval(next, 3000);
  });

  catTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      catTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderCarousel(tab.dataset.cat);
    });
  });

  document.getElementById('menu-prev')?.addEventListener('click', () => goTo(current - 1));
  document.getElementById('menu-next')?.addEventListener('click', () => goTo(current + 1));

  renderCarousel('all');
}

/* ─── GOOGLE REVIEWS SLIDER ───────────────────────── */
function initGoogleReviews() {
  const track    = document.getElementById('grev-track');
  const dotsWrap = document.getElementById('grev-dots');
  if (!track || !dotsWrap) return;

  // ── UPDATE INI DENGAN REVIEW ASLI DARI GOOGLE MAPS ──
  const reviews = [
    { name: 'Adhit Nugraha',    initials: 'AN', color: '#4285F4', stars: 5, when: '2 minggu lalu',  text: 'Tempat ini beneran cozy banget. Kopinya enak, WiFi kenceng, dan yang paling penting nggak berisik. Cocok buat ngerjain tugas atau meeting kecil-kecilan.' },
    { name: 'Rizki Firmansyah', initials: 'RF', color: '#34A853', stars: 5, when: '1 bulan lalu',   text: 'Spanish Latte-nya juara! Ambiance-nya juga pas banget, nggak terlalu rame. Sistem reservasi online-nya memudahkan banget, tinggal booking terus dateng.' },
    { name: 'Sari Rahayu',      initials: 'SR', color: '#EA4335', stars: 5, when: '3 minggu lalu',  text: 'Udah beberapa kali ke sini, selalu puas. Outdoor-nya adem dan romantis kalau malem. Nasi Goreng Kampungnya recommended banget!' },
    { name: 'Dimas Pratama',    initials: 'DP', color: '#FBBC05', stars: 5, when: '5 hari lalu',    text: 'Harga mahasiswa banget tapi kualitasnya premium. Americano Blackcurrant jadi favorit saya setiap ke sini. Pelayanannya juga ramah.' },
    { name: 'Nisa Amalia',      initials: 'NA', color: '#4285F4', stars: 5, when: '2 bulan lalu',   text: 'Study zone-nya sangat kondusif! Banyak colokan, meja luas, dan suasananya tenang. Jadi langganan sejak pertama kali dateng.' },
    { name: 'Budi Santoso',     initials: 'BS', color: '#34A853', stars: 5, when: '1 minggu lalu',  text: 'Lokasinya strategis, parkiran luas. Kopi Susu Gula Aren-nya bikin nagih. Pokoknya worth it banget buat nongkrong atau kerja dari sini!' },
  ];

  reviews.forEach(r => {
    const card = document.createElement('div');
    card.className = 'grev-card';
    card.innerHTML = `
      <div class="grev-header">
        <div class="grev-avatar" style="background:${r.color}">${r.initials}</div>
        <div>
          <div class="grev-name">${r.name}</div>
          <div class="grev-when">${r.when}</div>
        </div>
      </div>
      <div class="grev-rating">${'⭐'.repeat(r.stars)}</div>
      <p class="grev-text">${r.text}</p>
      <div class="grev-footer">
        <svg width="14" height="14" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-3.59-14.44-8.83l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        <span class="grev-gmaps">Google Maps</span>
      </div>
    `;
    track.appendChild(card);
  });

  const total = reviews.length;
  let current = 0, autoplay;

  for (let i = 0; i < total; i++) {
    const btn = document.createElement('button');
    btn.className = 'testi-dot' + (i === 0 ? ' active' : '');
    btn.setAttribute('aria-label', `Review ${i + 1}`);
    btn.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(btn);
  }

  function getW()        { const c = track.querySelector('.grev-card'); return c ? c.getBoundingClientRect().width + 24 : 400; }
  function getVisible()  { return Math.max(1, Math.floor((track.parentElement.getBoundingClientRect().width || window.innerWidth) / getW())); }
  function goTo(idx) {
    const maxIdx = Math.max(0, total - getVisible());
    current = Math.min(Math.max(0, idx), maxIdx);
    track.style.transform = `translateX(-${current * getW()}px)`;
    dotsWrap.querySelectorAll('.testi-dot').forEach((d, i) => d.classList.toggle('active', i === current));
    clearInterval(autoplay);
    autoplay = setInterval(next, 4500);
  }
  function next() { const max = Math.max(0, total - getVisible()); goTo(current >= max ? 0 : current + 1); }

  let tx = 0;
  track.addEventListener('touchstart', e => { tx = e.changedTouches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   e => {
    const diff = tx - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : goTo((current - 1 + total) % total);
  });

  autoplay = setInterval(next, 4500);
}

/* ─── GALLERY SLIDER ──────────────────────────────── */
function initGallerySlider() {
  const track    = document.getElementById('gallery-track');
  const dotsWrap = document.getElementById('gallery-dots');
  if (!track || !dotsWrap) return;

  const photos = [
    'Brand_assets/Story 1.jpeg',
    'Brand_assets/Story 2.jpeg',
    'Brand_assets/Story 3.JPG',
    'Brand_assets/Story 4.JPG',
    'Brand_assets/Story 5.jpg',
    'Brand_assets/Story 6.JPG',
    'Brand_assets/Story 7.JPG',
    'Brand_assets/Story 8.JPG',
    'Brand_assets/Story 9.JPG',
    'Brand_assets/Story 10.jpg',
    'Brand_assets/Story 11.JPG',
    'Brand_assets/Story 12.JPG',
    'Brand_assets/Story 13.JPG',
    'Brand_assets/Story 14.jpg',
    'Brand_assets/Story 15.jpg',
    'Brand_assets/Story 16.JPG',
    'Brand_assets/Story 17.JPG',
  ];

  photos.forEach(src => {
    const card = document.createElement('div');
    card.className = 'gallery-thumb-card';
    card.innerHTML = `
      <img src="${src}" alt="Suasana Raskop" loading="lazy" />
      <div class="gallery-thumb-overlay"></div>
    `;
    track.appendChild(card);
  });

  const cards = track.querySelectorAll('.gallery-thumb-card');
  const total = cards.length;
  let current = 0, autoplay;

  for (let i = 0; i < total; i++) {
    const btn = document.createElement('button');
    btn.className = 'testi-dot' + (i === 0 ? ' active' : '');
    btn.setAttribute('aria-label', `Foto ${i + 1}`);
    btn.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(btn);
  }

  function getW()        { return cards[0].getBoundingClientRect().width + 24; }
  function getVisible()  { return Math.max(1, Math.floor((track.parentElement.getBoundingClientRect().width || window.innerWidth) / getW())); }
  function goTo(idx) {
    const maxIdx = Math.max(0, total - getVisible());
    current = Math.min(Math.max(0, idx), maxIdx);
    track.style.transform = `translateX(-${current * getW()}px)`;
    dotsWrap.querySelectorAll('.testi-dot').forEach((d, i) => d.classList.toggle('active', i === current));
    clearInterval(autoplay);
    autoplay = setInterval(next, 3000);
  }
  function next() { const max = Math.max(0, total - getVisible()); goTo(current >= max ? 0 : current + 1); }

  let tx = 0;
  track.addEventListener('touchstart', e => { tx = e.changedTouches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx;
    if (dx < -40) goTo(Math.min(current + 1, total - 1));
    else if (dx > 40) goTo(Math.max(current - 1, 0));
  });

  document.getElementById('gallery-prev')?.addEventListener('click', () => goTo(Math.max(current - 1, 0)));
  document.getElementById('gallery-next')?.addEventListener('click', () => goTo(Math.min(current + 1, total - 1)));

  autoplay = setInterval(next, 3000);
}

/* ─── SCROLL ANIMATIONS ───────────────────────────── */
function initScrollAnimations() {
  const targets = document.querySelectorAll('.anim-up, .reveal');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  targets.forEach(el => obs.observe(el));
}

/* ─── CAPACITY WIDGET ─────────────────────────────── */
async function loadCapacityUI() {
  const CIRC = 314.16;
  const STATUS_LABEL = { open: 'Tersedia', busy: 'Mulai Ramai', full: 'Hampir Penuh' };
  const STATUS_CLASS  = { open: '',        busy: 'busy',        full: 'full' };
  const ARC_COLOR     = { open: '#22c55e', busy: '#E08756',     full: '#ef4444' };

  function updateCard(area, data) {
    const arc    = document.getElementById(`${area}-arc`);
    const pctEl  = document.getElementById(`${area}-pct`);
    const booked = document.getElementById(`${area}-booked`);
    const status = document.getElementById(`${area}-status`);
    if (!arc) return;

    arc.style.strokeDashoffset = CIRC * (1 - data.pct / 100);
    arc.style.stroke = ARC_COLOR[data.status] || ARC_COLOR.open;

    animateNumTo(pctEl, data.pct, '%');
    if (booked) booked.textContent = data.booked;
    if (status) {
      status.textContent = STATUS_LABEL[data.status] || '—';
      status.className = 'capacity-status-badge' + (STATUS_CLASS[data.status] ? ' ' + STATUS_CLASS[data.status] : '');
    }
  }

  async function refresh() {
    const btn = document.getElementById('capacity-refresh-btn');
    if (btn) btn.classList.add('spinning');

    try {
      const res  = await fetch('/.netlify/functions/capacity');
      const data = await res.json();
      if (data && data.areas) {
        updateCard('indoor',  data.areas.indoor);
        updateCard('outdoor', data.areas.outdoor);
        const dateEl = document.getElementById('capacity-date');
        if (dateEl && data.date) {
          const d = new Date(data.date + 'T00:00:00+07:00');
          dateEl.textContent = d.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
        }
      }
    } catch { /* silently ignore network errors */ }

    const timeEl = document.getElementById('capacity-time');
    if (timeEl) {
      const now = new Date();
      timeEl.textContent = 'Diperbarui: ' + now.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
    }
    setTimeout(() => { if (btn) btn.classList.remove('spinning'); }, 650);
  }

  const btn = document.getElementById('capacity-refresh-btn');
  if (btn) btn.addEventListener('click', refresh);

  await refresh();
  setInterval(refresh, 2 * 60 * 1000);
}

function animateNumTo(el, target, suffix) {
  if (!el) return;
  const start = performance.now();
  const dur   = 1000;
  const from  = parseFloat(el.textContent) || 0;
  function tick(now) {
    const progress = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (target - from) * ease) + (suffix || '');
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}