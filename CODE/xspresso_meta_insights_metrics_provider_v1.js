/** Adapts read-only Meta Insights into the shared MonitoringWorker contract. */
export class MetaInsightsMetricsProvider {
  constructor({ store, vault, graphClient, lookbackDays = 7, conversionActionTypes = [], clock = () => Date.now() } = {}) {
    if (!store || !vault || !graphClient) throw new TypeError('store, vault, and graphClient are required.');
    if (!Number.isInteger(lookbackDays) || lookbackDays < 1 || lookbackDays > 90) throw new TypeError('lookbackDays must be between 1 and 90.');
    this.store = store; this.vault = vault; this.graphClient = graphClient; this.lookbackDays = lookbackDays; this.clock = clock;
    this.actionTypes = new Set(conversionActionTypes.map(x => String(x).trim()).filter(Boolean));
  }
  async getCampaignMetrics({ tenantId, campaignId } = {}) {
    const state = await this.store.read();
    const campaign = (state.campaigns || []).find(x => x.id === campaignId && x.tenantId === tenantId);
    if (!campaign) throw fault('CAMPAIGN_NOT_FOUND', 404, 'Campaign not found.');
    if (campaign.platform !== 'meta' || !campaign.externalCampaignId) throw fault('META_CAMPAIGN_NOT_LINKED', 409, 'Link an existing Meta campaign before requesting Insights.');
    const credentials = await this.vault.get(tenantId);
    const until = new Date(this.clock()).toISOString().slice(0, 10);
    const since = new Date(this.clock() - (this.lookbackDays - 1) * 86_400_000).toISOString().slice(0, 10);
    const rows = await this.graphClient.getCampaignInsights({ adAccountId: credentials.adAccountId, campaignId: campaign.externalCampaignId, accessToken: credentials.accessToken, since, until });
    const grouped = new Map();
    for (const row of rows) {
      const adId = String(row.ad_id || ''); if (!adId) continue;
      const ad = grouped.get(adId) || { adId, externalAdId: adId, name: String(row.ad_name || ''), currency: credentials.currency, metrics: { impressions: 0, clicks: 0, spend: 0, conversions: 0, conversionTrackingConfigured: this.actionTypes.size > 0 } };
      ad.metrics.impressions += safeInt(row.impressions); ad.metrics.clicks += safeInt(row.clicks); ad.metrics.spend += safeAmount(row.spend);
      if (this.actionTypes.size) ad.metrics.conversions += conversions(row.actions, this.actionTypes);
      grouped.set(adId, ad);
    }
    return { source: 'meta_insights', campaignId, lookbackDays: this.lookbackDays, conversionTrackingConfigured: this.actionTypes.size > 0, ads: [...grouped.values()] };
  }
}
function conversions(actions, types) { if (!Array.isArray(actions)) return 0; let total = 0; for (const action of actions) if (types.has(String(action.action_type))) total += safeAmount(action.value); return Math.round(total); }
function safeInt(value) { const n = Number(value || 0); return Number.isSafeInteger(n) && n >= 0 ? n : 0; }
function safeAmount(value) { const n = Number(value || 0); return Number.isFinite(n) && n >= 0 ? n : 0; }
function fault(code, status, message) { return Object.assign(new Error(message), { code, status }); }
