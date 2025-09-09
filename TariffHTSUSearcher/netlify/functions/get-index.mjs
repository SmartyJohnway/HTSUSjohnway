// /netlify/functions/get-index.mjs
import { getStore } from '@netlify/blobs';

export const handler = async () => {
  try {
    const store = getStore({ name: 'data' });
    let index = await store.get('search/index.json', { type: 'json' });
    if (!index) {
      index = { updatedAt: null, docs: [] };
    }

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(index),
    };
  } catch (error) {
    console.error('Failed to load index', error);
    const fallbackIndex = { updatedAt: null, docs: [] };
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(fallbackIndex),
    };
  }
};