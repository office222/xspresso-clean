// xspresso_766_help_center_panel_v11.js
// Help center topic and search helpers

const TOPICS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    body: 'Add an offer, build a brief, generate a draft, then review and launch.',
  },
  {
    id: 'credits',
    title: 'Credits and Usage',
    body: 'All plans include every tool. Credits determine fair usage.',
  },
  {
    id: 'monitoring',
    title: 'Monitoring Ads',
    body: 'Xspresso watches CPC, CTR, and conversions, then suggests a fix.',
  },
  {
    id: 'platform-switching',
    title: 'Platform Switching',
    body: 'Switching platforms may stop monitoring there unless you choose to keep it on.',
  },
  {
    id: 'billing',
    title: 'Billing and Renewal',
    body: 'See your credits, renewal date, and usage all in one place.',
  },
];

export function buildHelpTopics() {
  return TOPICS.slice();
}

export function searchHelpTopics(query = '') {
  const q = String(query).trim().toLowerCase();
  if (!q) return TOPICS.slice();
  return TOPICS.filter(topic =>
    topic.title.toLowerCase().includes(q) || topic.body.toLowerCase().includes(q)
  );
}
