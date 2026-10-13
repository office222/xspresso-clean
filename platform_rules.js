// Xspresso V1 - Platform Rules
// Purpose: define supported platforms, upload limits, monitoring rules, and switch behavior.

const supportedPlatforms = {
  facebook: {
    name: 'Facebook',
    formats: ['square', 'vertical', 'landscape'],
    uploadsAllowed: true,
    monitoringAllowed: true,
    defaultRate: 5,
    notes: 'Supports standard image and text campaigns.'
  },
  instagram: {
    name: 'Instagram',
    formats: ['square', 'vertical'],
    uploadsAllowed: true,
    monitoringAllowed: true,
    defaultRate: 5,
    notes: 'Best for image-first and short-form creative.'
  },
  tiktok: {
    name: 'TikTok',
    formats: ['vertical'],
    uploadsAllowed: true,
    monitoringAllowed: true,
    defaultRate: 5,
    notes: 'Best for vertical video and fast hooks.'
  },
  youtube: {
    name: 'YouTube',
    formats: ['landscape', 'vertical'],
    uploadsAllowed: true,
    monitoringAllowed: true,
    defaultRate: 5,
    notes: 'Best for video ads and VSL-style delivery.'
  },
  linkedin: {
    name: 'LinkedIn',
    formats: ['square', 'landscape'],
    uploadsAllowed: true,
    monitoringAllowed: true,
    defaultRate: 5,
    notes: 'Best for B2B offers and professional audiences.'
  }
};

function listSupportedPlatforms() {
  return Object.values(supportedPlatforms).map(platform => ({
    name: platform.name,
    formats: platform.formats,
    uploadsAllowed: platform.uploadsAllowed,
    monitoringAllowed: platform.monitoringAllowed,
    defaultRate: platform.defaultRate,
    notes: platform.notes
  }));
}

function getPlatformRules(platformKey) {
  return supportedPlatforms[platformKey.toLowerCase()] || null;
}

function isPlatformSupported(platformKey) {
  return !!getPlatformRules(platformKey);
}

function validatePlatformSelection(platformKeys = []) {
  const valid = [];
  const invalid = [];

  platformKeys.forEach(key => {
    if (isPlatformSupported(key)) {
      valid.push(key.toLowerCase());
    } else {
      invalid.push(key);
    }
  });

  return {
    valid,
    invalid,
    allValid: invalid.length === 0
  };
}

function getFormatForPlatform(platformKey, requestedFormat = 'square') {
  const rules = getPlatformRules(platformKey);
  if (!rules) return requestedFormat;

  if (rules.formats.includes(requestedFormat)) {
    return requestedFormat;
  }

  return rules.formats[0];
}

function calculateUploadCost(platformKey, count = 1) {
  const rules = getPlatformRules(platformKey);
  const rate = rules ? rules.defaultRate : 5;
  return rate * count;
}

function buildPlatformWarning(platformKey) {
  const rules = getPlatformRules(platformKey);

  if (!rules) {
    return {
      title: 'Unsupported platform',
      message: `Xspresso does not currently support ${platformKey}. Tell Xspresso and we will see what we can do. No promises.`
    };
  }

  return {
    title: `Platform selected: ${rules.name}`,
    message: `Xspresso can upload and monitor on ${rules.name}. Supported formats: ${rules.formats.join(', ')}.`
  };
}

function buildSwitchNotice(platformKey, monitoredAds = 0) {
  const rules = getPlatformRules(platformKey);
  const name = rules ? rules.name : platformKey;

  return {
    title: `Warning: switching off ${name} will stop Xspresso from tracking your ads there.`,
    message: `Choose which ads you want Xspresso to keep tracking, or choose the option that fits your ads best.`,
    monitoredAds,
    options: [
      'Keep running all ads — I will track them myself',
      `Delete all ads from ${name} and move them to my library`,
      `Keep monitoring all ads on ${name} for a usage cost`,
      'I will monitor them myself'
    ]
  };
}

function getPlatformUploadNote(platformKey) {
  const rules = getPlatformRules(platformKey);
  if (!rules) return 'Platform not supported yet.';
  return `Best format for ${rules.name}: ${rules.formats[0]}.`;
}

module.exports = {
  supportedPlatforms,
  listSupportedPlatforms,
  getPlatformRules,
  isPlatformSupported,
  validatePlatformSelection,
  getFormatForPlatform,
  calculateUploadCost,
  buildPlatformWarning,
  buildSwitchNotice,
  getPlatformUploadNote
};
