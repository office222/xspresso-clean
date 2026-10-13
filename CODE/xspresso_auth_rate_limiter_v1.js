/** In-memory fixed-window limiter for auth endpoints; use the socket IP, not untrusted proxy headers. */
export class AuthRateLimiter {
  constructor({ maxAttempts = 10, windowMs = 60_000, clock = () => Date.now(), maxKeys = 20_000 } = {}) {
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) throw new TypeError('maxAttempts must be a positive integer.');
    if (!Number.isInteger(windowMs) || windowMs < 1_000) throw new TypeError('windowMs must be at least 1000 ms.');
    this.maxAttempts = maxAttempts; this.windowMs = windowMs; this.clock = clock; this.maxKeys = maxKeys; this.windows = new Map(); this.calls = 0;
  }

  consume(key) {
    if (typeof key !== 'string' || !key || key.length > 200) throw new TypeError('A bounded client key is required.');
    const now = this.clock();
    let row = this.windows.get(key);
    if (!row || now >= row.resetAt) row = { count: 0, resetAt: now + this.windowMs };
    if (row.count >= this.maxAttempts) {
      this.windows.set(key, row); this.#maybePrune(now);
      return { allowed: false, remaining: 0, resetAt: row.resetAt, retryAfterSeconds: Math.max(1, Math.ceil((row.resetAt - now) / 1000)) };
    }
    row.count += 1; this.windows.set(key, row); this.#maybePrune(now);
    return { allowed: true, remaining: this.maxAttempts - row.count, resetAt: row.resetAt, retryAfterSeconds: 0 };
  }

  reset(key) { return this.windows.delete(key); }

  #maybePrune(now) {
    this.calls += 1;
    if (this.calls % 256 !== 0 && this.windows.size <= this.maxKeys) return;
    for (const [key, row] of this.windows) if (now >= row.resetAt) this.windows.delete(key);
    if (this.windows.size > this.maxKeys) {
      const excess = this.windows.size - this.maxKeys;
      let removed = 0;
      for (const key of this.windows.keys()) { this.windows.delete(key); if (++removed >= excess) break; }
    }
  }
}
