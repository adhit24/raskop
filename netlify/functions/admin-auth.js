const crypto = require('crypto');
const { ADMIN_PASSWORD, ADMIN_JWT_SECRET } = process.env;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors() };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body); } catch { return err('Invalid JSON', 400); }

  if (!body.password || body.password !== ADMIN_PASSWORD) {
    return err('Password salah', 401);
  }

  return ok({ token: makeToken() });
};

function makeToken() {
  const expiry = (Date.now() + 8 * 3600 * 1000).toString(36);
  const secret = ADMIN_JWT_SECRET || 'raskop_fallback';
  const sig    = crypto.createHmac('sha256', secret).update(expiry).digest('hex').slice(0, 32);
  return `${expiry}.${sig}`;
}

function ok(body)       { return { statusCode: 200, headers: cors(), body: JSON.stringify(body) }; }
function err(msg, code) { return { statusCode: code, headers: cors(), body: JSON.stringify({ error: msg }) }; }
function cors()         { return { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }; }
