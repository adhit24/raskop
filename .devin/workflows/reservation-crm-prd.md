---
description: PRD & CRM Reservasi — sistem reservasi berbasis slot dengan integrasi Airtable + SQL, WhatsApp notification, dan admin dashboard. Gunakan sebagai konteks awal di folder project baru.
---

# PRD & CRM — Sistem Reservasi (Airtable + SQL)

> **Cara pakai:** Copy file ini ke `.windsurf/workflows/` di folder project baru. Aira akan langsung memahami konteks tanpa perlu penjelasan ulang.

---

## 1. Identitas Project

| Field | Value |
|-------|-------|
| **Nama Project** | Sistem Reservasi Café / F&B |
| **Target User** | Walk-in customer (mahasiswa, young adult) — mobile-first |
| **Owner** | Admin tunggal (pemilik bisnis) |
| **Bahasa UI** | Bahasa Indonesia |
| **Zona Waktu** | WIB (UTC+7) |

---

## 2. PRD — Product Requirements Document

### 2.1 Core Problem
Customer datang tanpa reservasi → meja penuh → pengalaman buruk → tidak balik lagi.
Solusi: sistem reservasi slot berbasis waktu dengan kapasitas terkontrol.

### 2.2 Core Feature Set

#### A. Halaman Reservasi (Public)
- Form 3-step: Data Diri → Pilih Slot → Konfirmasi
- Input: Nama, WhatsApp (+62), Jumlah orang, Tanggal, Jam slot
- Real-time slot availability (polling / SSE)
- **70% Lock Rule**: jika slot sudah ≥ 70% terisi → status "Terkunci" untuk walk-in (tidak bisa booking online), sisanya dialokasikan untuk walk-in langsung
- Booking ID unik (format: `OXI-YYYYMMDD-XXXX`)
- Konfirmasi otomatis via WhatsApp setelah submit

#### B. Slot Logic
```
Kapasitas default: 60 kursi/hari
Slot waktu: 08.00–10.00 / 10.00–12.00 / 12.00–14.00 / dst (2 jam per slot)
Max per booking: 6 orang
Status slot:
  - OPEN      : < 50% terisi
  - HAMPIR    : 50–69% terisi  
  - TERKUNCI  : ≥ 70% terisi (lock untuk reservasi online)
  - PENUH     : 100% terisi
```

#### C. WhatsApp Notification
- Trigger: setelah booking berhasil (status = pending)
- Pesan ke customer: konfirmasi booking + detail slot + nomor booking
- Pesan ke admin: notifikasi booking baru (opsional)
- Library: `@whiskeysockets/baileys` atau Fonnte API / Wablas

#### D. Admin Dashboard (Private)
- Login: password-only (satu akun owner)
- Stat cards: Menunggu / Dikonfirmasi / Dibatalkan / Total
- Tabel reservasi: filter by tanggal & status, search by nama/HP
- Action per row: Konfirmasi / Batalkan / Tandai No-Show
- Quota bar harian (real-time)
- Export ke CSV (opsional)

### 2.3 Non-Functional Requirements
- Mobile-first (≥ 375px viewport)
- Load time < 3 detik (LCP)
- Form accessible (label, aria, keyboard nav)
- No login required untuk customer
- Tidak ada pembayaran online (gratis, cukup reservasi)

---

## 3. CRM — Customer Relationship Management

### 3.1 Data yang Dikumpulkan per Booking

| Field | Source | Tipe |
|-------|--------|------|
| `booking_id` | Auto-generated | STRING |
| `nama` | Form input | STRING |
| `whatsapp` | Form input | STRING (E.164) |
| `jumlah_orang` | Form input | INT |
| `tujuan` | Form input (opsional) | ENUM |
| `tanggal` | Form input | DATE |
| `slot_id` | Dipilih user | FK |
| `status` | System | ENUM: pending/confirmed/cancelled/no_show |
| `created_at` | Auto | TIMESTAMP |
| `notes` | Form input (opsional) | TEXT |

### 3.2 CRM Lite — Customer Intelligence

