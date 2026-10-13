import { randomUUID } from 'node:crypto';

/** Pulls metrics through an injected platform adapter and records recommendations. */
export class MonitoringWorker {
  constructor({ store, metricsProvider, ruleEngine, alerts, clock = () => Date.now() } = {}) {
    if (!store || typeof metricsProvider?.getCampaignMetrics !== 'function' || typeof ruleEngine?.evaluateAdMetrics !== 'function' || typeof alerts?.createOrRefresh !== 'function') {
      throw new TypeError('store, metricsProvider.getCampaignMetrics, ruleEngine.evaluateAdMetrics, and alerts.createOrRefresh are required.');
    }
    this.store = store; this.metricsProvider = metricsProvider; this.ruleEngine = ruleEngine; this.alerts = alerts; this.clock = clock;
  }

  async run({ tenantId, campaignId, thresholds = {} } = {}) {
    if (!tenantId || !campaignId) throw new TypeError('tenantId and campaignId are required.');
    const state = await this.store.read();
    const campaign = (state.campaigns || []).find(row => row.id === campaignId && row.tenantId === tenantId);
    if (!campaign) throw Object.assign(new Error('Campaign not found.'), { code: 'CAMPAIGN_NOT_FOUND', status: 404 });
    if (!campaign.platform || campaign.status === 'draft' || campaign.status === 'archived') {
      return { checked: false, reason: 'campaign_not_monitorable', alerts: [] };
    }

    const response = await this.metricsProvider.getCampaignMetrics({
      tenantId, campaignId, platform: campaign.platform, externalCampaignId: campaign.externalCampaignId || null
    });
    if (!response || !Array.isArray(response.ads)) throw Object.assign(new Error('Metrics provider returned an invalid response.'), { code: 'INVALID_METRICS_RESPONSE', status: 502 });

    const results = [];
    for (const ad of response.ads) {
      const evaluation = this.ruleEngine.evaluateAdMetrics(ad.metrics, thresholds);
      results.push({ adId: ad.adId || null, evaluation });
      if (evaluation.status === 'warning' || evaluation.status === 'underperforming') {
        const type = evaluation.recommendation?.type || evaluation.status;
        await this.alerts.createOrRefresh({
          tenantId, campaignId, adId: ad.adId || null, type,
          severity: evaluation.status === 'underperforming' ? 'critical' : 'warning',
          title: evaluation.status === 'underperforming' ? 'Ad may be underperforming' : 'Ad needs review',
          message: evaluation.message,
          recommendation: evaluation.recommendation?.recommendation || 'Review this ad before extending paid monitoring.'
        });
      }
    }

    const checkedAt = new Date(this.clock()).toISOString();
    await this.store.update(draft => {
      draft.monitoringRuns ||= [];
      draft.monitoringRuns.push({ id: randomUUID(), tenantId, campaignId, checkedAt, platform: campaign.platform, adsChecked: results.length });
      if (draft.monitoringRuns.length > 5000) draft.monitoringRuns.splice(0, draft.monitoringRuns.length - 5000);
    });
    return { checked: true, campaignId, checkedAt, ads: results };
  }
}
