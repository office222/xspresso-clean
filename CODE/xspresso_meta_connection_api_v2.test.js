import test from 'node:test';
import assert from 'node:assert/strict';
import { MetaConnectionApi, readXspressoSessionToken, XSPRESSO_SESSION_KEY } from './xspresso_meta_connection_api_v2.js';

test('dashboard Meta API reads the same session key as the main app', () => {
  const seen = [];
  const storage = { getItem(key) { seen.push(key); return key === 'xspresso_token' ? 'session-value' : null; } };
  assert.equal(readXspressoSessionToken(storage), 'session-value');
  assert.equal(XSPRESSO_SESSION_KEY, 'xspresso_token');
  assert.deepEqual(seen, ['xspresso_token']);
});

test('Meta connection API sends bearer auth and uses OAuth status/connect/disconnect routes', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    const payload = url.endsWith('/status')
      ? { connected:true, connections:[{ adAccountId:'123456', currency:'USD' }] }
      : url.endsWith('/connect')
        ? { authorizationUrl:'https://www.facebook.com/oauth/mock' }
        : { connected:false };
    return new Response(JSON.stringify(payload), { status:200, headers:{ 'content-type':'application/json' } });
  };
  const api = new MetaConnectionApi({ fetchImpl, getToken:() => 'session-value' });
  assert.equal((await api.status()).connections[0].adAccountId, '123456');
  assert.equal((await api.connect({ adAccountId:'123456', currency:'USD' })).authorizationUrl, 'https://www.facebook.com/oauth/mock');
  await api.disconnect();
  assert.deepEqual(calls.map(call => [call.url,call.options.method || 'GET']), [
    ['/api/integrations/meta/status','GET'],
    ['/api/integrations/meta/connect','POST'],
    ['/api/integrations/meta/connection','DELETE'],
  ]);
  assert.ok(calls.every(call => call.options.headers.get('Authorization') === 'Bearer session-value'));
  assert.deepEqual(JSON.parse(calls[1].options.body), { adAccountId:'123456', currency:'USD' });
});
