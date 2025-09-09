// /netlify/functions/build-search-index.mjs
import { getStore } from '@netlify/blobs';
export const handler = async () => {
  const store = getStore({ name: 'data' });
  const [hts, fr, regs] = await Promise.all([
    store.get('hts/latest.json', { type: 'json' }),
    store.get('fr/232.json', { type: 'json' }),
    store.get('regs/232.json', { type: 'json' }),
  ]);

  const docs = [];
  for (const x of (hts?.items ?? [])) {
    docs.push({ id: `HTS-${x.htsno}`, type: 'hts', title: x.htsno, text: x.desc, extra: x });
  }
  for (const d of (fr?.results ?? [])) {
    docs.push({ id: `FR-${d.document_number}`, type: 'fr', title: d.title, text: d.abstract, extra: d });
  }
  for (const d of (regs?.data ?? [])) {
    docs.push({ id: `REGS-${d.id}`, type: 'regs', title: d.attributes.title, text: d.attributes.abstract, extra: d });
  }
  await store.setJSON('search/index.json', { updatedAt: new Date().toISOString(), docs });
  return { statusCode: 200, body: `Index ready: ${docs.length}` };
};
