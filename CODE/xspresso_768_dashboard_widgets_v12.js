export function buildDashboardWidgets(state = {}) {
  const campaigns = state.campaigns || [];
  const alerts = state.alerts || [];
  const credits = state.credits || { used: 0, included: 0 };

  return [
    {
      id: 'active-campaigns',
      title: 'Active Campaigns',
      value: campaigns.filter(c => c.status === 'live').length,
      tone: 'good'
    },
    {
      id: 'needs-attention',
      title: 'Needs Attention',
      value: campaigns.filter(c => c.status === 'needs_attention' || c.status === 'underperforming').length,
      tone: 'warn'
    },
    {
      id: 'alerts',
      title: 'Alerts',
      value: alerts.length,
      tone: alerts.length ? 'warn' : 'good'
    },
    {
      id: 'credits-remaining',
      title: 'Credits Remaining',
      value: Math.max((credits.included || 0) - (credits.used || 0), 0),
      tone: credits.included && credits.used / credits.included > 0.8 ? 'warn' : 'good'
    }
  ];
}
