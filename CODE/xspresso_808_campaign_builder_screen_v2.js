// Xspresso campaign builder screen v2

export function renderCampaignBuilderScreen() {
  return `
    <section class="page page-builder">
      <header class="page-header">
        <h1>Campaign Builder</h1>
        <p>Turn an offer into a usable draft fast.</p>
      </header>

      <form id="campaignBuilderForm" class="builder-form">
        <label>
          Offer / Product Name
          <input name="productName" type="text" placeholder="e.g. Light Touch Body Cream" />
        </label>

        <label>
          Product URL
          <input name="productUrl" type="url" placeholder="https://..." />
        </label>

        <label>
          Offer Description
          <textarea name="offerDescription" rows="4" placeholder="What are you selling?"></textarea>
        </label>

        <div class="two-col">
          <label>
            Goal
            <select name="goal">
              <option value="sales">Sales</option>
              <option value="leads">Leads</option>
              <option value="clicks">Clicks</option>
              <option value="list">Build List</option>
            </select>
          </label>

          <label>
            Tone
            <select name="tone">
              <option value="simple">Simple</option>
              <option value="friendly">Friendly</option>
              <option value="bold">Bold</option>
              <option value="premium">Premium</option>
            </select>
          </label>
        </div>

        <button type="submit" class="primary">Generate Draft</button>
      </form>
    </section>
  `;
}
