import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

/** Signed, tenant-bound unsubscribe tokens. Keep the signing secret server-side. */
export class UnsubscribeTokenService {
  constructor({ signingSecret, clock = () => Date.now(), ttlMs = 5 * 365 * 24 * 60 * 60 * 1000 } = {}) {
    if (typeof signingSecret !== 'string' || Buffer.byteLength(signingSecret) < 32) {
      throw new TypeError('signingSecret must contain at least 32 bytes.');
    }
    if (!Number.isSafeInteger(ttlMs) || ttlMs < 60_000) throw new TypeError('ttlMs must be at least one minute.');
    this.secret = Buffer.from(signingSecret);
    this.clock = clock;
    this.ttlMs = ttlMs;
  }

  issue({ tenantId, leadId } = {}) {
    if (!isId(tenantId) || !isId(leadId)) throw new TypeError('tenantId and leadId are required.');
    const payload = {
      v: 1,
      purpose: 'unsubscribe',
      tenantId,
      leadId,
      exp: Math.floor((this.clock() + this.ttlMs) / 1000),
      nonce: randomBytes(12).toString('base64url')
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${encoded}.${this.#sign(encoded)}`;
  }

  verify(token) {
    if (typeof token !== 'string' || token.length > 2048) throw tokenError();
    const parts = token.split('.');
    if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]+$/.test(parts[1])) throw tokenError();
    const expected = Buffer.from(this.#sign(parts[0]));
    const supplied = Buffer.from(parts[1]);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw tokenError();
    let payload;
    try { payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')); } catch { throw tokenError(); }
    if (payload?.v !== 1 || payload?.purpose !== 'unsubscribe' || !isId(payload.tenantId) || !isId(payload.leadId) || !Number.isSafeInteger(payload.exp)) throw tokenError();
    if (payload.exp <= Math.floor(this.clock() / 1000)) throw Object.assign(new Error('Unsubscribe link has expired.'), { code: 'UNSUBSCRIBE_TOKEN_EXPIRED', status: 410 });
    return { tenantId: payload.tenantId, leadId: payload.leadId, expiresAt: new Date(payload.exp * 1000).toISOString() };
  }

  #sign(value) { return createHmac('sha256', this.secret).update(value).digest('base64url'); }
}

function isId(value) { return typeof value === 'string' && value.length > 0 && value.length <= 160 && !/[\u0000-\u001f]/.test(value); }
function tokenError() { return Object.assign(new Error('Unsubscribe link is invalid.'), { code: 'INVALID_UNSUBSCRIBE_TOKEN', status: 400 }); }
