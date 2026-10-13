// Xspresso activity stream v2
// Keeps track of important actions in the app.

export function logActivity({ userId = "", campaignId = "", type = "info", title = "", message = "", creditsUsed = 0 } = {}) {
  return {
    id: `act_${Date.now()}`,
    userId,
    campaignId,
    type,
    title,
    message,
    creditsUsed,
    createdAt: new Date().toISOString()
  };
}

export function buildRecentActivityFeed(activities = [], limit = 10) {
  return activities
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
    .map(item => ({
      id: item.id,
      type: item.type,
      title: item.title,
      message: item.message,
      createdAt: item.createdAt
    }));
}
