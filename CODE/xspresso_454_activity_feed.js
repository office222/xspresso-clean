// xspresso_454_activity_feed.js
// Activity feed helpers for Xspresso

export function logActivity({ userId, campaignId, type, title, message, creditsUsed = 0 }) {
  return {
    id: `act_${Date.now()}`,
    userId,
    campaignId,
    type,
    title,
    message,
    creditsUsed,
    createdAt: new Date().toISOString(),
  };
}

export function buildActivityFeed(activities = []) {
  return [...activities]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      message: a.message,
      creditsUsed: a.creditsUsed || 0,
      createdAt: a.createdAt,
    }));
}

export function buildCreditSummary(activities = [], creditsIncluded = 0) {
  const totalUsed = activities.reduce((sum, a) => sum + (a.creditsUsed || 0), 0);
  return {
    creditsIncluded,
    creditsUsed: totalUsed,
    creditsRemaining: Math.max(creditsIncluded - totalUsed, 0),
  };
}
