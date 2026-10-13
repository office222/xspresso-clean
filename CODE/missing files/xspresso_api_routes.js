/** REST API routes for auth, health, and tenant-scoped campaign drafts. */
import { randomUUID } from 'node:crypto';
import { publicUser } from './xspresso_auth.js';

export function createApiHandler({ store, auth, config }) {
  if (!store || !auth || !config) throw new TypeError('store, auth, and config are required.');

  return async function handleApi(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const method = req.method || 'GET';
    if (url.pathname === '/api/health' && method === 'GET') return json(res, 200, { ok: true, service: 'xspresso-api' });

    if (method === 'POST' && url.pathname === '/api/auth/signup') {
      if (!config.signupsEnabled) return json(res, 403, { error: 'SIGNUPS_DISABLED', message: 'New registrations are temporarily disabled.' });
      const body = await readJson(req, config.bodyLimitBytes);
      try { return json(res, 201, await auth.register(body)); }
      catch (error) { return sendError(res, error); }
    }
    if (method === 'POST' && url.pathname === '/api/auth/login') {
      const body = await readJson(req, config.bodyLimitBytes);
      try { return json(res, 200, await auth.login(body)); }
      catch (error) { return sendError(res, error); }
    }

    const token = bearer(req.headers.authorization);
    const user = await auth.authenticate(token);
    if (!user) return json(res, 401, { error: 'UNAUTHORIZED', message: 'Sign in to continue.' });

    if (method === 'POST' && url.pathname === '/api/auth/logout') {
      await auth.logout(token);
      return json(res, 200, { ok: true });
    }
    if (method === 'GET' && url.pathname === '/api/auth/me') return json(res, 200, { user });

    if (url.pathname === '/api/campaigns' && method === 'GET') {
      const state = await store.read();
      const rows = state.campaigns.filter(item => item.tenantId === user.tenantId);
      return json(res, 200, { campaigns: rows });
    }
    if (url.pathname === '/api/campaigns' && method === 'POST') {
      const body = await readJson(req, config.bodyLimitBytes);
      const name = String(body.name || '').trim().slice(0, 160);
      if (!name) return json(res, 400, { error: 'VALIDATION_ERROR', message: 'Campaign name is required.' });
      const campaign = {
        id: randomUUID(), tenantId: user.tenantId, createdBy: user.id, name,
        status: 'draft', goal: safeText(body.goal, 80), platform: safeText(body.platform, 80),
        brief: safeObject(body.brief), assets: safeObject(body.assets),
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      };
      await store.update(state => {
        state.campaigns.push(campaign);
        state.auditEvents.push(audit(user, 'campaign.created', campaign.id));
      });
      return json(res, 201, { campaign });
    }

    const match = url.pathname.match(/^\/api\/campaigns\/([A-Za-z0-9_-]+)$/);
    if (match) {
      const id = match[1];
      const state = await store.read();
      const campaign = state.campaigns.find(item => item.id === id && item.tenantId === user.tenantId);
      if (!campaign) return json(res, 404, { error: 'NOT_FOUND', message: 'Campaign not found.' });
      if (method === 'GET') return json(res, 200, { campaign });
      if (method === 'PATCH') {
        const body = await readJson(req, config.bodyLimitBytes);
        const allowed = ['name', 'goal', 'platform', 'brief', 'assets'];
        const patch = {};
        for (const key of allowed) if (Object.hasOwn(body, key)) patch[key] = key === 'brief' || key === 'assets' ? safeObject(body[key]) : safeText(body[key], key === 'name' ? 160 : 80);
        if (Object.hasOwn(patch, 'name') && !patch.name) return json(res, 400, { error: 'VALIDATION_ERROR', message: 'Campaign name cannot be empty.' });
        const updated = await store.update(draft => {
          const row = draft.campaigns.find(item => item.id === id && item.tenantId === user.tenantId);
          if (!row) return null;
          Object.assign(row, patch, { updatedAt: new Date().toISOString() });
          draft.auditEvents.push(audit(user, 'campaign.updated', id));
          return row;
        });
        return updated ? json(res, 200, { campaign: updated }) : json(res, 404, { error: 'NOT_FOUND', message: 'Campaign not found.' });
      }
      if (method === 'DELETE') {
        await store.update(draft => {
          const row = draft.campaigns.find(item => item.id === id && item.tenantId === user.tenantId);
          if (row) { row.status = 'archived'; row.updatedAt = new Date().toISOString(); draft.auditEvents.push(audit(user, 'campaign.archived', id)); }
        });
        return json(res, 200, { ok: true, status: 'archived' });
      }
    }

    return json(res, 404, { error: 'NOT_FOUND', message: 'API route not found.' });
  };
}

async function readJson(req, limit) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) { const error = new Error('Request body is too large.'); error.status = 413; throw error; }
    chunks.push(chunk);
  }
  if (!size) return {};
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { const error = new Error('Request body must be a JSON object.'); error.status = 400; throw error; }
}
function bearer(header = '') { const match = /^Bearer\s+([A-Za-z0-9_-]+)$/i.exec(header); return match?.[1] || ''; }
function safeText(value, limit) { return String(value ?? '').trim().slice(0, limit); }
function safeObject(value) { return value && typeof value === 'object' && !Array.isArray(value) ? structuredClone(value) : {}; }
function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(body), 'cache-control': 'no-store' });
  res.end(body);
}
function sendError(res, error) {
  const status = error.code === 'EMAIL_EXISTS' ? 409 : error.code === 'INVALID_CREDENTIALS' ? 401 : error.status || (error instanceof TypeError ? 400 : 500);
  return json(res, status, { error: error.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'), message: status >= 500 ? 'The request could not be completed.' : error.message });
}
function audit(user, action, resourceId) {
  return { id: randomUUID(), tenantId: user.tenantId, actorId: user.id, action,
    resourceType: 'campaign', resourceId, outcome: 'success', createdAt: new Date().toISOString() };
}
