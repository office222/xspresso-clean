// xspresso_797_help_center_panel.js
// Help center data and search helpers for Xspresso

export const helpTopics = [
  { id: 'start', title: 'Getting Started', body: 'Add an offer, build a brief, and generate a draft.' },
  { id: 'builder', title: 'Campaign Builder', body: 'Use the builder to create ads, pages, and follow-up.' },
  { id: 'monitor', title: 'Monitoring', body: 'Watch CPC, alerts, and ad performance.' },
  { id: 'billing', title: 'Billing and Credits', body: 'Credits determine fair usage across plans.' },
  { id: 'switch', title: 'Platform Switching', body: 'Choose what happens when you move platforms.' },
  { id: 'templates', title: 'Templates and Library', body: 'Save and reuse your own campaigns.' },
];

export function searchHelp(query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return helpTopics;
  return helpTopics.filter(topic => `${topic.title} ${topic.body}`.toLowerCase().includes(q));
}

export function getHelpTopic(id) {
  return helpTopics.find(topic => topic.id === id) || null;
}

export function helpCopy(query = '') {
  const results = searchHelp(query);
  return {
    headline: results.length ? 'Find the answer fast' : 'Need help?',
    body: results.length ? `Showing ${results.length} help topic(s).` : 'Xspresso is here to help.',
  };
}
