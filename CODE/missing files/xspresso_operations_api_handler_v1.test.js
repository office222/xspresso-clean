import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createOperationsApiHandler } from './xspresso_operations_api_handler_v1.js';

function responseCapture() {
  return { status: 0, headers: {}, body: '', writeHead(status, headers) { this.status = status; this.headers = headers; }, setHeader(key, value) { this.headers[key] = value; }, end(body = '') { this.body = body; } };
}
async function request(handler, { method = 'GET', path, token = 'good-token', body } = {}) {
  const req = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))]);
  req.method = method; req.url = path; req.headers = token ? { authorization: `Bearer ${token}` } : {};
  const res = responseCapture(); await handler(req, res);
  return { status: res.status, headers: res.headers, data: res.body ? JSON.parse(res.body) : null };
}

test('monitor endpoint is authenticated and tenant-scoped', async () => {
  let args;
  const handler = createOperationsApiHandler({
    auth: { authenticate: async token => token === 'good-token' ? { id: 'u1', tenantId: 't1' } : null },
    monitoringWorker: { run: async input => { args = input; return { checked: true, ads: [] }; } },
    fallback: async (_req, res) => { res.writeHead(404, {}); res.end('{}'); }
  });
  const denied = await request(handler, { path: '/api/campaigns/c1/monitor', token: '' });
  assert.equal(denied.status, 401);
  const ok = await request(handler, { method: 'POST', path: '/api/campaigns/c1/monitor', body: { thresholds: { minClicks: 20 } } });
  assert.equal(ok.status, 200);
  assert.deepEqual(args, { tenantId: 't1', campaignId: 'c1', thresholds: { minClicks: 20 } });
});

test('alerts are listed and resolved only within authenticated tenant', async () => {
  const calls = [];
  const handler = createOperationsApiHandler({
    auth: { authenticate: async () => ({ id: 'user-7', tenantId: 'tenant-7' }) },
    alertRepository: {
      list: async input => { calls.push(['list', input]); return [{ id: 'a1' }]; },
      resolve: async input => { calls.push(['resolve', input]); return { id: input.alertId, status: 'resolved' }; }
    },
    fallback: async (_req, res) => { res.writeHead(404, {}); res.end('{}'); }
  });
  const list = await request(handler, { path: '/api/alerts?status=open&limit=10' });
  assert.equal(list.status, 200); assert.equal(list.data.alerts.length, 1);
  const resolved = await request(handler, { method: 'POST', path: '/api/alerts/a1/resolve' });
  assert.equal(resolved.status, 200);
  assert.deepEqual(calls[0][1], { tenantId: 'tenant-7', status: 'open', limit: 10 });
  assert.deepEqual(calls[1][1], { tenantId: 'tenant-7', alertId: 'a1', actorId: 'user-7' });
});

test('follow-up enrollment passes lead, campaign, authenticated user, and idempotency key', async () => {
  let args;
  const handler = createOperationsApiHandler({
    auth: { authenticate: async () => ({ id: 'u2', tenantId: 't2' }) },
    followups: { enroll: async input => { args = input; return { id: 'en-1' }; } },
    fallback: async (_req, res) => { res.writeHead(404, {}); res.end('{}'); }
  });
  const req = Readable.from([Buffer.from(JSON.stringify({ campaignId: 'c2' }))]);
  req.method = 'POST'; req.url = '/api/leads/l2/followups';
  req.headers = { authorization: 'Bearer good-token', 'idempotency-key': 'enroll-key-123' };
  const res = responseCapture(); await handler(req, res);
  assert.equal(res.status, 200);
  assert.equal(args.user.tenantId, 't2'); assert.equal(args.leadId, 'l2');
  assert.equal(args.campaignId, 'c2'); assert.equal(args.idempotencyKey, 'enroll-key-123');
});
