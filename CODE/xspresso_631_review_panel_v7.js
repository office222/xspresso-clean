// xspresso_631_review_panel_v7.js

export const ReviewAction = {
  APPROVE: 'approve',
  EDIT: 'edit',
  REGENERATE: 'regenerate',
  SIMPLIFY: 'simplify',
  STRENGTHEN: 'strengthen',
};

export function createReviewSection(name, value = '') {
  return {
    name,
    value,
    approved: false,
    lastUpdated: new Date().toISOString(),
  };
}

export function approveSection(section) {
  return { ...section, approved: true, approvedAt: new Date().toISOString() };
}

export function regenerateSection(section, replacement = '') {
  return {
    ...section,
    value: replacement || `Regenerated ${section.name} content`,
    approved: false,
    regeneratedAt: new Date().toISOString(),
  };
}

export function buildReviewState(sections = []) {
  return sections.map((section) => ({
    ...section,
    canEdit: true,
    canApprove: true,
    canRegenerate: true,
  }));
}
