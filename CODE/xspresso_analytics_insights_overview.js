// Xspresso Analytics & Insights Overview
// Dashboard summary: trends, top performers, simple charts

export default function AnalyticsInsightsOverview({ stats }) {
  const best = stats.campaigns ? stats.campaigns[0] : {};
  return `
    <div class="analytics-overview">
      <h2>Analytics & Insights</h2>
      <div><strong>Top Campaign:</strong> ${best.name||'None'} &mdash; ${best.ctr||'0'}% CTR</div>
      <div><strong>Best Performing Platform:</strong> ${stats.topPlatform||'N/A'}</div>
      <div><strong>Avg Clicks:</strong> ${stats.avgClicks||0}</div>
      <div class="chart-placeholder">[Trends chart here]</div>
    </div>
  `;
}
