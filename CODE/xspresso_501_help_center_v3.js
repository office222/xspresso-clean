export const HelpTopics = [
  'getting-started',
  'adding-an-offer',
  'campaign-creation',
  'monitoring-ads',
  'platform-switching',
  'credits-and-usage',
  'billing-and-renewal',
  'save-restore-work',
  'troubleshooting-alerts'
];

export function searchHelpTopics(query = '') {
  const q = query.toLowerCase();
  return HelpTopics.filter(topic => topic.includes(q));
}

export function buildHelpSnippet(topic) {
  const snippets = {
    'getting-started': 'Tell Xspresso what you are selling and it will build a draft.',
    'campaign-creation': 'Add your offer, choose your goal, then generate a draft.',
    'monitoring-ads': 'Xspresso watches performance and suggests the next best action.',
    'billing-and-renewal': 'All plans include every tool. Credits determine usage.'
  };

  return snippets[topic] || 'Need help? We\'ve got you.';
}
