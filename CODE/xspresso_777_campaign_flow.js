window.XspressoCampaignFlow = (() => {
  function buildBrief(input) {
    return {
      productName: input.productName || 'Untitled Offer',
      offerDescription: input.offerDescription || 'A product or offer needing a campaign',
      audience: input.audience || 'general audience',
      goal: input.goal || 'sales',
      tone: input.tone || 'simple',
      platform: input.platform || 'general',
      templateType: input.templateType || 'basic'
    };
  }

  function generateDraft(brief) {
    const title = brief.goal === 'leads' ? 'Turn attention into leads.' : 'Done-for-you marketing that gets responses.';
    return {
      headline: title,
      subheadline: 'More responses. Less software chaos.',
      hooks: [
        'Wake up your marketing.',
        'You stay in command. We do the work.',
        'Build faster without starting from scratch.'
      ],
      ads: [
        `Xspresso helps you market ${brief.productName} with less time and less chaos.`,
        `Done-for-you marketing for ${brief.audience}.`
      ],
      landingPage: {
        headline: title,
        body: brief.offerDescription,
        cta: brief.goal === 'leads' ? 'Learn More' : 'Try the Demo'
      },
      followUp: [
        'Thanks for checking this out.',
        'Here is a quick reminder about the offer.',
        'Take another look before you decide.'
      ]
    };
  }

  function reviewSections(draft) {
    return Object.keys(draft).map((key) => ({
      section: key,
      status: 'editable',
      preview: typeof draft[key] === 'string' ? draft[key] : JSON.stringify(draft[key])
    }));
  }

  return { buildBrief, generateDraft, reviewSections };
})();
