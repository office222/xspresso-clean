const INSIGHT_FIELDS = ['ad_id', 'ad_name', 'campaign_id', 'impressions', 'clicks', 'spend', 'actions', 'date_start', 'date_stop'];

/** GET-only Meta Graph Insights client; never publishes, edits, pauses, or changes budgets. */
export class MetaGraphReadClient {
  constructor({ apiVersion, fetchImpl = globalThis.fetch, timeoutMs = 20_000, maxPages = 20 } = {}) {
    if (!/^v\d+\.\d+$/.test(String(apiVersion || ''))) throw new TypeError('Set a supported Meta Graph API version such as vXX.0.');
    if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl is required.');
    this.apiVersion = apiVersion; this.fetchImpl = fetchImpl; this.timeoutMs = timeoutMs; this.maxPages = maxPages;
  }
  async getCampaignInsights({ adAccountId, campaignId, accessToken, since, until }) {
    adAccountId = String(adAccountId || '').replace(/^act_/, '');
    if (!/^\d{4,40}$/.test(adAccountId) || !/^\d{4,80}$/.test(String(campaignId || ''))) throw fault('META_INVALID_ID', 400, 'Meta account or campaign ID is invalid.');
    if (!accessToken || String(accessToken).length < 20) throw fault('META_NOT_CONNECTED', 409, 'No Meta access token is available.');
    if (!validDate(since) || !validDate(until) || since > until) throw fault('META_INVALID_DATE_RANGE', 400, 'Insights date range is invalid.');
    const url = new URL(`https://graph.facebook.com/${this.apiVersion}/act_${adAccountId}/insights`);
    url.searchParams.set('access_token', accessToken);
    url.searchParams.set('fields', INSIGHT_FIELDS.join(','));
    url.searchParams.set('level', 'ad'); url.searchParams.set('limit', '100');
    url.searchParams.set('time_increment', '1');
    url.searchParams.set('time_range', JSON.stringify({ since, until }));
    url.searchParams.set('filtering', JSON.stringify([{ field: 'campaign.id', operator: 'EQUAL', value: String(campaignId) }]));
    const rows = []; let next = url.toString();
    for (let page = 0; next && page < this.maxPages; page++) {
      const result = await this.#getPage(next);
      if (!Array.isArray(result.data)) throw fault('META_BAD_RESPONSE', 502, 'Meta returned an invalid Insights response.');
      rows.push(...result.data);
      if (rows.length > 10_000) throw fault('META_RESULT_TOO_LARGE', 502, 'Meta returned too many insight rows.');
      next = result.paging?.next || '';
      if (next) {
        let parsed; try { parsed = new URL(next); } catch { throw fault('META_BAD_PAGINATION', 502, 'Meta returned an invalid pagination link.'); }
        if (parsed.protocol !== 'https:' || parsed.hostname !== 'graph.facebook.com' || !parsed.pathname.startsWith(`/${this.apiVersion}/`)) throw fault('META_BAD_PAGINATION', 502, 'Meta returned an unexpected pagination host.');
      }
    }
    if (next) throw fault('META_PAGE_LIMIT', 502, 'Meta Insights exceeded the configured page limit.');
    return rows;
  }
  async #getPage(url) {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(url, { method: 'GET', redirect: 'error', signal: controller.signal, headers: { accept: 'application/json' } });
      const text = await response.text();
      if (Buffer.byteLength(text, 'utf8') > 2_000_000) throw fault('META_RESPONSE_TOO_LARGE', 502, 'Meta response exceeded the size limit.');
      let body; try { body = JSON.parse(text); } catch { throw fault('META_BAD_RESPONSE', 502, 'Meta returned invalid JSON.'); }
      if (!response.ok || body.error) {
        if (response.status === 401 || body.error?.code === 190) throw fault('META_TOKEN_EXPIRED', 409, 'Meta access token is invalid or expired.');
        if (response.status === 429 || body.error?.code === 4 || body.error?.code === 17) throw fault('META_RATE_LIMITED', 503, 'Meta rate limit reached; try again later.');
        throw fault('META_API_ERROR', 502, 'Meta Insights request failed. Check account access and requested fields.');
      }
      return body;
    } catch (error) {
      if (error?.name === 'AbortError') throw fault('META_TIMEOUT', 504, 'Meta Insights request timed out.');
      if (error?.code) throw error;
      throw fault('META_NETWORK_ERROR', 502, 'Could not reach Meta Insights.');
    } finally { clearTimeout(timer); }
  }
}
function validDate(value) { if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false; const date = new Date(`${value}T00:00:00.000Z`); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value; }
function fault(code, status, message) { return Object.assign(new Error(message), { code, status }); }
