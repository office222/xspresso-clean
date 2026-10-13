// xspresso_review_panel.js
// Campaign Review/Approve/Regenerate Panel for Xspresso

/*
This module renders the review workflow for generated campaigns:
- Shows generated headlines, hooks, ad copy, landing page, CTAs, follow-up, etc.
- Allows user to edit each block, approve, or request regeneration
- Integrates with app state to save approvals and trigger regeneration events
*/

export function renderReviewPanel({ campaign, onApprove, onEdit, onRegenerate }) {
  if (!campaign) return `<div class="review-panel">No campaign loaded.</div>`;

  // Helper to render blocks
  function sectionBlock(label, content, section) {
    return `
      <div class="review-section">
        <div class="review-label">${label}</div>
        <div class="review-content">${content}</div>
        <div class="review-actions">
          <button onclick="${onApprove}('${section}')">Approve</button>
          <button onclick="${onEdit}('${section}')">Edit</button>
          <button onclick="${onRegenerate}('${section}')">Regenerate</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="review-panel">
      <h2>Review & Approve Your Campaign</h2>
      ${sectionBlock('Headline', campaign.headline, 'headline')}
      ${sectionBlock('Hook', campaign.hook, 'hook')}
      ${sectionBlock('Ad Copy', campaign.adCopy, 'adCopy')}
      ${sectionBlock('Landing Page', campaign.landingPage, 'landingPage')}
      ${sectionBlock('Call To Action', campaign.cta, 'cta')}
      ${sectionBlock('Follow-up Email', campaign.followUp, 'followUp')}
      <div class="review-summary">
        <button class="launch-btn" onclick="launchCampaign()">Launch Campaign</button>
        <span style="margin-left:16px;">Edit or regenerate any section before launch.</span>
      </div>
    </div>
  `;
}
