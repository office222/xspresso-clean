/** User-scoped settings service with a strict allowlist and safe defaults. */
const TONES = new Set(['simple', 'friendly', 'bold', 'premium', 'direct', 'persuasive']);
const GOALS = new Set(['sales', 'leads', 'clicks', 'list_building']);

export const DEFAULT_SETTINGS = Object.freeze({
  tone: 'simple', defaultGoal: 'sales', monitoringEnabled: true,
  alerts: Object.freeze({ cpcWarning: 1.5, ctrWarning: 0.008, lowCreditPercent: 20 })
});

export class SettingsService {
  constructor({ store, clock = () => Date.now() } = {}) {
    if (!store) throw new TypeError('SettingsService requires a store.');
    this.store = store;
    this.clock = clock;
  }

  async get(user) {
    const userId = requireUser(user);
    const state = await this.store.read();
    const saved = (state.userSettings || []).find(item => item.userId === userId);
    return { ...structuredClone(DEFAULT_SETTINGS), ...(saved ? structuredClone(saved.values) : {}), userId };
  }

  async update(user, patch = {}) {
    const userId = requireUser(user);
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw error('INVALID_SETTINGS', 'Settings must be an object.', 400);
    const allowed = new Set(['tone', 'defaultGoal', 'monitoringEnabled', 'alerts']);
    for (const key of Object.keys(patch)) if (!allowed.has(key)) throw error('SETTING_NOT_ALLOWED', `Setting is not editable: ${key}`, 400);
    const current = await this.get(user);
    const next = { ...current };
    if (Object.hasOwn(patch, 'tone')) {
      if (!TONES.has(patch.tone)) throw error('INVALID_TONE', 'Choose a supported tone.', 400);
      next.tone = patch.tone;
    }
    if (Object.hasOwn(patch, 'defaultGoal')) {
      if (!GOALS.has(patch.defaultGoal)) throw error('INVALID_GOAL', 'Choose a supported campaign goal.', 400);
      next.defaultGoal = patch.defaultGoal;
    }
    if (Object.hasOwn(patch, 'monitoringEnabled')) {
      if (typeof patch.monitoringEnabled !== 'boolean') throw error('INVALID_SETTING', 'monitoringEnabled must be boolean.', 400);
      next.monitoringEnabled = patch.monitoringEnabled;
    }
    if (Object.hasOwn(patch, 'alerts')) next.alerts = validateAlerts(patch.alerts, next.alerts);
    const now = new Date(this.clock()).toISOString();
    const saved = await this.store.update(state => {
      state.userSettings ||= [];
      let row = state.userSettings.find(item => item.userId === userId);
      if (!row) { row = { userId, tenantId: user.tenantId, createdAt: now }; state.userSettings.push(row); }
      row.values = { tone: next.tone, defaultGoal: next.defaultGoal, monitoringEnabled: next.monitoringEnabled, alerts: next.alerts };
      row.updatedAt = now;
      return row;
    });
    return { ...structuredClone(saved.values), userId, updatedAt: saved.updatedAt };
  }
}

function validateAlerts(input, current) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw error('INVALID_ALERT_SETTINGS', 'alerts must be an object.', 400);
  const allowed = new Set(['cpcWarning', 'ctrWarning', 'lowCreditPercent']);
  for (const key of Object.keys(input)) if (!allowed.has(key)) throw error('SETTING_NOT_ALLOWED', `Alert setting is not editable: ${key}`, 400);
  const result = { ...current };
  for (const [key, value] of Object.entries(input)) {
    const n = Number(value);
    const max = key === 'lowCreditPercent' ? 100 : 10;
    if (!Number.isFinite(n) || n < 0 || n > max) throw error('INVALID_ALERT_THRESHOLD', `${key} must be between 0 and ${max}.`, 400);
    result[key] = n;
  }
  return result;
}
function requireUser(user) {
  if (!user?.id || !user?.tenantId) throw error('UNAUTHENTICATED', 'Authenticated user required.', 401);
  return user.id;
}
function error(code, message, status) { return Object.assign(new Error(message), { code, status }); }
