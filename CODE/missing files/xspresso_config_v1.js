import { resolve } from 'node:path';

/** Read and validate the small, dependency-free runtime configuration surface. */
export function loadConfig(env = process.env) {
  const port = integer(env.PORT, 3000, 1, 65535, 'PORT');
  const bodyLimitBytes = integer(env.XSPRESSO_BODY_LIMIT_BYTES, 1_000_000, 1024, 20_000_000, 'XSPRESSO_BODY_LIMIT_BYTES');
  const sessionTtlMs = integer(env.XSPRESSO_SESSION_TTL_MS, 30 * 24 * 60 * 60 * 1000, 60_000, 365 * 24 * 60 * 60 * 1000, 'XSPRESSO_SESSION_TTL_MS');
  const dataDir = resolve(env.XSPRESSO_DATA_DIR || './data');
  const signupDefault = String(env.NODE_ENV || 'development') !== 'production';
  return Object.freeze({
    nodeEnv: env.NODE_ENV || 'development',
    host: env.HOST || '127.0.0.1',
    port,
    dataDir,
    dataFile: resolve(dataDir, 'xspresso-store.json'),
    bodyLimitBytes,
    sessionTtlMs,
    signupEnabled: boolean(env.XSPRESSO_SIGNUP_ENABLED, signupDefault),
    logLevel: env.LOG_LEVEL || 'info'
  });
}

function integer(value, fallback, min, max, name) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) throw new Error(`${name} must be an integer from ${min} to ${max}.`);
  return parsed;
}
function boolean(value, fallback) {
  if (value === undefined || value === '') return fallback;
  if (/^(true|1|yes|on)$/i.test(value)) return true;
  if (/^(false|0|no|off)$/i.test(value)) return false;
  throw new Error('XSPRESSO_SIGNUP_ENABLED must be true or false.');
}
