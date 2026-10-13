// Xspresso - Review Panel v15
// Approve, edit, regenerate, or finalize individual sections of a campaign draft.

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getSections(campaign = {}) {
  return {
    headlines: campaign.copy?.headlines || [],
    hooks: campaign.copy?.hooks || [],
    adCopy: campaign.copy?.adCopy || [],
    landingPage: campaign.copy?.landingPage || {},
    followUp: campaign.copy?.followUp || [],
    platformVersions: campaign.platformVersions || {}
  };
}

function approveSection(campaign, sectionName) {
  const next = clone(campaign);
  next.approvedSections = Array.from(new Set([...(next.approvedSections || []), sectionName]));
  return next;
}

function unapproveSection(campaign, sectionName) {
  const next = clone(campaign);
  next.approvedSections = (next.approvedSections || []).filter((s) => s !== sectionName);
  return next;
}

function updateSection(campaign, sectionName, value) {
  const next = clone(campaign);
  if (sectionName === 'landingPage' && typeof value === 'object') {
    next.copy = next.copy || {};
    next.copy.landingPage = { ...(next.copy.landingPage || {}), ...value };
  } else if (next.copy && sectionName in next.copy) {
    next.copy[sectionName] = value;
  } else {
    next[sectionName] = value;
  }
  next.updatedAt = new Date().toISOString();
  return next;
}

function regenerateHeadline(campaign) {
  const next = clone(campaign);
  const productName = next.brief?.productName || 'your offer';
  next.copy = next.copy || {};
  next.copy.headlines = [
    `Done-for-you marketing for ${productName}`,
    'Wake up your marketing.',
    'More responses. Less software chaos.'
  ];
  next.updatedAt = new Date().toISOString();
  return next;
}

function regenerateHook(campaign) {
  const next = clone(campaign);
  next.copy = next.copy || {};
  next.copy.hooks = [
    'Approve what you like. Tweak what you want.',
    'Turn one offer into a full campaign faster.',
    'You stay in command. We do the work.'
  ];
  next.updatedAt = new Date().toISOString();
  return next;
}

function regenerateAdCopy(campaign) {
  const next = clone(campaign);
  const productName = next.brief?.productName || 'your offer';
  next.copy = next.copy || {};
  next.copy.adCopy = [
    `${productName} can be turned into a campaign draft faster with Xspresso.`,
    'More responses. Less software chaos.',
    'Xspresso helps you build, launch, and monitor without the busywork.'
  ];
  next.updatedAt = new Date().toISOString();
  return next;
}

function regenerateSection(campaign, sectionName) {
  switch (sectionName) {
    case 'headlines': return regenerateHeadline(campaign);
    case 'hooks': return regenerateHook(campaign);
    case 'adCopy': return regenerateAdCopy(campaign);
    default: {
      const next = clone(campaign);
      next.lastRegeneratedSection = sectionName;
      next.updatedAt = new Date().toISOString();
      return next;
    }
  }
}

function finalizeCampaign(campaign) {
  const next = clone(campaign);
  const required = ['headlines', 'hooks', 'adCopy'];
  const hasApproved = required.every((s) => (next.approvedSections || []).includes(s));
  next.status = hasApproved ? 'ready_to_launch' : 'needs_review';
  next.launchReady = hasApproved;
  next.finalizedAt = new Date().toISOString();
  return next;
}

function buildReviewSummary(campaign = {}) {
  const sections = getSections(campaign);
  return {
    title: sections.headlines[0] || 'Untitled campaign',
    approvedSections: campaign.approvedSections || [],
    needsReview: Object.keys(sections).filter((key) => !Array.isArray(sections[key]) || sections[key].length > 0),
    hasLandingPage: Boolean(sections.landingPage.headline),
    followUpCount: sections.followUp.length,
    platformCount: Object.keys(sections.platformVersions).length
  };
}

module.exports = {
  getSections,
  approveSection,
  unapproveSection,
  updateSection,
  regenerateSection,
  finalizeCampaign,
  buildReviewSummary
};
