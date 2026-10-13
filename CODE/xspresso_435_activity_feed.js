// xspresso_435_activity_feed.js
// Xspresso activity feed: track actions, credits, and recent user events.

export function createActivity({ userId, campaignId = null, type, title, message, creditsUsed = 0 }) {
  return {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    campaignId,
    type,
    title,
    message,
    creditsUsed,
    createdAt: new Date().toISOString(),
  };
}

export function buildActivityFeed(activities = [], limit = 20) {
  return [...activities]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      message: item.message,
      creditsUsed: item.creditsUsed || 0,
      createdAt: item.createdAt,
    }));
}

export function buildCreditSummary(activities = [], creditsIncluded = 0) {
  const creditsUsed = activities.reduce((sum, activity) => sum + Number(activity.creditsUsed || 0), 0);
  return {
    creditsIncluded,
    creditsUsed,
    creditsRemaining: Math.max(creditsIncluded - creditsUsed, 0),
  };
}

export function filterActivitiesByType(activities = [], type) {
  return activities.filter((activity) => activity.type === type);
}

export function formatActivityTitle(activity = {}) {
  if (activity.type === 'alert') return `Alert: ${activity.title}`;
  if (activity.type === 'launch') return `Launched: ${activity.title}`;
  if (activity.type === 'monitor') return `Monitoring: ${activity.title}`;
  return activity.title || 'Activity';
}