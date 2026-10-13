export const helpTopics = [
  {
    id: 'getting-started',
    title: 'Getting started',
    summary: 'Add an offer, build a brief, and generate a draft campaign.'
  },
  {
    id: 'campaign-builder',
    title: 'Campaign builder',
    summary: 'Enter your offer, choose a goal, tone, and platform.'
  },
  {
    id: 'monitoring',
    title: 'Monitoring',
    summary: 'Watch ad performance and act on alerts before credits are wasted.'
  },
  {
    id: 'billing',
    title: 'Billing and credits',
    summary: 'Track plan usage, credits remaining, and renewal dates.'
  },
  {
    id: 'platform-switching',
    title: 'Platform switching',
    summary: 'Choose whether to keep tracking, move ads to library, or monitor yourself.'
  }
];

export function searchHelpTopics(query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return helpTopics;

  return helpTopics.filter(topic =>
    topic.title.toLowerCase().includes(q) || topic.summary.toLowerCase().includes(q)
  );
}

export function renderHelpTopics(topics = helpTopics) {
  return topics.map(topic => `
    <article class="help-topic">
      <h4>${topic.title}</h4>
      <p>${topic.summary}</p>
    </article>
  `).join('');
}
