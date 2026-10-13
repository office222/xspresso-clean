// Xspresso billing and credits panel v2

export function renderBillingCreditsPanel(state = {}) {
  const plan = state.plan || 'Starter';
  const included = Number(state.creditsIncluded || 0);
  const used = Number(state.creditsUsed || 0);
  const remaining = Math.max(included - used, 0);
  const renewal = state.renewalDate || '—';

  return `
    <section class="panel billing-panel">
      <h2>Billing & Credits</h2>
      <div class="billing-grid">
        <div><span>Plan</span><strong>${plan}</strong></div>
        <div><span>Credits Included</span><strong>${included}</strong></div>
        <div><span>Credits Used</span><strong>${used}</strong></div>
        <div><span>Credits Remaining</span><strong>${remaining}</strong></div>
        <div><span>Renews</span><strong>${renewal}</strong></div>
      </div>
      <p class="muted">All plans include every tool. Credits simply determine fair usage.</p>
    </section>
  `;
}

export function calcCreditsRemaining(included = 0, used = 0) {
  return Math.max(Number(included) - Number(used), 0);
}
