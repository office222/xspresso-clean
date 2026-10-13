const appState = {
  route: "dashboard",
  campaigns: [
    { id: 1, name: "Jones Street Pub", cpc: 1.42, ctr: 0.8, conversions: 2, status: "live" },
    { id: 2, name: "Light Touch Body Cream", cpc: 2.11, ctr: 0.4, conversions: 0, status: "warning" }
  ],
  credits: 1420,
  monitoredAds: 5,
  alerts: [],
  leadCount: 27
};

function money(n) {
  return `$${Number(n).toFixed(2)}`;
}

function badgeForStatus(status) {
  if (status === "live") return "success";
  if (status === "warning") return "warning";
  return "danger";
}

function renderDashboard() {
  const dashboard = document.getElementById("dashboard");
  dashboard.innerHTML = `
    <div class="panel kpi"><span class="label">Credits remaining</span><div class="value">${appState.credits}</div></div>
    <div class="panel kpi"><span class="label">Monitored ads</span><div class="value">${appState.monitoredAds}</div></div>
    <div class="panel kpi"><span class="label">Leads captured</span><div class="value">${appState.leadCount}</div></div>
  `;

  document.getElementById("builder").innerHTML = `
    <h2>Campaign Builder</h2>
    <p class="small">Tell Xspresso what you’re selling and it will build the first draft.</p>
    <form id="builder-form" class="form-grid">
      <input name="productName" placeholder="Product name" />
      <input name="audience" placeholder="Audience" />
      <input name="goal" placeholder="Goal (sales, leads, clicks)" />
      <input name="tone" placeholder="Tone (simple, bold, premium)" />
      <textarea name="description" placeholder="Short offer description"></textarea>
      <button class="btn btn-primary" type="submit">Generate Draft</button>
    </form>
    <div id="builder-output"></div>
  `;

  document.getElementById("monitoring").innerHTML = `
    <h2>Monitoring</h2>
    <div class="list">
      ${appState.campaigns.map(c => `
        <div class="list-item">
          <div>
            <strong>${c.name}</strong><br />
            <span class="small">CPC: ${money(c.cpc)} • CTR: ${c.ctr}% • Conversions: ${c.conversions}</span>
          </div>
          <span class="badge ${badgeForStatus(c.status)}">${c.status}</span>
        </div>
      `).join("")}
    </div>
  `;

  document.getElementById("pricing").innerHTML = `
    <h2>Pricing</h2>
    <p class="small">All plans include every tool. Credits determine usage.</p>
    <div class="list">
      <div class="list-item"><strong>Starter</strong><span>$29</span></div>
      <div class="list-item"><strong>Pro</strong><span>$49</span></div>
      <div class="list-item"><strong>Business</strong><span>$99</span></div>
      <div class="list-item"><strong>Agency</strong><span>$329</span></div>
    </div>
  `;

  document.getElementById("help").innerHTML = `
    <h2>Help</h2>
    <p class="small">Need help? We’ve got you. Xspresso keeps the work organized so you can stay in command.</p>
  `;

  const form = document.getElementById("builder-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const draft = window.XspressoCampaignBuilder.generateDraft(data);
    document.getElementById("builder-output").innerHTML = `
      <div class="panel" style="margin-top:16px;">
        <h3>${draft.headline}</h3>
        <p>${draft.subheadline}</p>
        <p class="small">${draft.body}</p>
      </div>
    `;
  });
}

document.addEventListener("click", (e) => {
  const routeBtn = e.target.closest("[data-route]");
  if (!routeBtn) return;
  const route = routeBtn.dataset.route;
  document.getElementById(route)?.scrollIntoView({ behavior: "smooth", block: "start" });
});

renderDashboard();
