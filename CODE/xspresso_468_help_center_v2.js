// Xspresso Help Center v2

export const helpTopics = [
  'getting-started',
  'add-offer',
  'build-campaign',
  'monitor-ads',
  'switch-platforms',
  'credits-usage',
  'billing-renewal',
  'save-restore',
  'export-import',
  'troubleshooting-alerts',
];

export function buildHelpArticle(topic) {
  const articles = {
    'getting-started': {
      title: 'Getting started',
      body: 'Start by adding an offer, then let Xspresso build a draft you can review and launch.',
    },
    'credits-usage': {
      title: 'Credits and usage',
      body: 'All plans include every tool. Credits simply determine fair usage.',
    },
    'switch-platforms': {
      title: 'Switching platforms',
      body: 'Switching off a platform stops tracking there unless you choose a monitoring option.',
    },
  };

  return articles[topic] || {
    title: 'Help topic',
    body: 'Find the answer fast. Xspresso is here to help.',
  };
}

export function getHelpCopy() {
  return {
    title: 'Need help?',
    subtitle: 'Find the answer fast.',
    body: 'Xspresso is designed to make marketing easier, faster, and less confusing.',
  };
}
