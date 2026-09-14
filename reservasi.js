/* =====================================================
   RASKOP — Reservation Form Logic
   reservasi.js
   ===================================================== */

/* ─── STATE ─────────────────────────────────────── */
const state = {
  step:    1,
  guests:  1,
  name:    '',
  phone:   '',
  date:    '',
  time:    '',
  area:    '',
  note:    '',
  orders:  {},     // { itemId: qty }
  payment: '',
};

/* ─── DOM REFERENCES ────────────────────────────── */
const $ = id => document.getElementById(id);

function getJakartaNow() {
  const d = new Date();
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const hour = Number(parts.find(p => p.type === 'hour')?.value || 0);
  const minute = Number(parts.find(p => p.type === 'minute')?.value || 0);
  return { dateStr, minutes: (hour * 60) + minute };
}

function parseTimeToMinutes(hhmm) {
  const [h, m] = String(hhmm || '').split(':');
  return (Number(h) * 60) + Number(m);
}

// Steps
const steps    = [1, 2, 3].map(i => $(`step-${i}`));
const siSteps  = [1, 2, 3].map(i => $(`si-${i}`));
const siLines  = [1, 2].map(i => $(`sl-${i}`));

/* ─── INIT ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  setMinDate();
  initGuestsSteper();
  initAreaCards();
  initStep1Next();
  initMenuFilter();
  renderMenuItems('kopi');
  initStep2Next();
  initPaymentOptions();
  initSubmit();
});

/* ─── STEP NAVIGATION ───────────────────────────── */
function goToStep(n) {
  state.step = n;
  steps.forEach((el, i) => el.classList.toggle('active', i + 1 === n));
  siSteps.forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i + 1 === n)       el.classList.add('active');
    if (i + 1 < n)         el.classList.add('done');
    el.querySelector('.si-circle').textContent = (i + 1 < n) ? '✓' : (i + 1);
  });
  siLines.forEach((el, i) => el.classList.toggle('done', i + 1 < n));

  // Show/hide sticky bars
  const totalBar  = $('order-total-bar');
  const step3Bar  = $('step3-bar');
  if (totalBar) totalBar.style.display  = n === 2 ? 'block' : 'none';
  if (step3Bar) step3Bar.style.display  = n === 3 ? 'block' : 'none';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ─── STEP 1 ────────────────────────────────────── */
function setMinDate() {
  const dateInput = $('f-date');
  if (!dateInput) return;
  const today = getJakartaNow().dateStr;
  dateInput.min = today;
  dateInput.value = today;
  dateInput.addEventListener('change', () => {
    state.time = '';
    const hidden = $('f-time');
    if (hidden) hidden.value = '';
    loadAndRenderSlots();
  });
  // Load slots untuk tanggal hari ini langsung
  loadAndRenderSlots();
}

function initGuestsSteper() {
  const val = $('guests-val');
  $('guests-minus').addEventListener('click', () => {
    if (state.guests > 1) { state.guests--; val.textContent = state.guests; }
    updateMinOrderBar();
    reRenderSlotsFromCache();
  });
  $('guests-plus').addEventListener('click', () => {
    if (state.guests < 45) { state.guests++; val.textContent = state.guests; }
    updateMinOrderBar();
    reRenderSlotsFromCache();
  });
}

function initAreaCards() {
  document.querySelectorAll('.area-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.area-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.area = card.querySelector('input').value;
      $('err-area').textContent = '';
      // Reset slot selection dan reload slots dengan area conflict
      state.time = '';
      const hidden = $('f-time');
      if (hidden) hidden.value = '';
      delete _slotAvailCache[$('f-date').value + '_blocked'];
      loadAndRenderSlots();
    });
  });
}

