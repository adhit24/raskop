const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE } = process.env;

const CAPS = { indoor: 30, outdoor: 45 };

function getJakartaDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
}

exports.handler = async (event) => {
  const date = (event.queryStringParameters || {}).date || getJakartaDate();

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    return ok(emptyData(date));
  }

  // Compute next day for range query (handles both text and date field types in Airtable)
  const [y, m, d] = date.split('-').map(Number);
  const nextDate = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);

  try {
    // Use range instead of exact match to handle Airtable date/datetime fields consistently
    const formula = encodeURIComponent(
      `AND({Tanggal}>='${date}',{Tanggal}<'${nextDate}',NOT({Status}='rejected'))`
    );
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}` +
      `?filterByFormula=${formula}&fields[]=Jumlah%20Orang&fields[]=Area&fields[]=Status&fields[]=Tanggal`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
    const json = await res.json();

    const totals = { indoor: 0, outdoor: 0 };
    for (const r of (json.records || [])) {
      const area = (r.fields['Area'] || '').toLowerCase().trim();
      if (area in totals) totals[area] += Number(r.fields['Jumlah Orang']) || 0;
    }

    const areas = {};
    for (const [area, cap] of Object.entries(CAPS)) {
      const booked = Math.min(totals[area], cap);
      const pct = Math.min(100, Math.round((booked / cap) * 100));
      const status = pct >= 80 ? 'full' : pct >= 50 ? 'busy' : 'open';
      areas[area] = { booked, capacity: cap, pct, status };
    }

    return ok({ date, areas });
  } catch {
    return ok(emptyData(date));
  }
};

function emptyData(date) {
  const areas = {};
  for (const [area, cap] of Object.entries(CAPS)) {
    areas[area] = { booked: 0, capacity: cap, pct: 0, status: 'open' };
  }
  return { date, areas };
}

function ok(body) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}
