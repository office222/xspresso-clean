/** Tenant-scoped daily campaign metric snapshots and reports. */
import { randomUUID } from 'node:crypto';

const METRICS = ['impressions', 'clicks', 'spend', 'conversions'];

export class MetricsService {
  constructor({ store, clock = () => Date.now() } = {}) {
    if (!store) throw new TypeError('MetricsService requires a store.');
    this.store = store;
    this.clock = clock;
  }

  async upsertDailySnapshot(user, campaignId, input = {}) {
    const tenantId = requireTenant(user);
    const date = validDate(input.date || new Date(this.clock()).toISOString().slice(0, 10));
    const values = {};
    for (const key of METRICS) values[key] = nonNegativeNumber(input[key] ?? 0, key);
    if (!Number.isSafeInteger(values.impressions) || !Number.isSafeInteger(values.clicks) || !Number.isSafeInteger(values.conversions)) {
      throw error('INVALID_METRIC', 'Impressions, clicks, and conversions must be whole numbers.', 400);
    }
    if (values.clicks > values.impressions) throw error('INVALID_METRIC', 'Clicks cannot exceed impressions.', 400);
    const now = new Date(this.clock()).toISOString();
    return this.store.update(state => {
      state.metricSnapshots ||= [];
      const campaign = state.campaigns.find(row => row.id === campaignId && row.tenantId === tenantId);
      if (!campaign) throw error('CAMPAIGN_NOT_FOUND', 'Campaign not found.', 404);
      let row = state.metricSnapshots.find(item => item.tenantId === tenantId && item.campaignId === campaignId && item.date === date);
      if (!row) {
        row = { id: randomUUID(), tenantId, campaignId, date, createdAt: now };
        state.metricSnapshots.push(row);
      }
      Object.assign(row, values, { updatedAt: now });
      return derive(row);
    });
  }

  async report(user, { from, to, campaignId } = {}) {
    const tenantId = requireTenant(user);
    const start = from ? validDate(from) : '0000-01-01';
    const end = to ? validDate(to) : '9999-12-31';
    if (start > end) throw error('INVALID_DATE_RANGE', 'The start date must not be after the end date.', 400);
    const state = await this.store.read();
    if (campaignId && !state.campaigns.some(row => row.id === campaignId && row.tenantId === tenantId)) {
      throw error('CAMPAIGN_NOT_FOUND', 'Campaign not found.', 404);
    }
    const rows = (state.metricSnapshots || []).filter(row => row.tenantId === tenantId && row.date >= start && row.date <= end && (!campaignId || row.campaignId === campaignId));
    const totals = rows.reduce((sum, row) => {
      for (const key of METRICS) sum[key] += row[key] || 0;
      return sum;
    }, { impressions: 0, clicks: 0, spend: 0, conversions: 0 });
    const byCampaign = new Map();
    for (const row of rows) {
      const item = byCampaign.get(row.campaignId) || { campaignId: row.campaignId, impressions: 0, clicks: 0, spend: 0, conversions: 0 };
      for (const key of METRICS) item[key] += row[key] || 0;
      byCampaign.set(row.campaignId, item);
    }
    return { from: start, to: end, totals: derive(totals), campaigns: [...byCampaign.values()].map(derive), snapshotCount: rows.length };
  }
}

function derive(row) {
  const impressions = row.impressions || 0, clicks = row.clicks || 0, spend = row.spend || 0, conversions = row.conversions || 0;
  return { ...row, ctr: impressions ? clicks / impressions : 0, cpc: clicks ? spend / clicks : 0, cpa: conversions ? spend / conversions : null };
}
function nonNegativeNumber(value, field) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw error('INVALID_METRIC', `${field} must be a non-negative number.`, 400);
  return n;
}
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value) {
    throw error('INVALID_DATE', 'Dates must use a valid YYYY-MM-DD value.', 400);
  }
  return value;
}
function requireTenant(user) {
  if (!user?.id || !user?.tenantId) throw error('UNAUTHENTICATED', 'Authenticated user required.', 401);
  return user.tenantId;
}
function error(code, message, status) { return Object.assign(new Error(message), { code, status }); }
