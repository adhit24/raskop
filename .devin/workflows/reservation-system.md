---
description: Oxi Cirebon — build and design the Reservation System page with 70% quota lock logic, real-time slot display, WhatsApp notification, and admin dashboard
---

# Reservation System — Oxi Cirebon

**Project:** Website & Reservation System – Coffee Shop (Model Oksigen + Raskop System)
**Target User:** Mahasiswa (students) — UX harus sangat simple
**Stack:** Next.js (frontend) · Node.js/Laravel (backend) · MySQL/PostgreSQL · WhatsApp API · Midtrans/Xendit

---

## Project Context

Ini bukan sekadar website — ini adalah **digital engine untuk mengubah traffic jadi revenue + komunitas**.

- **Core Logic:** Slot-based reservation dengan 70% lock rule
- **CRM Lite:** Database pelanggan dari setiap booking
- **Funnel:** Instagram → Website → Booking → WhatsApp Notification → Retention

---

## Step 1: Design the Reservation Page UI

### Layout Structure (Mobile-First — target mahasiswa pakai HP)

```
[Header: Oxi Cirebon logo + nav]
[Hero: "Reservasi Sekarang" headline + short desc]

[RESERVATION FORM CARD]
  ├── Nama lengkap (text input)
  ├── Nomor WhatsApp (tel input, +62 prefix)
  ├── Jumlah orang (number input, min:1)
  ├── Tanggal (date picker, disable past dates)
  └── Jam / Slot (dropdown — loaded from available slots)

[SLOT AVAILABILITY WIDGET]
  ├── Progress bar: X/10 seats (real-time)
  ├── Badge status: 🟢 Open / 🟡 Hampir Penuh / 🔴 Locked
  └── Label: "Sisa X tempat tersedia"

[SUBMIT BUTTON: "Booking Sekarang →"]
[Info: "Kamu akan menerima konfirmasi via WhatsApp"]
```

### UI Rules
- Font: besar, mudah dibaca (min 16px body)
- Color system: gunakan brand Oxi Cirebon (warm/coffee tones)
- Form: 1 kolom, full-width inputs — tidak ada 2-column form
- Error states: inline, merah, bahasa Indonesia
- Loading state: skeleton + spinner pada tombol submit
- Success state: full-screen confirmation card dengan nomor booking
- **TIDAK ada step yang membingungkan** — form → submit → done

### Status Badge Colors
```
Pending    → abu-abu  (belum 70%)
Open       → hijau    (< 70% booked)
Hampir     → kuning   (50–69% booked)
Locked     → merah    (≥ 70% booked — reservasi ditutup, walk-in only)
Full       → hitam    (100%)
Completed  → biru
Cancelled  → abu-abu strikethrough
```

---

## Step 2: Database Schema

```sql
-- Users Table
CREATE TABLE users (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(20) NOT NULL UNIQUE,  -- nomor WhatsApp +62xxx
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Slots Table
CREATE TABLE slots (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  date          DATE NOT NULL,
  time          TIME NOT NULL,              -- misal: 10:00, 13:00, 16:00, 19:00
  capacity      INT NOT NULL DEFAULT 10,
  booked_count  INT NOT NULL DEFAULT 0,
  status        ENUM('open','locked','full','closed') DEFAULT 'open',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_slot (date, time)
);

-- Reservations Table
CREATE TABLE reservations (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  slot_id     BIGINT UNSIGNED NOT NULL,
  pax         INT NOT NULL DEFAULT 1,       -- jumlah orang
  status      ENUM('pending','confirmed','cancelled','completed') DEFAULT 'pending',
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (slot_id) REFERENCES slots(id)
);

-- Events Table (for event integration)
CREATE TABLE events (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  date        DATE NOT NULL,
  capacity    INT NOT NULL DEFAULT 50,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Step 3: Core Business Logic (70% Rule)

```js
// reservationService.js

const LOCK_THRESHOLD = 0.70;  // 70% kapasitas = LOCK

async function getSlotStatus(slot) {
  const fillRate = slot.booked_count / slot.capacity;
  if (fillRate >= 1.0)    return 'full';
  if (fillRate >= LOCK_THRESHOLD) return 'locked';
  if (fillRate >= 0.50)   return 'hampir';
  return 'open';
}

