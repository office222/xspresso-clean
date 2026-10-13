/** Strictly validate and normalize model output before it is stored or shown. */
const LIMITS = Object.freeze({ headline: 180, subheadline: 300, hook: 220, adHeadline: 180, primaryText: 1200, cta: 80, landingBody: 5000, emailSubject: 180, emailBody: 3000 });

export function validateGeneratedCampaign(input) {
  const value = typeof input === 'string' ? parseJson(input) : input;
  if (!isRecord(value)) throw invalid('Generation output must be a JSON object.');
  const result = {
    headline: requiredText(value.headline, LIMITS.headline, 'headline'),
    subheadline: optionalText(value.subheadline, LIMITS.subheadline),
    hooks: textArray(value.hooks, 5, LIMITS.hook, 'hooks'),
    ads: validateAds(value.ads),
    landingPage: validateLandingPage(value.landingPage),
    followUpEmails: validateEmails(value.followUpEmails)
  };
  if (!result.ads.length) throw invalid('At least one ad draft is required.');
  return result;
}

function validateAds(value) {
  if (!Array.isArray(value) || value.length > 3) throw invalid('ads must contain one to three items.');
  return value.map((ad, index) => {
    if (!isRecord(ad)) throw invalid(`ads[${index}] must be an object.`);
    return {
      headline: requiredText(ad.headline, LIMITS.adHeadline, `ads[${index}].headline`),
      primaryText: requiredText(ad.primaryText, LIMITS.primaryText, `ads[${index}].primaryText`),
      callToAction: optionalText(ad.callToAction, LIMITS.cta)
    };
  });
}
function validateLandingPage(value) {
  if (!isRecord(value)) throw invalid('landingPage must be an object.');
  return {
    headline: requiredText(value.headline, LIMITS.headline, 'landingPage.headline'),
    body: requiredText(value.body, LIMITS.landingBody, 'landingPage.body'),
    callToAction: optionalText(value.callToAction, LIMITS.cta)
  };
}
function validateEmails(value) {
  if (!Array.isArray(value) || value.length > 4) throw invalid('followUpEmails must contain zero to four items.');
  return value.map((email, index) => {
    if (!isRecord(email)) throw invalid(`followUpEmails[${index}] must be an object.`);
    const delayDays = Number(email.delayDays);
    if (!Number.isInteger(delayDays) || delayDays < 0 || delayDays > 365) throw invalid(`followUpEmails[${index}].delayDays must be an integer from 0 to 365.`);
    return {
      subject: requiredText(email.subject, LIMITS.emailSubject, `followUpEmails[${index}].subject`),
      body: requiredText(email.body, LIMITS.emailBody, `followUpEmails[${index}].body`),
      delayDays
    };
  });
}
function textArray(value, maxCount, maxLength, field) {
  if (!Array.isArray(value) || value.length > maxCount) throw invalid(`${field} must be an array of at most ${maxCount} strings.`);
  return value.map((item, index) => requiredText(item, maxLength, `${field}[${index}]`));
}
function requiredText(value, max, field) {
  const result = clean(value, max);
  if (!result) throw invalid(`${field} is required.`);
  return result;
}
function optionalText(value, max) { return clean(value, max); }
function clean(value, max) {
  if (value == null) return '';
  if (typeof value !== 'string') throw invalid('Generated text fields must be strings.');
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}
function parseJson(value) { try { return JSON.parse(value); } catch { throw invalid('Generation provider returned invalid JSON.'); } }
function isRecord(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function invalid(message) { return Object.assign(new Error(message), { code: 'INVALID_GENERATION_OUTPUT', status: 502 }); }
