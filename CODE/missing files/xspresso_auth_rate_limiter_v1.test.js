import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthRateLimiter } from './xspresso_auth_rate_limiter_v1.js';

test('allows the configured number of attempts and then blocks until the window resets', () => {
  let now = 10_000;
  const limiter = new AuthRateLimiter({ maxAttempts: 2, windowMs: 5_000, clock: () => now });
  assert.equal(limiter.consume('127.0.0.1').allowed, true);
  assert.equal(limiter.consume('127.0.0.1').allowed, true);
  const blocked = limiter.consume('127.0.0.1');
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 5);
  now += 5_001;
  assert.equal(limiter.consume('127.0.0.1').allowed, true);
});

test('uses independent counters per client key and supports reset', () => {
  const limiter = new AuthRateLimiter({ maxAttempts: 1, windowMs: 2_000, clock: () => 20_000 });
  assert.equal(limiter.consume('client-a').allowed, true);
  assert.equal(limiter.consume('client-b').allowed, true);
  assert.equal(limiter.consume('client-a').allowed, false);
  assert.equal(limiter.reset('client-a'), true);
  assert.equal(limiter.consume('client-a').allowed, true);
});
