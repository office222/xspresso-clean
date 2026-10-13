import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runPreflight } from './xspresso_environment_preflight_v1.js';

test('preflight succeeds locally without AI credentials and reports generation warning', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'xspresso-preflight-'));
  try {
    const report = await runPreflight({ env: { NODE_ENV: 'test', XSPRESSO_DATA_DIR: dir, XSPRESSO_SIGNUP_ENABLED: 'true' }, nodeVersion: '20.0.0' });
    assert.equal(report.ok, true);
    assert.ok(report.checks.find(item => item.name === 'data_directory')?.ok);
    assert.ok(report.warnings.some(message => message.includes('Campaign generation')));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('preflight rejects partial AI configuration without echoing credentials', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'xspresso-preflight-'));
  try {
    const secret = 'must-not-appear-in-output';
    const report = await runPreflight({ env: { NODE_ENV: 'test', XSPRESSO_DATA_DIR: dir, OPENAI_API_KEY: secret }, nodeVersion: '20.0.0' });
    assert.equal(report.ok, false);
    const output = JSON.stringify(report);
    assert.equal(output.includes(secret), false);
    assert.equal(report.checks.find(item => item.name === 'ai_provider_config')?.ok, false);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('preflight rejects unsupported Node versions', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'xspresso-preflight-'));
  try {
    const report = await runPreflight({ env: { NODE_ENV: 'test', XSPRESSO_DATA_DIR: dir }, nodeVersion: '18.20.0' });
    assert.equal(report.ok, false);
    assert.equal(report.checks.find(item => item.name === 'node_version')?.ok, false);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
