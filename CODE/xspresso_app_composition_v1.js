import { createCampaignGenerationHandler } from './xspresso_campaign_generation_handler_v1.js';
import { createOperationsApiHandler } from './xspresso_operations_api_handler_v1.js';
import { createUnsubscribeRoute } from './xspresso_unsubscribe_http_route_v1.js';

/**
 * Composes public unsubscribe, operations, generation, and the existing API.
 * Public unsubscribe is outermost so recipients never need an authenticated session.
 */
export function composeXspressoApi({ baseApi, auth, generation, monitoringWorker, alertRepository, followups, unsubscribeService, tokenService, bodyLimitBytes = 1_000_000 } = {}) {
  if (typeof baseApi !== 'function') throw new TypeError('baseApi must be a request handler.');
  let handler = baseApi;
  if (generation) handler = createCampaignGenerationHandler({ auth, generation, fallback: handler, bodyLimitBytes });
  if (monitoringWorker || alertRepository || followups) {
    handler = createOperationsApiHandler({ auth, monitoringWorker, alertRepository, followups, fallback: handler, bodyLimitBytes });
  }
  if (unsubscribeService || tokenService) {
    handler = createUnsubscribeRoute({ unsubscribeService, tokenService, fallback: handler, bodyLimitBytes: 4096 });
  }
  return handler;
}
