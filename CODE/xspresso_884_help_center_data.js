// xspresso_884_help_center_data.js
export const helpArticles = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    tags: ['start', 'setup', 'welcome'],
    body: 'Add an offer, build a brief, generate a draft, review and launch.'
  },
  {
    id: 'credits',
    title: 'Credits and Usage',
    tags: ['billing', 'credits', 'usage'],
    body: 'All plans include every tool. Credits determine fair usage.'
  },
  {
    id: 'monitoring',
    title: 'Monitoring Your Campaigns',
    tags: ['alerts', 'monitoring', 'performance'],
    body: 'Xspresso watches CPC, CTR, and performance changes and suggests next steps.'
  },
  {
    id: 'switch-platform',
    title: 'Switching Platforms',
    tags: ['platform', 'switch', 'tracking'],
    body: 'Switching off a platform may stop tracking there. Choose whether to keep monitoring or move ads to your library.'
  },
  {
    id: 'review-regenerate',
    title: 'Review, Approve, Regenerate',
    tags: ['review', 'approve', 'regenerate'],
    body: 'Approve what you like, tweak what you want, and regenerate anything that does not fit.'
  }
];

export function searchHelpArticles(query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return helpArticles;
  return helpArticles.filter(article => {
    const haystack = `${article.title} ${article.tags.join(' ')} ${article.body}`.toLowerCase();
    return haystack.includes(q);
  });
}
