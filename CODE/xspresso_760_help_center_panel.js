// xspresso_760_help_center_panel.js
// Simple help/support panel renderer

const helpTopics = [
  'Getting started',
  'Adding an offer',
  'Creating a campaign',
  'Monitoring ads',
  'Switching platforms',
  'Credits and billing',
  'Saving and restoring work',
  'Troubleshooting alerts'
];

export function renderHelpCenterPanel(query = '') {
  const q = String(query || '').toLowerCase();
  const filtered = helpTopics.filter(topic => topic.toLowerCase().includes(q));
  return `
    <div class="help-center-panel">
      <h2>Help Center</h2>
      <ul>
        ${filtered.map(topic => `<li>${escapeHtml(topic)}</li>`).join('')}
      </ul>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
