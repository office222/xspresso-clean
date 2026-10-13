// Xspresso - Campaign Builder v9
// Builds a draft campaign from a brief, then prepares platform-specific variants.

const XSPRESSO_DEFAULTS = {
  goal: 'sales',
  tone: 'simple',
  platform: 'general'
};

function normalizeBrief(input = {}) {
  return {
    productName: (input.productName || 'Untitled Offer').trim(),
    productUrl: (input.productUrl || '').trim(),
    productImage: (input.productImage || '').trim(),
    offerDescription: (input.offerDescription || 'A product or offer needing a campaign').trim(),
    audience: (input.audience || 'general audience').trim(),
    goal: input.goal || XSPRESSO_DEFAULTS.goal,
    tone: input.tone || XSPRESSO_DEFAULTS.tone,
    platform: input.platform || XSPRESSO_DEFAULTS.platform,
    templateType: input.templateType || 'basic',
    notes: (input.notes || '').trim()
  };
}

function buildHeadlines(brief) {
  const base = brief.productName;
  return [
    `Done-for-you marketing for ${base}`,
    'Wake up your marketing.',
    'More responses. Less software chaos.',
    'You stay in command. We do the work.'
  ];
}

function buildHooks(brief) {
  const audience = brief.audience;
  return [
    `Built for ${audience}.`,
    'Turn one offer into a full campaign faster.',
    'Approve what you like. Tweak what you want.',
    'Let Xspresso do the heavy lifting.'
  ];
}

function buildAdCopy(brief) {
  return [
    `${brief.productName} is packaged into a done-for-you campaign that can generate ads, pages, and follow-up faster.`,
    'Xspresso helps you move from idea to launch without stitching together a pile of tools.',
    'More responses. Less software chaos. You stay in command.'
  ];
}

function buildLandingPage(brief) {
  return {
    headline: 'Done-for-you marketing that gets responses.',
    subheadline: 'More responses. Less software chaos.',
    body: `Turn ${brief.productName} into a campaign draft with ads, landing page copy, follow-up, and platform-ready variations.`,
    cta: 'Try the Demo'
  };
}

function buildFollowUp(brief) {
  return [
    {
      day: 0,
      subject: `Thanks for checking out ${brief.productName}`,
      body: `Here is a quick reminder about ${brief.productName} and what it can do for you.`
    },
    {
      day: 1,
      subject: 'A quick reminder',
      body: 'Take another look at the offer and see if it fits what you need.'
    },
    {
      day: 3,
      subject: 'Why this may be worth a second look',
      body: 'Here is a little more detail to help you decide.'
    }
  ];
}

function adaptForPlatform(copy, platform) {
  const format = /tiktok|shorts|reels/i.test(platform) ? 'vertical' : 'square';
  return {
    platform,
    format,
    headline: copy.headlines[0],
    hook: copy.hooks[0],
    body: copy.adCopy[0],
    cta: copy.landingPage.cta
  };
}

function buildCampaign(input = {}) {
  const brief = normalizeBrief(input);
  const headlines = buildHeadlines(brief);
  const hooks = buildHooks(brief);
  const adCopy = buildAdCopy(brief);
  const landingPage = buildLandingPage(brief);
  const followUp = buildFollowUp(brief);

  const copy = {
    headlines,
    hooks,
    adCopy,
    landingPage,
    followUp
  };

  const platforms = Array.isArray(input.platforms) && input.platforms.length
    ? input.platforms
    : [brief.platform];

  const platformVersions = platforms.reduce((acc, platform) => {
    acc[platform] = adaptForPlatform(copy, platform);
    return acc;
  }, {});

  return {
    id: `cmp_${Date.now()}`,
    status: 'draft',
    brief,
    copy,
    platformVersions,
    createdAt: new Date().toISOString()
  };
}

function buildCampaignDraft(input) {
  return buildCampaign(input);
}

module.exports = {
  normalizeBrief,
  buildHeadlines,
  buildHooks,
  buildAdCopy,
  buildLandingPage,
  buildFollowUp,
  adaptForPlatform,
  buildCampaign,
  buildCampaignDraft
};
