/** Small reusable request-security helpers for the Node HTTP API. */

/** Fixed-window in-memory limiter. Suitable for one local process only. */
export function createRateLimiter({ windowMs = 60_000, maxRequests = 120, clock = () => Date.now(), keyOf = req => req.socket?.remoteAddress || 'unknown' } = {}) {
  if (!Number.isSafeInteger(windowMs) || windowMs < 1000) throw new RangeError('windowMs must be at least 1000.');
  if (!Number.isSafeInteger(maxRequests) || maxRequests < 1) throw new RangeError('maxRequests must be positive.');
  const buckets = new Map();
  return function checkRateLimit(req) {
    const key = String(keyOf(req) || 'unknown').slice(0, 200);
    const now = clock();
    let bucket = buckets.get(key);
    if (!bucket || now >= bucket.resetAt) bucket = { count: 0, resetAt: now + windowMs };
    bucket.count += 1;
    buckets.set(key, bucket);
    if (buckets.size > 10_000) {
      for (const [bucketKey, value] of buckets) if (now >= value.resetAt) buckets.delete(bucketKey);
    }
    const remaining = Math.max(0, maxRequests - bucket.count);
    return { allowed: bucket.count <= maxRequests, limit: maxRequests, remaining,
      resetAt: new Date(bucket.resetAt).toISOString(), retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  };
}

/** Apply security headers and exact-origin CORS policy to a Node response. */
export function applySecurityHeaders(req, res, { allowedOrigin, production = false } = {}) {
  if (!allowedOrigin || allowedOrigin === '*') throw new TypeError('Use one explicit allowedOrigin.');
  const origin = req.headers?.origin;
  if (origin && origin !== allowedOrigin) return false;
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('cache-control', 'no-store');
  res.setHeader('content-security-policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  if (production) res.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains');
  res.setHeader('vary', 'Origin');
  res.setHeader('access-control-allow-origin', allowedOrigin);
  res.setHeader('access-control-allow-methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('access-control-allow-headers', 'authorization,content-type');
  res.setHeader('access-control-max-age', '600');
  return true;
}
