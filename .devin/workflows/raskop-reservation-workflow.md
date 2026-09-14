---
description: Raskop Reservation System — Complete workflow documentation for slot-based reservation with Airtable backend, WhatsApp notifications, and admin dashboard
---

# Raskop Reservation System Workflow

> **Project:** Raskop Coffee & Space  
> **Stack:** HTML/CSS/JS (vanilla) + Airtable + Fonnte WhatsApp API  
> **Target:** Mobile-first walk-in customers (students, young adults)

---

## 1. System Architecture

### 1.1 Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (Static HTML)                                     │
│  ├── index.html      → Landing page                          │
│  ├── reservasi.html  → 3-step reservation form               │
│  ├── reservasi.js    → Slot logic, payment, submission       │
│  ├── admin.html      → Admin dashboard (password protected)  │
│  ├── admin.js        → CRM, slot manager, status updates     │
│  ├── data.js         → Shared config, menu data, utilities   │
│  └── style.css       → All styling including components      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (REST API)
┌─────────────────────────────────────────────────────────────┐
│  BACKEND: Airtable                                          │
│  ├── Base: appiMTgw4GqPFDttT                                │
│  ├── Table: tblUV2sdbdY4PM8gS (Reservations)                │
│  └── Fields: Name, Nama Customer, WhatsApp, Jumlah Orang,   │
│              Tanggal, Jam, Area, Status, Orders,           │
│              Total Items, Total Harga, Metode Bayar,         │
│              Catatan, Dibuat, WhatsApp Raw                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (HTTPS POST)
┌─────────────────────────────────────────────────────────────┐
│  NOTIFICATION: Fonnte WhatsApp API                           │
│  ├── Token: 8of7YP9jySA2ZDLah8Le                            │
│  └── Admin Phone: 6281224642727                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Core Files

| File | Purpose | Lines |
|------|---------|-------|
| `reservasi.html` | 3-step reservation form UI | ~340 |
| `reservasi.js` | Form logic, slot picker, payment, Airtable submit | ~780 |
| `admin.html` | Admin dashboard UI | ~110 |
| `admin.js` | Reservation management, CRM lite, slot manager | ~570 |
| `data.js` | Shared config, menu data, utilities | ~160 |
| `style.css` | All styling + components | ~1500 |

---

## 2. Configuration (data.js)

### 2.1 Slot Configuration

```javascript
slots: {
  times: ['10:00','11:00','12:00','13:00','14:00','15:00','16:00',
          '17:00','18:00','19:00','20:00','21:00','22:00','23:00'],
  defaultCapacity: 10,
}
```

### 2.2 Area-Specific Capacities

```javascript
areaCapacity: {
  indoor:  30,   // Single room → 1 booking locks entire slot
  outdoor: 45,   // Single room → 1 booking locks entire slot
  study:   15,   // Multi-sekat → cumulative booking allowed
}
```

### 2.3 Critical Config

```javascript
airtable: {
  baseId: 'appiMTgw4GqPFDttT',
  token:  'pata0zQxriCYze9P7...',  // 🔴 EXPOSED IN BROWSER
  table:  'tblUV2sdbdY4PM8gS',
}

adminPassword: 'raskop2024',  // 🔴 HARDCODED
```

---

## 3. Reservation Flow

### 3.1 Customer Journey

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   STEP 1    │ →  │   STEP 2    │ →  │   STEP 3    │ →  │   SUCCESS   │
│  Data Diri  │    │ Pre-Order   │    │  Review &   │    │  WhatsApp   │
│             │    │    Menu     │    │   Bayar     │    │  Confirm    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
     │                   │                   │                  │
     ▼                   ▼                   ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ • Nama      │    │ • Pilih     │    │ • Review    │    │ • WA ke     │
│ • WhatsApp  │    │   menu      │    │   detail    │    │   admin     │
│ • Jumlah    │    │ • Min 70%   │    │ • Pilih     │    │ • Booking   │
│   orang     │    │   rule      │    │   payment   │    │   ID        │
│ • Tanggal   │    │             │    │ • Submit    │    │ • Auto-     │
│ • Area      │    │             │    │             │    │   confirm   │
│ • Jam slot  │    │             │    │             │    │   @70%      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 3.2 Form Validation (validateStep1)

```javascript
// Required fields:
- Nama: non-empty
- WhatsApp: /^(\+62|62|0)8[0-9]{8,12}$/
- Tanggal: selected, not past
- Jam: selected from slot picker
- Area: selected (indoor/outdoor/study)
```

### 3.3 70% Minimum Order Rule

```javascript
const minRequired = Math.ceil(state.guests * 0.7);
// Contoh: 4 orang → min 3 item wajib pre-order
// Contoh: 10 orang → min 7 item wajib pre-order
```

