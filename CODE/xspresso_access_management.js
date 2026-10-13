// xspresso_access_management.js
// User/team access and permissions for Xspresso SaaS

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

export class AccessManager {
  constructor(users = []) {
    this.users = users;
  }

  addUser(user, role = ROLES.VIEWER) {
    this.users.push({ ...user, role });
  }

  setRole(userId, newRole) {
    const usr = this.users.find(u => u.id === userId);
    if (usr) usr.role = newRole;
  }

  can(userId, action) {
    const usr = this.users.find(u => u.id === userId);
    if (!usr) return false;
    if (usr.role === ROLES.OWNER) return true;
    if (usr.role === ROLES.ADMIN && action !== 'delete_project') return true;
    if (usr.role === ROLES.EDITOR && ['edit', 'view'].includes(action)) return true;
    return usr.role === ROLES.VIEWER && action === 'view';
  }

  getUserRole(userId) {
    const usr = this.users.find(u => u.id === userId);
    return usr ? usr.role : null;
  }
}

// Usage:
// const am = new AccessManager([{id:'user1', role:ROLES.OWNER}]);
// am.can('user1', 'edit') // true
// am.addUser({id:'user2'}, ROLES.EDITOR)
