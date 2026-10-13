// xspresso_849_review_panel_view.js
import { reviewState, approve, regenerate, reviewSummary } from './xspresso_841_review_panel.js';

export function renderReviewPanel(campaign = {}) {
  const review = reviewState(campaign);
  return `
    <section class="panel review-panel">
      <h2>Review and Approve</h2>
      <p class="muted">Approve what you like. Tweak what you want. Regenerate what doesn’t fit.</p>
      <div class="review-grid">
        ${Object.entries(review.sections).map(([key, section]) => `
          <article class="review-card" data-section="${key}">
            <header>
              <h3>${escapeLabel(key)}</h3>
              <span class="badge">${section.approved ? 'Approved' : 'Draft'}</span>
            </header>
            <pre>${escapeHtml(JSON.stringify(section.value, null, 2))}</pre>
            <div class="row">
              <button data-approve="${key}">Approve</button>
              <button data-regenerate="${key}">Regenerate</button>
            </div>
          </article>
        `).join('')}
      </div>
      <p class="muted" data-review-summary>${JSON.stringify(reviewSummary(review))}</p>
    </section>
  `;
}

export function wireReviewPanel(root, onChange) {
  const review = reviewState((onChange && onChange.campaign) || {});
  root.querySelectorAll('[data-approve]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.approve;
      const updated = approve(review, section);
      btn.closest('.review-card').querySelector('.badge').textContent = 'Approved';
      if (typeof onChange === 'function') onChange(updated, section, 'approve');
    });
  });
  root.querySelectorAll('[data-regenerate]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.regenerate;
      const updated = regenerate(review, section, `Regenerated ${section}`);
      btn.closest('.review-card').querySelector('.badge').textContent = 'Draft';
      if (typeof onChange === 'function') onChange(updated, section, 'regenerate');
    });
  });
}

function escapeLabel(text) {
  return String(text).replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
