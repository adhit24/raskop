/* =====================================================
   RASKOP — Admin Dashboard Logic
   admin.js
   ===================================================== */

/* ─── STATE ─────────────────────────────────────── */
let allReservations = [];
let currentTab      = 'pending';
let searchQuery     = '';
let dateFilter      = '';
let authenticated   = false;
let adminToken      = '';

/* ─── DOM HELPERS ───────────────────────────────── */
const $ = id => document.getElementById(id);

/* ─── XSS ESCAPE ────────────────────────────────── */
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ─── TOKEN HELPERS ─────────────────────────────── */
function tokenIsValid(token) {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot === -1) return false;
  const exp = parseInt(token.slice(0, dot), 36);
  return !isNaN(exp) && exp > Date.now();
}

/* ─── AUTH ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const gate = $('admin-gate');

  // Check session
  const stored = sessionStorage.getItem('raskop_admin_token');
  if (stored && tokenIsValid(stored)) {
    adminToken    = stored;
    authenticated = true;
    if (gate) gate.classList.add('hidden');
    init();
    return;
  }

  // Password input submit on Enter
  $('gate-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') $('gate-submit').click();
  });

  $('gate-submit').addEventListener('click', async () => {
    const pw  = $('gate-password').value;
    const btn = $('gate-submit');
    btn.disabled    = true;
    btn.textContent = '⏳...';
    try {
      const resp = await fetch('/.netlify/functions/admin-auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password: pw }),
      });
      if (resp.ok) {
        const { token } = await resp.json();
        sessionStorage.setItem('raskop_admin_token', token);
        adminToken    = token;
        authenticated = true;
        if (gate) { gate.style.opacity = 0; setTimeout(() => gate.classList.add('hidden'), 400); }
        init();
      } else {
        $('gate-error').textContent = 'Password salah. Coba lagi.';
        $('gate-password').classList.add('error');
      }
    } catch {
      $('gate-error').textContent = 'Gagal terhubung ke server.';
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Masuk';
    }
  });

  $('admin-logout').addEventListener('click', () => {
    sessionStorage.removeItem('raskop_admin_token');
    window.location.reload();
  });
});

/* ─── INIT ──────────────────────────────────────── */
async function init() {
  dateFilter = '';

  $('admin-search').addEventListener('input', e => { searchQuery = e.target.value.toLowerCase(); render(); });
  $('admin-date').addEventListener('change', e => { dateFilter = e.target.value; render(); });
  $('admin-refresh').addEventListener('click', loadData);

  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      const panel = $(`panel-${currentTab}`);
      if (panel) panel.classList.add('active');
      if (currentTab === 'crm')   renderCRM();
      else if (currentTab === 'slots') renderSlotManager();
      else render();
    });
  });

  await loadData();
  setInterval(loadData, 60000);
}

/* ─── LOAD DATA ─────────────────────────────────── */
async function loadData() {
  const btn = $('admin-refresh');
  if (btn) btn.textContent = '⏳ Loading...';

  try {
    const res = await fetch('/.netlify/functions/admin-reservations', {
      headers: { 'x-admin-token': adminToken },
    });
    if (!res.ok) {
      allReservations = getDemoData();
    } else {
      const { records: allRecords } = await res.json();
      allReservations = (allRecords || []).map(r => ({
        _recordId:     r.id,
        id:            r.fields['Name']              || '',
        name:          r.fields['Nama Customer']     || '',
        phone:         r.fields['WhatsApp']          || '',
        guests:        r.fields['Jumlah Orang']      || 0,
        date:          (r.fields['Tanggal'] || '').slice(0, 10),
        time:          r.fields['Jam']               || '',
        area:          r.fields['Area']              || '',
        orders:        safeParseOrders(r.fields['Orders']),
        totalItems:    r.fields['Total Items']       || 0,
        totalPrice:    r.fields['Total Harga']       || 0,
        paymentMethod: r.fields['Metode Bayar']      || '',
        status:        r.fields['Status']            || 'pending',
        note:          r.fields['Catatan']           || '',
        createdAt:     r.fields['Dibuat']            || '',
      })).filter(r => r.name.trim() || r.phone.trim());
    }
  } catch (e) {
    console.error('Failed to load:', e);
    allReservations = getDemoData();
  }

  updateStats();
  loadQuota();
  render();

  const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  if ($('last-refresh')) $('last-refresh').textContent = `Terakhir diperbarui ${now}`;
  if (btn) btn.textContent = '🔄 Refresh';
}

