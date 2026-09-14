const crypto = require('crypto');
const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE, ADMIN_JWT_SECRET } = process.env;

exports.handler = async (event) => {
  if (!verify(event)) return err('Unauthorized', 401);

  try {
    let allRecords = [], offset = null;
    do {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?sort[0][field]=Dibuat&sort[0][direction]=desc${offset ? '&offset=' + offset : ''}`;
      const res  = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
      const json = await res.json();
      allRecords = allRecords.concat(json.records || []);
      offset = json.offset || null;
    } while (offset);

    return ok({ records: allRecords });
  } catch {
    return err('Failed to load', 500);
  }
};

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