function initStep1Next() {
  $('next-1').addEventListener('click', () => {
    if (!validateStep1()) return;
    state.name  = $('f-name').value.trim();
    state.phone = $('f-phone').value.trim();
    state.date  = $('f-date').value;
    state.time  = $('f-time').value;
    state.note  = $('f-note').value.trim();

    // Update step 2 sub text (70% rule)
    const minRequired = Math.ceil(state.guests * 0.7);
    $('step2-sub').textContent =
      `Min. ${minRequired} item wajib pre-order (70% dari ${state.guests} orang). Sisa ${state.guests - minRequired} orang boleh pesan saat hadir.`;
    updateMinOrderBar();
    renderMenuItems(document.querySelector('.menu-filter-btn.active')?.dataset.cat || 'kopi');
    goToStep(2);
  });
}

function validateStep1() {
  let ok = true;
  const name  = $('f-name').value.trim();
  const phone = $('f-phone').value.trim();
  const date  = $('f-date').value;
  const time  = $('f-time').value;

  if (!name)  { showErr('f-name',  'err-name',  'Nama tidak boleh kosong.'); ok = false; }
  else         clearErr('f-name', 'err-name');

  if (!phone || !/^(\+62|62|0)8[0-9]{8,12}$/.test(phone.replace(/\s/g, ''))) {
    showErr('f-phone', 'err-phone', 'Nomor HP tidak valid (contoh: 08123456789).');
    ok = false;
  } else clearErr('f-phone', 'err-phone');

  if (!date)  { showErr('f-date',  'err-date',  'Pilih tanggal kunjungan.'); ok = false; }
  else         clearErr('f-date', 'err-date');

  if (!time)  { showErr('f-time',  'err-time',  'Pilih jam kedatangan.'); ok = false; }
  else         clearErr('f-time', 'err-time');

  if (!state.area) { $('err-area').textContent = 'Pilih salah satu area.'; ok = false; }
  else              $('err-area').textContent = '';

  return ok;
}

function showErr(inputId, errId, msg) {
  const el = $(inputId);
  if (el) el.classList.add('error');
  const err = $(errId);
  if (err) err.textContent = msg;
}
function clearErr(inputId, errId) {
  const el = $(inputId);
  if (el) el.classList.remove('error');
  const err = $(errId);
  if (err) err.textContent = '';
}

/* ─── STEP 2: MENU ──────────────────────────────── */
function initMenuFilter() {
  document.querySelectorAll('.menu-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.menu-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMenuItems(btn.dataset.cat);
    });
  });
}

function renderMenuItems(cat) {
  const grid  = $('menu-order-grid');
  if (!grid) return;
  const items = RASKOP.menu[cat] || [];
  grid.innerHTML = '';

  items.forEach(item => {
    const qty = state.orders[item.id] || 0;
    const div = document.createElement('div');
    div.className = 'menu-order-item' + (qty > 0 ? ' has-qty' : '');
    div.id = `moi-${item.id}`;
    div.innerHTML = `
      <div class="item-info">
        <div class="item-name">${item.emoji} ${item.name}${item.bestseller ? ' <span style="font-size:.7rem;background:rgba(224,135,86,.15);color:var(--amber);padding:2px 8px;border-radius:20px;font-weight:700;">Best Seller</span>' : ''}</div>
        <div class="item-desc">${item.desc}</div>
        <div class="item-price">${formatRupiah(item.price)}</div>
      </div>
      <div class="item-counter">
        <button class="counter-btn" data-id="${item.id}" data-action="minus" type="button">−</button>
        <div class="counter-val" id="cv-${item.id}">${qty}</div>
        <button class="counter-btn" data-id="${item.id}" data-action="plus"  type="button">+</button>
      </div>
    `;
    grid.appendChild(div);
  });

  // Attach counter events
  grid.querySelectorAll('.counter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id     = btn.dataset.id;
      const action = btn.dataset.action;
      const allItems = Object.values(RASKOP.menu).flat();
      const item   = allItems.find(m => m.id === id);
      if (!item) return;

      if (action === 'plus') {
        state.orders[id] = (state.orders[id] || 0) + 1;
      } else {
        if ((state.orders[id] || 0) > 0) state.orders[id]--;
        if (state.orders[id] === 0) delete state.orders[id];
      }

      const cv  = $(`cv-${id}`);
      const moi = $(`moi-${id}`);
      if (cv)  cv.textContent  = state.orders[id] || 0;
      if (moi) moi.classList.toggle('has-qty', (state.orders[id] || 0) > 0);

      updateTotalBar();
      updateMinOrderBar();
    });
  });
}