/* ─── QUOTA ─────────────────────────────────────── */
async function loadQuota() {
  const quota = await fetchQuota(dateFilter || undefined);
  const fill  = $('admin-quota-fill');
  const meta  = $('admin-quota-meta');
  if (fill) fill.style.width = quota.percentage + '%';
  if (meta) meta.textContent = `${quota.totalGuests} / ${quota.reservedSeats} tamu (${quota.percentage}%)`;
}

/* ─── STATS ─────────────────────────────────────── */
function updateStats() {
  const pending   = allReservations.filter(r => r.status === 'pending').length;
  const confirmed = allReservations.filter(r => r.status === 'confirmed').length;
  const rejected  = allReservations.filter(r => r.status === 'rejected').length;

  $('stat-pending').textContent   = pending;
  $('stat-confirmed').textContent = confirmed;
  $('stat-rejected').textContent  = rejected;
  $('stat-total').textContent     = allReservations.length;

  $('tc-pending').textContent   = pending;
  $('tc-confirmed').textContent = confirmed;
  $('tc-rejected').textContent  = rejected;
}

/* ─── RENDER ─────────────────────────────────────── */
function render() {
  const filtered = allReservations.filter(r => {
    const matchSearch = !searchQuery ||
      (r.name  || '').toLowerCase().includes(searchQuery) ||
      (r.id    || '').toLowerCase().includes(searchQuery) ||
      (r.phone || '').toLowerCase().includes(searchQuery);
    const matchDate = !dateFilter || r.date === dateFilter;
    const matchTab  = currentTab === 'all' || r.status === currentTab;
    return matchSearch && matchDate && matchTab;
  });

  filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  ['pending', 'confirmed', 'rejected', 'all'].forEach(tab => {
    const panel = $(`panel-${tab}`);
    if (!panel) return;
    const items = tab === 'all' ? filtered : filtered.filter(r => r.status === tab);
    panel.innerHTML = '';

    if (items.length === 0) {
      panel.innerHTML = `
        <div class="admin-empty">
          <div class="admin-empty-icon">${tab === 'pending' ? '⏳' : tab === 'confirmed' ? '✅' : tab === 'rejected' ? '❌' : '📋'}</div>
          <p>Tidak ada reservasi ${tab === 'all' ? '' : `dengan status ${tab}`} ${dateFilter ? `pada tanggal ${formatDate(dateFilter)}` : ''}</p>
        </div>`;
      return;
    }
    items.forEach(r => panel.appendChild(createCard(r)));
  });
}

/* ─── CARD ──────────────────────────────────────── */
function createCard(r) {
  const el = document.createElement('div');
  el.className = 'res-card';
  el.id = `card-${r.id}`;

  const areaMap   = { indoor: '🏠 Indoor', outdoor: '🌿 Outdoor', study: '📚 Study Zone' };
  const areaLabel = areaMap[r.area] || esc(r.area);

  const orderItems = Array.isArray(r.orders)
    ? r.orders.map(o => `
        <div class="res-order-item">
          <span class="res-order-name">${esc(o.name || o.id)} x${Number(o.qty)}</span>
          <span class="res-order-price">${formatRupiah((Number(o.price) || 0) * (Number(o.qty) || 1))}</span>
        </div>`).join('')
    : '<div style="color:var(--muted);font-size:.82rem;">Tidak ada data menu</div>';

  const isPending   = r.status === 'pending';
  const isConfirmed = r.status === 'confirmed';

  const actionBtns = isPending
    ? `<button class="action-btn action-confirm" onclick="updateStatus('${esc(r.id)}','confirmed')">✅ Konfirmasi</button>
       <button class="action-btn action-reject"  onclick="updateStatus('${esc(r.id)}','rejected')">❌ Tolak</button>`
    : `<button class="action-btn action-done">${isConfirmed ? '✅ Sudah Dikonfirmasi' : '❌ Ditolak'}</button>`;

  el.innerHTML = `
    <div class="res-card-top">
      <div>
        <div class="res-card-id">${esc(r.id)}</div>
        <div class="res-card-time">${esc(r.createdAt) || '—'}</div>
      </div>
      <span class="status-badge ${r.status}">${r.status === 'pending' ? '⏳ Menunggu' : r.status === 'confirmed' ? '✅ Dikonfirmasi' : '❌ Ditolak'}</span>
    </div>

    <div class="res-card-info">
      <div class="res-info-item">
        <div class="res-info-label">Nama</div>
        <div class="res-info-val">${esc(r.name)}</div>
      </div>
      <div class="res-info-item">
        <div class="res-info-label">No. HP</div>
        <div class="res-info-val" style="font-family:var(--font-mono);font-size:.85rem;">${esc(r.phone)}</div>
      </div>
      <div class="res-info-item">
        <div class="res-info-label">Tanggal & Jam</div>
        <div class="res-info-val">${esc(r.date)} · ${esc(r.time)}</div>
      </div>
      <div class="res-info-item">
        <div class="res-info-label">Area · Tamu</div>
        <div class="res-info-val">${areaLabel} · ${Number(r.guests)} orang</div>
      </div>
    </div>

    <div class="res-card-orders">
      <div class="res-orders-label">Pre-Order Menu</div>
      <div class="res-orders-list">${orderItems}</div>
    </div>

    <div class="res-payment-row">
      💳 <span class="res-payment-val">${esc(r.paymentMethod) || '—'}</span>
      ${r.note && r.note !== '-' ? `&nbsp;·&nbsp; 📝 <span style="color:rgba(255,255,255,.6)">${esc(r.note)}</span>` : ''}
    </div>

    <div class="res-card-actions">
      <div class="res-card-total">
        <span class="res-card-total-label">Total:</span>
        <span class="res-card-total-val">${formatRupiah(r.totalPrice || 0)}</span>
      </div>
      ${actionBtns}
    </div>
  `;
  return el;
}

