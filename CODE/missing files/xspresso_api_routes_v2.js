import { randomUUID } from 'node:crypto';
import { publicUser } from './xspresso_auth.js';

/**
 * Integrated Node API v2. Replaces xspresso_api_routes.js for the local MVP.
 * Required services: leads, credits, metrics, settings. All are tenant-scoped.
 */
export function createApiHandler({ store, auth, config, services = {} } = {}) {
  if (!store || !auth || !config) throw new TypeError('store, auth, and config are required.');
  for (const name of ['leads', 'credits', 'metrics', 'settings']) {
    if (!services[name]) throw new TypeError(`services.${name} is required.`);
  }

  return async function handleApi(req, res) {
    try {
      const url = new URL(req.url || '/', 'http://localhost');
      const method = req.method || 'GET';
      const path = url.pathname;

      if (path === '/api/health' && method === 'GET') return send(res, 200, { ok: true, service: 'xspresso-api' });
      if (path === '/api/auth/signup' && method === 'POST') {
        if (!config.signupsEnabled) return send(res, 403, { error: 'SIGNUPS_DISABLED', message: 'New registrations are disabled.' });
        const body = await readJson(req, config.bodyLimitBytes);
        return send(res, 201, await auth.register(body));
      }
      if (path === '/api/auth/login' && method === 'POST') {
        const body = await readJson(req, config.bodyLimitBytes);
        return send(res, 200, await auth.login(body));
      }

      const token = getBearer(req.headers?.authorization);
      const user = await auth.authenticate(token);
      if (!user) return send(res, 401, { error: 'UNAUTHORIZED', message: 'Sign in to continue.' });
      if (path === '/api/auth/logout' && method === 'POST') {
        await auth.logout(token);
        return send(res, 200, { ok: true });
      }
      if (path === '/api/auth/me' && method === 'GET') return send(res, 200, { user: publicUser(user) });

      if (path === '/api/campaigns' && method === 'GET') {
        const state = await store.read();
        return send(res, 200, { campaigns: state.campaigns.filter(row => row.tenantId === user.tenantId) });
      }
      if (path === '/api/campaigns' && method === 'POST') {
        const body = await readJson(req, config.bodyLimitBytes);
        const name = cleanText(body.name, 160);
        if (!name) throw httpError('VALIDATION_ERROR', 'Campaign name is required.', 400);
        const now = new Date().toISOString();
        const campaign = {
          id: randomUUID(), tenantId: user.tenantId, createdBy: user.id, name,
          status: 'draft', goal: cleanText(body.goal, 80), platform: cleanText(body.platform, 80),
          brief: plainObject(body.brief), assets: plainObject(body.assets), createdAt: now, updatedAt: now
        };
        await store.update(state => {
          state.campaigns.push(campaign);
          state.auditEvents.push(audit(user, 'campaign.created', campaign.id, now));
        });
        return send(res, 201, { campaign });
      }

      if (path === '/api/leads' && method === 'GET') {
        const result = await services.leads.list(user, {
          campaignId: url.searchParams.get('campaignId') || undefined,
          status: url.searchParams.get('status') || undefined,
          cursor: url.searchParams.get('cursor') || undefined,
          limit: parseLimit(url.searchParams.get('limit'))
        });
        return send(res, 200, result);
      }
      if (path === '/api/leads' && method === 'POST') {
        const body = await readJson(req, config.bodyLimitBytes);
        const result = await services.leads.capture(user, body);
        return send(res, result.created ? 201 : 200, result);
      }
      const leadEvent = path.match(/^\/api\/leads\/([A-Za-z0-9_-]+)\/events$/);
      if (leadEvent && method === 'POST') {
        const body = await readJson(req, config.bodyLimitBytes);
        return send(res, 201, await services.leads.addTimelineEvent(user, leadEvent[1], body));
      }
      const leadStatus = path.match(/^\/api\/leads\/([A-Za-z0-9_-]+)\/status$/);
      if (leadStatus && method === 'PATCH') {
        const body = await readJson(req, config.bodyLimitBytes);
        return send(res, 200, { lead: await services.leads.updateStatus(user, leadStatus[1], body.status) });
      }

      if (path === '/api/settings' && method === 'GET') return send(res, 200, { settings: await services.settings.get(user) });
      if (path === '/api/settings' && method === 'PATCH') {
        const body = await readJson(req, config.bodyLimitBytes);
        return send(res, 200, { settings: await services.settings.update(user, body) });
      }

      if (path === '/api/credits' && method === 'GET') return send(res, 200, await services.credits.balance(user.tenantId));
      if (path === '/api/credits/ledger' && method === 'GET') {
        return send(res, 200, { entries: await services.credits.list(user.tenantId, {
          limit: parseLimit(url.searchParams.get('limit')), before: url.searchParams.get('before') || undefined
        }) });
      }

      if (path === '/api/metrics/report' && method === 'GET') {
        return send(res, 200, await services.metrics.report(user, {
          from: url.searchParams.get('from') || undefined,
          to: url.searchParams.get('to') || undefined,
          campaignId: url.searchParams.get('campaignId') || undefined
        }));
      }
      const dailyMetrics = path.match(/^\/api\/campaigns\/([A-Za-z0-9_-]+)\/metrics\/daily$/);
      if (dailyMetrics && method === 'PUT') {
        const body = await readJson(req, config.bodyLimitBytes);
        return send(res, 200, { snapshot: await services.metrics.upsertDailySnapshot(user, dailyMetrics[1], body) });
      }

      const campaignMatch = path.match(/^\/api\/campaigns\/([A-Za-z0-9_-]+)$/);
      if (campaignMatch) {
        const id = campaignMatch[1];
        if (method === 'GET') {
          const state = await store.read();
          const campaign = state.campaigns.find(row => row.id === id && row.tenantId === user.tenantId);
          return campaign ? send(res, 200, { campaign }) : send(res, 404, { error: 'NOT_FOUND', message: 'Campaign not found.' });
        }
        if (method === 'PATCH') {
          const body = await readJson(req, config.bodyLimitBytes);
          const patch = {};
          if (Object.hasOwn(body, 'name')) patch.name = cleanText(body.name, 160);
          if (Object.hasOwn(body, 'goal')) patch.goal = cleanText(body.goal, 80);
          if (Object.hasOwn(body, 'platform')) patch.platform = cleanText(body.platform, 80);
          if (Object.hasOwn(body, 'brief')) patch.brief = plainObject(body.brief);
          if (Object.hasOwn(body, 'assets')) patch.assets = plainObject(body.assets);
          if (Object.hasOwn(patch, 'name') && !patch.name) throw httpError('VALIDATION_ERROR', 'Campaign name cannot be empty.', 400);
          const now = new Date().toISOString();
          const updated = await store.update(state => {
            const row = state.campaigns.find(item => item.id === id && item.tenantId === user.tenantId);
            if (!row) return null;
            Object.assign(row, patch, { updatedAt: now });
            state.auditEvents.push(audit(user, 'campaign.updated', id, now));
            return row;
          });
          return updated ? send(res, 200, { campaign: updated }) : send(res, 404, { error: 'NOT_FOUND', message: 'Campaign not found.' });
        }
        if (method === 'DELETE') {
          const now = new Date().toISOString();
          const archived = await store.update(state => {
            const row = state.campaigns.find(item => item.id === id && item.tenantId === user.tenantId);
            if (!row) return false;
            row.status = 'archived'; row.updatedAt = now;
            state.auditEvents.push(audit(user, 'campaign.archived', id, now));
            return true;
          });
          return archived ? send(res, 200, { ok: true, status: 'archived' }) : send(res, 404, { error: 'NOT_FOUND', message: 'Campaign not found.' });
        }
      }
      return send(res, 404, { error: 'NOT_FOUND', message: 'API route not found.' });
    } catch (error) {
      const status = Number.isInteger(error.status) ? error.status : error.code === 'EMAIL_EXISTS' ? 409 : error.code === 'INVALID_CREDENTIALS' ? 401 : error instanceof TypeError ? 400 : 500;
      return send(res, status, { error: error.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'), message: status >= 500 ? 'The request could not be completed.' : error.message });
    }
  };
}

async function readJson(req, limit) {
  if (!Number.isSafeInteger(limit) || limit < 1024) throw new Error('Invalid request body limit configuration.');
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > limit) throw httpError('BODY_TOO_LARGE', 'Request body is too large.', 413);
    chunks.push(buffer);
  }
  if (!size) return {};
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw httpError('INVALID_JSON', 'Request body must be a JSON object.', 400); }
}
function getBearer(value = '') { return /^Bearer\s+([A-Za-z0-9_-]+)$/i.exec(value)?.[1] || ''; }
function cleanText(value, max) { return String(value ?? '').trim().slice(0, max); }
function plainObject(value) { return value && typeof value === 'object' && !Array.isArray(value) ? structuredClone(value) : {}; }
function parseLimit(value) { const n = Number(value); return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 100) : 50; }
function audit(user, action, resourceId, createdAt) { return { id: randomUUID(), tenantId: user.tenantId, actorId: user.id, action, resourceType: 'campaign', resourceId, outcome: 'success', createdAt }; }
function httpError(code, message, status) { return Object.assign(new Error(message), { code, status }); }
function send(res, status, payload) {
  if (res.headersSent) return;
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(body), 'cache-control': 'no-store' });
  res.end(body);
}
