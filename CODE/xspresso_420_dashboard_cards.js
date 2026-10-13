/* xspresso_420_dashboard_cards.js
   Dashboard summary cards + campaign card renderer.
*/

import { createCard, createStatusPill } from './xspresso_419_ui_shell_components.js';

export function buildDashboardSummary(state = {}) {
  const totalCampaigns = state.totalCampaigns ?? 0;
  const activeCampaigns = state.activeCampaigns ?? 0;
  const alerts = state.alerts ?? 0;
  const creditsRemaining = state.creditsRemaining ?? 0;

  return `
    <section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;">
      ${createCard({ title: 'Campaigns', value: totalCampaigns, note: 'Total campaigns in your workspace.' })}
      ${createCard({ title: 'Active', value: activeCampaigns, note: 'Campaigns currently running.' })}
      ${createCard({ title: 'Alerts', value: alerts, note: 'Items needing attention.' })}
      ${createCard({ title: 'Credits', value: creditsRemaining, note: 'Credits remaining this cycle.' })}
    </section>
  `;
}

export function buildCampaignCard(campaign = {}) {
  const status = campaign.status || 'draft';
  const statusClass = status === 'live' ? 'good' : (status === 'underperforming' ? 'danger' : 'warning');

  return `
    <article style="background:#fff;border:1px solid #e6e6e6;border-radius:14px;padding:16px;display:grid;gap:10px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
        <div>
          <div style="font-size:18px;font-weight:800;color:#111;line-height:1.2;">${campaign.name || 'Untitled Campaign'}</div>
          <div style="margin-top:4px;font-size:13px;color:#666;">${campaign.platform || 'Multiple platforms'}</div>
        </div>
        <div>${createStatusPill(statusClass)}</div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;font-size:13px;color:#444;">
        <div><strong>CPC</strong><br>${campaign.cpc ?? '—'}</div>
        <div><strong>CTR</strong><br>${campaign.ctr ?? '—'}</div>
        <div><strong>Conv.</strong><br>${campaign.conversions ?? '—'}</div>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button data-action="view" data-id="${campaign.id || ''}" style="padding:8px 12px;border-radius:8px;border:1px solid #ddd;background:#fff;cursor:pointer;">View</button>
        <button data-action="edit" data-id="${campaign.id || ''}" style="padding:8px 12px;border-radius:8px;border:1px solid #ddd;background:#fff;cursor:pointer;">Edit</button>
        <button data-action="regenerate" data-id="${campaign.id || ''}" style="padding:8px 12px;border-radius:8px;border:0;background:#c65a1e;color:#fff;cursor:pointer;">Regenerate</button>
      </div>
    </article>
  `;
}

export function buildCampaignList(campaigns = []) {
  return `
    <section style="display:grid;gap:14px;">
      ${campaigns.map(buildCampaignCard).join('')}
    </section>
  `;
}
