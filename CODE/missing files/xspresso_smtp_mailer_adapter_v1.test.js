import test from 'node:test';
import assert from 'node:assert/strict';
import { createSmtpMailerFromEnv } from './xspresso_smtp_mailer_adapter_v1.js';

function fakeNodemailer() {
  const captured = { transportOptions: null, messages: [] };
  return {
    captured,
    module: {
      createTransport(options) {
        captured.transportOptions = options;
        return { async sendMail(message) { captured.messages.push(message); return { messageId: '<smtp-1@example.test>', accepted: [message.to] }; }, close() {} };
      }
    }
  };
}

test('SMTP factory enforces STARTTLS by default and sends plain text with an unsubscribe header', async () => {
  const fake = fakeNodemailer();
  const mailer = createSmtpMailerFromEnv({ SMTP_HOST: 'smtp.example.test', SMTP_PORT: '587', SMTP_FROM: 'Xspresso <mailer@example.test>', SMTP_USER: 'mailer', SMTP_PASSWORD: 'secret' }, { nodemailerModule: fake.module });
  assert.ok(mailer);
  assert.equal(fake.captured.transportOptions.secure, false);
  assert.equal(fake.captured.transportOptions.requireTLS, true);
  const result = await mailer.send({ to: 'lead@example.test', subject: 'Your follow-up', text: 'A plain-text message.', unsubscribeUrl: 'https://xspresso.example.test/api/unsubscribe?token=abc', idempotencyKey: 'message-1' });
  assert.equal(result.id, '<smtp-1@example.test>');
  assert.equal(fake.captured.messages[0].list.unsubscribe, 'https://xspresso.example.test/api/unsubscribe?token=abc');
  assert.match(fake.captured.messages[0].headers['X-Xspresso-Message-Key'], /^[a-f0-9]{64}$/);
  assert.equal(await createSmtpMailerFromEnv({}, { nodemailerModule: fake.module }), null);
});

test('SMTP factory rejects partial credentials, header injection, and insecure unsubscribe URLs', async () => {
  const fake = fakeNodemailer();
  assert.throws(() => createSmtpMailerFromEnv({ SMTP_HOST: 'smtp.example.test' }, { nodemailerModule: fake.module }), /SMTP_HOST and SMTP_FROM/);
  assert.throws(() => createSmtpMailerFromEnv({ SMTP_HOST: 'smtp.example.test', SMTP_FROM: 'mailer@example.test', SMTP_USER: 'user' }, { nodemailerModule: fake.module }), /both SMTP_USER and SMTP_PASSWORD/);
  const mailer = createSmtpMailerFromEnv({ SMTP_HOST: 'smtp.example.test', SMTP_FROM: 'mailer@example.test' }, { nodemailerModule: fake.module });
  await assert.rejects(() => mailer.send({ to: 'lead@example.test', subject: 'hello\r\nBcc: victim@example.test', text: 'body' }), { code: 'INVALID_SUBJECT' });
  await assert.rejects(() => mailer.send({ to: 'lead@example.test', subject: 'hello', text: 'body', unsubscribeUrl: 'javascript:alert(1)' }), { code: 'INVALID_UNSUBSCRIBE_URL' });
});
