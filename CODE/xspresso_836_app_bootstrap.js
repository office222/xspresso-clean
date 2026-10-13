// xspresso_836_app_bootstrap.js
import { createStateStore, normalizeCredits } from "./xspresso_831_state_store.js";
import { buildCampaignBrief, generateCampaignDraft } from "./xspresso_832_campaign_builder.js";
import { buildDashboardModel, renderDashboardHTML } from "./xspresso_833_dashboard_renderer.js";
import { buildAlert } from "./xspresso_834_monitoring_engine.js";
import { createLead, scoreLead } from "./xspresso_835_lead_followup.js";

export function bootstrapApp(root) {
  const store = createStateStore({
    credits: normalizeCredits({ included: 500, used: 0 }),
    campaigns: [],
    alerts: [],
    leads: []
  });

  function seedDemoData() {
    const brief = buildCampaignBrief({
      productName: "Demo Offer",
      audience: "small business owners",
      goal: "sales",
      tone: "simple",
      platform: "Facebook"
    });

    const draft = generateCampaignDraft(brief);
    const lead = scoreLead(createLead({ name: "Demo Lead", email: "demo@example.com" }), "opened_email");
    const alert = buildAlert({ id: "ad_1", campaignId: "cmp_demo", cpc: 1.8, ctr: 0.4, conversions: 0, clicks: 25 });

    store.setState((state) => ({
      ...state,
      campaigns: [
        {
          id: "cmp_demo",
          name: brief.productName,
          status: "draft",
          platform: brief.platform,
          cpc: 1.8,
          ctr: 0.4,
          conversions: 0,
          monitoredAds: 1
        }
      ],
      alerts: [alert],
      leads: [lead],
      lastDraft: draft
    }));
  }

  function render() {
    const state = store.getState();
    const model = buildDashboardModel(state);
    if (root) root.innerHTML = renderDashboardHTML(model);
  }

  store.subscribe(render);
  seedDemoData();
  render();

  return {
    store,
    render,
    seedDemoData
  };
}
