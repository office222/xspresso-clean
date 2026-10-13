const ACTIVITY_KEY = 'xspresso_activity_log_v2';

export function loadActivityLog() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveActivityLog(entries) {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(entries));
  return entries;
}

export function logActivity({ type, title, message = '', creditsUsed = 0, campaignId = null }) {
  const entry = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    title,
    message,
    creditsUsed,
    campaignId,
    createdAt: new Date().toISOString()
  };
  const entries = [entry, ...loadActivityLog()];
  saveActivityLog(entries);
  return entry;
}

export function summarizeCredits(entries = loadActivityLog()) {
  const totalUsed = entries.reduce((sum, e) => sum + (e.creditsUsed || 0), 0);
  return {
    entries: entries.length,
    creditsUsed: totalUsed
  };
}
