// xspresso_741_help_center_v10.js
// Help center search and article scaffolding

export const HELP_ARTICLES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    tags: ['start', 'onboarding', 'first campaign'],
    body: 'Add an offer, build a brief, generate a draft, review it, then launch.'
  },
  {
    id: 'credits',
    title: 'Credits and Fair Usage',
    tags: ['credits', 'billing', 'usage'],
    body: 'All tools are included. Credits simply determine fair usage.'
  },
  {
    id: 'monitoring',
    title: 'Monitoring Ads',
    tags: ['monitoring', 'cpc', 'alerts'],
    body: 'Xspresso watches performance and tells you what to improve.'
  },
  {
    id: 'platform-switch',
    title: 'Switching Platforms',
    tags: ['switch', 'platform', 'tracking'],
    body: 'When you switch platforms, Xspresso shows you what changes and what to do next.'
  }
];

export function searchHelp(query = '') {
  const q = String(query).toLowerCase().trim();
  if (!q) return HELP_ARTICLES;
  return HELP_ARTICLES.filter(article =>
    article.title.toLowerCase().includes(q) ||
    article.tags.some(tag => tag.includes(q)) ||
    article.body.toLowerCase().includes(q)
  );
}

export function renderHelpList(query = '') {
  return searchHelp(query)
    .map(article => `
      <article class="help-article">
        <h3>${article.title}</h3>
        <p>${article.body}</p>
      </article>
    `)
    .join('');
}