function getTotalItems()  { return Object.values(state.orders).reduce((s, q) => s + q, 0); }
function getTotalPrice()  {
  const allItems = Object.values(RASKOP.menu).flat();
  return Object.entries(state.orders).reduce((sum, [id, qty]) => {
    const item = allItems.find(m => m.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);
}

function updateTotalBar() {
  const items = getTotalItems();
  const price = getTotalPrice();
  const tv = $('total-val');
  const ti = $('total-items');
  if (tv) tv.textContent = formatRupiah(price);
  if (ti) ti.textContent = `${items} item dipilih`;
}

function updateMinOrderBar() {
  const bar  = $('min-order-bar');
  const icon = $('min-order-icon');
  const text = $('min-order-text');
  if (!bar) return;

  const items    = getTotalItems();
  const required = Math.ceil(state.guests * 0.7);

  if (items === 0) {
    bar.className    = 'min-order-bar notok';
    icon.textContent = '⚠️';
    text.textContent = `Belum ada menu yang dipilih (min. ${required} item untuk ${state.guests} orang)`;
  } else if (items < required) {
    bar.className    = 'min-order-bar notok';
    icon.textContent = '⚠️';
    text.textContent = `Tambah ${required - items} item lagi (min. 70% = ${required} item dari ${state.guests} orang)`;
  } else {
    bar.className    = 'min-order-bar ok';
    icon.textContent = '\u2705';
    text.textContent = `Syarat 70% terpenuhi! (${items} item pre-order untuk ${state.guests} orang)`;
  }
}

function initStep2Next() {
  $('next-2').addEventListener('click', () => {
    const items    = getTotalItems();
    const required = Math.ceil(state.guests * 0.7);
    if (items < 1) {
      alert('Pilih minimal 1 menu dulu ya!');
      return;
    }
    if (items < required) {
      alert(`Minimal 70% dari ${state.guests} orang harus pre-order = ${required} item. Sekarang baru ${items} item.`);
      return;
    }
    buildReviewStep();
    goToStep(3);
  });

  // Back from step 2
  const back2 = document.createElement('button');
  back2.className = 'btn btn-ghost';
  back2.type = 'button';
  back2.style.cssText = 'margin-right:auto;';
  back2.textContent = '← Edit Info';
  back2.addEventListener('click', () => goToStep(1));
  const bar = $('order-total-bar');
  if (bar) {
    const inner = bar.querySelector('.order-total-inner');
    if (inner) inner.insertBefore(back2, inner.firstChild);
  }
}

/* ─── STEP 3: REVIEW & PAY ──────────────────────── */
function buildReviewStep() {
  const areaMap = { indoor: 'Indoor', outdoor: 'Outdoor', study: 'Study Zone' };

  $('rv-name').textContent   = state.name;
  $('rv-phone').textContent  = state.phone;
  $('rv-date').textContent   = formatDate(state.date);
  $('rv-time').textContent   = state.time + ' WIB';
  $('rv-area').textContent   = areaMap[state.area] || state.area;
  $('rv-guests').textContent = state.guests + ' orang';

  const noteRow = $('rv-note-row');
  if (state.note) {
    $('rv-note').textContent = state.note;
    if (noteRow) noteRow.style.display = '';
  } else {
    if (noteRow) noteRow.style.display = 'none';
  }

  // Orders
  const orderList = $('rv-orders');
  if (orderList) {
    orderList.innerHTML = '';
    const allItems = Object.values(RASKOP.menu).flat();
    Object.entries(state.orders).forEach(([id, qty]) => {
      const item = allItems.find(m => m.id === id);
      if (!item) return;
      const row = document.createElement('div');
      row.className = 'review-order-item';
      row.innerHTML = `
        <span class="review-order-name">${item.emoji} ${item.name}</span>
        <span class="review-order-qty">x${qty}</span>
        <span class="review-order-price">${formatRupiah(item.price * qty)}</span>
      `;
      orderList.appendChild(row);
    });
  }

  $('rv-total').textContent = formatRupiah(getTotalPrice());

  // Bank list
  renderBankList();
}

function renderBankList() {
  const el = $('bank-list');
  if (!el) return;
  const banks = RASKOP.config.payment.transfer.banks;
  el.innerHTML = banks.map(b => `
    <div class="bank-row">
      <span class="bank-name">${b.name}</span>
      <div>
        <div class="bank-no">${b.no}</div>
        <div class="bank-an">a.n. ${b.an}</div>
      </div>
    </div>
  `).join('');
}

function initPaymentOptions() {
  document.querySelectorAll('.payment-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.payment = card.querySelector('input').value;

      // Show/hide details
      $('detail-qris').classList.toggle('visible',      state.payment === 'QRIS');
      $('detail-transfer').classList.toggle('visible',  state.payment === 'Bank Transfer');
      $('detail-midtrans').classList.toggle('visible',  state.payment === 'Midtrans E-Wallet');
      $('err-payment').textContent = '';
    });
  });

  // Back button (step 3 → step 2)
  $('back-3').addEventListener('click', () => goToStep(2));
}

