/** Xspresso API configuration. Node.js 20+, ES modules, no dependencies. */

export function loadConfig(env = process.env) {
  const port = readInteger(env.PORT, 8787, 1, 65535, 'PORT');
  const sessionTtlMs = readInteger(env.XSPRESSO_SESSION_TTL_MS, 86400000, 60000, 2592000000, 'XSPRESSO_SESSION_TTL_MS');
  const bodyLimitBytes = readInteger(env.XSPRESSO_BODY_LIMIT_BYTES, 1024 * 1024, 1024, 10 * 1024 * 1024, 'XSPRESSO_BODY_LIMIT_BYTES');
  const allowedOrigin = (env.XSPRESSO_ALLOWED_ORIGIN || 'http://localhost:8080').trim();
  const dataFile = (env.XSPRESSO_DATA_FILE || './data/xspresso.json').trim();
  const signupsEnabled = env.XSPRESSO_SIGNUPS_ENABLED !== 'false';

  if (!allowedOrigin || allowedOrigin === '*') {
    throw new Error('Set XSPRESSO_ALLOWED_ORIGIN to one explicit origin; wildcard CORS is not allowed.');
  }
  return Object.freeze({ port, sessionTtlMs, bodyLimitBytes, allowedOrigin, dataFile, signupsEnabled });
}

function readInteger(value, fallback, min, max, name) {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  return n;
}
