// xspresso_881_campaign_workflow.js
export function buildCampaignBrief(input = {}) {
  return {
    productName: input.productName || 'Untitled Offer',
    productUrl: input.productUrl || '',
    productImage: input.productImage || '',
    offerDescription: input.offerDescription || 'A product or service needing a marketing campaign.',
    audience: input.audience || 'General audience',
    goal: input.goal || 'sales',
    tone: input.tone || 'simple',
    platform: input.platform || 'general',
    notes: input.notes || ''
  };
}

export function buildDraftFromBrief(brief) {
  const headline = brief.goal === 'leads'
    ? 'Turn attention into leads.'
    : 'Done-for-you marketing that gets responses.';

  return {
    id: `cmp_${Date.now()}`,
    status: 'draft',
    brief,
    headline,
    subheadline: 'More responses. Less software chaos.',
    hooks: [
      'Turn one offer into a full campaign faster.',
      'Stay in command while Xspresso does the heavy lifting.'
    ],
    adCopy: [
      `Xspresso helps you market ${brief.productName} without starting from scratch.`,
      'Build ads, pages, and follow-up from one simple brief.'
    ],
    landingPage: {
      headline,
      body: `A clean landing page for ${brief.productName}.`,
      cta: 'Try the Demo'
    },
    followUp: [
      'Thanks for taking a look.',
      'Here is a quick reminder about the offer.',
      'You may want to revisit this before it is gone.'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function applyPlatformAdaptation(draft, platform) {
  return {
    ...draft,
    platform,
    adCopy: draft.adCopy.map((copy) => `${copy} (Adapted for ${platform})`),
    updatedAt: new Date().toISOString()
  };
}

export function approveSection(draft, sectionName) {
  const approvedSections = new Set(draft.approvedSections || []);
  approvedSections.add(sectionName);
  return { ...draft, approvedSections: Array.from(approvedSections) };
}

export function regenerateSection(draft, sectionName, mode = 'balanced') {
  const next = { ...draft };
  const stamp = mode === 'strong' ? 'Strong' : mode === 'simple' ? 'Simple' : 'Balanced';

  if (sectionName === 'headline') next.headline = `${stamp}: ${draft.brief.productName} that gets responses.`;
  if (sectionName === 'subheadline') next.subheadline = `${stamp}: More responses. Less software chaos.`;
  if (sectionName === 'hooks') next.hooks = [`${stamp}: Let Xspresso do the heavy lifting.`];
  if (sectionName === 'adCopy') next.adCopy = [`${stamp}: Promote ${draft.brief.productName} with less guesswork.`];
  if (sectionName === 'landingPage') next.landingPage = { ...draft.landingPage, body: `${stamp}: A better campaign draft for ${draft.brief.productName}.` };
  if (sectionName === 'followUp') next.followUp = [`${stamp}: Follow up without starting over.`];

  return { ...next, updatedAt: new Date().toISOString() };
}
