const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE } = process.env;
const RESERVED_SEATS = 35;

exports.handler = async (event) => {
  const date = (event.queryStringParameters || {}).date || new Date().toISOString().slice(0, 10);

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    return ok({ totalGuests: 0, reservedSeats: RESERVED_SEATS, percentage: 0 });
  }

  try {
    const formula = encodeURIComponent(`AND({Tanggal}='${date}', OR({Status}='pending', {Status}='confirmed'))`);
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?filterByFormula=${formula}&fields[]=Jumlah%20Orang`;
    const res  = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
    const json = await res.json();
    const totalGuests = (json.records || []).reduce((s, r) => s + (Number(r.fields['Jumlah Orang']) || 0), 0);
    const percentage  = Math.min(100, Math.round((totalGuests / RESERVED_SEATS) * 100));
    return ok({ totalGuests, reservedSeats: RESERVED_SEATS, percentage });
  } catch {
    return ok({ totalGuests: 0, reservedSeats: RESERVED_SEATS, percentage: 0 });
  }
};

function ok(body) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}
