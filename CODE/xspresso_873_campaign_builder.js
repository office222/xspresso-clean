// xspresso_873_campaign_builder.js
// Campaign brief builder and draft generator for Xspresso.

export function normalizeBrief(input = {}) {
  return {
    productName: input.productName?.trim() || 'Untitled Offer',
    productUrl: input.productUrl?.trim() || '',
    productImage: input.productImage?.trim() || '',
    offerDescription: input.offerDescription?.trim() || 'A product or service offer.',
    audience: input.audience?.trim() || 'General audience',
    goal: input.goal?.trim() || 'sales',
    tone: input.tone?.trim() || 'simple',
    platform: input.platform?.trim() || 'general',
  };
}

export function buildCampaignDraft(brief) {
  const b = normalizeBrief(brief);

  const headlineMap = {
    sales: 'Done-for-you marketing that gets responses.',
    leads: 'Turn attention into leads faster.',
    clicks: 'Wake up your marketing and get more clicks.',
    list: 'Build your list with less software chaos.',
  };

  const headline = headlineMap[b.goal] || headlineMap.sales;

  return {
    brief: b,
    headline,
    subheadline: 'You stay in command. Xspresso does the heavy lifting.',
    hooks: [
      `Built for ${b.audience}.`,
      `Made to support ${b.goal}.`,
      'Turn one offer into a full campaign.'
    ],
    adCopy: [
      `${b.productName} is ready for a cleaner, smarter campaign.`,
      `Xspresso turns your offer into ads, landing pages, and follow-up.`
    ],
    landingPage: {
      headline,
      body: b.offerDescription,
      cta: 'Try the Demo'
    },
    followUp: [
      'Thanks for checking this out.',
      'Here is a quick reminder about the offer.',
      'Take another look before you decide.'
    ]
  };
}

export function createCampaignFromInput(input = {}) {
  const draft = buildCampaignDraft(input);
  return {
    id: `cmp_${Date.now()}`,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...draft,
  };
}
