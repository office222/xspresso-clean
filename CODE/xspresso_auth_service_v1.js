import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;
const SCRYPT_OPTIONS = { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/** Password/session auth for the local single-tenant-per-signup MVP. */
export class AuthService {
  constructor({ store, sessionTtlMs = 30 * 24 * 60 * 60 * 1000, clock = () => Date.now() } = {}) {
    if (!store || typeof store.read !== 'function' || typeof store.update !== 'function') throw new TypeError('store.read and store.update are required.');
    if (!Number.isSafeInteger(sessionTtlMs) || sessionTtlMs < 60_000) throw new TypeError('sessionTtlMs must be at least one minute.');
    this.store = store; this.sessionTtlMs = sessionTtlMs; this.clock = clock;
  }

  async register({ email, password, name = '' } = {}) {
    const normalizedEmail = normalizeEmail(email);
    validatePassword(password);
    const salt = randomBytes(16);
    const passwordHash = await scryptAsync(password, salt, KEYLEN, SCRYPT_OPTIONS);
    const userId = randomUUID();
    const tenantId = randomUUID();
    const now = new Date(this.clock()).toISOString();
    const token = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(token);
    const result = await this.store.update(state => {
      state.users ||= []; state.sessions ||= []; state.auditEvents ||= [];
      if (state.users.some(user => user.email === normalizedEmail)) throw fault('EMAIL_ALREADY_REGISTERED', 'An account with this email already exists.', 409);
      const user = { id: userId, tenantId, email: normalizedEmail, name: cleanName(name), role: 'owner', passwordSalt: salt.toString('base64url'), passwordHash: Buffer.from(passwordHash).toString('base64url'), createdAt: now };
      state.users.push(user);
      state.sessions.push({ id: randomUUID(), userId, tokenHash, createdAt: now, expiresAt: new Date(this.clock() + this.sessionTtlMs).toISOString() });
      state.auditEvents.push({ id: randomUUID(), tenantId, actorId: userId, action: 'auth.registered', createdAt: now });
      return { user: publicUser(user), token };
    });
    return result;
  }

  async login({ email, password } = {}) {
    const normalizedEmail = normalizeEmail(email);
    if (typeof password !== 'string' || password.length > 256) throw fault('INVALID_CREDENTIALS', 'Email or password is incorrect.', 401);
    const state = await this.store.read();
    const user = state.users.find(row => row.email === normalizedEmail);
    const salt = user ? Buffer.from(user.passwordSalt, 'base64url') : randomBytes(16);
    const actual = Buffer.from(await scryptAsync(password, salt, KEYLEN, SCRYPT_OPTIONS));
    const expected = user ? Buffer.from(user.passwordHash, 'base64url') : Buffer.alloc(KEYLEN);
    const match = expected.length === actual.length && timingSafeEqual(expected, actual);
    if (!user || !match) throw fault('INVALID_CREDENTIALS', 'Email or password is incorrect.', 401);

    const token = randomBytes(32).toString('base64url');
    const nowMs = this.clock();
    const now = new Date(nowMs).toISOString();
    await this.store.update(draft => {
      draft.sessions ||= [];
      draft.sessions = draft.sessions.filter(session => Date.parse(session.expiresAt) > nowMs);
      draft.sessions.push({ id: randomUUID(), userId: user.id, tokenHash: hashToken(token), createdAt: now, expiresAt: new Date(nowMs + this.sessionTtlMs).toISOString() });
    });
    return { user: publicUser(user), token };
  }

  async authenticate(token) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{40,100}$/.test(token)) return null;
    const digest = hashToken(token);
    const state = await this.store.read();
    const session = state.sessions.find(row => row.tokenHash === digest && Date.parse(row.expiresAt) > this.clock());
    if (!session) return null;
    const user = state.users.find(row => row.id === session.userId);
    return user ? publicUser(user) : null;
  }

  async logout(token) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{40,100}$/.test(token)) return { loggedOut: true };
    const digest = hashToken(token);
    await this.store.update(state => { state.sessions = (state.sessions || []).filter(row => row.tokenHash !== digest); });
    return { loggedOut: true };
  }
}

function normalizeEmail(value) {
  if (typeof value !== 'string') throw fault('INVALID_EMAIL', 'Enter a valid email address.', 400);
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fault('INVALID_EMAIL', 'Enter a valid email address.', 400);
  return email;
}
function validatePassword(value) {
  if (typeof value !== 'string' || value.length < 12 || value.length > 256) throw fault('INVALID_PASSWORD', 'Password must be 12–256 characters.', 400);
}
function cleanName(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 100);
}
function hashToken(token) { return createHash('sha256').update(token).digest('hex'); }
function publicUser(user) { return { id: user.id, tenantId: user.tenantId, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt }; }
function fault(code, message, status) { return Object.assign(new Error(message), { code, status }); }