/* ─── UPDATE STATUS ─────────────────────────────── */
async function updateStatus(id, status) {
  const card = $(`card-${id}`);
  if (card) {
    card.querySelectorAll('.action-btn').forEach(b => { b.disabled = true; b.textContent = '⏳ Proses...'; });
  }

  const r = allReservations.find(x => x.id === id);
  if (r && r._recordId) {
    const userPhone = String(r.phone || '').replace(/^\+/, '').replace(/^0/, '62').replace(/\D/g, '');
    const icon  = status === 'confirmed' ? '✅' : '❌';
    const label = status === 'confirmed' ? 'DIKONFIRMASI' : 'DITOLAK';
    const extra = status === 'confirmed'
      ? `\n\n📌 Tunjukkan ID ini saat tiba.\n⏰ Harap datang tepat waktu. Toleransi keterlambatan 15 menit.`
      : `\n\nMaaf, reservasimu tidak dapat kami proses saat ini.\nSilakan hubungi kami untuk info lebih lanjut.`;
    const msg = [
      `${icon} *RESERVASI ${label}*`,
      ``,
      `Halo ${r.name}! Reservasimu di Raskop telah ${label.toLowerCase()}.`,
      ``,
      `📋 ID: *${r.id}*`,
      `📅 ${r.date} · ${r.time}`,
      `📍 Area: ${r.area ? r.area.toUpperCase() : '-'}` + extra,
    ].join('\n');

    const adminNotifyMsg = status === 'confirmed' ? [
      `✅ *BOOKING DIKONFIRMASI*`,
      ``,
      `📋 ID: *${r.id}*`,
      `👤 ${r.name}`,
      `📞 ${r.phone || '-'}`,
      `📅 ${r.date} · ${r.time}`,
      `📍 Area: ${r.area ? r.area.toUpperCase() : '-'}`,
      `👥 ${r.guests || '-'} orang`,
    ].join('\n') : null;

    try {
      await fetch('/.netlify/functions/admin-update', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body:    JSON.stringify({
          recordId: r._recordId,
          status,
          waPhone: userPhone || null,
          waMsg:   userPhone ? msg : null,
          adminNotifyMsg,
        }),
      });
    } catch (e) {
      console.warn('Update error:', e);
    }
  }

  if (r) r.status = status;
  updateStats();
  render();
}

function safeParseOrders(str) {
  try { return JSON.parse(str); } catch { return []; }
}