async function createReservation({ userId, slotId, pax }) {
  // 1. Lock slot dengan transaction untuk cegah race condition
  return await db.transaction(async (trx) => {

    // 2. Re-fetch slot dengan FOR UPDATE (row-level lock)
    const slot = await trx('slots')
      .where('id', slotId)
      .forUpdate()
      .first();

    // 3. Validasi kapasitas (cegah overbooking)
    if (slot.status === 'locked' || slot.status === 'full') {
      throw new Error('Slot ini sudah penuh. Silakan pilih jam lain.');
    }
    if ((slot.booked_count + pax) > slot.capacity) {
      throw new Error(`Hanya tersisa ${slot.capacity - slot.booked_count} tempat.`);
    }

    // 4. Buat reservasi
    const [reservationId] = await trx('reservations').insert({
      user_id: userId,
      slot_id: slotId,
      pax,
      status: 'pending',
    });

    // 5. Update booked_count di slot
    const newBookedCount = slot.booked_count + pax;
    const newStatus = newBookedCount >= (slot.capacity * LOCK_THRESHOLD)
      ? 'locked'
      : 'open';

    await trx('slots').where('id', slotId).update({
      booked_count: newBookedCount,
      status: newStatus,
    });

    // 6. Jika baru trigger 70% → update semua reservasi di slot ini jadi "confirmed"
    if (newStatus === 'locked') {
      await trx('reservations')
        .where('slot_id', slotId)
        .where('status', 'pending')
        .update({ status: 'confirmed' });

      // 7. Trigger WhatsApp notifications (async, non-blocking)
      notifySlotLocked(slotId);
    }

    return reservationId;
  });
}
```

---

## Step 4: API Endpoints

```
GET  /api/slots?date=YYYY-MM-DD          → List available slots + fill rate
GET  /api/slots/:id                      → Detail slot (capacity, booked_count, status)
POST /api/reservations                   → Create reservation
GET  /api/reservations/:phone            → Cek status booking by WhatsApp number
PUT  /api/reservations/:id/cancel        → Cancel reservation (by customer)

// Admin endpoints (protected)
GET  /api/admin/reservations             → All bookings (filter: date, status)
PUT  /api/admin/reservations/:id         → Edit booking
DEL  /api/admin/reservations/:id         → Cancel booking
POST /api/admin/slots                    → Create slot
PUT  /api/admin/slots/:id/capacity       → Set kapasitas
GET  /api/admin/customers                → Customer database (CRM lite)
```

---

## Step 5: WhatsApp Notification System

### Templates Pesan

**Trigger 1 — Booking Dibuat (status: Pending)**
```
Halo [NAMA]! 👋

Reservasi kamu di *Oxi Cirebon* sudah masuk ya!

📅 Tanggal : [TANGGAL]
🕐 Jam     : [JAM]
👥 Orang   : [PAX] orang
📋 Status  : *PENDING*

Saat kuota 70% tercapai, status kamu akan otomatis berubah jadi CONFIRMED.

Nantikan konfirmasi selanjutnya ya! ☕
```

**Trigger 2 — 70% Tercapai (status: Confirmed)**
```
Yeay! Reservasi kamu *CONFIRMED* 🎉

📅 [TANGGAL] • [JAM]
👥 [PAX] orang
✅ Status : *CONFIRMED*

Sampai ketemu di Oxi Cirebon!
Kalau ada pertanyaan, balas pesan ini ya.
```

**Trigger 3 — Reminder H-1**
```
Reminder! 🔔 Besok kamu ada reservasi di *Oxi Cirebon*

📅 [TANGGAL] • [JAM]
👥 [PAX] orang

Kami tunggu ya! ☕🤙
```

### Integration (Fonnte / Whacenter / WA Gateway)
```js
async function sendWhatsApp(phone, message) {
  // Normalize nomor: hilangkan leading 0, tambah 62
  const normalized = phone.replace(/^0/, '62').replace(/[^0-9]/g, '');

  await axios.post(process.env.WA_API_URL, {
    target: normalized,
    message,
  }, {
    headers: { Authorization: process.env.WA_API_TOKEN }
  });
}
```

---

## Step 6: Real-Time Slot Availability (Frontend)

```jsx
// SlotPicker.jsx — React component

export function SlotPicker({ date, onSelect }) {
  const { data: slots } = useQuery(['slots', date], () =>
    fetch(`/api/slots?date=${date}`).then(r => r.json())
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {slots?.map(slot => (
        <SlotCard
          key={slot.id}
          slot={slot}
          onClick={() => slot.status !== 'locked' && onSelect(slot)}
        />
      ))}
    </div>
  );
}

