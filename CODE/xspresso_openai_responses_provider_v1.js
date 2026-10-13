const ENDPOINT = 'https://api.openai.com/v1/responses';

const CAMPAIGN_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    subheadline: { type: 'string' },
    hooks: { type: 'array', items: { type: 'string' } },
    ads: {
      type: 'array', items: {
        type: 'object',
        properties: {
          headline: { type: 'string' },
          primaryText: { type: 'string' },
          callToAction: { type: 'string' }
        },
        required: ['headline', 'primaryText', 'callToAction'],
        additionalProperties: false
      }
    },
    landingPage: {
      type: 'object',
      properties: {
        headline: { type: 'string' },
        body: { type: 'string' },
        callToAction: { type: 'string' }
      },
      required: ['headline', 'body', 'callToAction'],
      additionalProperties: false
    },
    followUpEmails: {
      type: 'array', items: {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          body: { type: 'string' },
          delayDays: { type: 'integer' }
        },
        required: ['subject', 'body', 'delayDays'],
        additionalProperties: false
      }
    }
  },
  required: ['headline', 'subheadline', 'hooks', 'ads', 'landingPage', 'followUpEmails'],
  additionalProperties: false
};

/**
 * Calls the OpenAI Responses API without exposing the API key to the browser.
 * The model name is intentionally configured by the operator, not hard-coded.
 */
export class OpenAIResponsesProvider {
  constructor({ apiKey, model, fetchImpl = globalThis.fetch, timeoutMs = 60_000, maxResponseBytes = 2_000_000 } = {}) {
    if (typeof apiKey !== 'string' || !apiKey.trim()) throw new TypeError('OpenAI API key is required.');
    if (typeof model !== 'string' || !model.trim()) throw new TypeError('OpenAI model is required.');
    if (typeof fetchImpl !== 'function') throw new TypeError('A fetch implementation is required.');
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 180_000) throw new TypeError('timeoutMs must be between 1000 and 180000.');
    this.apiKey = apiKey.trim();
    this.model = model.trim();
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.maxResponseBytes = maxResponseBytes;
  }

  async generate({ messages } = {}) {
    if (!Array.isArray(messages) || !messages.length || messages.some(message => !message || typeof message.role !== 'string' || typeof message.content !== 'string')) {
      throw providerFault('INVALID_PROVIDER_INPUT', 'Campaign messages are invalid.', 400);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      let response;
      try {
        response = await this.fetchImpl(ENDPOINT, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${this.apiKey}`,
            'content-type': 'application/json',
            accept: 'application/json'
          },
          body: JSON.stringify({
            model: this.model,
            input: messages,
            store: false,
            max_output_tokens: 3000,
            text: {
              format: {
                type: 'json_schema',
                name: 'xspresso_campaign_draft',
                strict: true,
                schema: CAMPAIGN_SCHEMA
              }
            }
          }),
          signal: controller.signal
        });
      } catch (error) {
        if (controller.signal.aborted || error?.name === 'AbortError') {
          throw providerFault('AI_PROVIDER_TIMEOUT', 'AI provider timed out. Please try again.', 504);
        }
        throw providerFault('AI_PROVIDER_UNAVAILABLE', 'AI provider could not be reached.', 503);
      }

      const raw = await response.text();
      if (Buffer.byteLength(raw, 'utf8') > this.maxResponseBytes) {
        throw providerFault('AI_RESPONSE_TOO_LARGE', 'AI provider response exceeded the allowed size.', 502);
      }
      let payload;
      try { payload = raw ? JSON.parse(raw) : {}; }
      catch { throw providerFault('AI_PROVIDER_BAD_RESPONSE', 'AI provider returned an unreadable response.', 502); }

      if (!response.ok) {
        if (response.status === 429) throw providerFault('AI_PROVIDER_RATE_LIMITED', 'AI provider is temporarily rate-limited. Try again shortly.', 503);
        if (response.status >= 500) throw providerFault('AI_PROVIDER_UNAVAILABLE', 'AI provider is temporarily unavailable.', 503);
        throw providerFault('AI_PROVIDER_REQUEST_REJECTED', 'AI provider rejected the generation request. Check model configuration.', 502);
      }
      if (payload.status === 'incomplete') throw providerFault('AI_OUTPUT_INCOMPLETE', 'AI provider returned an incomplete draft. Try again.', 502);
      if (payload.status !== 'completed') throw providerFault('AI_OUTPUT_NOT_COMPLETE', 'AI provider did not complete the draft.', 502);

      const text = extractOutputText(payload);
      if (!text) throw providerFault('AI_OUTPUT_EMPTY', 'AI provider returned no draft text.', 502);
      let result;
      try { result = JSON.parse(text); }
      catch { throw providerFault('AI_OUTPUT_INVALID_JSON', 'AI provider returned invalid structured output.', 502); }
      return result;
    } finally {
      clearTimeout(timer);
    }
  }
}

export function createOpenAIProviderFromEnv(env = process.env, options = {}) {
  const apiKey = String(env.OPENAI_API_KEY || '').trim();
  const model = String(env.OPENAI_MODEL || '').trim();
  if (!apiKey && !model) return null;
  if (!apiKey || !model) throw new Error('Set both OPENAI_API_KEY and OPENAI_MODEL, or leave both unset.');
  const timeoutMs = parseInteger(env.XSPRESSO_OPENAI_TIMEOUT_MS, 60_000, 1_000, 180_000);
  return new OpenAIResponsesProvider({ apiKey, model, timeoutMs, ...options });
}

function extractOutputText(response) {
  for (const item of response.output || []) {
    if (item?.type !== 'message') continue;
    for (const part of item.content || []) {
      if (part?.type === 'refusal' || part?.refusal) {
        throw providerFault('AI_OUTPUT_REFUSED', 'The AI provider could not generate this draft. Review the campaign brief and try again.', 422);
      }
      if (part?.type === 'output_text' && typeof part.text === 'string') return part.text;
    }
  }
  return '';
}
function parseInteger(value, fallback, min, max) {
  if (value === undefined || value === '') return fallback;
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < min || result > max) throw new Error(`XSPRESSO_OPENAI_TIMEOUT_MS must be an integer from ${min} to ${max}.`);
  return result;
}
function providerFault(code, message, status) { return Object.assign(new Error(message), { code, status }); }
