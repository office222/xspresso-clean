const ARTICLES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    body: 'Tell Xspresso what you are selling, choose a goal, and generate a draft.'
  },
  {
    id: 'credits-and-usage',
    title: 'Credits and Usage',
    body: 'All plans include every tool. Credits determine fair usage.'
  },
  {
    id: 'monitoring',
    title: 'Monitoring',
    body: 'Xspresso watches your ads and recommends improvements when performance drops.'
  },
  {
    id: 'platform-switch',
    title: 'Platform Switches',
    body: 'If you switch platforms, Xspresso will show what to keep monitoring and what to move to your library.'
  }
];

export function searchHelp(query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return ARTICLES;
  return ARTICLES.filter(article => article.title.toLowerCase().includes(q) || article.body.toLowerCase().includes(q));
}

export function getHelpArticle(id) {
  return ARTICLES.find(article => article.id === id) || null;
}
