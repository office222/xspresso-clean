export function buildCampaignBrief(input = {}) {
  return {
    productName: input.productName || 'Untitled Offer',
    productUrl: input.productUrl || '',
    productImage: input.productImage || '',
    description: input.description || 'A product or offer needing a campaign',
    audience: input.audience || 'general audience',
    goal: input.goal || 'sales',
    tone: input.tone || 'simple',
    platform: input.platform || 'general',
    templateType: input.templateType || 'basic',
    notes: input.notes || '',
    status: 'brief'
  };
}

export function applySmartDefaults(brief) {
  return {
    ...brief,
    headlineStyle: brief.goal === 'leads' ? 'curiosity' : 'benefit',
    callToAction: brief.goal === 'sales' ? 'Buy Now' : 'Learn More',
    followUpEnabled: true,
    monitoringEnabled: true
  };
}

export function buildAiPrompt(brief) {
  return `
Create a done-for-you marketing campaign for the following offer:

Product Name: ${brief.productName}
Product URL: ${brief.productUrl}
Product Image: ${brief.productImage}
Description: ${brief.description}
Audience: ${brief.audience}
Goal: ${brief.goal}
Tone: ${brief.tone}
Platform: ${brief.platform}
Template Type: ${brief.templateType}
Notes: ${brief.notes}

Output:
- headlines
- hooks
- ad copy
- landing page copy
- shopping cart copy
- lead magnet copy
- follow-up emails
- platform-specific versions

Keep it original, customer-focused, and aligned with the user's goal.
`;
}

export function validateBrief(brief) {
  const missing = [];
  if (!brief.productName) missing.push('productName');
  if (!brief.description) missing.push('description');
  if (!brief.audience) missing.push('audience');
  return { valid: missing.length === 0, missing };
}

export function createFallbackBrief() {
  return buildCampaignBrief({
    productName: 'Untitled Offer',
    description: 'A product or offer needing a campaign',
    audience: 'general audience'
  });
}
