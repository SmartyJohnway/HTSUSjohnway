// /netlify/functions/refresh-hts.mjs
import { getStore } from '@netlify/blobs';

export const handler = async () => {
  const store = getStore({ name: 'data' });
  const fetchRange = async (from, to) => {
    const url = new URL('https://hts.usitc.gov/reststop/exportList');
    url.searchParams.set('from', from);
    url.searchParams.set('to', to);
    url.searchParams.set('format', 'JSON');
    url.searchParams.set('styles', 'false');
    const r = await fetch(url, { headers: { 'User-Agent': 'section232-app/1.0' }});
    if (!r.ok) throw new Error(`HTS export ${from}-${to} ${r.status}`);
    return r.json();
  };

  const chunks = [];
  for (let ch = 1; ch <= 99; ch++) {
    const from = String(ch).padStart(2, '0') + '00';
    const to   = String(ch + 1).padStart(2, '0') + '00';
    try {
      const data = await fetchRange(from, to);
      chunks.push(...data);
    } catch (e) {
      // ignore gaps
    }
  }
  const hts = chunks.map(x => ({
    htsno: x.htsno, desc: x.description,
    uoq: x.uoq, general: x.general_rate, special: x.special_rate, col2: x.column2_rate
  }));
  await store.setJSON('hts/latest.json', { updatedAt: new Date().toISOString(), items: hts });
  return { statusCode: 200, body: `HTS saved: ${hts.length}` };
};
