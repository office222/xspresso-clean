// xspresso_756_billing_credits_panel.js
// Billing + credits panel helpers

export function formatPlan(plan) {
  if (!plan) return 'Free';
  return `${plan.name || 'Plan'} — ${plan.creditsIncluded || 0} credits`;
}

export function getCreditSummary(account) {
  const included = account.creditsIncluded || 0;
  const used = account.creditsUsed || 0;
  const remaining = Math.max(included - used, 0);
  return { included, used, remaining };
}

export function renderBillingPanel(account, plan) {
  const summary = getCreditSummary(account);
  return `
    <div class="billing-panel">
      <h2>Billing & Credits</h2>
      <p><strong>Plan:</strong> ${escapeHtml(formatPlan(plan))}</p>
      <p><strong>Credits included:</strong> ${summary.included}</p>
      <p><strong>Credits used:</strong> ${summary.used}</p>
      <p><strong>Credits remaining:</strong> ${summary.remaining}</p>
      <p class="billing-panel__note">All plans include every tool. Credits determine usage.</p>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
