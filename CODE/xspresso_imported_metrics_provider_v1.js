import { createHash } from 'node:crypto';

const REQUIRED = ['date', 'ad_id', 'impressions', 'clicks', 'spend', 'conversions', 'currency'];
const MAX_CSV_BYTES = 2 * 1024 * 1024;

function parseRecords(text, maxRows) {
  const rows = []; let row = []; let field = ''; let quoted = false; let justClosedQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; justClosedQuote = true; }
      else field += c;
      continue;
    }
    if (justClosedQuote && c !== ',' && c !== '\n' && c !== '\r' && !/\s/.test(c)) throw new Error(`Unexpected character after quoted field at offset ${i}.`);
    if (c === '"') {
      if (field !== '' || justClosedQuote) throw new Error(`Unexpected quote at offset ${i}.`);
      quoted = true;
    } else if (c === ',') { row.push(field); field = ''; justClosedQuote = false; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = ''; justClosedQuote = false;
      if (row.some(value => value.trim() !== '')) rows.push(row);
      row = [];
      if (rows.length > maxRows + 1) throw new Error(`CSV exceeds the ${maxRows} row limit.`);
    } else { field += c; justClosedQuote = false; }
  }
  if (quoted) throw new Error('CSV ends inside a quoted field.');
  if (field !== '' || row.length) { row.push(field); if (row.some(value => value.trim() !== '')) rows.push(row); }
  if (rows.length > maxRows + 1) throw new Error(`CSV exceeds the ${maxRows} row limit.`);
  return rows;
}

function integer(value, name) {
  if (!/^\d+$/.test(value)) throw new Error(`${name} must be a non-negative integer.`);
  const n = Number(value); if (!Number.isSafeInteger(n)) throw new Error(`${name} is outside the supported range.`); return n;
}
function decimal(value, name) {
  if (!/^(?:\d+)(?:\.\d+)?$/.test(value)) throw new Error(`${name} must be a non-negative number.`);
  const n = Number(value); if (!Number.isFinite(n) || n > 1e12) throw new Error(`${name} is outside the supported range.`); return n;
}
function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('date must use YYYY-MM-DD format.');
  const d = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== value) throw new Error('date is not a valid calendar date.');
  return value;
}

export function parseCampaignMetricsCsv(input, { maxRows = 10000 } = {}) {
  if (typeof input !== 'string') throw new TypeError('CSV input must be text.');
  if (Buffer.byteLength(input, 'utf8') > MAX_CSV_BYTES) throw new Error('CSV exceeds the 2 MiB limit.');
  const text = input.replace(/^\uFEFF/, '');
  const records = parseRecords(text, maxRows);
  if (records.length < 2) throw new Error('CSV must contain a header and at least one data row.');
  const headers = records[0].map(value => value.trim().toLowerCase());
  if (new Set(headers).size !== headers.length) throw new Error('CSV contains duplicate column names.');
  const missing = REQUIRED.filter(name => !headers.includes(name));
  if (missing.length) throw new Error(`CSV is missing required columns: ${missing.join(', ')}.`);
  const byKey = new Map();
  for (let index = 1; index < records.length; index++) {
    const cells = records[index];
    if (cells.length !== headers.length) throw new Error(`Row ${index + 1} has ${cells.length} columns; expected ${headers.length}.`);
    const raw = Object.fromEntries(headers.map((header, i) => [header, cells[i].trim()]));
    const adId = raw.ad_id;
    if (!adId || adId.length > 160 || /[\u0000-\u001f]/.test(adId)) throw new Error(`Row ${index + 1} has an invalid ad_id.`);
    const date = parseDate(raw.date);
    const impressions = integer(raw.impressions, 'impressions');
    const clicks = integer(raw.clicks, 'clicks');
    const spend = decimal(raw.spend, 'spend');
    const conversions = decimal(raw.conversions, 'conversions');
    const currency = raw.currency.toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error(`Row ${index + 1} has an invalid currency code.`);
    if (clicks > impressions) throw new Error(`Row ${index + 1} has more clicks than impressions.`);
    const key = `${date}\u0000${adId}\u0000${currency}`;
    const old = byKey.get(key) || { date, adId, currency, impressions: 0, clicks: 0, spend: 0, conversions: 0 };
    old.impressions += impressions; old.clicks += clicks; old.spend += spend; old.conversions += conversions;
    byKey.set(key, old);
  }
  if (!byKey.size) throw new Error('CSV contains no usable metric rows.');
  return [...byKey.values()];
}

export class ImportedCsvMetricsProvider {
  constructor({ store, lookbackDays = 30, clock = Date.now } = {}) {
    if (!store) throw new TypeError('store is required.');
    this.store = store; this.lookbackDays = lookbackDays; this.clock = clock;
  }
  async getCampaignMetrics(input = {}) {
    const tenantId = input.tenantId || input.user?.tenantId || input.campaign?.tenantId;
    const campaignId = input.campaignId || input.campaign?.id;
    if (!tenantId || !campaignId) throw Object.assign(new Error('tenantId and campaignId are required.'), { status: 400 });
    const state = await this.store.read();
    const campaign = (state.campaigns || []).find(c => c.id === campaignId && c.tenantId === tenantId);
    if (!campaign) throw Object.assign(new Error('Campaign not found.'), { status: 404 });
    const cutoff = new Date(this.clock() - this.lookbackDays * 86400000).toISOString().slice(0, 10);
    const rows = (state.metricsSnapshots || []).filter(r => r.tenantId === tenantId && r.campaignId === campaignId && r.date >= cutoff);
    const grouped = new Map();
    for (const row of rows) {
      const key = `${row.adId}\u0000${row.currency}`;
      const item = grouped.get(key) || { adId: row.adId, currency: row.currency, impressions: 0, clicks: 0, spend: 0, conversions: 0, latestDate: row.date };
      item.impressions += row.impressions; item.clicks += row.clicks; item.spend += row.spend; item.conversions += row.conversions;
      if (row.date > item.latestDate) item.latestDate = row.date;
      grouped.set(key, item);
    }
    const ads = [...grouped.values()].map(row => ({
      adId: `${row.adId}::${row.currency}`, externalAdId: row.adId, currency: row.currency,
      date: row.latestDate, impressions: row.impressions, clicks: row.clicks, spend: row.spend, conversions: row.conversions,
      metrics: { impressions: row.impressions, clicks: row.clicks, spend: row.spend, conversions: row.conversions }
    }));
    return { source: 'csv_import', campaignId, tenantId, lookbackDays: this.lookbackDays, ads };
  }
}

export function hashMetricsCsv(csv) { return createHash('sha256').update(csv, 'utf8').digest('hex'); }