/* ─── SUBMIT ─────────────────────────────────────── */
function initSubmit() {
  $('submit-btn').addEventListener('click', async () => {
    const nowJkt = getJakartaNow();
    if (state.date === nowJkt.dateStr && state.time && parseTimeToMinutes(state.time) <= nowJkt.minutes) {
      const errTime = $('err-time');
      if (errTime) errTime.textContent = 'Jam yang dipilih sudah lewat. Pilih jam berikutnya.';
      const target = $('slot-picker') || $('err-time');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!state.payment) {
      $('err-payment').textContent = 'Pilih metode pembayaran terlebih dahulu.';
      $('err-payment').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const btn = $('submit-btn');
    btn.disabled    = true;
    btn.textContent = '\u23F3 Mengirim reservasi...';

    const allItems  = Object.values(RASKOP.menu).flat();
    const orderList = Object.entries(state.orders).map(([id, qty]) => {
      const item = allItems.find(m => m.id === id);
      return item ? { id: item.id, name: item.name, qty, price: item.price } : null;
    }).filter(Boolean);

    const reservationId = generateReservationId();

    let success = false;

    try {
      const isoDateTime = new Date().toISOString().slice(0, 19);
      const areaMap2    = { indoor: 'Indoor', outdoor: 'Outdoor', study: 'Study Zone' };
      const menuLines   = orderList.map(o => `  - ${o.name} x${o.qty} (${formatRupiah(o.price * o.qty)})`).join('\n');
      const adminMsg    = [
        `*RESERVASI BARU - RASKOP*`, ``,
        `ID: *${reservationId}*`,
        `Nama: ${state.name}`, `HP: ${state.phone}`,
        `Tanggal: ${state.date} ${state.time}`,
        `Area: ${areaMap2[state.area] || state.area}`,
        `Tamu: ${state.guests} orang`, `Bayar: ${state.payment}`, ``,
        `*Pre-Order:*`, menuLines, ``,
        `*Total: ${formatRupiah(getTotalPrice())}*`, ``,
        `Buka admin dashboard untuk konfirmasi.`,
      ].join('\n');

      const resp = await fetch('/.netlify/functions/reservation', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            'Name':          reservationId,
            'Nama Customer': state.name,
            'WhatsApp':      state.phone,
            'WhatsApp Raw':  state.phone.replace(/^\+/, '').replace(/^0/, '62').replace(/\D/g, ''),
            'Jumlah Orang':  state.guests,
            'Tanggal':       state.date,
            'Jam':           state.time,
            'Area':          state.area,
            'Orders':        JSON.stringify(orderList),
            'Total Items':   getTotalItems(),
            'Total Harga':   getTotalPrice(),
            'Metode Bayar':  state.payment,
            'Status':        'pending',
            'Catatan':       state.note || '-',
            'Dibuat':        isoDateTime,
          },
          adminMsg,
          autoConfirm: { date: state.date, time: state.time, area: state.area },
        }),
      });
      if (!resp.ok) throw new Error(`Server error ${resp.status}`);
      success = true;
    } catch (e) {
      console.error('Reservasi Error:', e.message);
      success = false;
    }

    if (success) {
      showSuccess(reservationId);
    } else {
      btn.disabled    = false;
      btn.textContent = '\u2705 Submit Reservasi';
      alert('Terjadi kesalahan. Coba lagi atau hubungi kami langsung.');
    }
  });
}