---

## 4. Slot Logic (Core Business Rule)

### 4.1 Area Types

| Area | Type | Logic |
|------|------|-------|
| **Indoor** | Single-room | 1 booking → slot FULL (tidak bisa booking lagi jam sama) |
| **Outdoor** | Single-room | 1 booking → slot FULL |
| **Study Zone** | Multi-sekat | Cumulative booking hingga kapasitas 15 |

### 4.2 Slot Status Calculation

```javascript
// Single room (indoor/outdoor)
if (isSingleRoom && hasAnyBooking) {
  bookedBySlot[jam] = areaCapacity;  // Force full
}

// Multi-sekat (study)
bookedBySlot[jam] += jumlahOrang;  // Akumulasi
```

### 4.3 Slot Status Badge

| Status | Condition | Color |
|--------|-----------|-------|
| `open` | < 50% terisi | 🟢 Green |
| `hampir` | 50–69% terisi | 🟡 Yellow |
| `locked` | ≥ 70% terisi | 🔴 Red |
| `full` | 100% terisi | ⚫ Dark |

### 4.4 3-Hour Conflict Rule

```javascript
// Jika ada booking jam 16:00 di area X
// Maka jam 14:00, 15:00, 16:00, 17:00, 18:00 = "areaBlocked"
const areaBlocked = bookedHours.some(bh => Math.abs(bh - h) < 3);
```

---

## 5. Auto-Confirm @ 70% Rule

### 5.1 Trigger Condition

```javascript
const fillRate = totalBooked / capacity;
if (fillRate >= 0.70) {
  // Update SEMUA pending → confirmed
  // Kirim WA ke semua customer di slot tersebut
}
```

### 5.2 Implementation

```javascript
async function checkAndAutoConfirm(date, time, area) {
  // 1. Hitung total booked pada slot + area
  // 2. Jika ≥ 70%, ambil semua pending records
  // 3. Update status → confirmed
  // 4. Trigger WhatsApp notification (async, non-blocking)
}
```

### 5.3 WhatsApp Confirmation Message

```
✅ Yeay! Reservasi kamu *CONFIRMED* 🎉

Halo [NAMA]! Slot jam *[JAM]* pada *[TANGGAL]* 
sudah mencapai 70% — reservasimu otomatis dikonfirmasi!

📅 [TANGGAL] • [JAM]

Sampai ketemu di Raskop! ☕
```

---

## 6. Payment System

### 6.1 Payment Methods

| Method | Flow | WA Button |
|--------|------|-----------|
| **QRIS** | Scan QR → Bayar → Datang | "📸 Kirim Bukti" (opsional) |
| **Bank Transfer** | Transfer → Screenshot → WA Admin | "📸 Kirim Bukti Transfer" |
| **E-Wallet** | Pilih app → Scan QRIS → Bayar | "⚡ Minta Link Midtrans" (info only) |

### 6.2 E-Wallet Grid Display

```html
<div class="ewallet-grid">
  <div class="ewallet-card">
    <img src="[GoPay logo]" />
    <span>GoPay</span>
  </div>
  <!-- OVO, DANA, ShopeePay -->
</div>
```

---

## 7. Admin Dashboard

### 7.1 Authentication

```javascript
// Password gate di sessionStorage
if (sessionStorage.getItem('raskop_admin') === 'ok') {
  showDashboard();
} else {
  showPasswordGate();
}

// Password: 'raskop2024' (hardcoded)
```

### 7.2 Dashboard Tabs

| Tab | Content |
|-----|---------|
| **CRM** | Reservation cards with customer details |
| **Slot Manager** | Visual slot availability per date |

### 7.3 Reservation Card Actions

```javascript
// Per reservation:
- View detail (expandable)
- Confirm (status: pending → confirmed)
- Reject (status: pending → rejected)
- Send WA (manual trigger)
```

### 7.4 Stat Cards

```javascript
// Real-time counts:
- Menunggu (pending)
- Dikonfirmasi (confirmed)
- Ditolak (rejected)
- Total (all)
```

---

## 8. Airtable Schema

### 8.1 Fields (12 total)

| Field | Type | Description |
|-------|------|-------------|
| `Name` | String | Booking ID (e.g., OXI-260420-500) |
| `Nama Customer` | String | Customer name |
| `WhatsApp` | String | Phone with leading 0 |
| `WhatsApp Raw` | String | Phone with 62 prefix |
| `Jumlah Orang` | Number | Guest count |
| `Tanggal` | Date | Visit date (YYYY-MM-DD) |
| `Jam` | String | Time slot (HH:MM) |
| `Area` | Single select | indoor / outdoor / study |
| `Status` | Single select | pending / confirmed / rejected |
| `Orders` | Long text | JSON string of menu items |
| `Total Items` | Number | Sum of all item quantities |
| `Total Harga` | Number | Total price in Rupiah |
| `Metode Bayar` | Single select | QRIS / Bank Transfer / Midtrans E-Wallet |
| `Catatan` | Long text | Customer notes |
| `Dibuat` | String | Timestamp (WIB) |

