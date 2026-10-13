export const HelpTopic = Object.freeze({
  GETTING_STARTED: 'getting-started',
  BUILD_CAMPAIGN: 'build-campaign',
  MONITORING: 'monitoring',
  CREDITS: 'credits',
  BILLING: 'billing',
  PLATFORM_SWITCHING: 'platform-switching',
  LIBRARY: 'library',
  TEMPLATES: 'templates',
  FOLLOW_UP: 'follow-up',
  TROUBLESHOOTING: 'troubleshooting'
});

export const helpTopics = [
  {
    id: HelpTopic.GETTING_STARTED,
    title: 'Getting started',
    summary: 'Add an offer, build a brief, and generate a draft.'
  },
  {
    id: HelpTopic.BUILD_CAMPAIGN,
    title: 'Building a campaign',
    summary: 'Create ads, landing pages, carts, and follow-up from one brief.'
  },
  {
    id: HelpTopic.MONITORING,
    title: 'Monitoring campaigns',
    summary: 'Watch CPC, CTR, conversions, and alerts.'
  },
  {
    id: HelpTopic.CREDITS,
    title: 'Credits and usage',
    summary: 'Credits determine usage. All plans include every tool.'
  },
  {
    id: HelpTopic.BILLING,
    title: 'Billing and renewal',
    summary: 'See your plan, renewal date, and usage visibility.'
  },
  {
    id: HelpTopic.PLATFORM_SWITCHING,
    title: 'Switching platforms',
    summary: 'Choose what happens to your ads if you change platforms.'
  }
];

export function findHelpTopic(query) {
  const term = String(query || '').toLowerCase();
  return helpTopics.filter(topic =>
    topic.title.toLowerCase().includes(term) || topic.summary.toLowerCase().includes(term)
  );
}

export function buildHelpAnswer(topicId) {
  const topic = helpTopics.find(t => t.id === topicId);
  if (!topic) return 'Need help? We\'ve got you.';

  return `${topic.title}: ${topic.summary}`;
}
