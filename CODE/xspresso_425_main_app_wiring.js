/* xspresso_425_main_app_wiring.js
   Minimal wiring example that stitches the UI modules together.
*/

import { createTopBar, createSidebar } from './xspresso_419_ui_shell_components.js';
import { buildDashboardSummary, buildCampaignList } from './xspresso_420_dashboard_cards.js';
import { buildHelpSupportPanel } from './xspresso_421_help_support_panel.js';
import { buildBillingPanel } from './xspresso_424_billing_renewal_ui.js';

export function renderApp(root, state = {}) {
  const navItems = [
    { label: 'Dashboard', href: '#dashboard', active: true },
    { label: 'Create Campaign', href: '#create' },
    { label: 'Monitoring', href: '#monitoring' },
    { label: 'Leads', href: '#leads' },
    { label: 'Library', href: '#library' },
    { label: 'Templates', href: '#templates' },
    { label: 'Credits', href: '#credits' },
    { label: 'Billing', href: '#billing' },
    { label: 'Settings', href: '#settings' },
    { label: 'Help', href: '#help' }
  ];

  const campaigns = state.campaigns || [];
  const dashboardStats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'live').length,
    alerts: (state.alerts || []).length,
    creditsRemaining: state.creditsRemaining ?? 0
  };

  const html = `
    <div style="min-height:100vh;background:#f7f7f7;color:#222;">
      ${createTopBar()}
      <div style="display:flex;align-items:stretch;min-height:calc(100vh - 72px);">
        ${createSidebar(navItems)}
        <main style="flex:1;padding:20px;display:grid;gap:18px;">
          <section>
            <h1 style="margin:0 0 8px 0;font-size:28px;color:#111;">Welcome back</h1>
            <p style="margin:0;color:#555;line-height:1.6;">Xspresso is keeping watch. Here’s what needs attention.</p>
          </section>

          ${buildDashboardSummary(dashboardStats)}
          ${buildCampaignList(campaigns)}
          ${buildBillingPanel(state.subscription || {}, state.plan || {})}
          ${buildHelpSupportPanel()}
        </main>
      </div>
    </div>
  `;

  if (root) root.innerHTML = html;
  return html;
}
