import { createHash } from 'node:crypto';

const REQUIRED = ['date', 'ad_id', 'impressions', 'clicks', 'spend', 'conversions', 'currency'];

/** Parse canonical daily ad-metrics CSV. Duplicate ad/date/currency rows are summed. */
export function parseMetricsCsv(input, { maxRows = 10_000, maxBytes = 2_000_000 } = {}) {
  const text = Buffer.isBuffer(input) ? input.toString('utf8') : String(input ?? '');
  if (Buffer.byteLength(text, 'utf8') > maxBytes) throw fault('CSV_TOO_LARGE', 413, 'CSV exceeds the allowed size.');
  const records = parseRecords(text.replace(/^\uFEFF/, ''), maxRows + 1).filter(row => row.some(cell => cell.trim() !== ''));
  if (records.length < 2) throw fault('CSV_EMPTY', 400, 'CSV must include a header and at least one data row.');
  const headers = records[0].map(value => value.trim().toLowerCase());
  if (new Set(headers).size !== headers.length) throw fault('CSV_DUPLICATE_HEADER', 400, 'CSV contains duplicate headers.');
  const positions = Object.fromEntries(headers.map((key, index) => [key, index]));
  const missing = REQUIRED.filter(key => !(key in positions));
  if (missing.length) throw fault('CSV_MISSING_COLUMNS', 400, `CSV is missing required columns: ${missing.join(', ')}.`);
  if (records.length - 1 > maxRows) throw fault('CSV_TOO_MANY_ROWS', 413, 'CSV has too many data rows.');

  const aggregated = new Map();
  for (let index = 1; index < records.length; index++) {
    const cells = records[index];
    if (cells.length !== headers.length) throw fault('CSV_ROW_WIDTH', 400, `CSV row ${index + 1} has the wrong number of columns.`);
    const value = key => cells[positions[key]].trim();
    const date = value('date');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) !== date) {
      throw fault('CSV_INVALID_DATE', 400, `CSV row ${index + 1} has an invalid ISO date.`);
    }
    const adId = value('ad_id');
    if (!adId || adId.length > 160 || /[\u0000-\u001f\u007f]/.test(adId)) throw fault('CSV_INVALID_AD_ID', 400, `CSV row ${index + 1} has an invalid ad_id.`);
    const impressions = integer(value('impressions'), 'impressions', index + 1);
    const clicks = integer(value('clicks'), 'clicks', index + 1);
    const spend = decimal(value('spend'), 'spend', index + 1);
    const conversions = decimal(value('conversions'), 'conversions', index + 1);
    if (clicks > impressions) throw fault('CSV_INVALID_COUNTS', 400, `CSV row ${index + 1} has more clicks than impressions.`);
    const currency = value('currency').toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw fault('CSV_INVALID_CURRENCY', 400, `CSV row ${index + 1} must use a three-letter currency code.`);
    const key = `${date}\u0000${adId}\u0000${currency}`;
    const previous = aggregated.get(key) || { date, adId, currency, impressions: 0, clicks: 0, spend: 0, conversions: 0 };
    previous.impressions += impressions; previous.clicks += clicks; previous.spend += spend; previous.conversions += conversions;
    aggregated.set(key, previous);
  }
  if (!aggregated.size) throw fault('CSV_EMPTY', 400, 'CSV contains no usable metric rows.');
  return [...aggregated.values()];
}

function parseRecords(text, maxRecords) {
  const records = []; let row = []; let field = ''; let quoted = false; let justClosedQuote = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') { quoted = false; justClosedQuote = true; }
      else field += char;
      continue;
    }
    if (justClosedQuote && char !== ',' && char !== '\n' && char !== '\r' && char !== ' ' && char !== '\t') throw fault('CSV_MALFORMED', 400, 'CSV has characters after a closing quote.');
    if (char === '"') {
      if (field.length) throw fault('CSV_MALFORMED', 400, 'CSV has a quote inside an unquoted field.');
      quoted = true; justClosedQuote = false;
    } else if (char === ',') { row.push(field.trim()); field = ''; justClosedQuote = false; }
    else if (char === '\n' || char === '\r') {
      row.push(field.trim()); field = ''; justClosedQuote = false;
      if (row.some(cell => cell !== '')) records.push(row);
      row = []; if (char === '\r' && text[i + 1] === '\n') i++;
      if (records.length > maxRecords) throw fault('CSV_TOO_MANY_ROWS', 413, 'CSV has too many rows.');
    } else if (!justClosedQuote || (char !== ' ' && char !== '\t')) field += char;
  }
  if (quoted) throw fault('CSV_MALFORMED', 400, 'CSV has an unterminated quoted field.');
  if (field.length || row.length) { row.push(field.trim()); if (row.some(cell => cell !== '')) records.push(row); }
  if (records.length > maxRecords) throw fault('CSV_TOO_MANY_ROWS', 413, 'CSV has too many rows.');
  return records;
}
function integer(value, name, row) { if (!/^\d+$/.test(value)) throw fault('CSV_INVALID_NUMBER', 400, `CSV row ${row} has an invalid ${name}.`); const n = Number(value); if (!Number.isSafeInteger(n)) throw fault('CSV_INVALID_NUMBER', 400, `CSV row ${row} has an invalid ${name}.`); return n; }
function decimal(value, name, row) { if (!/^\d+(?:\.\d+)?$/.test(value)) throw fault('CSV_INVALID_NUMBER', 400, `CSV row ${row} has an invalid ${name}.`); const n = Number(value); if (!Number.isFinite(n) || n > 1_000_000_000) throw fault('CSV_INVALID_NUMBER', 400, `CSV row ${row} has an invalid ${name}.`); return n; }
function fault(code, status, message) { return Object.assign(new Error(message), { code, status }); }

/** Reads tenant-owned imports in a rolling window for MonitoringWorker. */
export class ImportedMetricsProvider {
  constructor({ store, lookbackDays = 30, clock = () => Date.now() } = {}) {
    if (!store || !Number.isInteger(lookbackDays) || lookbackDays < 1 || lookbackDays > 365) throw new TypeError('store and a valid lookbackDays are required.');
    this.store = store; this.lookbackDays = lookbackDays; this.clock = clock;
  }
  async getCampaignMetrics({ tenantId, campaignId } = {}) {
    if (!tenantId || !campaignId) throw new TypeError('tenantId and campaignId are required.');
    const state = await this.store.read();
    const campaign = (state.campaigns || []).find(row => row.id === campaignId && row.tenantId === tenantId);
    if (!campaign) throw fault('CAMPAIGN_NOT_FOUND', 404, 'Campaign not found.');
    const cutoff = new Date(this.clock() - this.lookbackDays * 86_400_000).toISOString().slice(0, 10);
    const rows = (state.metricsSnapshots || []).filter(row => row.tenantId === tenantId && row.campaignId === campaignId && row.date >= cutoff);
    const groups = new Map();
    for (const row of rows) {
      const key = `${row.adId}\u0000${row.currency}`;
      const ad = groups.get(key) || { adId: row.adId, currency: row.currency, metrics: { impressions: 0, clicks: 0, spend: 0, conversions: 0 } };
      for (const metric of ['impressions', 'clicks', 'spend', 'conversions']) ad.metrics[metric] += Number(row[metric] || 0);
      groups.set(key, ad);
    }
    return { source: 'csv_import', campaignId, lookbackDays: this.lookbackDays, ads: [...groups.values()] };
  }
}

export function hashCsv(csv) { return createHash('sha256').update(String(csv)).digest('hex'); }
