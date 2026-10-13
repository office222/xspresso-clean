// Xspresso review / approve / regenerate panel v13

export function getReviewSections(campaign = {}) {
  return [
    { key: 'headline', label: 'Headline', value: campaign.headline || campaign.headlines?.[0] || '' },
    { key: 'subheadline', label: 'Subheadline', value: campaign.subheadline || campaign.headlines?.[1] || '' },
    { key: 'hooks', label: 'Hooks', value: campaign.hooks || [] },
    { key: 'adCopy', label: 'Ad Copy', value: campaign.adCopy || [] },
    { key: 'landingPage', label: 'Landing Page', value: campaign.landingPage || {} },
    { key: 'leadMagnet', label: 'Lead Magnet', value: campaign.leadMagnet || {} },
    { key: 'followUpEmails', label: 'Follow-up Emails', value: campaign.followUpEmails || [] },
  ];
}

export function approveSection(campaign, sectionKey) {
  const approved = new Set(campaign.approvedSections || []);
  approved.add(sectionKey);
  return { ...campaign, approvedSections: [...approved] };
}

export function unapproveSection(campaign, sectionKey) {
  return {
    ...campaign,
    approvedSections: (campaign.approvedSections || []).filter((item) => item !== sectionKey),
  };
}

export function regenerateSection(campaign, sectionKey, prompt = '') {
  const next = { ...campaign, status: 'draft', lastRegeneratedSection: sectionKey, regenerationPrompt: prompt };

  switch (sectionKey) {
    case 'headline':
      next.headline = 'Wake up your marketing.';
      break;
    case 'subheadline':
      next.subheadline = 'More responses. Less software chaos.';
      break;
    case 'landingPage':
      next.landingPage = {
        headline: 'Done-for-you marketing that gets responses.',
        subheadline: 'You stay in command. We do the work.',
        body: 'Xspresso helps you build, review, and launch faster.'
      };
      break;
    default:
      next[sectionKey] = `Regenerated ${sectionKey} content`;
      break;
  }

  return next;
}

export function buildReviewSummary(campaign = {}) {
  return {
    title: campaign.headline || campaign.headlines?.[0] || 'Untitled Campaign',
    approvedCount: (campaign.approvedSections || []).length,
    sectionsReady: getReviewSections(campaign).length,
    launchReady: !!campaign.launchReady,
  };
}
