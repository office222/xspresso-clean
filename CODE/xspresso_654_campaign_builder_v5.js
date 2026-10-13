// xspresso_654_campaign_builder_v5.js
// Campaign builder / smart brief flow

export function createSmartBrief(input = {}) {
  return {
    productName: input.productName || 'Untitled Offer',
    productUrl: input.productUrl || '',
    productImage: input.productImage || '',
    offerDescription: input.offerDescription || 'A product or offer needing a campaign.',
    audience: input.audience || 'general audience',
    goal: input.goal || 'sales',
    tone: input.tone || 'simple',
    platform: input.platform || 'general',
    templateType: input.templateType || 'basic',
    notes: input.notes || ''
  };
}

export function validateBrief(brief) {
  const missing = [];
  if (!brief.productName) missing.push('productName');
  if (!brief.offerDescription) missing.push('offerDescription');
  if (!brief.audience) missing.push('audience');
  return { valid: missing.length === 0, missing };
}

export function buildCampaignDraft(brief) {
  const title = brief.goal === 'leads' ? 'Turn attention into leads.' : 'Wake up your marketing.';
  const subheadline = 'More responses. Less software chaos.';

  return {
    headline: title,
    subheadline,
    hooks: [
      'Done-for-you marketing that saves time.',
      'You stay in command while the work gets done.',
      'Turn one offer into a full campaign.'
    ],
    ads: [
      `${brief.productName} is ready to be seen by the right people.`,
      `Xspresso builds the ad, page, and follow-up for ${brief.productName}.`
    ],
    landingPage: {
      headline: title,
      body: brief.offerDescription
    },
    followUp: [
      'Thanks for checking this out.',
      'Here is a quick reminder about the offer.',
      'Take another look before you decide.'
    ],
    platform: brief.platform,
    brief
  };
}

export function applyDefaultTone(brief) {
  return { ...brief, tone: brief.tone || 'simple' };
}
