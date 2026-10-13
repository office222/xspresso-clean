/** Bounded single-process scheduler for consent-gated follow-up delivery. */
export class XspressoFollowupScheduler {
  constructor({ worker, intervalMs = 30_000, maxPerCycle = 25, timers = globalThis, onError = () => {} } = {}) {
    if (typeof worker?.runOne !== 'function') throw new TypeError('worker.runOne is required.');
    if (!Number.isInteger(intervalMs) || intervalMs < 1000 || !Number.isInteger(maxPerCycle) || maxPerCycle < 1 || maxPerCycle > 500) throw new TypeError('Invalid scheduler limits.');
    this.worker = worker;
    this.intervalMs = intervalMs;
    this.maxPerCycle = maxPerCycle;
    this.timers = timers;
    this.onError = onError;
    this.timer = null;
    this.activeCycle = null;
  }

  start() {
    if (this.timer) return false;
    this.timer = this.timers.setInterval(() => { void this.tick().catch(error => this.#report(error)); }, this.intervalMs);
    this.timer?.unref?.();
    void this.tick().catch(error => this.#report(error));
    return true;
  }

  async stop() {
    if (this.timer) {
      this.timers.clearInterval(this.timer);
      this.timer = null;
    }
    if (this.activeCycle) await this.activeCycle;
  }

  async tick() {
    if (this.activeCycle) return { skipped: true, reason: 'cycle_in_progress', attempted: 0 };
    const task = this.#drainDueMessages();
    this.activeCycle = task;
    try { return await task; }
    finally { if (this.activeCycle === task) this.activeCycle = null; }
  }

  async #drainDueMessages() {
    let attempted = 0;
    let sent = 0;
    const failures = [];
    for (let i = 0; i < this.maxPerCycle; i += 1) {
      let result;
      try { result = await this.worker.runOne(); }
      catch (error) {
        failures.push(error?.code || 'WORKER_ERROR');
        this.#report(error);
        break;
      }
      if (!result?.sent && result?.reason === 'nothing_due') break;
      if (!result?.sent) {
        failures.push(result?.errorCode || 'DELIVERY_DEFERRED');
        break; // Respect the worker's backoff; do not hammer the same message.
      }
      attempted += 1;
      sent += 1;
    }
    return { attempted, sent, failures };
  }

  #report(error) {
    try { this.onError({ code: error?.code || 'WORKER_ERROR', message: String(error?.message || 'Worker error').slice(0, 200) }); }
    catch { /* error reporting must not break delivery scheduling */ }
  }
}
