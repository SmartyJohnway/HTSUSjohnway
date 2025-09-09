// /netlify/functions/get-index.mjs
import { getStore } from '@netlify/blobs';

export const handler = async () => {
  const store = getStore({ name: 'data' });
  const index =
    (await store.get('search/index.json', { type: 'json' })) ??
    { updatedAt: null, docs: [] };

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(index),
  };
};
