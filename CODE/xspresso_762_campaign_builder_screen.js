// xspresso_762_campaign_builder_screen.js
// Campaign brief and draft helpers

export function validateCampaignBrief(brief = {}) {
  const missing = [];
  if (!brief.productName) missing.push('productName');
  if (!brief.offerDescription) missing.push('offerDescription');
  if (!brief.audience) missing.push('audience');

  return {
    valid: missing.length === 0,
    missing,
  };
}

export function createCampaignDraft(brief = {}) {
  const safeBrief = {
    productName: brief.productName || 'Untitled Offer',
    productUrl: brief.productUrl || '',
    offerDescription: brief.offerDescription || 'A product or offer needing a campaign',
    audience: brief.audience || 'general audience',
    goal: brief.goal || 'sales',
    tone: brief.tone || 'simple',
    platform: brief.platform || 'general',
  };

  return {
    ...safeBrief,
    headline: `Done-for-you marketing for ${safeBrief.productName}`,
    subheadline: 'More responses. Less software chaos.',
    hooks: [
      'Wake up your marketing.',
      'Turn one offer into a full campaign.',
      'You stay in command. We do the work.',
    ],
    ads: [
      {
        id: 'ad_1',
        title: 'Done-for-you marketing that gets responses.',
        body: 'Xspresso helps turn an offer into a campaign faster.',
      },
    ],
    landingPage: {
      headline: 'Done-for-you marketing that gets responses.',
      body: 'Build campaigns faster, keep control, and avoid software chaos.',
    },
    followUpEmails: [
      { day: 0, subject: 'Thanks for checking this out' },
      { day: 2, subject: 'A quick reminder' },
      { day: 5, subject: 'Here is one more look' },
    ],
    platformVersions: {
      [safeBrief.platform]: {
        platform: safeBrief.platform,
        status: 'ready',
      },
    },
    status: 'draft',
  };
}

export function buildSmartDefaults(brief = {}) {
  return {
    goal: brief.goal || 'sales',
    tone: brief.tone || 'simple',
    platform: brief.platform || 'general',
  };
}
