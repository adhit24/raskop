# SETUP.md — Raskop Reservation System

Panduan setup Google Apps Script + Fonnte WhatsApp untuk sistem reservasi Raskop.

---

## 1. Buat Google Spreadsheet

1. Buka [sheets.google.com](https://sheets.google.com) → **New Spreadsheet**
2. Beri nama: **"Raskop — Reservasi"**
3. Catat URL spreadsheet (sudah terdeteksi otomatis oleh script)

---

## 2. Deploy Google Apps Script

1. Di spreadsheet yang baru dibuat, klik **Extensions → Apps Script**
2. Hapus semua kode yang ada
3. **Copy seluruh isi file `apps-script.js`** dan paste di editor
4. Isi 2 baris konfigurasi di bagian atas:
   ```js
   const FONNTE_TOKEN = 'ISI_TOKEN_FONNTE';   // ← Isi setelah step 3
   const ADMIN_PHONE  = '628xxxxxxxxxxxx';     // ← Nomor WA admin (format 628xxx)
   ```
5. Klik **Deploy → New Deployment**
6. Pilih Type: **Web App**
7. Execute as: **Me (email kamu)**
8. Who has access: **Anyone**
9. Klik **Deploy** → Auth → Allow
10. **Copy Web App URL** (bentuknya: `https://script.google.com/macros/s/xxx/exec`)

---

## 3. Daftar & Setup Fonnte (WhatsApp Notification)

1. Buka [fonnte.com](https://fonnte.com) → Daftar gratis
2. Tambahkan nomor WhatsApp bisnis Raskop sebagai device
3. Scan QR yang muncul untuk hubungkan WA
4. Setelah terhubung, copy **Token** di dashboard Fonnte
5. Paste token di `apps-script.js`:
   ```js
   const FONNTE_TOKEN = 'token_dari_fonnte_kamu';
   ```
6. **Re-deploy** Apps Script (Deploy → Manage Deployments → New version)

---

## 4. Sambungkan ke Website

1. Buka file **`data.js`**
2. Ganti placeholder URL:
   ```js
   apiUrl: 'https://script.google.com/macros/s/PASTE_URL_KAMU/exec',
   ```
3. Ganti nomor admin:
   ```js
   adminPhone: '6281234567890',  // ← Nomor WA admin
   ```
4. Ganti password admin (opsional):
   ```js
   adminPassword: 'raskop2024',  // ← Ganti sesuai keinginan
   ```

---

## 5. Tambahkan QRIS (Opsional)

1. Screenshot QR QRIS dari aplikasi bank/GoPay/OVO Raskop
2. Simpan file sebagai **`Brand_assets/qris.png`**
3. Gambar akan otomatis muncul di halaman reservasi saat user pilih QRIS

---

## 6. Test Sistem

### Test Reservasi User:
1. Buka `reservasi.html` lewat ngrok URL
2. Isi form → pilih menu → pilih pembayaran → submit
3. Cek Google Sheets — baris baru harus muncul
4. Cek WA admin — notifikasi harus masuk

### Test Admin Dashboard:
1. Buka `admin.html` lewat ngrok URL
2. Login dengan password (default: `raskop2024`)
3. Cari reservasi tadi → klik **Konfirmasi**
4. Cek WA user — notifikasi konfirmasi harus diterima

---

## Struktur File Website

```
Website Raskop/
├── index.html        — Landing page
├── reservasi.html    — Form reservasi (3 langkah)
├── admin.html        — Dashboard admin
├── style.css         — Styling semua halaman
├── data.js           — Konfigurasi & data menu (EDIT DI SINI)
├── script.js         — Logic landing page
├── reservasi.js      — Logic form reservasi
├── admin.js          — Logic admin dashboard
├── apps-script.js    — Kode untuk Google Apps Script (paste ke GAS)
└── Brand_assets/
    ├── Logo raskop.png
    ├── qris.png       ← Tambahkan sendiri
    └── Asset1-13.*    — Foto venue
```

---

## Catatan Penting

- **Demo mode**: Jika `apiUrl` masih `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL`, website tetap berfungsi tapi data tidak tersimpan ke Sheets dan notifikasi WA tidak terkirim.
- **Data antar perangkat**: Karena menggunakan Google Sheets, data reservasi bisa diakses dari perangkat manapun (beda dengan localStorage).
- **Auto-refresh admin**: Dashboard admin auto-refresh setiap 60 detik.
- **Password admin**: Hanya tersimpan di browser session (logout otomatis saat browser ditutup).
