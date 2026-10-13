// xspresso_494_activity_log_v3.js
// Activity logging and history helpers.

export function createActivity({ userId, campaignId, type, title, message, creditsUsed = 0 }) {
  return {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    campaignId,
    type,
    title,
    message,
    creditsUsed,
    createdAt: new Date().toISOString()
  };
}

export function sortRecentActivity(activities = [], limit = 10) {
  return [...activities]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

export function summarizeCredits(activities = [], creditsIncluded = 0) {
  const used = activities.reduce((sum, item) => sum + (item.creditsUsed || 0), 0);
  return {
    creditsIncluded,
    creditsUsed: used,
    creditsRemaining: creditsIncluded - used
  };
}