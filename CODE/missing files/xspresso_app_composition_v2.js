import { composeXspressoApi } from './xspresso_app_composition_v1.js';
import { createCampaignReviewHandler } from './xspresso_campaign_review_handler_v1.js';

/** Adds human edit/approve routes over the previously composed API. */
export function composeXspressoApiV2({ reviewService, ...options } = {}) {
  const base = composeXspressoApi(options);
  if (!reviewService) return base;
  return createCampaignReviewHandler({ auth: options.auth, reviewService, fallback: base, bodyLimitBytes: options.bodyLimitBytes || 1_000_000 });
}