function launchConfetti() {
  const container = document.getElementById('bsp-confetti');
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#e91e63','#9b59b6','#1abc9c','#ff5722','#00bcd4','#ffeb3b','#ff4081','#69f0ae'];
  const shapes = ['rect','circle','rect','rect'];
  for (let i = 0; i < 72; i++) {
    const el = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const size  = 6 + Math.random() * 8;
    const left  = Math.random() * 100;
    const delay = Math.random() * 1.2;
    const dur   = 1.8 + Math.random() * 1.4;
    el.className = 'bsp-piece';
    el.style.cssText = [
      `left:${left}%`,
      `width:${shape === 'circle' ? size : size * (0.4 + Math.random() * 0.8)}px`,
      `height:${size}px`,
      `background:${color}`,
      `border-radius:${shape === 'circle' ? '50%' : '2px'}`,
      `animation-duration:${dur}s`,
      `animation-delay:${delay}s`,
      `opacity:0`,
    ].join(';');
    container.appendChild(el);
  }
}

function showBookingPopup(onClose) {
  const popup = document.getElementById('booking-success-popup');
  if (!popup) { onClose(); return; }
  launchConfetti();
  popup.classList.add('active');

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    popup.classList.remove('active');
    setTimeout(onClose, 350);
  }

  document.getElementById('bsp-close').addEventListener('click', close, { once: true });
  const autoTimer = setTimeout(close, 5000);
  popup.addEventListener('click', (e) => {
    if (e.target === popup) { clearTimeout(autoTimer); close(); }
  }, { once: true });
}

