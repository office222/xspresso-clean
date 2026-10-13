/**
 * Minimal email/password auth for local MVP evaluation.
 * Passwords are scrypt-hashed; bearer sessions are memory-only and reset on restart.
 * For production, prefer a managed identity provider and persistent revocable sessions.
 */
import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);

export class AuthService {
  constructor({ store, sessionTtlMs = 86400000, clock = () => Date.now() } = {}) {
    if (!store) throw new TypeError('AuthService requires a store.');
    this.store = store;
    this.sessionTtlMs = sessionTtlMs;
    this.clock = clock;
    this.sessions = new Map();
  }

  async register({ email, password, name = '' }) {
    const normalizedEmail = normalizeEmail(email);
    validatePassword(password);
    const salt = randomBytes(16);
    const passwordHash = await scrypt(password, salt, 64);
    const user = {
      id: randomUUID(), tenantId: null, email: normalizedEmail,
      name: String(name).trim().slice(0, 100),
      passwordSalt: salt.toString('hex'), passwordHash: Buffer.from(passwordHash).toString('hex'),
      createdAt: new Date(this.clock()).toISOString()
    };
    user.tenantId = user.id;
    await this.store.update(state => {
      if (state.users.some(item => item.email === normalizedEmail)) {
        const error = new Error('An account with this email already exists.');
        error.code = 'EMAIL_EXISTS';
        throw error;
      }
      state.users.push(user);
      state.auditEvents.push(audit(user, 'auth.signup', this.clock()));
    });
    return this.#issueSession(user, 'signup');
  }

  async login({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    if (typeof password !== 'string' || !password) throw new TypeError('Email and password are required.');
    const state = await this.store.read();
    const user = state.users.find(item => item.email === normalizedEmail);
    // Run scrypt even for unknown emails to reduce timing differences.
    const salt = user ? Buffer.from(user.passwordSalt, 'hex') : Buffer.alloc(16, 0x5a);
    const expected = user ? Buffer.from(user.passwordHash, 'hex') : Buffer.alloc(64, 0x5a);
    const candidate = Buffer.from(await scrypt(password, salt, 64));
    const matches = candidate.length === expected.length && timingSafeEqual(candidate, expected);
    if (!user || !matches) {
      const error = new Error('Email or password is incorrect.');
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }
    await this.store.update(stateDraft => stateDraft.auditEvents.push(audit(user, 'auth.login', this.clock())));
    return this.#issueSession(user, 'login');
  }

  async authenticate(token) {
    if (typeof token !== 'string' || token.length < 32) return null;
    const tokenHash = hashToken(token);
    const session = this.sessions.get(tokenHash);
    if (!session) return null;
    if (session.expiresAt <= this.clock()) {
      this.sessions.delete(tokenHash);
      return null;
    }
    const state = await this.store.read();
    const user = state.users.find(item => item.id === session.userId);
    return user ? publicUser(user) : null;
  }

  async logout(token) {
    if (!token) return false;
    const removed = this.sessions.delete(hashToken(token));
    return removed;
  }

  #issueSession(user, event) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = this.clock() + this.sessionTtlMs;
    this.sessions.set(hashToken(token), { userId: user.id, expiresAt });
    return { token, tokenType: 'Bearer', expiresAt: new Date(expiresAt).toISOString(), user: publicUser(user), event };
  }
}

export function publicUser(user) {
  return { id: user.id, tenantId: user.tenantId, email: user.email, name: user.name, createdAt: user.createdAt };
}

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new TypeError('Enter a valid email address.');
  return email;
}
function validatePassword(value) {
  if (typeof value !== 'string' || value.length < 12 || value.length > 256) {
    throw new TypeError('Password must be 12–256 characters.');
  }
}
function hashToken(token) { return createHash('sha256').update(token).digest('hex'); }
function audit(user, action, timestamp) {
  return { id: randomUUID(), tenantId: user.tenantId, actorId: user.id, action,
    resourceType: 'user', resourceId: user.id, outcome: 'success', createdAt: new Date(timestamp).toISOString() };
}
