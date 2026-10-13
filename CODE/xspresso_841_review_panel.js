// xspresso_841_review_panel.js
import { nowIso } from './xspresso_837_utils.js';

export function reviewState(campaign = {}) {
  return {
    id: campaign.id,
    sections: {
      headline: { value: campaign.headline || '', approved: false },
      subheadline: { value: campaign.subheadline || '', approved: false },
      hooks: { value: campaign.hooks || [], approved: false },
      ads: { value: campaign.ads || [], approved: false },
      landingPage: { value: campaign.landingPage || {}, approved: false },
      followUpEmails: { value: campaign.followUpEmails || [], approved: false }
    },
    updatedAt: nowIso()
  };
}

export function approve(review, section) {
  const next = structuredClone(review);
  if (next.sections?.[section]) next.sections[section].approved = true;
  next.updatedAt = nowIso();
  return next;
}

export function regenerate(review, section, newValue) {
  const next = structuredClone(review);
  if (next.sections?.[section]) next.sections[section].value = newValue;
  if (next.sections?.[section]) next.sections[section].approved = false;
  next.updatedAt = nowIso();
  return next;
}

export function reviewSummary(review) {
  const sections = Object.entries(review.sections || {});
  const approvedCount = sections.filter(([, v]) => v.approved).length;
  return {
    approvedCount,
    total: sections.length,
    ready: approvedCount === sections.length,
    updatedAt: review.updatedAt
  };
}
