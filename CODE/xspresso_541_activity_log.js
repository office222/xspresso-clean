// Xspresso Activity Log
// Tracks key actions for transparency and support.

const activities = [];

export function logActivity({
  type,
  title,
  message = '',
  campaignId = null,
  creditsUsed = 0,
  meta = {}
} = {}) {
  const entry = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: type || 'info',
    title: title || 'Activity',
    message,
    campaignId,
    creditsUsed,
    meta,
    createdAt: new Date().toISOString(),
  };
  activities.unshift(entry);
  return entry;
}

export function listActivities(limit = 50) {
  return activities.slice(0, limit);
}

export function getActivitySummary() {
  const counts = activities.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    acc.creditsUsed += Number(item.creditsUsed || 0);
    return acc;
  }, { creditsUsed: 0 });

  return counts;
}

export function clearActivities() {
  activities.length = 0;
  return { success: true };
}
