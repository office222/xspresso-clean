// xspresso_409_platform_switch_modal.js
// Platform switch modal for Xspresso.

export const switchActions = {
  KEEP_RUNNING: 'keep_running',
  MOVE_TO_LIBRARY: 'move_to_library',
  MONITOR: 'monitor',
  TRACK_MYSELF: 'track_myself',
};

export function buildPlatformSwitchWarning(platformName, ads = []) {
  return {
    title: `Warning: switching off ${platformName} will stop Xspresso from tracking your ads there.`,
    message: 'Choose what you want to do with each ad.',
    platformName,
    ads,
    actions: [
      switchActions.KEEP_RUNNING,
      switchActions.MOVE_TO_LIBRARY,
      switchActions.MONITOR,
      switchActions.TRACK_MYSELF,
    ],
  };
}

export function renderPlatformSwitchModal(platformName, ads = []) {
  const adRows = ads.map((ad) => `
    <label class="switch-ad-row">
      <input type="checkbox" name="ads" value="${ad.id}">
      <span>${ad.name}</span>
    </label>
  `).join('');

  return `
    <section class="modal platform-switch-modal">
      <h2>Switch Platform</h2>
      <p>Warning: switching off ${platformName} will stop Xspresso from tracking your ads there.</p>
      <p>Choose what you want to do with each ad.</p>
      <div class="switch-actions">
        <label><input type="radio" name="platform_action" value="${switchActions.KEEP_RUNNING}"> Keep running — I will track them myself</label>
        <label><input type="radio" name="platform_action" value="${switchActions.MOVE_TO_LIBRARY}"> Delete from ${platformName} and move to my library</label>
        <label><input type="radio" name="platform_action" value="${switchActions.MONITOR}"> Keep monitoring for a usage cost</label>
      </div>
      <div class="switch-ads-list">
        ${adRows || '<p>No ads selected.</p>'}
      </div>
      <div class="switch-buttons">
        <button type="button">Confirm Changes</button>
        <button type="button">Cancel</button>
      </div>
    </section>
  `;
}
