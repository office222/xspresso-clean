// xspresso_platform_switch_modal.js
// Platform Switch Modal for Xspresso

/*
Warns before switching ad platforms:
- Shows ads that will be affected
- Explains credit usage for monitoring
- Asks user to confirm or choose new monitoring behavior
*/

export function renderPlatformSwitchModal({ currentPlatform, ads, onConfirm, onCancel }) {
  return `
    <div class="platform-switch-modal">
      <h3>Switch Platform</h3>
      <p>You are about to switch from <b>${currentPlatform}</b> to another platform.</p>
      <p>Xspresso will stop monitoring these ads:</p>
      <ul>${(ads||[]).map(a=>`<li>${a.headline || a.name}</li>`).join('')}</ul>
      <p>If you want to keep monitoring, credits will be used for each ad. Continue?</p>
      <div class="modal-actions">
        <button onclick="${onConfirm}()">Yes, switch & monitor</button>
        <button onclick="${onCancel}()">Cancel</button>
      </div>
    </div>
  `;
}
