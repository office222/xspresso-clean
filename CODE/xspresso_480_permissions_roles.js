// xspresso_480_permissions_roles.js
// User roles and permission checks for Xspresso

export const Roles = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

export function canEditCampaign(role) {
  return [Roles.OWNER, Roles.ADMIN, Roles.EDITOR].includes(role);
}

export function canLaunchCampaign(role) {
  return [Roles.OWNER, Roles.ADMIN, Roles.EDITOR].includes(role);
}

export function canChangeBilling(role) {
  return [Roles.OWNER, Roles.ADMIN].includes(role);
}

export function canSwitchPlatform(role) {
  return [Roles.OWNER, Roles.ADMIN, Roles.EDITOR].includes(role);
}

export function canViewOnly(role) {
  return role === Roles.VIEWER;
}

export function requireConfirmation(action) {
  const sensitive = new Set([
    'delete_ad',
    'switch_platform',
    'change_billing',
    'cancel_subscription',
    'pause_subscription',
    'restore_library_item',
  ]);
  return sensitive.has(action);
}
