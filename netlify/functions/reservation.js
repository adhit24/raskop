const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE, FONNTE_TOKEN, ADMIN_PHONE, ADMIN_PHONE_2 } = process.env;
const AREA_CAPACITY = { indoor: 30, outdoor: 45, study: 15 };

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors() };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body); } catch { return err('Invalid JSON', 400); }

  const url  = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`;
  const resp = await fetch(url, {
    method:  'POST',
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fields: body.fields }),
  });

  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    return err(e.error?.message || 'Airtable error', 500);
  }

  if (FONNTE_TOKEN && ADMIN_PHONE && body.adminMsg) {
    sendWA(ADMIN_PHONE, body.adminMsg).catch(() => {});
  }

  if (body.autoConfirm) {
    const { date, time, area } = body.autoConfirm;
    checkAndAutoConfirm(date, time, area).catch(() => {});
  }

  return ok({ success: true });
};

async function checkAndAutoConfirm(date, time, area) {
  const capacity = AREA_CAPACITY[area] || 10;

  const allFormula = encodeURIComponent(`AND({Tanggal}='${date}',{Jam}='${time}',{Area}='${area}',NOT({Status}='rejected'))`);
  const allRes  = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?filterByFormula=${allFormula}&fields[]=Jumlah%20Orang`,
    { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
  );
  const allData = await allRes.json();
  const total   = (allData.records || []).reduce((s, r) => s + Number(r.fields['Jumlah Orang'] || 0), 0);
  if (total / capacity < 0.70) return;

  const pendingFormula = encodeURIComponent(`AND({Tanggal}='${date}',{Jam}='${time}',{Area}='${area}',{Status}='pending')`);
  const pendingRes  = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?filterByFormula=${pendingFormula}&fields[]=Nama%20Customer&fields[]=WhatsApp`,
    { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
  );
  const pendingData = await pendingRes.json();

  for (const rec of pendingData.records || []) {
    await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}/${rec.id}`,
      {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fields: { Status: 'confirmed' } }),
      }
    );
    const phone = String(rec.fields['WhatsApp'] || '').replace(/^\+/, '').replace(/^0/, '62').replace(/\D/g, '');
    const nama  = rec.fields['Nama Customer'] || 'Pelanggan';
    if (phone && FONNTE_TOKEN) {
      sendWA(phone, `Reservasi kamu *CONFIRMED*\n\nHalo ${nama}! Slot jam *${time}* pada *${date}* sudah mencapai 70% - reservasimu otomatis dikonfirmasi!\n\nSampai ketemu di Raskop!`).catch(() => {});
    }

    if (FONNTE_TOKEN) {
      const adminMsg = [
        `✅ *AUTO-CONFIRM BOOKING*`,
        ``,
        `👤 ${nama}`,
        `📞 ${phone || '-'}`,
        `📅 ${date} · ${time}`,
        `📍 Area: ${area.toUpperCase()}`,
      ].join('\n');
      if (ADMIN_PHONE)  sendWA(ADMIN_PHONE,  adminMsg).catch(() => {});
      if (ADMIN_PHONE_2) sendWA(ADMIN_PHONE_2, adminMsg).catch(() => {});
    }
  }
}

async function sendWA(phone, message) {
  await fetch('https://fonnte.com/api/send_message', {
    method: 'POST',
    body:   new URLSearchParams({ target: String(phone), message, token: FONNTE_TOKEN }),
  });
}

function ok(body)       { return { statusCode: 200, headers: cors(), body: JSON.stringify(body) }; }
function err(msg, code) { return { statusCode: code, headers: cors(), body: JSON.stringify({ error: msg }) }; }
function cors()         { return { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }; }
