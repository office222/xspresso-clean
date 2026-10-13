// xspresso_482_template_renderer.js
// Template and preset rendering for Xspresso

export const presetTypes = ['launch', 'lead-magnet', 'follow-up', 'ad-campaign', 'landing-page', 'sales-funnel'];

export function buildPreset(type) {
  const presets = {
    launch: {
      name: 'Launch Campaign',
      headline: 'Done-for-you marketing that gets responses.',
      subheadline: 'More responses. Less software chaos.',
    },
    'lead-magnet': {
      name: 'Lead Magnet Campaign',
      headline: 'Turn attention into leads.',
      subheadline: 'Capture leads and follow up automatically.',
    },
    'follow-up': {
      name: 'Follow-Up Sequence',
      headline: 'Keep the conversation going.',
      subheadline: 'Follow up without starting from scratch.',
    },
    'ad-campaign': {
      name: 'Ad Campaign',
      headline: 'Ads that get noticed.',
      subheadline: 'Generate more angles, hooks, and headlines.',
    },
    'landing-page': {
      name: 'Landing Page',
      headline: 'Built for response.',
      subheadline: 'Simple, clear, and ready to launch.',
    },
    'sales-funnel': {
      name: 'Sales Funnel',
      headline: 'Guide the next step.',
      subheadline: 'From attention to action.',
    },
  };

  return presets[type] || {
    name: 'Basic Template',
    headline: 'Wake up your marketing.',
    subheadline: 'You stay in command. We do the work.',
  };
}

export function saveAsTemplate(campaign, templateName) {
  return {
    templateId: `tpl_${Date.now()}`,
    name: templateName || `${campaign?.name || 'Untitled'} Template`,
    category: campaign?.category || 'general',
    createdAt: new Date().toISOString(),
    data: { ...campaign, id: undefined },
  };
}

export function createFromTemplate(template, overrides = {}) {
  return {
    ...template.data,
    ...overrides,
    id: `cmp_${Date.now()}`,
    name: overrides.name || template.name.replace(/\sTemplate$/, ''),
    status: 'draft',
  };
}
