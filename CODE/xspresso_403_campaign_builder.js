window.XspressoCampaignBuilder = (() => {
  const defaults = {
    productName: 'Untitled Offer',
    offerDescription: 'A product or service that needs a campaign',
    goal: 'sales',
    tone: 'simple',
    platform: 'general',
    audience: 'general audience'
  };

  function buildBrief(formData = {}) {
    return {
      productName: formData.productName || defaults.productName,
      offerDescription: formData.offerDescription || defaults.offerDescription,
      goal: formData.goal || defaults.goal,
      tone: formData.tone || defaults.tone,
      platform: formData.platform || defaults.platform,
      audience: formData.audience || defaults.audience
    };
  }

  function generateDraft(brief) {
    const headline = brief.goal === 'leads'
      ? 'Turn attention into leads.'
      : 'Done-for-you marketing that gets responses.';

    const subheadline = brief.goal === 'sales'
      ? 'More responses. Less software chaos.'
      : 'Capture leads and keep the conversation going.';

    const hooks = [
      'Turn one offer into a full campaign.',
      'Let Xspresso do the heavy lifting.',
      'You stay in command while the work gets done.'
    ];

    const ads = [
      `${brief.productName} helps you move faster with a done-for-you campaign.`,
      `Xspresso builds your marketing around ${brief.audience}.`
    ];

    const landingPage = {
      headline,
      subheadline,
      body: `Built for ${brief.audience}. Xspresso turns your offer into ads, pages, and follow-up faster.`
    };

    const followUp = [
      'Thanks for checking this out.',
      'Here is a quick reminder about the offer.',
      'You may want to take another look before it is gone.'
    ];

    return {
      brief,
      headline,
      subheadline,
      hooks,
      ads,
      landingPage,
      followUp,
      platformVersions: {
        [brief.platform]: {
          platform: brief.platform,
          format: brief.platform === 'tiktok' ? 'vertical' : 'square',
          copy: ads[0]
        }
      }
    };
  }

  function summarizeDraft(draft) {
    return {
      title: draft.headline,
      subtitle: draft.subheadline,
      hookCount: draft.hooks.length,
      adCount: draft.ads.length,
      followUpCount: draft.followUp.length,
      platformCount: Object.keys(draft.platformVersions || {}).length
    };
  }

  return {
    buildBrief,
    generateDraft,
    summarizeDraft
  };
})();
