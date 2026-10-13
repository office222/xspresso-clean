window.XspressoData = {
  user: {
    id: 'user_001',
    name: 'Xspresso User',
    plan: 'starter',
    creditsIncluded: 500,
    creditsUsed: 0,
    creditsRemaining: 500
  },
  campaigns: [
    {
      id: 'cmp_001',
      name: 'Light Touch Body Cream',
      platform: 'Facebook',
      status: 'live',
      cpc: 1.42,
      ctr: 0.8,
      conversions: 2,
      monitoredAds: 3,
      alerts: 1,
      monitoringStatus: 'active'
    },
    {
      id: 'cmp_002',
      name: 'Jones Street Pub',
      platform: 'TikTok',
      status: 'needs_attention',
      cpc: 1.91,
      ctr: 0.4,
      conversions: 0,
      monitoredAds: 2,
      alerts: 2,
      monitoringStatus: 'warning'
    }
  ],
  alerts: [
    {
      id: 'alt_001',
      campaignId: 'cmp_002',
      title: 'This ad is underperforming',
      message: 'Improve it before spending more credits monitoring an ad that is not performing.',
      level: 'critical',
      action: 'Regenerate this ad'
    },
    {
      id: 'alt_002',
      campaignId: 'cmp_001',
      title: 'CPC is rising',
      message: 'This campaign may need a tweak before you spend more credits.',
      level: 'warning',
      action: 'Test a new title or hook'
    }
  ],
  library: [],
  templates: [
    { id: 'tpl_001', name: 'Product Launch' },
    { id: 'tpl_002', name: 'Lead Magnet' },
    { id: 'tpl_003', name: 'Follow-Up Sequence' }
  ]
};
