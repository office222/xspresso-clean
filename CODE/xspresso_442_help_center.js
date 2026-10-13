// xspresso_442_help_center.js
// Xspresso help center content and search.

export const helpArticles = {
  'getting-started': {
    title: 'Getting started',
    body: 'Tell Xspresso what you sell. Build a draft. Review what you like. Launch when ready.',
  },
  'monitoring': {
    title: 'Monitoring',
    body: 'Xspresso watches performance, flags issues, and suggests the next best action.',
  },
  'platform-switching': {
    title: 'Platform switching',
    body: 'When you switch platforms, Xspresso shows what stays, what moves to library, and what keeps monitoring.',
  },
  'credits': {
    title: 'Credits and usage',
    body: 'All plans include every tool. Credits simply determine fair usage.',
  },
};

export function searchHelp(query = '') {
  const q = query.toLowerCase().trim();
  return Object.entries(helpArticles)
    .filter(([key, article]) => key.includes(q) || article.title.toLowerCase().includes(q) || article.body.toLowerCase().includes(q))
    .map(([key, article]) => ({ key, ...article }));
}

export function getHelpArticle(key = 'getting-started') {
  return helpArticles[key] || {
    title: 'Help',
    body: 'Need help? We’ve got you.',
  };
}