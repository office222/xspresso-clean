// xspresso_678_help_center.js
// Help center article lookup and search helpers.

export const HELP_ARTICLES = [
  {
    id: 'getting-started',
    title: 'Getting started',
    body: 'Tell Xspresso what you are selling, choose your goal, and generate a draft campaign.',
  },
  {
    id: 'campaign-builder',
    title: 'Using the campaign builder',
    body: 'Enter your offer details, choose a tone, select a platform, and generate a draft.',
  },
  {
    id: 'monitoring',
    title: 'Monitoring your ads',
    body: 'Xspresso watches performance and warns you when something looks off.',
  },
  {
    id: 'credits',
    title: 'Credits and fair usage',
    body: 'All plans include every tool. Credits simply determine fair usage.',
  },
  {
    id: 'platform-switching',
    title: 'Switching platforms',
    body: 'When you switch platforms, choose whether to keep tracking, move to library, or stop monitoring.',
  },
  {
    id: 'billing',
    title: 'Billing and renewal',
    body: 'Review your plan, credits used, renewal date, and upgrade options from the billing panel.',
  },
];

export function searchHelp(query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return HELP_ARTICLES;
  return HELP_ARTICLES.filter((article) =>
    [article.title, article.body].some((text) => text.toLowerCase().includes(q))
  );
}

export function getHelpArticle(id) {
  return HELP_ARTICLES.find((article) => article.id === id) || null;
}
