// xspresso_617_help_center_v5.js
// Help center content and search helpers

export const helpArticles = [
  { id: 'start', title: 'Getting Started', tags: ['start', 'onboarding'], body: 'How to add an offer, generate a draft, and launch.' },
  { id: 'campaigns', title: 'Creating Campaigns', tags: ['campaign', 'builder'], body: 'Use the builder to create ads, pages, and follow-up.' },
  { id: 'monitoring', title: 'Monitoring Ads', tags: ['monitoring', 'alerts'], body: 'Watch CPC, CTR, conversions, and alerts.' },
  { id: 'billing', title: 'Billing and Credits', tags: ['billing', 'credits'], body: 'Understand plans, credits, and renewals.' },
  { id: 'switch', title: 'Switching Platforms', tags: ['platform', 'switch'], body: 'What happens when you move tracking or uploads.' },
];

export function searchHelp(query = '') {
  const q = query.toLowerCase().trim();
  if (!q) return helpArticles;
  return helpArticles.filter(article =>
    article.title.toLowerCase().includes(q) ||
    article.tags.some(tag => tag.includes(q)) ||
    article.body.toLowerCase().includes(q)
  );
}

export function getHelpArticle(id) {
  return helpArticles.find(a => a.id === id) || null;
}

export function buildHelpTopics() {
  return helpArticles.map(a => ({ id: a.id, title: a.title }));
}
