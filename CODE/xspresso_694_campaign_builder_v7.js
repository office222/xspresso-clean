// xspresso_694_campaign_builder_v7.js
// Campaign brief builder for Xspresso

export function buildCampaignBrief(input = {}) {
  const brief = {
    productName: input.productName || 'Untitled Offer',
    productUrl: input.productUrl || '',
    productImage: input.productImage || '',
    offerDescription: input.offerDescription || '',
    audience: input.audience || 'general audience',
    goal: input.goal || 'sales',
    tone: input.tone || 'simple',
    platform: input.platform || 'general',
    templateType: input.templateType || 'basic',
    notes: input.notes || ''
  };

  return applySmartDefaults(brief);
}

export function applySmartDefaults(brief) {
  return {
    ...brief,
    callToAction: brief.goal === 'leads' ? 'Learn More' : 'Buy Now',
    headlineStyle: brief.goal === 'leads' ? 'curiosity' : 'benefit',
    followUpEnabled: true,
    monitoringEnabled: true,
    generatedAt: new Date().toISOString()
  };
}

export function validateBrief(brief) {
  const missing = [];
  if (!brief.productName) missing.push('productName');
  if (!brief.offerDescription) missing.push('offerDescription');
  if (!brief.audience) missing.push('audience');

  return {
    valid: missing.length === 0,
    missing
  };
}

export function buildAiPrompt(brief) {
  return `Create a done-for-you marketing campaign for ${brief.productName || 'an offer'}.

Product URL: ${brief.productUrl || 'N/A'}
Offer Description: ${brief.offerDescription || 'N/A'}
Audience: ${brief.audience || 'N/A'}
Goal: ${brief.goal || 'sales'}
Tone: ${brief.tone || 'simple'}
Platform: ${brief.platform || 'general'}
Template: ${brief.templateType || 'basic'}
Notes: ${brief.notes || ''}

Output:
- headlines
- hooks
- ad copy
- landing page copy
- lead magnet copy
- follow-up emails
- platform-specific version

Keep it original, customer-focused, and easy to edit.`;
}