/* ─── CRM LITE ──────────────────────────────── */
function renderCRM() {
  const panel = $('panel-crm');
  if (!panel) return;

  const customers = {};
  allReservations.forEach(r => {
    if (r.status === 'rejected') return;
    const key = r.phone || 'unknown';
    if (!customers[key]) {
      customers[key] = { name: r.name, phone: r.phone, visits: 0, totalSpend: 0, lastDate: '', lastStatus: '', bookings: [] };
    }
    customers[key].visits++;
    customers[key].totalSpend += Number(r.totalPrice || 0);
    if (!customers[key].lastDate || r.date > customers[key].lastDate) {
      customers[key].lastDate   = r.date;
      customers[key].lastStatus = r.status;
    }
    customers[key].bookings.push(r);
  });

  const rows = Object.values(customers).sort((a, b) => b.visits - a.visits);

  if (rows.length === 0) {
    panel.innerHTML = `<div class="admin-empty"><div class="admin-empty-icon">👥</div><p>Belum ada data pelanggan.</p></div>`;
    return;
  }

  const tableRows = rows.map((c, i) => {
    const tier    = c.visits >= 5 ? '🥇 Gold' : c.visits >= 3 ? '🥈 Silver' : '🥉 Bronze';
    const waPhone = String(c.phone || '').replace(/^\+/, '').replace(/^0/, '62').replace(/\D/g, '');
    const waLink  = waPhone ? `https://wa.me/${waPhone}` : '#';
    const badge   = c.visits >= 2 ? '<span class="crm-badge repeat">Repeat</span>' : '<span class="crm-badge new">New</span>';

    return `
      <tr>
        <td class="crm-num">${i + 1}</td>
        <td>
          <div class="crm-name">${esc(c.name)}</div>
          <div class="crm-tier">${tier}</div>
        </td>
        <td><a href="${waLink}" target="_blank" class="crm-phone">${esc(c.phone)}</a></td>
        <td class="crm-visits">${c.visits}x ${badge}</td>
        <td class="crm-spend">${formatRupiah(c.totalSpend)}</td>
        <td class="crm-last">${esc(c.lastDate) || '—'}</td>
        <td>
          <a href="${waLink}" target="_blank" class="action-btn action-confirm" style="font-size:.78rem;padding:7px 14px;text-decoration:none;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WA
          </a>
        </td>
      </tr>`;
  }).join('');

  panel.innerHTML = `
    <div class="crm-header">
      <div>
        <div class="crm-title">👥 Database Pelanggan</div>
        <div class="crm-sub">${rows.length} pelanggan unik · total ${allReservations.filter(r => r.status !== 'rejected').length} reservasi</div>
      </div>
      <button class="admin-refresh" onclick="exportCRM()">&#8595; Export CSV</button>
    </div>
    <div class="crm-table-wrap">
      <table class="crm-table">
        <thead>
          <tr>
            <th>#</th><th>Nama</th><th>WhatsApp</th><th>Kunjungan</th><th>Total Spend</th><th>Terakhir Booking</th><th>Aksi</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>`;
}

