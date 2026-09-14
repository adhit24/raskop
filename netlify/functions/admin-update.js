const crypto = require('crypto');
const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE, FONNTE_TOKEN, ADMIN_JWT_SECRET, ADMIN_PHONE, ADMIN_PHONE_2 } = process.env;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors() };
  if (!verify(event))                 return err('Unauthorized', 401);
  if (event.httpMethod !== 'PATCH')   return err('Method Not Allowed', 405);

  let body;
  try { body = JSON.parse(event.body); } catch { return err('Invalid JSON', 400); }

  const { recordId, status, waPhone, waMsg, adminNotifyMsg } = body;
  if (!recordId || !status) return err('Missing recordId or status', 400);

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}/${recordId}`,
      {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fields: { Status: status } }),
      }
    );
    if (!res.ok) return err('Airtable update failed', 500);
  } catch {
    return err('Airtable update failed', 500);
  }

  if (FONNTE_TOKEN && waPhone && waMsg) {
    sendWA(waPhone, waMsg).catch(() => {});
  }

  if (FONNTE_TOKEN && status === 'confirmed' && adminNotifyMsg) {
    if (ADMIN_PHONE)  sendWA(ADMIN_PHONE,  adminNotifyMsg).catch(() => {});
    if (ADMIN_PHONE_2) sendWA(ADMIN_PHONE_2, adminNotifyMsg).catch(() => {});
  }

  return ok({ success: true });
};

async function sendWA(phone, message) {
  await fetch('https://fonnte.com/api/send_message', {
    method: 'POST',
    body:   new URLSearchParams({ target: String(phone), message, token: FONNTE_TOKEN }),
  });
}

function verify(event) {
  const token = (event.headers || {})['x-admin-token'];
  if (!token) return false;
  const dot    = token.indexOf('.');
  if (dot === -1) return false;
  const expiry = parseInt(token.slice(0, dot), 36);
  if (isNaN(expiry) || expiry < Date.now()) return false;
  const secret   = ADMIN_JWT_SECRET || 'raskop_fallback';
  const expected = crypto.createHmac('sha256', secret).update(token.slice(0, dot)).digest('hex').slice(0, 32);
  return token.slice(dot + 1) === expected;
}

function ok(body)       { return { statusCode: 200, headers: cors(), body: JSON.stringify(body) }; }
function err(msg, code) { return { statusCode: code, headers: cors(), body: JSON.stringify({ error: msg }) }; }
function cors()         { return { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }; }
