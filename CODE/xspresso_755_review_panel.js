// xspresso_755_review_panel.js
// Review / approve / regenerate panel for Xspresso

export function renderReviewPanel(campaign, onAction) {
  const sections = [
    { key: 'headline', label: 'Headline', value: campaign.headline || '' },
    { key: 'subheadline', label: 'Subheadline', value: campaign.subheadline || '' },
    { key: 'hooks', label: 'Hooks', value: (campaign.hooks || []).join('\n') },
    { key: 'ads', label: 'Ad Copy', value: (campaign.ads || []).join('\n') },
    { key: 'landingPage', label: 'Landing Page', value: campaign.landingPage?.body || '' },
    { key: 'followUpEmails', label: 'Follow-Up', value: (campaign.followUpEmails || []).map(m => m.subject || '').join('\n') }
  ];

  return `
    <div class="review-panel">
      ${sections.map(section => `
        <section class="review-section" data-section="${section.key}">
          <header class="review-section__header">
            <h3>${section.label}</h3>
          </header>
          <pre class="review-section__content">${escapeHtml(section.value)}</pre>
          <div class="review-section__actions">
            <button data-action="approve" data-section="${section.key}">Approve</button>
            <button data-action="edit" data-section="${section.key}">Edit</button>
            <button data-action="regenerate" data-section="${section.key}">Regenerate</button>
          </div>
        </section>
      `).join('')}
    </div>
  `;
}

export function handleReviewAction({ action, sectionKey, campaign }) {
  if (typeof onAction === 'function') onAction(action, sectionKey, campaign);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
