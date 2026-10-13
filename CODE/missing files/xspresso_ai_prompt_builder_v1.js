/** Build structured, conservative prompts for campaign generation. */
const MAX_TEXT = 4000;

export function buildCampaignMessages({ brief = {}, notes = '', tone = 'simple', platform = 'general' } = {}) {
  const normalized = {
    productName: text(brief.productName, 160),
    description: text(brief.offerDescription || brief.description, MAX_TEXT),
    price: text(brief.price, 80),
    audience: text(brief.audience, 500),
    goal: text(brief.goal, 80),
    url: text(brief.productUrl || brief.url, 500),
    verifiedClaims: stringList(brief.verifiedClaims, 12, 300),
    restrictions: stringList(brief.restrictions, 12, 300),
    notes: text(notes, 1000),
    tone: text(tone, 40),
    platform: text(platform, 80)
  };

  const system = [
    'You are Xspresso, a marketing campaign drafting assistant.',
    'Return only a JSON object matching the requested schema; do not add markdown fences.',
    'Use only facts supplied in the brief. Do not invent testimonials, prices, discounts, guarantees, scarcity, results, ingredients, certifications, or product claims.',
    'Do not reproduce competitor copy or claim that you researched competitors.',
    'Write original, customer-focused copy. Keep all text plain text, not HTML.',
    'If a detail is missing, avoid making it up; write around it or leave the relevant field concise.'
  ].join(' ');

  const user = {
    task: 'Create an editable first-draft campaign. Do not publish, send, or launch anything.',
    brief: normalized,
    outputSchema: {
      headline: 'string', subheadline: 'string', hooks: ['string'],
      ads: [{ headline: 'string', primaryText: 'string', callToAction: 'string' }],
      landingPage: { headline: 'string', body: 'string', callToAction: 'string' },
      followUpEmails: [{ subject: 'string', body: 'string', delayDays: 'integer' }]
    },
    limits: { hooks: 5, ads: 3, followUpEmails: 4, plainTextOnly: true }
  };

  return [
    { role: 'system', content: system },
    { role: 'user', content: JSON.stringify(user) }
  ];
}

function text(value, max) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}
function stringList(value, maxItems, maxLength) {
  return Array.isArray(value) ? value.slice(0, maxItems).map(item => text(item, maxLength)).filter(Boolean) : [];
}