```
Dari data booking, bisa derive:
- Frequent visitor: customer yang booking > 2x dalam 30 hari
- Avg group size per customer
- Preferred time slot per customer
- Cancellation rate per customer
- Last visit date (churn risk jika > 30 hari)
```

### 3.3 Retention Funnel
```
Booking → WhatsApp Konfirmasi
         → Visit (no-show tracking)
         → Post-visit follow-up (opsional, D+1)
         → Re-engagement broadcast (jika > 30 hari tidak balik)
```

---

## 4. Arsitektur Teknis

### 4.1 Stack Rekomendasi

```
Frontend  : HTML/CSS/JS vanilla ATAU Next.js / Vite+React
Backend   : Node.js + Express
Database  : MySQL (primary) + Airtable (CRM layer / backup sync)
Notif     : WhatsApp API (Baileys / Fonnte / Wablas)
Hosting   : Vercel (frontend) + Railway/Render (backend) + PlanetScale/Supabase (DB)
```

### 4.2 Integrasi Airtable + SQL

#### Filosofi Integrasi
```
MySQL  = source of truth (operational DB — reservasi, slots, transaksi)
Airtable = CRM layer (customer view, marketing ops, non-technical admin)

Sync: MySQL → Airtable (one-way, triggered on booking events)
```

#### Tabel SQL (Core Schema)

```sql
-- Reservasi
CREATE TABLE reservations (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  booking_id    VARCHAR(20) UNIQUE NOT NULL,
  nama          VARCHAR(100) NOT NULL,
  whatsapp      VARCHAR(20) NOT NULL,
  jumlah_orang  TINYINT NOT NULL,
  tujuan        ENUM('work','meeting','hangout','date','other') DEFAULT NULL,
  tanggal       DATE NOT NULL,
  slot_id       INT NOT NULL,
  status        ENUM('pending','confirmed','cancelled','no_show') DEFAULT 'pending',
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (slot_id) REFERENCES slots(id)
);

-- Slot waktu
CREATE TABLE slots (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  tanggal     DATE NOT NULL,
  jam_mulai   TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  kapasitas   INT DEFAULT 60,
  terisi      INT DEFAULT 0,
  is_locked   BOOLEAN DEFAULT FALSE,
  UNIQUE KEY (tanggal, jam_mulai)
);

-- Customer CRM (derived dari reservations)
CREATE TABLE customers (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  whatsapp        VARCHAR(20) UNIQUE NOT NULL,
  nama            VARCHAR(100),
  total_booking   INT DEFAULT 0,
  last_visit      DATE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Airtable Base Structure

```
Base: "CRM Reservasi"

Table 1: Reservations (sync dari MySQL)
  Fields: Booking ID, Nama, WhatsApp, Jumlah, Tanggal, Slot, Status, Created At

Table 2: Customers (CRM view)
  Fields: WhatsApp, Nama, Total Booking, Last Visit, Segment (formula), Churn Risk

Table 3: Daily Quota (ringkasan harian)
  Fields: Tanggal, Total Booking, Confirmed, Cancelled, Occupancy %

Automations (Airtable):
  - Jika Status = confirmed → kirim email summary ke owner
  - Jika Last Visit > 30 hari → flag sebagai "At Risk"
  - Jika Total Booking ≥ 3 → tag sebagai "Loyal Customer"
```

#### Sync Code Pattern (Node.js → Airtable)

```javascript
// services/airtableSync.js
const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
              .base(process.env.AIRTABLE_BASE_ID);

async function syncReservationToAirtable(reservation) {
  await base('Reservations').create([{
    fields: {
      'Booking ID'  : reservation.booking_id,
      'Nama'        : reservation.nama,
      'WhatsApp'    : reservation.whatsapp,
      'Jumlah'      : reservation.jumlah_orang,
      'Tanggal'     : reservation.tanggal,
      'Status'      : reservation.status,
      'Created At'  : reservation.created_at,
    }
  }]);
}

async function updateReservationStatus(booking_id, status) {
  const records = await base('Reservations')
    .select({ filterByFormula: `{Booking ID} = '${booking_id}'` })
    .firstPage();
  if (records.length) {
    await base('Reservations').update(records[0].id, { 'Status': status });
  }
}

