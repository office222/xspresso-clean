// xspresso_759_platform_switch_modal.js
// Platform switch warning / selection modal

export function buildPlatformSwitchModal(platformName, ads = []) {
  return `
    <div class="platform-switch-modal">
      <h2>Warning: switching off ${escapeHtml(platformName)} will stop tracking there.</h2>
      <p>Choose what you want to do with these ads.</p>
      <ul>
        ${ads.map(ad => `<li>${escapeHtml(ad.name || ad.id || 'Ad')}</li>`).join('')}
      </ul>
      <div class="platform-switch-modal__actions">
        <button data-action="keep_running">Keep running — I’ll track them myself</button>
        <button data-action="move_to_library">Delete from platform and move to library</button>
        <button data-action="monitor">Keep monitoring for a usage cost</button>
      </div>
    </div>
  `;
}

export function calculatePlatformSwitchCost({ monitoredAds = 0, dailyRate = 5, rush = false }) {
  return (monitoredAds * dailyRate) + (rush ? 20 : 0);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
