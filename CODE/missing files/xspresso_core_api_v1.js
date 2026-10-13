import { randomUUID } from 'node:crypto';

/** Core tenant-scoped JSON API: auth, campaigns, leads, settings, and balances. */
export function createCoreApiHandler({ store, auth, config = {} } = {}) {
  if (!store || !auth) throw new TypeError('store and auth are required.');
  const bodyLimitBytes = config.bodyLimitBytes || 1_000_000;
  return async function coreApi(req, res) {
    const url = new URL(req.url || '/', 'http://localhost');
    const method = String(req.method || 'GET').toUpperCase();
    const path = url.pathname;
    try {
      if (method === 'GET' && path === '/api/health') return send(res, 200, { status: 'ok' });
      if (method === 'POST' && ['/api/auth/signup', '/api/auth/register'].includes(path)) {
        if (config.signupEnabled === false) return send(res, 403, { error: 'SIGNUP_DISABLED', message: 'New account creation is disabled.' });
        const body = await readJson(req, bodyLimitBytes);
        return send(res, 201, await auth.register({ email: body.email, password: body.password, name: body.name }));
      }
      if (method === 'POST' && path === '/api/auth/login') {
        const body = await readJson(req, bodyLimitBytes);
        return send(res, 200, await auth.login({ email: body.email, password: body.password }));
      }
      const token = /^Bearer\s+([A-Za-z0-9_-]+)$/i.exec(req.headers?.authorization || '')?.[1] || '';
      if (method === 'POST' && path === '/api/auth/logout') {
        await auth.logout(token);
        return send(res, 200, { loggedOut: true });
      }
      const user = await auth.authenticate(token);
      if (!user?.id || !user?.tenantId) return send(res, 401, { error: 'UNAUTHORIZED', message: 'Sign in to continue.' });
      if (method === 'GET' && path === '/api/auth/me') return send(res, 200, { user });

      if (path === '/api/campaigns' && method === 'GET') {
        const state = await store.read();
        return send(res, 200, { campaigns: (state.campaigns || []).filter(row => row.tenantId === user.tenantId).sort(newestFirst) });
      }
      if (path === '/api/campaigns' && method === 'POST') {
        const body = await readJson(req, bodyLimitBytes);
        const name = requiredText(body.name, 'name', 120);
        const brief = plainObject(body.brief) ? structuredClone(body.brief) : {};
        const campaign = {
          id: randomUUID(), tenantId: user.tenantId, name,
          platform: optionalText(body.platform, 40) || 'general',
          goal: optionalText(body.goal, 120) || 'awareness', brief,
          status: 'draft', reviewStatus: 'needs_review', assets: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        };
        const saved = await store.update(state => { state.campaigns ||= []; state.campaigns.push(campaign); state.auditEvents ||= []; state.auditEvents.push({ id: randomUUID(), tenantId: user.tenantId, actorId: user.id, action: 'campaign.created', resourceType: 'campaign', resourceId: campaign.id, createdAt: campaign.createdAt }); return campaign; });
        return send(res, 201, { campaign: saved });
      }
      const campaignMatch = path.match(/^\/api\/campaigns\/([A-Za-z0-9_-]+)$/);
      if (campaignMatch && method === 'GET') {
        const state = await store.read();
        const campaign = (state.campaigns || []).find(row => row.id === campaignMatch[1] && row.tenantId === user.tenantId);
        if (!campaign) return send(res, 404, { error: 'CAMPAIGN_NOT_FOUND', message: 'Campaign not found.' });
        return send(res, 200, { campaign });
      }
      if (path === '/api/leads' && method === 'GET') {
        const state = await store.read();
        const leads = (state.leads || []).filter(row => row.tenantId === user.tenantId).sort(newestFirst).slice(0, 500);
        return send(res, 200, { leads });
      }
      if (path === '/api/leads' && method === 'POST') {
        const body = await readJson(req, bodyLimitBytes);
        if (body.consent !== true) return send(res, 400, { error: 'CONSENT_REQUIRED', message: 'Explicit consent is required before adding a lead.' });
        const email = normalizeLeadEmail(body.email);
        const now = new Date().toISOString();
        const result = await store.update(state => {
          state.leads ||= [];
          const existing = state.leads.find(row => row.tenantId === user.tenantId && row.email === email);
          if (existing) {
            existing.consent = true; existing.consentGrantedAt ||= now; existing.updatedAt = now;
            return { lead: existing, created: false };
          }
          const lead = { id: randomUUID(), tenantId: user.tenantId, email, name: optionalText(body.name, 100), source: optionalText(body.source, 120) || 'manual', consent: true, consentGrantedAt: now, status: 'new', events: [], createdAt: now, updatedAt: now };
          state.leads.push(lead);
          state.auditEvents ||= []; state.auditEvents.push({ id: randomUUID(), tenantId: user.tenantId, actorId: user.id, action: 'lead.created_with_consent', resourceType: 'lead', resourceId: lead.id, createdAt: now });
          return { lead, created: true };
        });
        return send(res, result.created ? 201 : 200, { lead: result.lead, created: result.created });
      }
      if (path === '/api/settings' && method === 'GET') {
        const state = await store.read();
        const settings = (state.tenantSettings || []).find(row => row.tenantId === user.tenantId)?.settings || defaultSettings();
        return send(res, 200, { settings });
      }
      if (path === '/api/settings' && method === 'PATCH') {
        const body = await readJson(req, bodyLimitBytes);
        const patch = validateSettingsPatch(body);
        const settings = await store.update(state => {
          state.tenantSettings ||= [];
          let row = state.tenantSettings.find(entry => entry.tenantId === user.tenantId);
          if (!row) { row = { tenantId: user.tenantId, settings: defaultSettings(), updatedAt: new Date().toISOString() }; state.tenantSettings.push(row); }
          row.settings = { ...defaultSettings(), ...row.settings, ...patch }; row.updatedAt = new Date().toISOString();
          return row.settings;
        });
        return send(res, 200, { settings });
      }
      if (path === '/api/credits' && method === 'GET') {
        const state = await store.read();
        const entries = (state.creditLedger || []).filter(row => row.tenantId === user.tenantId).sort(newestFirst).slice(0, 100);
        const balance = entries.reduce((sum, row) => sum + (row.kind === 'debit' ? -Number(row.credits || 0) : Number(row.credits || 0)), 0);
        return send(res, 200, { balance: Math.max(0, balance), entries });
      }
      return send(res, 404, { error: 'NOT_FOUND', message: 'Route not found.' });
    } catch (error) {
      const status = Number.isInteger(error?.status) ? error.status : 500;
      return send(res, status, { error: error?.code || 'INTERNAL_ERROR', message: status >= 500 ? 'The request could not be completed.' : error.message });
    }
  };
}