### 8.2 Query Patterns

```javascript
// Fetch slots for date + area
formula: `AND({Tanggal}='${date}',{Area}='${area}',NOT({Status}='rejected'))`

// Check auto-confirm condition
formula: `AND({Tanggal}='${date}',{Jam}='${time}',{Area}='${area}',NOT({Status}='rejected'))`

// Fetch pending for auto-confirm
formula: `AND({Tanggal}='${date}',{Jam}='${time}',{Area}='${area}',{Status}='pending')`
```

---

## 9. WhatsApp Integration

### 9.1 Fonnte API

```javascript
async function sendWA(target, message) {
  const url = 'https://api.fonnte.com/send';
  const form = new FormData();
  form.append('target', target);      // 628xxxx
  form.append('message', message);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': '8of7YP9jySA2ZDLah8Le' },
    body: form,
  });
}
```

### 9.2 Notification Triggers

| Event | Recipient | Message |
|-------|-----------|---------|
| New booking | Admin | Booking details + link to Airtable |
| Auto-confirm @70% | Customer | Confirmation message |
| Manual confirm | Customer | Confirmation message |

### 9.3 Admin Notification Format

```
🔔 *RESERVASI BARU — RASKOP*

📋 ID: [BOOKING_ID]
👤 [NAMA] — [PHONE]
👥 [GUESTS] orang
📅 [DATE] • [TIME]
🏠 Area: [AREA]
💰 Total: [PRICE]
💳 Bayar: [METHOD]

📝 Pesanan:
• [Item] x[qty] ([price])
...

Lihat di Airtable:
https://airtable.com/app.../tbl.../viw...
```

---

## 10. Known Issues & Risks

### 🔴 Critical

| Issue | Impact | Mitigation |
|-------|--------|------------|
| **Airtable token exposed** | Anyone can read/write data | Move to backend proxy |
| **Admin password hardcoded** | Easy to find in source | Move to env/backend |
| **No backend/transaction** | Race condition on concurrent bookings | Add row-lock mechanism |
| **Client-side only** | All logic visible, bypassable | Add server validation |

### 🟡 Limitations

| Limitation | Current Workaround |
|------------|-------------------|
| No customer-facing WA | Admin must confirm manually |
| No cancel by customer | Customer must WA admin |
| No reminder H-1 | Manual reminder by admin |
| No waiting list | Customer must choose other slot |
| Max 6 people/booking | Not enforced (limit 45) |

---

## 11. Deployment Checklist

### Before Upload

- [ ] Update `data.js` with correct Airtable token
- [ ] Verify Airtable fields match schema
- [ ] Check `adminPhone` in `data.js`
- [ ] Test local with `node serve.mjs`
- [ ] Verify QR Code image exists in `Brand_assets/`

### Files to Upload

**Must update:**
- `data.js`
- `reservasi.js`
- `reservasi.html`
- `admin.js`
- `style.css`

**Static (upload if not exists):**
- `index.html`
- `admin.html`
- `menu.html`
- `Brand_assets/` (folder)

**Do NOT upload:**
- `serve.mjs`
- `screenshot.mjs`
- `node_modules/`
- `package*.json`

---

## 12. Quick Commands

### Local Development

```bash
# Start dev server
cd c:\Users\Win11\Downloads\Documents\Website Raskop
node serve.mjs

# Server runs at http://localhost:3000
```

### Airtable Test

```powershell
# Test connection
$headers = @{ Authorization = "Bearer TOKEN" }
Invoke-RestMethod -Uri "https://api.airtable.com/v0/BASE_ID/TABLE_ID?maxRecords=1" -Headers $headers
```

---

## 13. Future Enhancements (Backlog)

### Phase 2
- [ ] Waiting list for locked slots
- [ ] Customer self-service cancellation
- [ ] Automated H-1 reminder via cron
- [ ] Export CSV from admin
- [ ] Customer CRM database view

### Phase 3
- [ ] Backend API with proper auth
- [ ] Payment gateway integration (Midtrans/Xendit)
- [ ] Real-time slot updates (WebSocket/SSE)
- [ ] Loyalty points system
- [ ] Membership tiers (Bronze/Silver/Gold)

---

**Last updated:** April 2026  
**Maintainer:** Cascade (AI Assistant)
