// Xspresso Help Center v7
// Simple search / article lookup helpers for onboarding and support.

export const helpTopics = [
  'getting started',
  'adding an offer',
  'creating a campaign',
  'monitoring ads',
  'switching platforms',
  'credits and usage',
  'billing and renewals',
  'saving and restoring work',
  'exporting and importing',
  'troubleshooting alerts'
];

export function searchHelp(query = '') {
  const q = String(query).toLowerCase().trim();
  if (!q) return helpTopics;
  return helpTopics.filter(topic => topic.toLowerCase().includes(q));
}

export function getHelpArticle(topic = '') {
  const key = String(topic).toLowerCase().trim();
  return {
    topic: key,
    title: key ? key.replace(/\b\w/g, c => c.toUpperCase()) : 'Help',
    summary: `Help content for ${key || 'general support'}.`,
    steps: [
      'Read the overview.',
      'Follow the suggested steps.',
      'Return to the app and continue.'
    ]
  };
}

export function helpMessage() {
  return 'Need help? We\'ve got you.';
}
