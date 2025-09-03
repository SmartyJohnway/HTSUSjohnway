const test = require('node:test');
const assert = require('node:assert');
const { handler } = require('../netlify/functions/hts-proxy.js');

test('returns JSON with application/json for missing keyword', async () => {
  const res = await handler({ httpMethod: 'GET', queryStringParameters: {} });
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.headers['Content-Type'] || res.headers['content-type'], 'application/json');
  assert.deepStrictEqual(JSON.parse(res.body), { error: 'Missing keyword parameter' });
});

test('returns JSON with application/json for wrong method', async () => {
  const res = await handler({ httpMethod: 'POST', queryStringParameters: {} });
  assert.strictEqual(res.statusCode, 405);
  assert.strictEqual(res.headers['Content-Type'] || res.headers['content-type'], 'application/json');
  assert.deepStrictEqual(JSON.parse(res.body), { error: 'Method Not Allowed' });
});

test('returns JSON with application/json when upstream error occurs', async (t) => {
  t.mock.method(global, 'fetch', async () => ({
    ok: false,
    status: 502,
    statusText: 'Bad Gateway',
    text: async () => 'upstream error',
    headers: { get: () => 'text/plain' }
  }));
  const res = await handler({ httpMethod: 'GET', queryStringParameters: { keyword: 'test' } });
  assert.strictEqual(res.statusCode, 502);
  assert.strictEqual(res.headers['Content-Type'] || res.headers['content-type'], 'application/json');
  const body = JSON.parse(res.body);
  assert.ok(body.error.includes('API Error'));
});

test('returns JSON with application/json when fetch throws', async (t) => {
  t.mock.method(global, 'fetch', async () => { throw new Error('network'); });
  const res = await handler({ httpMethod: 'GET', queryStringParameters: { keyword: 'test' } });
  assert.strictEqual(res.statusCode, 500);
  assert.strictEqual(res.headers['Content-Type'] || res.headers['content-type'], 'application/json');
  const body = JSON.parse(res.body);
  assert.strictEqual(body.error, 'Failed to fetch data from the HTS API.');
});
