import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGeneratedCampaign } from './xspresso_ai_output_validation_v1.js';

const valid = {
  headline: 'A clearer routine', subheadline: 'Simple care for every day.', hooks: ['Make space for a simpler routine.'],
  ads: [{ headline: 'A simple daily choice', primaryText: 'Meet a product designed for everyday use.', callToAction: 'Learn more' }],
  landingPage: { headline: 'A simple daily choice', body: 'Explore the product and decide whether it suits you.', callToAction: 'Learn more' },
  followUpEmails: [{ subject: 'Thanks for your interest', body: 'Here is more information about the product.', delayDays: 1 }]
};

test('accepts and normalizes a valid generated campaign', () => {
  const result = validateGeneratedCampaign(valid);
  assert.equal(result.ads.length, 1);
  assert.equal(result.followUpEmails[0].delayDays, 1);
});

test('accepts JSON text from an AI provider', () => {
  assert.equal(validateGeneratedCampaign(JSON.stringify(valid)).headline, valid.headline);
});

test('rejects invalid JSON and missing required fields', () => {
  assert.throws(() => validateGeneratedCampaign('{bad'), { code: 'INVALID_GENERATION_OUTPUT' });
  assert.throws(() => validateGeneratedCampaign({ ...valid, ads: [] }), /At least one ad draft/);
});

test('rejects unsafe or structurally invalid content instead of passing it through', () => {
  assert.throws(() => validateGeneratedCampaign({ ...valid, ads: [{ ...valid.ads[0], headline: { html: '<script>' } }] }), /must be strings/);
  assert.throws(() => validateGeneratedCampaign({ ...valid, followUpEmails: [{ subject: 'Hello', body: 'Body', delayDays: -1 }] }), /delayDays/);
});
