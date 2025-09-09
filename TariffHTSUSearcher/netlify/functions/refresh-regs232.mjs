// /netlify/functions/refresh-regs232.mjs
import { getStore } from '@netlify/blobs';
export const handler = async () => {
  const store = getStore({ name: 'data' });
  const key = process.env.REGS_API_KEY;
  if (!key) return { statusCode: 500, body: 'Missing REGS_API_KEY' };
  const base = 'https://api.regulations.gov/v4/documents';
  const q = new URLSearchParams({
    'filter[searchTerm]': 'Section 232',
    'filter[agency]': 'BIS',
    'page[size]': '250'
  });
  const r = await fetch(`${base}?${q}`, { headers: { 'X-Api-Key': key }});
  if (!r.ok) return { statusCode: r.status, body: await r.text() };
  const data = await r.json();
  await store.setJSON('regs/232.json', data);
  return { statusCode: 200, body: `Regs docs: ${data?.data?.length ?? 0}` };
};
