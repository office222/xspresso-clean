// xspresso_878_help_center.js
// Help center topic lookup for Xspresso.

export const HELP_TOPICS = [
  {
    slug: 'getting-started',
    title: 'Getting Started',
    body: 'Add an offer, build a brief, generate a draft, review, then launch.',
  },
  {
    slug: 'credits',
    title: 'Credits and Usage',
    body: 'Credits determine fair usage. All plans include every tool.',
  },
  {
    slug: 'monitoring',
    title: 'Monitoring and Alerts',
    body: 'Xspresso watches CPC, CTR, and conversions, then suggests improvements.',
  },
  {
    slug: 'billing',
    title: 'Billing and Renewal',
    body: 'See your plan, credits used, credits remaining, and next renewal date.',
  },
];

export function searchHelp(query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return HELP_TOPICS;
  return HELP_TOPICS.filter((topic) =>
    topic.title.toLowerCase().includes(q) || topic.body.toLowerCase().includes(q)
  );
}
