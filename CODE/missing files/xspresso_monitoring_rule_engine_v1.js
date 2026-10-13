/** Evaluates supplied ad metrics conservatively; it never pauses or edits ads. */
export function evaluateAdMetrics(metrics, thresholds = {}) {
  const data = normalizeMetrics(metrics);
  const rules = {
    minimumImpressions: nonNegative(thresholds.minimumImpressions, 100),
    minimumClicks: nonNegative(thresholds.minimumClicks, 10),
    cpcWarning: positiveOrNull(thresholds.cpcWarning),
    ctrWarning: positiveOrNull(thresholds.ctrWarning),
    clicksWithoutConversion: nonNegative(thresholds.clicksWithoutConversion, 30)
  };
  if (data.impressions < rules.minimumImpressions) return result('insufficient_data', 'Not enough impressions to assess this ad yet.', null);
  if (data.clicks < rules.minimumClicks) return result('insufficient_data', 'Not enough clicks to assess this ad yet.', null);
  const ctr = data.impressions ? data.clicks / data.impressions * 100 : 0;
  const cpc = data.clicks ? data.spend / data.clicks : null;
  if (data.conversions === 0 && data.clicks >= rules.clicksWithoutConversion) {
    return result('underperforming', 'The ad has clicks but no recorded conversions.', { type: 'no_conversions', recommendation: 'Review the offer, landing page, title, and hook before extending monitoring.' }, { ctr, cpc });
  }
  if (rules.cpcWarning != null && cpc != null && cpc >= rules.cpcWarning) {
    return result('warning', 'Cost per click has reached your warning threshold.', { type: 'high_cpc', recommendation: 'Review the audience, creative, and offer; consider testing a new title or hook.' }, { ctr, cpc });
  }
  if (rules.ctrWarning != null && ctr <= rules.ctrWarning) {
    return result('warning', 'Click-through rate is at or below your warning threshold.', { type: 'low_ctr', recommendation: 'Consider testing a different opening hook or creative.' }, { ctr, cpc });
  }
  return result('healthy', 'No configured warning threshold has been reached.', null, { ctr, cpc });
}

function normalizeMetrics(input) {
  if (!input || typeof input !== 'object') throw new TypeError('metrics must be an object.');
  return {
    impressions: count(input.impressions, 'impressions'), clicks: count(input.clicks, 'clicks'),
    spend: amount(input.spend, 'spend'), conversions: count(input.conversions, 'conversions')
  };
}
function count(value, name) { const n = Number(value ?? 0); if (!Number.isSafeInteger(n) || n < 0) throw new TypeError(`${name} must be a non-negative integer.`); return n; }
function amount(value, name) { const n = Number(value ?? 0); if (!Number.isFinite(n) || n < 0) throw new TypeError(`${name} must be a non-negative number.`); return n; }
function nonNegative(value, fallback) { const n = value == null ? fallback : Number(value); if (!Number.isSafeInteger(n) || n < 0) throw new TypeError('Thresholds must be non-negative integers.'); return n; }
function positiveOrNull(value) { if (value == null || value === '') return null; const n = Number(value); if (!Number.isFinite(n) || n <= 0) throw new TypeError('CPC/CTR thresholds must be positive numbers.'); return n; }
function result(status, message, recommendation, derived = {}) { return { status, message, recommendation, metrics: derived }; }
