// xspresso_847_dashboard_view.js
import { buildDashboardModel, renderDashboardHTML } from './xspresso_833_dashboard_renderer.js';

export function renderDashboardView(state = {}) {
  const model = buildDashboardModel(state);
  return `
    <section class="dashboard-shell">
      <header class="hero-card">
        <h1>Wake up your marketing.</h1>
        <p>More responses. Less software chaos. You stay in command. We do the work.</p>
      </header>
      ${renderDashboardHTML(model)}
    </section>
  `;
}