module.exports = { syncReservationToAirtable, updateReservationStatus };
```

---

## 5. Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=reservasi_db
DB_USER=root
DB_PASS=

# Airtable
AIRTABLE_API_KEY=pat_xxxxxxxxxxxxxxxxxxxx
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX

# WhatsApp
WA_API_URL=https://api.fonnte.com/send
WA_TOKEN=xxxxxxxxxxxx
ADMIN_WA=628xxxxxxxxxx

# App
PORT=5000
FRONTEND_URL=http://localhost:3000
ADMIN_PASSWORD=ganti_ini_dengan_password_kuat
JWT_SECRET=random_secret_string
NODE_ENV=development
```

---

## 6. API Endpoints (Backend)

```
POST   /api/reservations          → Buat reservasi baru
GET    /api/slots?tanggal=        → Ambil slot tersedia per tanggal
GET    /api/reservations/:id      → Cek status reservasi (public)

GET    /api/admin/dashboard       → Stat harian (protected)
GET    /api/admin/reservations    → List semua reservasi (protected)
PATCH  /api/admin/reservations/:id/status → Update status (protected)
POST   /api/admin/login           → Auth
```

---

## 7. Folder Structure

```
project-root/
├── frontend/           (atau root jika vanilla HTML)
│   ├── index.html
│   ├── reservation.html
│   ├── style.css
│   └── js/
├── admin/
│   ├── index.html
│   ├── admin.css
│   └── admin.js
├── backend/
│   ├── server.js
│   ├── routes/
│   │   ├── reservations.js
│   │   ├── slots.js
│   │   └── admin.js
│   ├── services/
│   │   ├── reservationService.js
│   │   ├── whatsappService.js
│   │   └── airtableSync.js
│   ├── middleware/
│   │   └── auth.js
│   └── package.json
└── database/
    └── schema.sql
```

---

## 8. Design System

```css
/* Brand Colors */
--green-900 : #0E2318   /* bg utama */
--green-800 : #1B3A2D   /* card surface */
--green-700 : #2D5A40   /* hover / input */
--gold      : #C9A84C   /* aksen utama */
--cream     : #F5EDD8   /* teks primer */
--red       : #f87171   /* error / cancelled */
--green-ok  : #4ade80   /* confirmed / success */

/* Typography */
--font-serif : 'Playfair Display', Georgia, serif  /* heading */
--font-sans  : 'Inter', system-ui, sans-serif      /* body */
--font-label : 'Space Grotesk', sans-serif         /* label, badge */
```

---

## 9. Aturan Pengembangan (Rules for Aira)

1. **Bahasa UI selalu Indonesia** — error message, label, placeholder
2. **Mobile-first** — mulai dari 375px, baru desktop
3. **No hardcode credential** — selalu gunakan `.env`
4. **Airtable adalah CRM layer, bukan DB utama** — MySQL adalah source of truth
5. **Sync ke Airtable adalah async/non-blocking** — jangan block response user
6. **70% lock rule** — enforce di backend, bukan hanya frontend
7. **Admin password** — simpan di `.env`, bukan di kode
8. **WhatsApp notification** — fail gracefully (jika WA gagal, booking tetap tersimpan)
9. **Cache busting** — gunakan `?v=X` pada CSS/JS saat update
10. **Error handling** — selalu return JSON `{ success, message, data }`

---

## 10. Quick Start (New Project)

```bash
# 1. Clone / init project
mkdir nama-project && cd nama-project

# 2. Setup backend
cd backend
npm init -y
npm install express mysql2 cors dotenv airtable axios

# 3. Copy schema ke MySQL
mysql -u root -p < database/schema.sql

# 4. Isi .env (lihat section 5)
cp .env.example .env

# 5. Jalankan backend
node server.js

# 6. Jalankan frontend
npx serve . -p 3000

# 7. Buka admin
# http://localhost:3000/admin/
# Password: lihat ADMIN_PASSWORD di .env
```
