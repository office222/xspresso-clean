export const helpTopics = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    summary: 'Create your first campaign in a few simple steps.',
    tags: ['start', 'campaign', 'builder'],
  },
  {
    id: 'credits-usage',
    title: 'Credits and Usage',
    summary: 'Understand how credits are used across the app.',
    tags: ['billing', 'credits', 'usage'],
  },
  {
    id: 'monitoring',
    title: 'Monitoring Ads',
    summary: 'Learn how alerts, CPC, and ad health are tracked.',
    tags: ['alerts', 'monitoring', 'cpc'],
  },
  {
    id: 'platform-switch',
    title: 'Switching Platforms',
    summary: 'See what happens when you move tracking to another platform.',
    tags: ['switch', 'platform', 'tracking'],
  },
  {
    id: 'templates',
    title: 'Templates',
    summary: 'Reuse your own campaigns and start from a template.',
    tags: ['templates', 'reuse', 'library'],
  },
];

export function searchHelpTopics(query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return helpTopics;

  return helpTopics.filter((topic) => {
    const haystack = [topic.title, topic.summary, ...(topic.tags || [])].join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

export function getHelpTopic(id) {
  return helpTopics.find((topic) => topic.id === id) || null;
}
