/** Small in-process scheduler for follow-up delivery and campaign monitoring. */
export class XspressoWorkerScheduler {
  constructor({ store, followupWorker, monitoringWorker, intervalMs = 30_000, maxFollowupsPerCycle = 25, maxCampaignsPerCycle = 100, onError = () => {}, timers = globalThis } = {}) {
    if (!store || typeof store.read !== 'function' || typeof followupWorker?.runOne !== 'function' || typeof monitoringWorker?.run !== 'function') {
      throw new TypeError('store.read, followupWorker.runOne, and monitoringWorker.run are required.');
    }
    if (!Number.isInteger(intervalMs) || intervalMs < 1000 || !Number.isInteger(maxFollowupsPerCycle) || maxFollowupsPerCycle < 1 || !Number.isInteger(maxCampaignsPerCycle) || maxCampaignsPerCycle < 1) throw new TypeError('Invalid scheduler limits.');
    this.store = store; this.followupWorker = followupWorker; this.monitoringWorker = monitoringWorker;
    this.intervalMs = intervalMs; this.maxFollowupsPerCycle = maxFollowupsPerCycle; this.maxCampaignsPerCycle = maxCampaignsPerCycle;
    this.onError = onError; this.timers = timers; this.timer = null; this.activeCycle = null;
  }

  start() {
    if (this.timer) return false;
    this.timer = this.timers.setInterval(() => { void this.tick().catch(error => this.#report(error, 'cycle')); }, this.intervalMs);
    this.timer?.unref?.();
    void this.tick().catch(error => this.#report(error, 'initial_cycle'));
    return true;
  }

  async stop() {
    if (this.timer) { this.timers.clearInterval(this.timer); this.timer = null; }
    if (this.activeCycle) await this.activeCycle;
  }

  async tick() {
    if (this.activeCycle) return { skipped: true, reason: 'cycle_in_progress' };
    const task = this.#runCycle();
    this.activeCycle = task;
    try { return await task; }
    finally { if (this.activeCycle === task) this.activeCycle = null; }
  }

  async #runCycle() {
    const results = { followupsAttempted: 0, campaignsChecked: 0, errors: [] };
    for (let i = 0; i < this.maxFollowupsPerCycle; i += 1) {
      try {
        const result = await this.followupWorker.runOne();
        if (!result?.sent && result?.reason === 'nothing_due') break;
        results.followupsAttempted += result?.sent ? 1 : 0;
        if (!result?.sent) break; // A retry/backoff outcome should not be hammered this cycle.
      } catch (error) {
        results.errors.push({ task: 'followup', code: error?.code || 'WORKER_ERROR' });
        this.#report(error, 'followup');
        break;
      }
    }

    let state;
    try { state = await this.store.read(); }
    catch (error) { results.errors.push({ task: 'campaign_scan', code: error?.code || 'STORE_ERROR' }); this.#report(error, 'campaign_scan'); return results; }
    const campaigns = (state.campaigns || []).filter(campaign => campaign.tenantId && campaign.platform && !['draft', 'archived', 'paused'].includes(campaign.status)).slice(0, this.maxCampaignsPerCycle);
    for (const campaign of campaigns) {
      try { await this.monitoringWorker.run({ tenantId: campaign.tenantId, campaignId: campaign.id }); results.campaignsChecked += 1; }
      catch (error) { results.errors.push({ task: 'monitoring', campaignId: campaign.id, code: error?.code || 'WORKER_ERROR' }); this.#report(error, 'monitoring'); }
    }
    return results;
  }

  #report(error, task) {
    try { this.onError({ task, code: error?.code || 'WORKER_ERROR', message: String(error?.message || 'Worker error').slice(0, 300) }); } catch { /* reporting must not break worker scheduling */ }
  }
}
