export function renderReviewPanel(campaign) {
  const sections = [
    ['Headline', campaign.headline || ''],
    ['Subheadline', campaign.subheadline || ''],
    ['Hook', campaign.hook || ''],
    ['Ad Copy', campaign.adCopy || ''],
    ['Landing Page', campaign.landingPage || ''],
    ['Follow-up', (campaign.followUpEmails || []).join('\n')],
  ];

  return `
    <section class="review-panel">
      <h2>Review and Approve</h2>
      <div class="review-actions">
        <button data-action="regenerate-all">Regenerate All</button>
        <button data-action="save-draft">Save Draft</button>
        <button data-action="launch-now">Launch Now</button>
      </div>
      <div class="review-sections">
        ${sections.map(([title, body]) => `
          <article class="review-section">
            <header>
              <h3>${title}</h3>
              <div class="review-section-actions">
                <button data-action="approve">Approve</button>
                <button data-action="edit">Edit</button>
                <button data-action="regenerate">Regenerate</button>
              </div>
            </header>
            <pre>${escapeHtml(String(body))}</pre>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function escapeHtml(input) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
