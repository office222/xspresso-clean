import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestContext, disposeTestContext } from './xspresso_test_helpers.js';

test('AuthService registers, authenticates, and logs out a user', async t => {
  const context = await createTestContext();
  t.after(() => disposeTestContext(context));
  const session = await context.auth.register({ email: '  PERSON@Example.com ', password: 'correct-horse-battery-42', name: 'Person' });
  assert.equal(session.user.email, 'person@example.com');
  assert.equal(session.user.name, 'Person');
  assert.equal('passwordHash' in session.user, false);
  assert.equal((await context.auth.authenticate(session.token)).id, session.user.id);
  assert.equal(await context.auth.logout(session.token), true);
  assert.equal(await context.auth.authenticate(session.token), null);
});

test('AuthService rejects duplicate email addresses and weak passwords', async t => {
  const context = await createTestContext();
  t.after(() => disposeTestContext(context));
  await context.auth.register({ email: 'person@example.com', password: 'correct-horse-battery-42' });
  await assert.rejects(context.auth.register({ email: 'PERSON@example.com', password: 'correct-horse-battery-42' }), { code: 'EMAIL_EXISTS' });
  await assert.rejects(context.auth.register({ email: 'other@example.com', password: 'short' }), /12/);
});

test('AuthService uses a generic error for invalid credentials', async t => {
  const context = await createTestContext();
  t.after(() => disposeTestContext(context));
  await context.auth.register({ email: 'person@example.com', password: 'correct-horse-battery-42' });
  await assert.rejects(context.auth.login({ email: 'person@example.com', password: 'wrong-password-123' }), { code: 'INVALID_CREDENTIALS' });
  await assert.rejects(context.auth.login({ email: 'missing@example.com', password: 'wrong-password-123' }), { code: 'INVALID_CREDENTIALS' });
});
