// xspresso_848_campaign_builder_view.js
import { buildCampaignFromBrief } from './xspresso_838_campaign_api.js';

export function renderCampaignBuilderView(campaign = {}) {
  return `
    <section class="panel campaign-builder">
      <h2>Campaign Builder</h2>
      <p class="muted">Tell Xspresso what you’re selling. The more you tell Xspresso, the better it can help.</p>
      <div class="builder-grid">
        <label>
          Product name
          <input id="productName" value="${escapeHtml(campaign.productName || '')}" />
        </label>
        <label>
          Audience
          <input id="audience" value="${escapeHtml(campaign.audience || '')}" />
        </label>
        <label>
          Goal
          <select id="goal">
            <option value="sales">Sales</option>
            <option value="leads">Leads</option>
            <option value="clicks">Clicks</option>
          </select>
        </label>
        <label>
          Tone
          <select id="tone">
            <option value="simple">Simple</option>
            <option value="friendly">Friendly</option>
            <option value="bold">Bold</option>
            <option value="premium">Premium</option>
          </select>
        </label>
      </div>
      <label>
        Offer description
        <textarea id="description" rows="5">${escapeHtml(campaign.landingPage?.body || '')}</textarea>
      </label>
      <button class="primary" data-build-campaign>Generate Draft</button>
      <pre class="codebox" data-campaign-output></pre>
    </section>
  `;
}

export function wireCampaignBuilder(root, onBuild) {
  const button = root.querySelector('[data-build-campaign]');
  const output = root.querySelector('[data-campaign-output]');
  if (!button || !output) return;
  button.addEventListener('click', () => {
    const brief = {
      name: 'Draft Campaign',
      productName: root.querySelector('#productName').value,
      audience: root.querySelector('#audience').value,
      goal: root.querySelector('#goal').value,
      tone: root.querySelector('#tone').value,
      landingPage: { headline: 'Done-for-you marketing that gets responses.', body: root.querySelector('#description').value }
    };
    const campaign = buildCampaignFromBrief(brief);
    output.textContent = JSON.stringify(campaign, null, 2);
    if (typeof onBuild === 'function') onBuild(campaign);
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
