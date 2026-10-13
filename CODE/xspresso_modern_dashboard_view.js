// xspresso_modern_dashboard_view.js
// Modern Dashboard rendering logic for Xspresso

export function renderDashboard({ campaigns = [], alerts = [], credits = {}, user = {} }) {
    return `
        <section class="xs-dashboard">
            <div class="xs-dashboard-header">
                <h2>Welcome, ${user.name || "User"}</h2>
                <div class="xs-dashboard-credits">Credits: <strong>${credits.remaining || 0}</strong></div>
            </div>
            <div class="xs-dashboard-summary">
                <div class="xs-card xs-campaigns-card">
                    <h3>Active Campaigns</h3>
                    <ul>${campaigns.filter(c => c.status === 'active').map(c => `<li>${c.name} — <span class="xs-status xs-status-${c.status}">${c.status}</span></li>`).join('')}</ul>
                </div>
                <div class="xs-card xs-alerts-card">
                    <h3>Urgent Alerts</h3>
                    <ul>${alerts.length ? alerts.map(a => `<li><span class="xs-alert xs-alert-${a.level}">${a.message}</span></li>`).join('') : '<li>No urgent alerts</li>'}</ul>
                </div>
            </div>
            <div class="xs-dashboard-campaigns">
                <h3>All Campaigns</h3>
                <table class="xs-table">
                    <thead><tr><th>Name</th><th>Status</th><th>Platform</th><th>Performance</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${campaigns.map(c => `
                        <tr>
                            <td>${c.name}</td>
                            <td><span class="xs-status xs-status-${c.status}">${c.status}</span></td>
                            <td>${c.platform || '-'}</td>
                            <td>${c.performance || '-'}</td>
                            <td>
                                <button class="xs-btn-xs" onclick="viewCampaign('${c.id}')">View</button>
                                <button class="xs-btn-xs" onclick="editCampaign('${c.id}')">Edit</button>
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="xs-dashboard-footer">
                <button class="xs-btn-primary" onclick="createCampaign()">+ New Campaign</button>
                <button class="xs-btn-outline" onclick="goToSettings()">Settings</button>
            </div>
        </section>
    `;
}
