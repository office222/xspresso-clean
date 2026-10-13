// xspresso_838_campaign_api.js
import { uid, nowIso, deepClone } from './xspresso_837_utils.js';

export function createCampaignDraft(input = {}) {
  return {
    id: uid('cmp'),
    name: input.name || 'Untitled Campaign',
    productName: input.productName || '',
    audience: input.audience || 'general audience',
    goal: input.goal || 'sales',
    tone: input.tone || 'simple',
    platform: input.platform || 'general',
    status: 'draft',
    headline: input.headline || '',
    subheadline: input.subheadline || '',
    hooks: input.hooks || [],
    ads: input.ads || [],
    landingPage: input.landingPage || { headline: '', body: '' },
    leadMagnet: input.leadMagnet || { enabled: false, headline: '', body: '' },
    followUpEmails: input.followUpEmails || [],
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}

export function buildCampaignFromBrief(brief = {}) {
  const campaign = createCampaignDraft(brief);
  campaign.headline = brief.headline || 'Wake up your marketing.';
  campaign.subheadline = brief.subheadline || 'Done-for-you marketing that gets responses.';
  campaign.hooks = brief.hooks || [
    'Turn one offer into a full campaign.',
    'You stay in command. We do the work.'
  ];
  campaign.ads = brief.ads || [{ id: uid('ad'), title: campaign.headline, body: campaign.subheadline }];
  campaign.landingPage = brief.landingPage || {
    headline: campaign.headline,
    body: 'Xspresso helps you move faster with less software chaos.'
  };
  campaign.followUpEmails = brief.followUpEmails || [
    { day: 0, subject: 'Thanks for checking this out', body: 'Here is your first follow-up.' },
    { day: 2, subject: 'A quick reminder', body: 'A second pass may help.' }
  ];
  return campaign;
}

export function duplicateCampaign(campaign) {
  const copy = deepClone(campaign);
  copy.id = uid('cmp');
  copy.name = `${campaign.name || 'Campaign'} Copy`;
  copy.status = 'draft';
  copy.createdAt = nowIso();
  copy.updatedAt = nowIso();
  return copy;
}

export function approveSection(campaign, sectionName) {
  const approved = new Set(campaign.approvedSections || []);
  approved.add(sectionName);
  return { ...campaign, approvedSections: [...approved], updatedAt: nowIso() };
}

export function regenerateSection(campaign, sectionName) {
  const regenerated = { ...campaign, updatedAt: nowIso() };
  switch (sectionName) {
    case 'headline':
      regenerated.headline = `Wake up your marketing with ${campaign.productName || 'Xspresso'}.`;
      break;
    case 'subheadline':
      regenerated.subheadline = 'More responses. Less software chaos.';
      break;
    case 'hooks':
      regenerated.hooks = [
        'Done-for-you marketing.',
        'More responses without the chaos.',
        'You stay in command.'
      ];
      break;
    default:
      regenerated.notes = [...(campaign.notes || []), `Regenerated ${sectionName} at ${nowIso()}`];
  }
  return regenerated;
}

export function launchReady(campaign) {
  const required = ['headline', 'landingPage'];
  const missing = required.filter((k) => !campaign[k] || (typeof campaign[k] === 'object' && Object.keys(campaign[k]).length === 0));
  return { ready: missing.length === 0, missing };
}
