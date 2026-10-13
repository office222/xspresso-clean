// xspresso_784_help_center.js
// Simple help center search and article lookup

const ARTICLES = [
  { id: "getting_started", title: "Getting Started", tags: ["start", "setup", "beginner"] },
  { id: "campaign_builder", title: "Building a Campaign", tags: ["campaign", "builder", "offer"] },
  { id: "monitoring_ads", title: "Monitoring Ads", tags: ["monitoring", "alerts", "cpc"] },
  { id: "credits_billing", title: "Credits and Billing", tags: ["credits", "billing", "renewal"] },
  { id: "platform_switch", title: "Switching Platforms", tags: ["platform", "switch", "tracking"] },
  { id: "templates_library", title: "Templates and Library", tags: ["templates", "library", "reuse"] }
];

export function searchHelp(query = "") {
  const q = query.toLowerCase().trim();
  if (!q) return ARTICLES;
  return ARTICLES.filter(a => a.title.toLowerCase().includes(q) || a.tags.some(t => t.includes(q)));
}

export function getArticleById(id) {
  return ARTICLES.find(a => a.id === id) || null;
}

export function listHelpTopics() {
  return ARTICLES.map(({ id, title }) => ({ id, title }));
}
