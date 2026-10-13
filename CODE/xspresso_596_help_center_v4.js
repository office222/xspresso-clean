// Xspresso help center v4
export const helpTopics = [
  'Getting started',
  'Add an offer',
  'Build a campaign',
  'Review and regenerate',
  'Launch readiness',
  'Monitoring and alerts',
  'Credits and billing',
  'Platform switching',
  'Templates and library',
  'Follow-up and leads'
];

export function searchHelp(query = '') {
  const q = query.toLowerCase();
  return helpTopics.filter(topic => topic.toLowerCase().includes(q));
}

export function helpArticle(topic) {
  return {
    topic,
    summary: `Help article for ${topic}`,
    sections: [
      'What it is',
      'How to use it',
      'Common mistakes',
      'What to do next'
    ]
  };
}
