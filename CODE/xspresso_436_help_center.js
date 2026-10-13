// xspresso_436_help_center.js
// Xspresso help center and support topics.

export const helpTopics = [
  'getting-started',
  'add-an-offer',
  'campaign-builder',
  'monitoring',
  'platform-switching',
  'credits-and-usage',
  'billing-and-renewal',
  'library-and-templates',
  'troubleshooting',
  'alerts-and-regeneration',
];

export function searchHelp(query = '') {
  const q = query.toLowerCase().trim();
  return helpTopics.filter((topic) => topic.includes(q));
}

export function buildHelpArticle(topic = 'getting-started') {
  const articles = {
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
      body: 'When you switch platforms, Xspresso shows what will keep running, what moves to library, and what should keep being monitored.',
    },
    'credits-and-usage': {
      title: 'Credits and usage',
      body: 'All plans include every tool. Credits simply determine fair usage.',
    },
    default: {
      title: 'Help',
      body: 'Find the answer fast. Xspresso is here to help.',
    },
  };

  return articles[topic] || articles.default;
}

export function supportMessage(topic = '') {
  const article = buildHelpArticle(topic);
  return `Need help with ${article.title.toLowerCase()}? We’ve got you.`;
}