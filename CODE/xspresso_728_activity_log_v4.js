export function logActivity({
  userId = 'anonymous',
  campaignId = null,
  type = 'info',
  title = 'Activity',
  message = '',
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

export function buildUsageSummary(activities = [], creditsIncluded = 0) {
  const creditsUsed = activities.reduce((sum, a) => sum + (a.creditsUsed || 0), 0);
  return {
    creditsIncluded,
    creditsUsed,
    creditsRemaining: Math.max(creditsIncluded - creditsUsed, 0),
  };
}

export function recentActivity(activities = [], limit = 10) {
  return [...activities]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

export function filterActivities(activities = [], type) {
  return activities.filter((item) => item.type === type);
}
