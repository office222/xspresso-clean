// xspresso_416_activity_log.js
// Activity and audit trail helpers for Xspresso V1

export function logActivity({
  userId,
  campaignId = null,
  type,
  title,
  message,
  creditsUsed = 0,
  meta = {},
}) {
  return {
    id: `act_${Date.now()}`,
    userId,
    campaignId,
    type,
    title,
    message,
    creditsUsed,
    meta,
    createdAt: new Date().toISOString(),
  };
}

export function buildActivityHistory(activities = []) {
  return activities
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      message: item.message,
      creditsUsed: item.creditsUsed,
      createdAt: item.createdAt,
    }));
}

export function filterActivities(activities = [], type) {
  return activities.filter((activity) => activity.type === type);
}

export function summarizeUsage(activities = [], creditsIncluded = 0) {
  const creditsUsed = activities.reduce((sum, item) => sum + Number(item.creditsUsed || 0), 0);
  return {
    creditsIncluded,
    creditsUsed,
    creditsRemaining: Math.max(creditsIncluded - creditsUsed, 0),
  };
}

export function buildRecentActivityFeed(activities = [], limit = 10) {
  return buildActivityHistory(activities).slice(0, limit);
}

export default {
  logActivity,
  buildActivityHistory,
  filterActivities,
  summarizeUsage,
  buildRecentActivityFeed,
};
