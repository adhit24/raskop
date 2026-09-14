# 🧪 RASKOP RESERVASI - TESTING & TROUBLESHOOTING GUIDE

## ✅ QUICK TEST (5 menit)

### Step 1: Open Website
```
http://localhost:3000/reservasi.html
(or your deployment URL)
```

### Step 2: Fill Form dengan Data Test
```
Nama: Test User
HP: 082333002084
Tanggal: Besok atau tanggal mendatang
Jam: 19:00
Area: Outdoor
Jumlah Orang: 3
Pre-Order: Pilih minimal 1 item
```

### Step 3: Submit & Check Success
```
✓ Harus muncul success page
✓ ID Reservasi ditampilkan
✓ WhatsApp button muncul
```

### Step 4: Check Airtable
```
1. Buka: https://airtable.com/appiMTgw4GqPFDttT/tblUV2sdbdY4PM8gS/
2. Scroll ke paling atas (newest first)
3. Harus ada record baru dengan:
   - Name: RSK-YYYYMMDD-xxxxx
   - Nama Customer: Test User
   - WhatsApp: 082333002084
   - Area: outdoor
   - Status: pending
   - Dibuat: timestamp terbaru
```

### Step 5: Check Admin Dashboard
```
1. Buka: /admin.html
2. Password: raskop2024
3. Tab "Pending" harus menampilkan reservasi baru
4. Klik refresh jika tidak muncul
```

---

## 🔍 ADVANCED DEBUGGING

### Check Browser Console
```
1. Open browser (Chrome, Firefox, Edge)
2. Press F12 (or Ctrl+Shift+I)
3. Go to "Console" tab
4. Lihat logs untuk:
   - Airtable POST status
   - Any error messages
   - Timestamp submissions
```

### Run Diagnostic Script
```bash
# Di folder "Website Raskop"
node temp_analysis/test_airtable_api.js

# Akan menampilkan:
# - Recent records dari Airtable
# - Field structure verification
# - Test POST success/failure
```

### Check Network Requests
```
1. F12 → Network tab
2. Submit reservasi form
3. Cari request ke: api.airtable.com
4. Lihat:
   - Request: POST /v0/{baseId}/{table}
   - Status: 200 (OK) atau error code
   - Response: { "id": "rec...", "fields": {...} }
```

---

## 🚨 TROUBLESHOOTING

### Problem: "✅ Success" tapi data tidak ada di Airtable

**Possible Causes**:
1. Token Airtable expired
2. Baselik atau table ID salah
3. Field names tidak match
4. Network issue

**Solution**:
```bash
1. Run: node temp_analysis/test_airtable_api.js
2. Lihat error message
3. Verify config di data.js:
   - baseId: appiMTgw4GqPFDttT
   - table: tblUV2sdbdY4PM8gS
   - token: valid dan tidak expired
```

---

### Problem: "422 INVALID_VALUE_FOR_COLUMN" Error

**Possible Causes**:
1. Field type mismatch (e.g., text vs number)
2. Date format error
3. Field tidak ada di Airtable

**Solution** (Already Fixed):
- ✅ Date format sudah di-fix ke ISO 8601
- Jika masih error, check Airtable field types:
  - Jumlah Orang: Number
  - Tanggal: Date
  - Jam: Text
  - Total Harga: Number

---

### Problem: Admin tidak notified via WhatsApp

**Possible Causes**:
1. Fonnte token expired/invalid
2. Admin phone number wrong
3. Network issue

**Solution**:
```javascript
// Check di data.js
RASKOP.config.fonnteToken: '8of7YP9jySA2ZDLah8Le'
RASKOP.config.adminPhone: '6281357662424'

// Verify admin phone format (harus 628... tanpa +)
```

---

### Problem: Form Submit Timeout (loading lama)

**Possible Causes**:
1. Slow internet
2. Airtable API slow
3. Browser issue

**Solution**:
```
1. Check internet speed: speedtest.net
2. Try different browser
3. Check Airtable status: status.airtable.com
4. Retry submission
```

---

## 📊 MONITORING CHECKLIST

Daily/Weekly checks:

- [ ] Recent reservasi masuk ke Airtable
- [ ] Admin mendapat WhatsApp notification
- [ ] Dashboard menampilkan data dengan benar
- [ ] Tidak ada error di browser console
- [ ] Date/time format benar di Airtable
- [ ] All field values saved properly

---

## 🔐 VERIFICATION CHECKLIST

Before going LIVE, verify:

- [ ] Date format fix applied (ISO 8601)
- [ ] Error handling improved (not silent)
- [ ] Response validation added
- [ ] Test data posted successfully
- [ ] Admin received WhatsApp notification
- [ ] All fields visible in dashboard
- [ ] All fields correct format in Airtable
- [ ] Token not expired
- [ ] Phone numbers valid (admin & customer)

---

## 📋 TEST CASES

### Test Case 1: Normal Submission
```
Input: Valid form data
Expected: Data saved to Airtable + notification sent
Status: ✅ PASS
```

### Test Case 2: Invalid Phone Number
```
Input: Phone "1234" (invalid format)
Expected: Error shown "Nomor HP tidak valid"
Status: ✅ PASS (form validation)
```

### Test Case 3: Missing Pre-Order
```
Input: 0 items selected
Expected: Error "Minimal 70% dari X orang"
Status: ✅ PASS (form validation)
```

### Test Case 4: Future Submission
```
Input: Tanggal 2 hari ke depan
Expected: Slot availability checked + data saved
Status: ✅ PASS (if slots available)
```

---

## 🎯 SUCCESS INDICATORS

Form submission berhasil jika:

1. ✅ User melihat success page dengan ID reservasi
2. ✅ WhatsApp button dapat di-klik
3. ✅ Data muncul di Airtable dalam < 5 detik
4. ✅ Admin menerima WhatsApp notification
5. ✅ Admin dashboard menampilkan "pending" status
6. ✅ Semua field di Airtable lengkap
7. ✅ No error di browser console

---

## 📞 IF PROBLEMS PERSIST

1. **Check logs**:
   - Browser console (F12)
   - Airtable activity (view record history)
   - Network requests (F12 → Network)

2. **Run diagnostic**:
   ```bash
   node temp_analysis/test_airtable_api.js
   node temp_analysis/test_after_fix.js
   ```

3. **Verify credentials**:
   - Airtable token valid?
   - Fonnte token valid?
   - Admin phone correct?
   - Base ID correct?

4. **Contact support**:
   - Share console errors
   - Share diagnostic results
   - Share Airtable screenshot
   - Describe what user entered

---

## 📚 FILES REFERENCE

- `reservasi.html` - Form UI
- `reservasi.js` - Form logic + Airtable POST
- `data.js` - Config + utilities
- `admin.js` - Admin dashboard
- `logging.js` - Logging utilities (optional)
- `temp_analysis/test_airtable_api.js` - Diagnostic script
- `temp_analysis/test_after_fix.js` - Verification script
- `FIX_SUMMARY.md` - Detailed fix documentation

---

**Last Updated**: 2026-04-21  
**Status**: ✅ Ready for Testing & Deployment
