const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE } = process.env;
const AREA_CAPACITY = { indoor: 30, outdoor: 45, study: 15 };

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const { date, area } = params;
  if (!date || !area) return err('Missing date or area', 400);

  if (!AIRTABLE_TOKEN) return ok({ bookedBySlot: {}, blockedHours: [] });

  try {
    const formula = encodeURIComponent(`AND({Tanggal}='${date}',{Area}='${area}',NOT({Status}='rejected'))`);
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?filterByFormula=${formula}&fields[]=Jam&fields[]=Jumlah%20Orang&fields[]=Status`;
    const res  = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
    const data = await res.json();
    const records = data.records || [];

    const isSingleRoom = area === 'indoor' || area === 'outdoor';
    const areaCapacity = AREA_CAPACITY[area] || 10;
    const bookedBySlot = {};

    records.forEach(r => {
      const jam  = r.fields['Jam'] || '';
      const tamu = Number(r.fields['Jumlah Orang'] || 0);
      if (!jam) return;
      bookedBySlot[jam] = isSingleRoom
        ? areaCapacity
        : (bookedBySlot[jam] || 0) + tamu;
    });

    const blockedHours = records
      .filter(r => r.fields['Status'] === 'pending' || r.fields['Status'] === 'confirmed')
      .map(r => parseInt((r.fields['Jam'] || '09:00').split(':')[0], 10));

    return ok({ bookedBySlot, blockedHours });
  } catch {
    return ok({ bookedBySlot: {}, blockedHours: [] });
  }
};

function ok(body)       { return { statusCode: 200, headers: cors(), body: JSON.stringify(body) }; }
function err(msg, code) { return { statusCode: code, headers: cors(), body: JSON.stringify({ error: msg }) }; }
function cors()         { return { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }; }
