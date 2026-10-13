// xspresso_850_monitoring_view.js
import { evaluateAd, buildAlertFromAd, monitoringSweep } from './xspresso_840_monitoring_engine.js';

export function renderMonitoringView(campaigns = []) {
  const ads = campaigns.flatMap((c) => c.ads || []);
  const sweep = monitoringSweep(ads);
  return `
    <section class="panel monitoring-view">
      <h2>Monitoring</h2>
      <div class="dashboard-grid">
        <div class="stat"><span>Ads</span><strong>${ads.length}</strong></div>
        <div class="stat"><span>Alerts</span><strong>${sweep.alerts.length}</strong></div>
        <div class="stat"><span>Healthy</span><strong>${sweep.report.filter((r) => r.status === 'healthy').length}</strong></div>
        <div class="stat"><span>Warning</span><strong>${sweep.report.filter((r) => r.status === 'warning').length}</strong></div>
      </div>
      <div class="alerts-list">
        ${sweep.alerts.map((alert) => `
          <article class="alert ${alert.level}">
            <strong>${escapeHtml(alert.title)}</strong>
            <p>${escapeHtml(alert.message)}</p>
          </article>
        `).join('') || '<p class="muted">No alerts right now.</p>'}
      </div>
    </section>
  `;
}

export function monitoringSnapshot(campaigns = []) {
  const ads = campaigns.flatMap((c) => c.ads || []);
  const sweep = monitoringSweep(ads);
  return {
    totalAds: ads.length,
    alerts: sweep.alerts,
    report: sweep.report,
    hasCritical: sweep.alerts.some((a) => a.level === 'critical')
  };
}

export function alertForAd(ad) {
  return buildAlertFromAd(ad);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
