// xspresso_823_help_center_panel_v12.js
// Help center panel helpers for Xspresso

export const helpTopics = [
  "Getting started",
  "Adding an offer",
  "Building a campaign",
  "Monitoring ads",
  "Switching platforms",
  "Credits and usage",
  "Billing and renewal",
  "Saving and restoring work",
  "Troubleshooting alerts",
];

export function searchHelp(query = "") {
  const q = query.trim().toLowerCase();
  if (!q) return helpTopics;
  return helpTopics.filter(topic => topic.toLowerCase().includes(q));
}

export function buildHelpArticle(topic) {
  return {
    title: topic,
    body: `Short, clear help content for ${topic}. Keep the tone calm, helpful, and simple.`,
  };
}

export function buildHelpPanel(query = "") {
  return searchHelp(query).map(topic => buildHelpArticle(topic));
}