function defaultSettings() { return { defaultTone: 'clear', defaultPlatform: 'general', notificationsEnabled: true }; }
function validateSettingsPatch(body) {
  if (!plainObject(body)) throw fault('INVALID_SETTINGS', 'A JSON object is required.', 400);
  const allowed = new Set(['defaultTone', 'defaultPlatform', 'notificationsEnabled']);
  for (const key of Object.keys(body)) if (!allowed.has(key)) throw fault('INVALID_SETTINGS', `Setting '${key}' cannot be changed.`, 400);
  const patch = {};
  if ('defaultTone' in body) patch.defaultTone = requiredText(body.defaultTone, 'defaultTone', 40);
  if ('defaultPlatform' in body) patch.defaultPlatform = requiredText(body.defaultPlatform, 'defaultPlatform', 40);
  if ('notificationsEnabled' in body) {
    if (typeof body.notificationsEnabled !== 'boolean') throw fault('INVALID_SETTINGS', 'notificationsEnabled must be boolean.', 400);
    patch.notificationsEnabled = body.notificationsEnabled;
  }
  return patch;
}
function normalizeLeadEmail(value) {
  if (typeof value !== 'string') throw fault('INVALID_EMAIL', 'Enter a valid email address.', 400);
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fault('INVALID_EMAIL', 'Enter a valid email address.', 400);
  return email;
}
function requiredText(value, field, max) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw fault('INVALID_INPUT', `${field} must be 1–${max} characters.`, 400);
  return value.trim();
}
function optionalText(value, max) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function plainObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function newestFirst(a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); }
function fault(code, message, status) { return Object.assign(new Error(message), { code, status }); }
async function readJson(req, limit) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk); size += b.length; if (size > limit) throw fault('BODY_TOO_LARGE', 'Request body too large.', 413); chunks.push(b); }
  if (!size) return {};
  let value; try { value = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw fault('INVALID_JSON', 'Request body must be valid JSON.', 400); }
  if (!plainObject(value)) throw fault('INVALID_JSON', 'Request body must be a JSON object.', 400);
  return value;
}
function send(res, status, value) {
  const payload = JSON.stringify(value);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(payload), 'cache-control': 'no-store' });
  res.end(payload);
}
