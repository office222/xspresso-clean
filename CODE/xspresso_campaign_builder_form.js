// Xspresso Campaign Builder Form — MVP module

// This module provides a core JavaScript component for rendering the campaign builder form in Xspresso

function renderCampaignBuilderForm(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = `
    <form id="campaign-builder-form" class="xspresso-form">
      <h2>Start a New Campaign</h2>
      <label>Product Name:<br>
        <input type="text" name="productName" required></label><br>
      <label>Product Photo URL:<br>
        <input type="text" name="productPhoto"></label><br>
      <label>Offer Description:<br>
        <textarea name="offerDescription" rows="3" required></textarea></label><br>
      <label>Audience:<br>
        <input type="text" name="audience"></label><br>
      <label>Goal:<br>
        <select name="goal">
          <option value="sales">Sales</option>
          <option value="leads">Leads</option>
          <option value="clicks">Clicks</option>
          <option value="list">Build List</option>
          <option value="followup">Follow Up</option>
        </select></label><br>
      <label>Tone:<br>
        <select name="tone">
          <option value="simple">Simple</option>
          <option value="friendly">Friendly</option>
          <option value="bold">Bold</option>
          <option value="premium">Premium</option>
          <option value="direct">Direct</option>
          <option value="persuasive">Persuasive</option>
        </select></label><br>
      <label>Platform(s):<br>
        <select name="platforms" multiple size="3">
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube">YouTube</option>
          <option value="google">Google</option>
        </select></label><br>
      <button type="submit">Generate Draft</button>
    </form>
    <div id="campaign-builder-result"></div>
  `;
  
  const form = document.getElementById('campaign-builder-form');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const data = new FormData(form);
      const resultDiv = document.getElementById('campaign-builder-result');
      resultDiv.innerHTML = '<div class="xspresso-loader">Generating campaign draft…</div>';
      // Simulate draft generation with a minimal delay
      setTimeout(() => {
        resultDiv.innerHTML =
          '<div class="xspresso-success">Draft created for "' + (data.get('productName')||'Your Product') + '".<br>Please continue to the review screen.</div>';
      }, 1200);
    });
  }
}

// To actually use this:
//   1. Add a div with an ID (e.g. "campaign-builder-container") to your HTML
//   2. Call renderCampaignBuilderForm('campaign-builder-container')

// Exports
window.renderCampaignBuilderForm = renderCampaignBuilderForm;
