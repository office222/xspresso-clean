// Xspresso activity log v2
export function logActivity({ id, userId = null, campaignId = null, type = 'info', title = '', message = '', creditsUsed = 0, createdAt = new Date().toISOString() }) {
  return { id, userId, campaignId, type, title, message, creditsUsed, createdAt };
}

export function addActivity(feed, activity) {
  return [activity, ...(feed || [])];
}

export function recentActivity(feed, limit = 10) {
  return [...(feed || [])].slice(0, limit);
}

export function creditSummary(feed, creditsIncluded = 0) {
  const used = (feed || []).reduce((sum, item) => sum + (item.creditsUsed || 0), 0);
  return { creditsIncluded, creditsUsed: used, creditsRemaining: creditsIncluded - used };
}
