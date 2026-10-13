// xspresso_billing_credits_panel.js
// Logic for billing/credits summary panel in Xspresso

export function renderBillingCreditsPanel({ creditsTotal, creditsUsed, planName, renewalDate }) {
    const creditsRemaining = creditsTotal - creditsUsed;
    return `
    <div class="xspresso-billing-credits-panel">
      <h3>Plan: ${planName}</h3>
      <div class="credits-status">
        <strong>Credits Remaining:</strong> ${creditsRemaining} / ${creditsTotal}
      </div>
      <div class="credits-bar">
        <div class="credits-bar-fill" style="width: ${(creditsRemaining/creditsTotal)*100}%"></div>
      </div>
      <div class="renewal-date">
        <strong>Next renewal:</strong> ${renewalDate ? renewalDate : 'N/A'}
      </div>
      <div class="usage-help">
        <span style="color:#888">No feature limits. All plans include every tool. Credits determine fair usage.</span>
        <br />
        Need more? <a href="#" class="add-credits-link">Add credits</a> anytime.
      </div>
    </div>
    <style>
      .xspresso-billing-credits-panel { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 0 6px #eee; margin: 15px 0; }
      .credits-bar { background: #eee; height: 10px; border-radius: 5px; margin: 8px 0; position: relative; }
      .credits-bar-fill { background: #53b247; height: 10px; border-radius: 5px 0 0 5px; transition: width 0.5s; }
      .add-credits-link { color: #e8892b; text-decoration: underline; }
    </style>
    `;
}
