// Xspresso help search v2
// Small helper to filter help topics and return matches.

export const helpTopics = [
  "getting started",
  "adding an offer",
  "creating a campaign",
  "monitoring ads",
  "platform switching",
  "credits and usage",
  "billing and renewal",
  "saving and restoring work",
  "exporting and importing",
  "troubleshooting alerts"
];

export function searchHelpTopics(query = "") {
  const term = query.toLowerCase().trim();
  if (!term) return helpTopics;
  return helpTopics.filter(topic => topic.includes(term));
}