function exportCRM() {
  const customers = {};
  allReservations.forEach(r => {
    if (r.status === 'rejected') return;
    const key = r.phone || 'unknown';
    if (!customers[key]) customers[key] = { name: r.name, phone: r.phone, visits: 0, totalSpend: 0, lastDate: '' };
    customers[key].visits++;
    customers[key].totalSpend += Number(r.totalPrice || 0);
    if (!customers[key].lastDate || r.date > customers[key].lastDate) customers[key].lastDate = r.date;
  });
  const rows = Object.values(customers);
  const csv  = ['Nama,WhatsApp,Kunjungan,Total Spend,Terakhir Booking']
    .concat(rows.map(c => `"${c.name}","${c.phone}",${c.visits},${c.totalSpend},${c.lastDate}`))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `raskop-crm-${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

/* ─── SLOT MANAGER ───────────────────────────── */
async function renderSlotManager() {
  const panel = $('panel-slots');
  if (!panel) return;

  const today        = new Date().toISOString().slice(0, 10);
  const savedCapacity = localStorage.getItem('raskop_slot_capacity') || RASKOP.config.slots.defaultCapacity;

  panel.innerHTML = `
    <div class="sm-header">
      <div class="crm-title">🕐 Slot Manager</div>
      <div class="crm-sub">Kelola kapasitas slot dan pantau fill rate per tanggal</div>
    </div>

    <div class="sm-config-card">
      <div class="sm-config-label">Kapasitas Default per Slot (semua jam)</div>
      <div class="sm-config-row">
        <input class="form-input" type="number" id="sm-capacity" value="${savedCapacity}" min="1" max="100" style="max-width:120px;" />
        <button class="btn btn-primary" id="sm-save-cap" type="button" style="padding:12px 24px;">Simpan</button>
        <span class="sm-save-msg" id="sm-save-msg"></span>
      </div>
    </div>

    <div class="sm-date-row">
      <label class="form-label" style="margin:0;">Lihat Fill Rate Tanggal:</label>
      <input class="form-input" type="date" id="sm-date" value="${today}" style="max-width:200px;" />
      <button class="btn btn-ghost" id="sm-load" type="button" style="padding:12px 20px;">Tampilkan</button>
    </div>

    <div class="sm-slots-wrap" id="sm-slots-wrap">
      <div class="admin-empty"><div class="admin-empty-icon">🕐</div><p>Klik Tampilkan untuk melihat fill rate slot</p></div>
    </div>`;

  $('sm-save-cap').addEventListener('click', () => {
    const val = Number($('sm-capacity').value);
    if (!val || val < 1) return;
    localStorage.setItem('raskop_slot_capacity', String(val));
    RASKOP.config.slots.defaultCapacity = val;
    const msg = $('sm-save-msg');
    if (msg) { msg.textContent = '✅ Tersimpan!'; setTimeout(() => msg.textContent = '', 2500); }
  });

  $('sm-load').addEventListener('click', () => loadSlotFillRate($('sm-date').value));
  loadSlotFillRate(today);
}

async function loadSlotFillRate(date) {
  const wrap = $('sm-slots-wrap');
  if (!wrap) return;

  const times    = RASKOP.config.slots.times;
  const capacity = Number(localStorage.getItem('raskop_slot_capacity') || RASKOP.config.slots.defaultCapacity);

  wrap.innerHTML = `<div class="slot-grid-loading">${times.map(() => '<div class="slot-card-skeleton"></div>').join('')}</div>`;

  let bookedBySlot = {};
  try {
    const res = await fetch(`/.netlify/functions/admin-slots?date=${date}`, {
      headers: { 'x-admin-token': adminToken },
    });
    if (res.ok) {
      const data = await res.json();
      bookedBySlot = data.bookedBySlot || {};
    }
  } catch (e) { console.warn('loadSlotFillRate error:', e); }

  const totalBooked = Object.values(bookedBySlot).reduce((s, v) => s + v, 0);

  const cards = times.map(time => {
    const booked  = bookedBySlot[time] || 0;
    const fillPct = Math.min(100, Math.round((booked / capacity) * 100));
    let status, statusCls;
    if (fillPct >= 100)     { status = 'Penuh';       statusCls = 'full'; }
    else if (fillPct >= 70) { status = 'Locked 🔴';   statusCls = 'locked'; }
    else if (fillPct >= 50) { status = 'Hampir 🟡';   statusCls = 'hampir'; }
    else                    { status = 'Tersedia 🟢';  statusCls = 'open'; }

    return `
      <div class="slot-card ${statusCls}" style="cursor:default;">
        <div class="slot-card-time">${time}</div>
        <div class="slot-progress-wrap">
          <div class="slot-progress-bar"><div class="slot-progress-fill" style="width:${fillPct}%"></div></div>
        </div>
        <div class="slot-card-count">${booked}/${capacity}</div>
        <div class="slot-badge badge-${statusCls}">${status}</div>
      </div>`;
  }).join('');

  wrap.innerHTML = `
    <div class="sm-summary">
      <div class="sm-sum-item"><span class="sm-sum-num">${totalBooked}</span><span class="sm-sum-label">Total Tamu</span></div>
      <div class="sm-sum-item"><span class="sm-sum-num">${Object.keys(bookedBySlot).length}</span><span class="sm-sum-label">Slot Aktif</span></div>
      <div class="sm-sum-item"><span class="sm-sum-num">${capacity}</span><span class="sm-sum-label">Kapasitas/Slot</span></div>
    </div>
    <div class="slot-grid">${cards}</div>`;
}

/* ─── DEMO DATA ─────────────────────────────────── */
function getDemoData() {
  return [
    {
      _recordId:     'demo1',
      id:            'RSK-20260416-DEMO1',
      name:          'Demo Customer',
      phone:         '6281234567890',
      guests:        2,
      date:          new Date().toISOString().slice(0, 10),
      time:          '14:00',
      area:          'indoor',
      orders:        [{ id: 'k2', name: 'Spanish Latte', qty: 2, price: 20000 }],
      totalItems:    2,
      totalPrice:    40000,
      paymentMethod: 'QRIS',
      status:        'pending',
      note:          '-',
      createdAt:     new Date().toISOString(),
    },
  ];
}
