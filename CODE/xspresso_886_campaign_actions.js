export function getSectionStatus(section) {
  if (!section) return 'missing';
  if (section.approved) return 'approved';
  if (section.generated && !section.approved) return 'needs_review';
  return 'draft';
}

export function approveSection(campaign, sectionKey) {
  const next = structuredClone(campaign || {});
  next.sections = next.sections || {};
  next.sections[sectionKey] = {
    ...(next.sections[sectionKey] || {}),
    approved: true,
    updatedAt: new Date().toISOString(),
  };
  next.updatedAt = new Date().toISOString();
  return next;
}

export function unapproveSection(campaign, sectionKey) {
  const next = structuredClone(campaign || {});
  next.sections = next.sections || {};
  next.sections[sectionKey] = {
    ...(next.sections[sectionKey] || {}),
    approved: false,
    updatedAt: new Date().toISOString(),
  };
  next.updatedAt = new Date().toISOString();
  return next;
}

export function regenerateSection(campaign, sectionKey, generator) {
  const next = structuredClone(campaign || {});
  next.sections = next.sections || {};
  const current = next.sections[sectionKey] || {};
  const regenerated = typeof generator === 'function'
    ? generator(current, next)
    : { ...current, content: current.content || '' };

  next.sections[sectionKey] = {
    ...current,
    ...regenerated,
    approved: false,
    regeneratedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  next.updatedAt = new Date().toISOString();
  return next;
}

export function buildCampaignActions(campaign) {
  const sections = campaign?.sections || {};
  return Object.keys(sections).reduce((acc, key) => {
    acc[key] = {
      status: getSectionStatus(sections[key]),
      canApprove: true,
      canRegenerate: true,
      canEdit: true,
    };
    return acc;
  }, {});
}

export function canLaunchCampaign(campaign) {
  const sections = campaign?.sections || {};
  const required = ['headline', 'subheadline', 'adCopy', 'landingPage'];
  const missing = required.filter((key) => !sections[key] || !sections[key].content);
  return {
    ready: missing.length === 0,
    missing,
  };
}

export function getCampaignActionSummary(campaign) {
  const launchCheck = canLaunchCampaign(campaign);
  const sections = campaign?.sections || {};
  const approvedCount = Object.values(sections).filter((s) => s?.approved).length;
  return {
    approvedCount,
    totalSections: Object.keys(sections).length,
    readyToLaunch: launchCheck.ready,
    missing: launchCheck.missing,
  };
}
