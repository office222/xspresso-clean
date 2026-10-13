// Xspresso campaign builder v8
// Turns a brief into a structured campaign draft.

export function buildCampaignBrief(input = {}) {
  return {
    productName: input.productName || 'Untitled Offer',
    productUrl: input.productUrl || '',
    productImage: input.productImage || '',
    offerDescription: input.offerDescription || '',
    audience: input.audience || 'general audience',
    goal: input.goal || 'sales',
    tone: input.tone || 'simple',
    platforms: Array.isArray(input.platforms) ? input.platforms : [],
    templateType: input.templateType || 'basic',
    notes: input.notes || '',
  };
}

export function applySmartDefaults(brief) {
  const goal = brief.goal || 'sales';
  return {
    ...brief,
    headlineStyle: goal === 'leads' ? 'curiosity' : 'benefit',
    callToAction: goal === 'sales' ? 'Buy Now' : 'Learn More',
    followUpEnabled: true,
    monitoringEnabled: true,
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
  const safeBrief = applySmartDefaults(buildCampaignBrief(brief));
  return {
    id: `cmp_${Date.now()}`,
    status: 'draft',
    createdAt: new Date().toISOString(),
    brief: safeBrief,
    headlines: [
      'Wake up your marketing.',
      'Done-for-you marketing that gets responses.',
      'More responses. Less software chaos.'
    ],
    hooks: [
      'Turn one offer into a full campaign faster.',
      'Stay in command while Xspresso does the heavy lifting.'
    ],
    adCopy: [
      `Xspresso turns ${safeBrief.productName} into a campaign you can review, tweak, and launch.`,
      'Done-for-you marketing designed to save time and reduce chaos.'
    ],
    landingPage: {
      headline: 'Done-for-you marketing that gets responses.',
      subheadline: 'More responses. Less software chaos.',
      body: 'Turn your offer into ads, pages, hooks, and follow-up faster.'
    },
    leadMagnet: {
      enabled: safeBrief.goal === 'leads',
      headline: 'Capture leads without starting from scratch.',
      body: 'Build a list and keep the follow-up going automatically.'
    },
    followUpEmails: [
      { day: 0, subject: 'Thanks for checking this out', body: 'Here is a quick intro to the offer.' },
      { day: 1, subject: 'A quick reminder', body: 'You may want to take another look.' },
      { day: 3, subject: 'A little more detail', body: 'Here is why this offer may be worth a second look.' }
    ],
  };
}
