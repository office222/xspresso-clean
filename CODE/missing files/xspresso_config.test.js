import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from './xspresso_config.js';

test('loadConfig provides safe local development defaults', () => {
  const config = loadConfig({});
  assert.equal(config.port, 8787);
  assert.equal(config.allowedOrigin, 'http://localhost:8080');
  assert.equal(config.dataFile, './data/xspresso.json');
  assert.equal(config.signupsEnabled, true);
  assert.equal(Object.isFrozen(config), true);
});

test('loadConfig parses configured values and allows disabling signups', () => {
  const config = loadConfig({ PORT: '9000', XSPRESSO_ALLOWED_ORIGIN: 'https://app.example.test', XSPRESSO_SIGNUPS_ENABLED: 'false' });
  assert.equal(config.port, 9000);
  assert.equal(config.allowedOrigin, 'https://app.example.test');
  assert.equal(config.signupsEnabled, false);
});

test('loadConfig rejects invalid port and wildcard CORS origin', () => {
  assert.throws(() => loadConfig({ PORT: '70000' }), /PORT must be an integer/);
  assert.throws(() => loadConfig({ XSPRESSO_ALLOWED_ORIGIN: '*' }), /wildcard CORS is not allowed/);
});

test('loadConfig rejects body limits outside supported bounds', () => {
  assert.throws(() => loadConfig({ XSPRESSO_BODY_LIMIT_BYTES: '10' }), /XSPRESSO_BODY_LIMIT_BYTES must be an integer/);
  assert.throws(() => loadConfig({ XSPRESSO_BODY_LIMIT_BYTES: 'not-a-number' }), /XSPRESSO_BODY_LIMIT_BYTES must be an integer/);
});