function showSuccess(id) {
  // Show booking popup first, then reveal the full success section
  showBookingPopup(() => {
    // Hide all steps and step indicator
    document.querySelectorAll('.res-step').forEach(s => { s.classList.remove('active'); s.style.display = 'none'; });
    document.querySelectorAll('.order-total-bar, .si-line, .step-indicator').forEach(el => { if (el) el.style.display = 'none'; });

    $('success-id').textContent = id;

    const success = $('res-success');
    success.classList.add('active');
    success.style.display = 'flex';
  });

  // Build WhatsApp confirmation message
  const areaMap  = { indoor: 'Indoor', outdoor: 'Outdoor', study: 'Study Zone' };
  const allItems = Object.values(RASKOP.menu).flat();
  const orderLines = Object.entries(state.orders).map(([itemId, qty]) => {
    const item = allItems.find(m => m.id === itemId);
    return item ? `- ${item.name} x${qty} = ${formatRupiah(item.price * qty)}` : '';
  }).filter(Boolean).join('\n');

  const msg = [
    `Halo Admin Raskop!`,
    ``,
    `Saya ingin konfirmasi reservasi berikut:`,
    ``,
    `ID: ${id}`,
    `Nama: ${state.name}`,
    `No. HP: ${state.phone}`,
    `Jumlah Tamu: ${state.guests} orang`,
    `Tanggal: ${formatDate(state.date)}`,
    `Jam: ${state.time} WIB`,
    `Area: ${areaMap[state.area] || state.area}`,
    ``,
    `Pre-Order:`,
    orderLines,
    ``,
    `Pembayaran: ${state.payment}`,
    `Total: ${formatRupiah(getTotalPrice())}`,
    ``,
    `Mohon dikonfirmasi. Terima kasih!`,
  ].join('\n');

  const adminPhone = RASKOP.config.adminPhone;
  const waBtn = $('wa-confirm-btn');
  if (waBtn) waBtn.href = `https://wa.me/${adminPhone}?text=${encodeURIComponent(msg)}`;

  // Tombol tambahan — bukti transfer (Bank Transfer) atau minta link (Midtrans)
  const buktiBtnEl = $('wa-bukti-btn');
  if (buktiBtnEl) {
    if (state.payment === 'Bank Transfer') {
      const buktiMsg = [
        `Halo Admin Raskop!`,
        ``,
        `Berikut bukti transfer untuk reservasi saya:`,
        ``,
        `ID Reservasi: *${id}*`,
        `Nama: ${state.name}`,
        `Jumlah Transfer: ${formatRupiah(getTotalPrice())}`,
        `Ke rekening BCA 1342714409 a.n. Adhitya Nugraha`,
        ``,
        `*(Foto bukti transfer saya lampirkan di bawah)*`,
      ].join('\n');
      buktiBtnEl.textContent = '\u{1F4F8} Kirim Bukti Transfer';
      buktiBtnEl.href = `https://wa.me/${adminPhone}?text=${encodeURIComponent(buktiMsg)}`;
      buktiBtnEl.style.display = 'flex';
    } else if (state.payment === 'Midtrans E-Wallet') {
      const midtransMsg = [
        `Halo Admin Raskop!`,
        ``,
        `Saya sudah booking dengan pembayaran Midtrans E-Wallet.`,
        `Mohon kirimkan link pembayaran Midtrans ke nomor ini ya!`,
        ``,
        `ID Reservasi: *${id}*`,
        `Nama: ${state.name}`,
        `Total: ${formatRupiah(getTotalPrice())}`,
        ``,
        `Terima kasih!`,
      ].join('\n');
      buktiBtnEl.textContent = '\u26A1 Minta Link Midtrans';
      buktiBtnEl.href = `https://wa.me/${adminPhone}?text=${encodeURIComponent(midtransMsg)}`;
      buktiBtnEl.style.display = 'flex';
    }
  }

  // Reset on "Reservasi Baru"
  $('new-reservation').addEventListener('click', () => window.location.reload());
}

/* ─── SLOT PICKER ───────────────────────────────── */

let _slotAvailCache = {}; // { 'YYYY-MM-DD': { 'HH:MM': bookedCount } }

async function loadAndRenderSlots() {
  const date = $('f-date').value;
  const area = state.area;
  const picker = $('slot-picker');
  if (!picker) return;

  // Belum pilih area — tampilkan hint
  if (!date || !area) {
    picker.innerHTML = `
      <div class="slot-picker-hint">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        Pilih area terlebih dahulu untuk melihat ketersediaan slot
      </div>`;
    return;
  }

  // Show loading skeletons
  const times = RASKOP.config.slots.times;
  picker.innerHTML = `<div class="slot-grid-loading">${times.map(() => '<div class="slot-card-skeleton"></div>').join('')}</div>`;

  let bookedBySlot = {};

  try {
    const res  = await fetch(`/.netlify/functions/slots?date=${date}&area=${area}`);
    const data = await res.json();
    bookedBySlot = data.bookedBySlot || {};
    const cacheKey = `${date}_${area}`;
    _slotAvailCache[cacheKey + '_blocked'] = data.blockedHours || [];
    _slotAvailCache[cacheKey] = bookedBySlot;
  } catch (e) {
    console.warn('loadAndRenderSlots error:', e);
  }

  renderSlotPicker(date, bookedBySlot);
}

function reRenderSlotsFromCache() {
  const date = $('f-date').value;
  const area = state.area;
  if (!date || !area) return;
  const cacheKey = `${date}_${area}`;
  renderSlotPicker(date, _slotAvailCache[cacheKey] || {});
}

