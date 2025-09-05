// /netlify/functions/refresh-fr232.mjs
import { getStore } from '@netlify/blobs';
export const handler = async () => {
  const store = getStore({ name: 'data' });
  const base = 'https://www.federalregister.gov/api/v1/documents.json';
  const params = new URLSearchParams({
    'conditions[term]': 'Section 232',
    'conditions[agencies][]': 'Bureau of Industry and Security',
    order: 'newest', per_page: '100'
  });
  const r = await fetch(`${base}?${params}`);
  const data = await r.json();
  await store.setJSON('fr/232.json', data);
  return { statusCode: 200, body: `FR docs: ${data?.results?.length ?? 0}` };
};
