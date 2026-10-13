// xspresso_837_utils.js
export const nowIso = () => new Date().toISOString();

export const uid = (prefix = 'id') => `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function scoreAd({ cpc = 0, ctr = 0, conversions = 0, clicks = 0 } = {}) {
  const cpcPenalty = cpc > 1.5 ? 25 : cpc > 1 ? 10 : 0;
  const ctrBonus = ctr >= 1 ? 25 : ctr >= 0.5 ? 10 : -10;
  const convBonus = conversions > 0 ? Math.min(30, conversions * 10) : clicks > 20 ? -15 : 0;
  return clamp(50 + ctrBonus + convBonus - cpcPenalty, 0, 100);
}

export function money(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0));
}

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}