function renderSlotPicker(date, bookedBySlot) {
  const picker    = $('slot-picker');
  const area      = state.area;
  const capacity  = RASKOP.config.areaCapacity[area] || RASKOP.config.slots.defaultCapacity;
  const times     = RASKOP.config.slots.times;
  const cacheKey  = `${date}_${area}`;
  const blockedHours = _slotAvailCache[cacheKey + '_blocked'] || [];
  const nowJkt = getJakartaNow();
  const isPastDate = date && date < nowJkt.dateStr;
  const isToday = date === nowJkt.dateStr;

  if ((isToday || isPastDate) && state.time && parseTimeToMinutes(state.time) <= nowJkt.minutes) {
    state.time = '';
    const hidden = $('f-time');
    if (hidden) hidden.value = '';
  }

  const visibleTimes = times.filter(time => {
    if (isPastDate) return false;
    if (!isToday) return true;
    return parseTimeToMinutes(time) > nowJkt.minutes;
  });

  if (!visibleTimes.length) {
    picker.innerHTML = `
      <div class="slot-picker-hint">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        Tidak ada slot tersisa untuk hari ini. Silakan pilih tanggal lain.
      </div>`;
    return;
  }

  const cards = visibleTimes.map(time => {
    const h           = parseInt(time.split(':')[0], 10);
    const booked      = bookedBySlot[time] || 0;
    const fillPct     = Math.min(100, Math.round((booked / capacity) * 100));
    const areaBlocked = blockedHours.some(bh => Math.abs(bh - h) < 3);
    const cantFit     = (booked + state.guests) > capacity;

    let slotStatus;
    if (fillPct >= 100)      slotStatus = 'full';
    else if (fillPct >= 70)  slotStatus = 'locked';
    else if (fillPct >= 50)  slotStatus = 'hampir';
    else                     slotStatus = 'open';

    const isDisabled = slotStatus === 'locked' || slotStatus === 'full' || areaBlocked || cantFit;
    const isSelected = state.time === time;

    const badgeMap = {
      open:   { label: 'Tersedia',     cls: 'badge-open'   },
      hampir: { label: 'Hampir Penuh', cls: 'badge-hampir' },
      locked: { label: 'Locked \u{1F534}',    cls: 'badge-locked' },
      full:   { label: 'Penuh',        cls: 'badge-full'   },
    };
    const badge = badgeMap[slotStatus];

    let extraNote = '';
    if (areaBlocked && !cantFit && slotStatus !== 'locked' && slotStatus !== 'full') {
      extraNote = '<span class="slot-area-note">Area sibuk</span>';
    } else if (cantFit && slotStatus !== 'locked' && slotStatus !== 'full') {
      extraNote = `<span class="slot-area-note">${state.guests} tamu tidak muat</span>`;
    }

    return `
      <button
        type="button"
        class="slot-card ${slotStatus}${isSelected ? ' selected' : ''}${isDisabled ? ' disabled' : ''}"
        onclick="selectSlot('${time}')"
        ${isDisabled ? 'disabled' : ''}
        aria-label="${time} \u2014 ${badge.label}"
      >
        <div class="slot-card-time">${time}</div>
        <div class="slot-progress-wrap">
          <div class="slot-progress-bar">
            <div class="slot-progress-fill" style="width:${fillPct}%"></div>
          </div>
        </div>
        <div class="slot-card-count">${booked}/${capacity}</div>
        <div class="slot-badge ${badge.cls}">${badge.label}</div>
        ${extraNote}
      </button>`;
  }).join('');

  picker.innerHTML = `<div class="slot-grid">${cards}</div>`;
}

function selectSlot(time) {
  state.time = time;
  const hidden = $('f-time');
  if (hidden) hidden.value = time;
  const err = $('err-time');
  if (err) err.textContent = '';
  reRenderSlotsFromCache();
}

function getSlotCapacity() {
  const stored = localStorage.getItem('raskop_slot_capacity');
  if (stored && !isNaN(Number(stored))) return Number(stored);
  return RASKOP.config.slots.defaultCapacity;
}
