export const helpTopics = [
  'getting-started',
  'add-an-offer',
  'create-a-campaign',
  'monitoring-ads',
  'switching-platforms',
  'credits-and-usage',
  'billing-and-renewal',
  'save-and-restore',
  'troubleshooting-alerts'
];

export function searchHelpCenter(query = '') {
  const q = query.trim().toLowerCase();
  return helpTopics.filter(topic => topic.includes(q));
}

export function getHelpArticle(topic = '') {
  const articles = {
    'getting-started': {
      title: 'Getting Started',
      summary: 'Add an offer, generate a draft, and launch with guidance.'
    },
    'credits-and-usage': {
      title: 'Credits and Usage',
      summary: 'Credits determine fair usage. All tools stay available.'
    },
    'troubleshooting-alerts': {
      title: 'Troubleshooting Alerts',
      summary: 'Understand alerts, fix issues, and improve campaigns faster.'
    }
  };
  return articles[topic] || { title: 'Help Article', summary: 'Find the answer fast.' };
}

export function buildHelpSearchResult(query = '') {
  return {
    query,
    results: searchHelpCenter(query).map(topic => getHelpArticle(topic))
  };
}