// xspresso_488_help_center_data.js
// Help center content for Xspresso V1

export const helpTopics = [
  {
    id: "getting-started",
    title: "Getting started",
    summary: "Add an offer, generate a draft, then review and launch.",
  },
  {
    id: "campaign-builder",
    title: "Campaign builder",
    summary: "Turn product details into ads, landing pages, and follow-up.",
  },
  {
    id: "monitoring",
    title: "Monitoring",
    summary: "Watch performance and suggest the next best action when results drop.",
  },
  {
    id: "credits",
    title: "Credits and usage",
    summary: "All plans include every tool. Credits determine fair usage.",
  },
  {
    id: "billing",
    title: "Billing and renewal",
    summary: "See your plan, credits remaining, and next renewal date.",
  },
  {
    id: "platform-switching",
    title: "Platform switching",
    summary: "Choose what happens when you move campaigns between platforms.",
  },
];

export function searchHelpTopics(query = "") {
  const q = query.trim().toLowerCase();
  if (!q) return helpTopics;
  return helpTopics.filter(
    (topic) =>
      topic.title.toLowerCase().includes(q) ||
      topic.summary.toLowerCase().includes(q)
  );
}
