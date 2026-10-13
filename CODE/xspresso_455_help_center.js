// xspresso_455_help_center.js
// Help center content and helpers for Xspresso

export const helpTopics = [
  'getting started',
  'adding an offer',
  'creating a campaign',
  'monitoring ads',
  'platform switching',
  'credits and usage',
  'billing and renewal',
  'saving and restoring work',
  'exporting and importing',
  'troubleshooting alerts',
];

export function buildHelpCard(topic) {
  return {
    topic,
    title: `Help: ${topic}`,
    summary: `Clear steps for ${topic} in Xspresso.`,
    cta: 'Find the answer fast',
  };
}

export function getHelpCopy() {
  return {
    title: 'Need help?',
    subtitle: 'We’ve got you.',
    body: 'Find the answer fast. Xspresso is here to help.',
  };
}
