import nodemailer from 'nodemailer';
import { createHash } from 'node:crypto';

/** Creates a Nodemailer SMTP adapter from server-side environment variables. */
export function createSmtpMailerFromEnv(env = process.env, { nodemailerModule = nodemailer } = {}) {
  const host = String(env.SMTP_HOST || '').trim();
  const from = String(env.SMTP_FROM || '').trim();
  const user = String(env.SMTP_USER || '').trim();
  const password = String(env.SMTP_PASSWORD || '');
  const supplied = [host, from, user, password].some(Boolean);
  if (!supplied) return null;
  if (!host || !from) throw new Error('SMTP_HOST and SMTP_FROM are required to enable email delivery.');
  if (Boolean(user) !== Boolean(password)) throw new Error('Set both SMTP_USER and SMTP_PASSWORD, or leave both unset.');
  if (!isMailbox(from)) throw new Error('SMTP_FROM must be a valid email address or display-name address.');

  const port = parseInteger(env.SMTP_PORT, 587, 1, 65535, 'SMTP_PORT');
  const secure = env.SMTP_SECURE === undefined || env.SMTP_SECURE === '' ? port === 465 : parseBoolean(env.SMTP_SECURE, 'SMTP_SECURE');
  const requireTLS = env.SMTP_REQUIRE_TLS === undefined || env.SMTP_REQUIRE_TLS === '' ? !secure : parseBoolean(env.SMTP_REQUIRE_TLS, 'SMTP_REQUIRE_TLS');
  if (typeof nodemailerModule?.createTransport !== 'function') throw new TypeError('A Nodemailer-compatible createTransport function is required.');

  const transport = nodemailerModule.createTransport({
    host,
    port,
    secure,
    requireTLS: secure ? false : requireTLS,
    ...(user ? { auth: { user, pass: password } } : {}),
    connectionTimeout: parseInteger(env.SMTP_CONNECTION_TIMEOUT_MS, 15_000, 1000, 120_000, 'SMTP_CONNECTION_TIMEOUT_MS'),
    greetingTimeout: parseInteger(env.SMTP_GREETING_TIMEOUT_MS, 10_000, 1000, 60_000, 'SMTP_GREETING_TIMEOUT_MS'),
    socketTimeout: parseInteger(env.SMTP_SOCKET_TIMEOUT_MS, 30_000, 1000, 180_000, 'SMTP_SOCKET_TIMEOUT_MS'),
    tls: { rejectUnauthorized: true }
  });
  return new SmtpMailerAdapter({ transport, from });
}

export class SmtpMailerAdapter {
  constructor({ transport, from } = {}) {
    if (typeof transport?.sendMail !== 'function' || !isMailbox(from)) throw new TypeError('transport.sendMail and a valid from address are required.');
    this.transport = transport;
    this.from = from;
  }

  async send({ to, subject, text, unsubscribeUrl, idempotencyKey } = {}) {
    if (!isMailbox(to)) throw mailFault('INVALID_RECIPIENT', 'Recipient address is invalid.', 400);
    if (typeof subject !== 'string' || !subject.trim() || subject.length > 180 || /[\r\n]/.test(subject)) throw mailFault('INVALID_SUBJECT', 'Email subject is invalid.', 400);
    if (typeof text !== 'string' || !text.trim() || text.length > 12_000) throw mailFault('INVALID_MESSAGE', 'Email body is invalid.', 400);
    const list = unsubscribeUrl ? { unsubscribe: requireHttpUrl(unsubscribeUrl) } : undefined;
    const headers = {};
    if (typeof idempotencyKey === 'string' && idempotencyKey.length) {
      // Diagnostic correlation only; SMTP does not guarantee exactly-once delivery.
      headers['X-Xspresso-Message-Key'] = createHash('sha256').update(idempotencyKey).digest('hex');
    }
    let info;
    try {
      info = await this.transport.sendMail({
        from: this.from,
        to,
        subject: subject.trim(),
        text,
        ...(list ? { list } : {}),
        ...(Object.keys(headers).length ? { headers } : {})
      });
    } catch {
      throw mailFault('SMTP_SEND_FAILED', 'SMTP provider could not accept the message.', 503);
    }
    const accepted = Array.isArray(info?.accepted) ? info.accepted : [];
    if (!accepted.length) throw mailFault('SMTP_NO_RECIPIENT_ACCEPTED', 'SMTP provider did not accept the recipient.', 503);
    return { id: typeof info?.messageId === 'string' ? info.messageId.slice(0, 200) : null, acceptedCount: accepted.length };
  }

  async close() {
    if (typeof this.transport.close === 'function') await this.transport.close();
  }
}

function requireHttpUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw mailFault('INVALID_UNSUBSCRIBE_URL', 'Unsubscribe URL must be absolute.', 400); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw mailFault('INVALID_UNSUBSCRIBE_URL', 'Unsubscribe URL must use HTTP or HTTPS.', 400);
  return url.toString();
}
function isMailbox(value) {
  if (typeof value !== 'string' || value.length > 254 || /[\r\n\u0000]/.test(value)) return false;
  const address = /<([^<>]+)>$/.exec(value)?.[1] || value;
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address);
}
function parseInteger(value, fallback, min, max, name) {
  if (value === undefined || value === '') return fallback;
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < min || result > max) throw new Error(`${name} must be an integer from ${min} to ${max}.`);
  return result;
}
function parseBoolean(value, name) {
  if (/^(true|1|yes|on)$/i.test(String(value))) return true;
  if (/^(false|0|no|off)$/i.test(String(value))) return false;
  throw new Error(`${name} must be true or false.`);
}
function mailFault(code, message, status) { return Object.assign(new Error(message), { code, status }); }
