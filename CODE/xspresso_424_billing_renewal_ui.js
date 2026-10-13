/* xspresso_424_billing_renewal_ui.js
   Billing + renewal UI helpers.
*/

export function buildBillingPanel(subscription = {}, plan = {}) {
  const creditsRemaining = (subscription.creditsIncluded || 0) - (subscription.creditsUsed || 0);

  return `
    <section style="background:#fff;border:1px solid #e6e6e6;border-radius:14px;padding:16px;display:grid;gap:10px;">
      <div style="font-size:18px;font-weight:800;color:#111;">Billing & Credits</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;">
        <div><strong>Plan</strong><br>${subscription.plan || 'starter'}</div>
        <div><strong>Included</strong><br>${subscription.creditsIncluded || plan.creditsIncluded || 0}</div>
        <div><strong>Used</strong><br>${subscription.creditsUsed || 0}</div>
        <div><strong>Remaining</strong><br>${creditsRemaining}</div>
      </div>
      <div style="font-size:13px;color:#555;line-height:1.5;">All plans include every tool. Credits simply determine fair usage.</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button style="padding:9px 12px;border-radius:8px;border:1px solid #ddd;background:#fff;cursor:pointer;">Add Credits</button>
        <button style="padding:9px 12px;border-radius:8px;border:1px solid #ddd;background:#fff;cursor:pointer;">Change Plan</button>
        <button style="padding:9px 12px;border-radius:8px;border:0;background:#c65a1e;color:#fff;cursor:pointer;">Renew Now</button>
      </div>
    </section>
  `;
}

export function buildRenewalNotice(subscription = {}) {
  const date = subscription.renewsAt ? new Date(subscription.renewsAt).toLocaleDateString() : 'soon';
  return `
    <div style="padding:12px 14px;border-left:4px solid #c65a1e;background:#fff7f1;border-radius:10px;color:#4a3322;line-height:1.5;">
      Your plan renews on <strong>${date}</strong>. You can review usage before renewal.
    </div>
  `;
}
