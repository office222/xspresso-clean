/**
 * Xspresso multi-platform ad preview model.
 *
 * Produces illustrative, platform-shaped previews from one campaign draft.
 * It does not publish, call ad networks, or claim that a connected account
 * is authorized to publish. Platform status must be supplied by the caller.
 */

const PLATFORM_PROFILES = Object.freeze({
  facebook: {
    id: "facebook",
    name: "Facebook",
    placement: "Feed ad",
    layout: "social-feed",
    format: "Image or video with primary text, headline and call to action",
    notes: "Illustrative feed preview. Confirm current Meta placement specifications before launch."
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    placement: "Feed / Stories / Reels concept",
    layout: "visual-first",
    format: "Visual creative with concise supporting copy and call to action",
    notes: "Illustrative Instagram preview. Feed, Stories and Reels have different creative requirements."
  },
  google: {
    id: "google",
    name: "Google Ads",
    placement: "Responsive search ad",
    layout: "search-results",
    format: "Multiple headlines, descriptions and a destination URL",
    notes: "Text-only search preview. Asset limits and combinations must be checked in Google Ads."
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    placement: "In-feed video ad",
    layout: "vertical-video",
    format: "Vertical video concept with caption text and call to action",
    notes: "Illustrative in-feed preview. Confirm current TikTok ad specifications before launch."
  }
});

const LIMITS = Object.freeze({
  facebook: { primaryText: 500, headline: 40, description: 100 },
  instagram: { primaryText: 2200, headline: 40, description: 100 },
  google: { headline: 30, description: 90 },
  tiktok: { primaryText: 100 }
});

function firstText(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function normalizeCampaignDraft(draft = {}) {
  const firstAd = Array.isArray(draft.ads) ? (draft.ads[0] || {}) : {};
  const media = draft.media || draft.creative || {};
  const headline = firstText(draft.headline, draft.title, firstAd.headline);
  const primaryText = firstText(
    draft.primaryText, draft.primary_text, draft.adCopy, draft.copy,
    firstAd.primaryText, firstAd.adCopy, firstAd.text
  );
  const description = firstText(draft.description, draft.linkDescription, firstAd.description);
  const destinationUrl = firstText(draft.destinationUrl, draft.landingPageUrl, draft.url, firstAd.destinationUrl);
  const imageUrl = firstText(draft.imageUrl, media.imageUrl, media.image, firstAd.imageUrl);
  const videoUrl = firstText(draft.videoUrl, media.videoUrl, media.video, firstAd.videoUrl);
  const callToAction = firstText(draft.callToAction, draft.cta, firstAd.callToAction, "Learn more");
  const brand = firstText(draft.brand, draft.businessName, draft.productName, "Your business");
  const headlines = Array.isArray(draft.headlines)
    ? draft.headlines.filter(value => typeof value === "string" && value.trim()).map(value => value.trim())
    : [];
  const descriptions = Array.isArray(draft.descriptions)
    ? draft.descriptions.filter(value => typeof value === "string" && value.trim()).map(value => value.trim())
    : [];
  return { brand, headline, primaryText, description, destinationUrl, imageUrl, videoUrl, callToAction, headlines, descriptions };
}

function makeWarnings(platformId, content) {
  const limits = LIMITS[platformId] || {};
  const warnings = [];
  for (const [field, max] of Object.entries(limits)) {
    const value = field === "headline" && platformId === "google"
      ? (content.headlines[0] || content.headline)
      : field === "description" && platformId === "google"
        ? (content.descriptions[0] || content.description)
        : content[field];
    if (value && value.length > max) {
      warnings.push({
        code: "TEXT_OVER_LIMIT",
        field,
        limit: max,
        actual: value.length,
        message: `${field} is ${value.length} characters; this preview guideline is ${max}.`
      });
    }
  }
  if (!content.imageUrl && !content.videoUrl && platformId !== "google") {
    warnings.push({ code: "MEDIA_MISSING", field: "media", message: "Add an image or video to complete this visual preview." });
  }
  if (!content.destinationUrl) {
    warnings.push({ code: "DESTINATION_MISSING", field: "destinationUrl", message: "Add a destination URL before launch." });
  }
  return warnings;
}

/**
 * @param {object} draft Campaign draft or generated ad content.
 * @param {object} options Optional { platforms, connections }.
 * connections is a map such as { facebook: { connected: true } }.
 */
export function buildPlatformAdPreviews(draft, options = {}) {
  const requested = Array.isArray(options.platforms) && options.platforms.length
    ? options.platforms
    : Object.keys(PLATFORM_PROFILES);
  const content = normalizeCampaignDraft(draft);
  return requested
    .filter(id => Object.hasOwn(PLATFORM_PROFILES, id))
    .map(id => {
      const profile = PLATFORM_PROFILES[id];
      const connection = options.connections?.[id] || {};
      const connected = connection.connected === true;
      const warnings = makeWarnings(id, content);
      const headlines = content.headlines.length ? content.headlines : (content.headline ? [content.headline] : []);
      const descriptions = content.descriptions.length ? content.descriptions : (content.description ? [content.description] : []);
      return {
        id,
        platform: profile.name,
        placement: profile.placement,
        layout: profile.layout,
        format: profile.format,
        notes: profile.notes,
        connection: {
          status: connected ? "connected" : "not_connected",
          accountLabel: typeof connection.accountLabel === "string" ? connection.accountLabel : null
        },
        publishAvailable: false,
        content: {
          ...content,
          headlines: id === "google" ? headlines.slice(0, 15) : headlines,
          descriptions: id === "google" ? descriptions.slice(0, 4) : descriptions
        },
        warnings,
        readiness: warnings.length ? "needs_attention" : "preview_ready"
      };
    });
}

export function getSupportedAdPreviewPlatforms() {
  return Object.values(PLATFORM_PROFILES).map(({ id, name, placement, layout, format, notes }) => ({
    id, name, placement, layout, format, notes
  }));
}
