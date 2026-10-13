export function buildCampaignBrief(input = {}) {
  return {
    productName: input.productName || 'Untitled Offer',
    productUrl: input.productUrl || '',
    productImage: input.productImage || '',
    offerDescription: input.offerDescription || '',
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

export function generateCampaignDraft(brief, research = {}) {
  const offer = brief.productName || 'your offer';
  return {
    headline: `Done-for-you marketing for ${offer}`,
    subheadline: 'More responses. Less software chaos.',
    hooks: [
      `Turn ${offer} into a full campaign faster.`,
      'You stay in command. We do the work.',
      'Wake up your marketing.'
    ],
    ads: [
      `${offer} can get responses faster with a done-for-you campaign.`,
      'Build your list, follow up automatically, and keep control.'
    ],
    landingPage: {
      headline: `Done-for-you marketing that gets responses for ${offer}`,
      body: 'Xspresso helps you build a campaign draft from a simple brief.'
    },
    followUp: [
      'Thanks for checking this out.',
      'Here is a quick reminder about the offer.',
      'Take another look before you decide.'
    ],
    research
  };
}

export function adaptDraftForPlatform(draft, platform) {
  const channel = platform || 'general';
  return {
    ...draft,
    platform: channel,
    format: channel === 'TikTok' ? 'vertical' : 'square',
    notes: [...(draft.notes || []), `Adapted for ${channel}`]
  };
}

export function buildCampaign(input = {}) {
  const brief = buildCampaignBrief(input);
  const validation = validateBrief(brief);
  const research = {
    matchingProducts: [],
    competingOffers: [],
    audienceSignals: [],
    angleSuggestions: []
  };
  const draft = generateCampaignDraft(brief, research);
  return {
    brief,
    validation,
    research,
    draft,
    ready: validation.valid
  };
}
