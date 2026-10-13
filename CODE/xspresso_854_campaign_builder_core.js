export function buildCampaignBrief(input = {}) {
  const productName = input.productName?.trim() || 'Untitled Offer';
  const audience = input.audience?.trim() || 'general audience';
  const goal = input.goal || 'sales';
  const tone = input.tone || 'simple';
  const platform = input.platform || 'general';

  return {
    productName,
    productUrl: input.productUrl?.trim() || '',
    productImage: input.productImage?.trim() || '',
    offerDescription: input.offerDescription?.trim() || 'A product or offer needing a campaign.',
    audience,
    goal,
    tone,
    platform,
    notes: input.notes?.trim() || ''
  };
}

export function generateCampaignDraft(brief) {
  const hook = `Turn ${brief.productName} into a campaign faster.`;
  const headline = brief.goal === 'leads'
    ? 'Build your list without the chaos.'
    : 'Done-for-you marketing that gets responses.';

  return {
    headline,
    subheadline: 'More responses. Less software chaos.',
    hooks: [hook, 'You stay in command. We do the work.'],
    adCopy: [
      `Xspresso helps you market ${brief.productName} with less guesswork.`,
      `Built for people who want more for less and more time back.`
    ],
    landingPage: {
      headline,
      body: `Tell Xspresso what you are selling and it helps draft the campaign.`,
      cta: 'Try the Demo'
    },
    followUp: [
      'Thanks for checking this out.',
      `Here is a quick reminder about ${brief.productName}.`,
      'If you want to move faster, take another look today.'
    ]
  };
}

export function validateBrief(brief) {
  const missing = [];
  if (!brief.productName) missing.push('productName');
  if (!brief.offerDescription) missing.push('offerDescription');
  if (!brief.audience) missing.push('audience');
  return {
    valid: missing.length === 0,
    missing
  };
}
