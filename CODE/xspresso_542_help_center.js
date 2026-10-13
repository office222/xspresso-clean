// Xspresso Help Center Data
// Small, searchable help article set for the app.

export const helpArticles = [
  {
    id: 'getting_started',
    title: 'Getting Started',
    tags: ['start', 'setup', 'welcome'],
    body: 'Add an offer, build a brief, generate a draft, review it, then launch and monitor it.'
  },
  {
    id: 'credits_usage',
    title: 'Credits and Usage',
    tags: ['credits', 'billing', 'usage'],
    body: 'All plans include every tool. Credits determine fair usage and can be added when needed.'
  },
  {
    id: 'monitoring_ads',
    title: 'Monitoring Ads',
    tags: ['monitoring', 'ads', 'cpc'],
    body: 'Xspresso watches your ads for performance changes and suggests fixes when something is off.'
  },
  {
    id: 'platform_switching',
    title: 'Switching Platforms',
    tags: ['platform', 'switch', 'tracking'],
    body: 'Before switching platforms, Xspresso shows what will stop tracking and what options you have.'
  },
  {
    id: 'reuse_templates',
    title: 'Templates and Reuse',
    tags: ['templates', 'reuse', 'library'],
    body: 'You can save your own winning campaigns, duplicate them, and restore them later.'
  },
];

export function searchHelp(query = '') {
  const q = query.toLowerCase().trim();
  if (!q) return helpArticles;

  return helpArticles.filter(article => {
    return article.title.toLowerCase().includes(q) || article.tags.some(tag => tag.includes(q)) || article.body.toLowerCase().includes(q);
  });
}

export function getHelpArticle(id) {
  return helpArticles.find(article => article.id === id) || null;
}
