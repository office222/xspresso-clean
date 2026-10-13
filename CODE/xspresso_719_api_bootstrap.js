// xspresso_719_api_bootstrap.js
// Basic bootstrap helpers for the Xspresso app.

export const APP_NAME = 'Xspresso';

export function createAppConfig(overrides = {}) {
  return {
    appName: APP_NAME,
    version: '1.0.0',
    environment: 'production',
    currency: 'credits',
    defaultTone: 'simple',
    defaultGoal: 'sales',
    monitoringEnabled: true,
    ...overrides,
  };
}

export function makeId(prefix = 'xsp') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso() {
  return new Date().toISOString();
}
