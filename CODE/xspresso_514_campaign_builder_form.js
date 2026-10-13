export function buildCampaignForm(config = {}) {
  const defaults = {
    productName: '',
    productUrl: '',
    productImage: '',
    offerDescription: '',
    audience: '',
    goal: 'sales',
    tone: 'simple',
    platforms: ['general']
  };

  return {
    ...defaults,
    ...config,
    platforms: Array.isArray(config.platforms) && config.platforms.length ? config.platforms : defaults.platforms,
  };
}

export function getCampaignFormFields() {
  return [
    { name: 'productName', label: 'Product Name', type: 'text' },
    { name: 'productUrl', label: 'Product URL', type: 'url' },
    { name: 'productImage', label: 'Product Image', type: 'file' },
    { name: 'offerDescription', label: 'Offer Description', type: 'textarea' },
    { name: 'audience', label: 'Audience', type: 'text' },
    { name: 'goal', label: 'Goal', type: 'select', options: ['sales', 'leads', 'clicks', 'list-building'] },
    { name: 'tone', label: 'Tone', type: 'select', options: ['simple', 'friendly', 'bold', 'premium', 'direct', 'persuasive'] },
    { name: 'platforms', label: 'Platforms', type: 'multi-select', options: ['Facebook', 'Instagram', 'TikTok', 'YouTube', 'Google', 'General'] }
  ];
}

export function validateCampaignForm(form) {
  const missing = [];
  if (!form.productName) missing.push('productName');
  if (!form.offerDescription) missing.push('offerDescription');
  if (!form.audience) missing.push('audience');

  return {
    valid: missing.length === 0,
    missing
  };
}