function SlotCard({ slot, onClick }) {
  const fillPct = Math.round((slot.booked_count / slot.capacity) * 100);
  const isLocked = slot.status === 'locked' || slot.status === 'full';

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        "rounded-xl p-3 text-center border-2 transition-all",
        isLocked
          ? "opacity-40 cursor-not-allowed border-gray-200 bg-gray-50"
          : "hover:border-amber-500 border-gray-200 bg-white"
      )}
    >
      <div className="font-bold text-lg">{slot.time}</div>
      <div className="text-xs text-gray-500 mt-1">
        {slot.booked_count}/{slot.capacity} orang
      </div>
      {/* Progress bar */}
      <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            fillPct >= 70 ? "bg-red-400" :
            fillPct >= 50 ? "bg-yellow-400" : "bg-green-400"
          )}
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <StatusBadge status={slot.status} fillPct={fillPct} />
    </button>
  );
}
```

---

## Step 7: Admin Dashboard

### Pages
```
/admin/reservations          → Table: all bookings (filter tanggal, status)
/admin/reservations/[id]     → Detail + edit + cancel
/admin/slots                 → Manage slot kapasitas
/admin/customers             → CRM lite (nama, WA, total kunjungan, history)
/admin/events                → Create/edit events
```

### CRM Lite — Customer Table
```
Kolom:  Nama | WhatsApp | Total Kunjungan | Last Booking | Status | Aksi
Filter: Cari nama/WA | Bulan | Frekuensi (new/repeat)
Export: CSV untuk keperluan broadcast
```

### Reservation Table
```
Kolom:  # | Nama | WA | Tanggal | Jam | Pax | Status | Aksi
Filter: Tanggal (range) | Status | Slot
Actions: View detail | Confirm manual | Cancel | Kirim ulang WA
```

---

## Step 8: Reservation Status State Machine

```
                    ┌─────────┐
         submit ──► │ PENDING │
                    └────┬────┘
                         │ 70% slot tercapai
                         ▼
                   ┌───────────┐
                   │ CONFIRMED │ ◄── admin manual confirm
                   └─────┬─────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
        ┌───────────┐         ┌───────────┐
        │ COMPLETED │         │ CANCELLED │ ◄── customer / admin
        └───────────┘         └───────────┘
```

---

## Step 9: Payment Flow (Optional — Phase 1.5)

```
1. User selesai isi form reservasi
2. Pilih: "Bayar Sekarang" atau "Bayar di Tempat"
3. Jika bayar sekarang:
   a. Generate payment link via Midtrans / Xendit
   b. Redirect ke payment page
   c. Webhook: update reservation.payment_status = 'paid'
   d. Kirim bukti + invoice via WhatsApp
4. Jika bayar di tempat:
   a. Reservasi tetap masuk (status: pending)
   b. Catatan admin: "belum bayar"
```

---

## Step 10: Anti-Overbooking Guard

```js
// middleware/validateSlot.js
// Selalu gunakan DB transaction + row lock saat insert reservasi

// Tambahkan di Slots table:
ALTER TABLE slots ADD COLUMN lock_version INT DEFAULT 0;

// Optimistic locking check:
UPDATE slots
SET booked_count = booked_count + ?,
    lock_version = lock_version + 1
WHERE id = ?
  AND lock_version = ?           -- cegah concurrent update
  AND booked_count + ? <= capacity;

// Jika 0 rows affected → throw error "Slot sudah terisi, coba lagi"
```

---

## Step 11: Success Metrics to Track

| Metric | Target | Cara Ukur |
|--------|--------|-----------|
| Conversion rate | > 30% (visit → booking) | Analytics: page views vs. form submit |
| Booking per hari | 5–15 di awal | Admin dashboard |
| Slot fill rate | Rata-rata > 60% | `AVG(booked_count/capacity)` |
| WhatsApp open rate | > 80% | WA API read receipts |
| Repeat customer | > 40% bulan ke-2 | CRM: return booking by phone |

---

## Phase 2 Features (Backlog)
- Waiting list otomatis saat slot locked
- Loyalty points per kunjungan
- Membership tier (Bronze/Silver/Gold)
- AI recommendation: "Jam favorit kamu: 19:00 tiap Jumat"
- Broadcast promo ke segmen pelanggan tertentu via WA

---

## Checklist Build Order

- [ ] **1.** Database schema + migration
- [ ] **2.** Backend: Slot API (GET /api/slots)
- [ ] **3.** Backend: Reservation API (POST /api/reservations) + transaction logic
- [ ] **4.** Frontend: Reservation page form + SlotPicker component
- [ ] **5.** Frontend: Real-time slot availability + progress bar
- [ ] **6.** WhatsApp notification service (booking created + confirmed)
- [ ] **7.** Frontend: Booking confirmation page
- [ ] **8.** Admin: Reservation management table
- [ ] **9.** Admin: CRM lite customer database
- [ ] **10.** WhatsApp: Reminder H-1 (cron job)
- [ ] **11.** Anti-overbooking guard (row-level lock)
- [ ] **12.** Payment integration (Midtrans/Xendit) — optional
