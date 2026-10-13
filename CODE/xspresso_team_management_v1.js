/**
 * Tenant-scoped team and invitation domain service (ES module).
 * Authentication, email delivery, and persistence are deliberately injected;
 * this module is authorization/business logic, not an identity provider.
 */

export const TeamRole = Object.freeze({ OWNER: 'owner', ADMIN: 'admin', EDITOR: 'editor', VIEWER: 'viewer' });
const ROLE_RANK = { viewer: 1, editor: 2, admin: 3, owner: 4 };
const ROLE_CAPABILITIES = Object.freeze({
  owner: ['workspace:read','workspace:manage','members:invite','members:remove','members:role','billing:manage','campaign:read','campaign:write','campaign:launch','campaign:delete'],
  admin: ['workspace:read','members:invite','members:remove','members:role','campaign:read','campaign:write','campaign:launch','campaign:delete'],
  editor: ['workspace:read','campaign:read','campaign:write'],
  viewer: ['workspace:read','campaign:read']
});

export class MemoryTeamStore {
  constructor() { this.workspaces = new Map(); this.invites = new Map(); }
  async getWorkspace(id) { return clone(this.workspaces.get(id) || null); }
  async saveWorkspace(workspace) { this.workspaces.set(workspace.id, clone(workspace)); return clone(workspace); }
  async saveInvite(invite) { this.invites.set(invite.id, clone(invite)); return clone(invite); }
  async getInvite(id) { return clone(this.invites.get(id) || null); }
  async findInviteByTokenHash(hash) { return clone([...this.invites.values()].find(item => item.tokenHash === hash) || null); }
}

export class TeamManagementService {
  constructor({ store = new MemoryTeamStore(), clock = () => new Date(), hashToken = async token => token } = {}) {
    this.store = store; this.clock = clock; this.hashToken = hashToken;
  }
  async createWorkspace({ id, name, ownerId }) {
    required(id, 'id'); required(name, 'name'); required(ownerId, 'ownerId');
    if (await this.store.getWorkspace(id)) throw new Error('Workspace already exists.');
    const now = this.clock().toISOString();
    return this.store.saveWorkspace({ id, name: String(name).trim(), members: [{ userId: ownerId, role: TeamRole.OWNER, joinedAt: now }], createdAt: now, updatedAt: now });
  }
  async listMembers(workspaceId, actorId) {
    const workspace = await this.#authorizedWorkspace(workspaceId, actorId, 'workspace:read');
    return clone(workspace.members);
  }
  async invite({ workspaceId, actorId, email, role = TeamRole.EDITOR, token, expiresInHours = 72 }) {
    const workspace = await this.#authorizedWorkspace(workspaceId, actorId, 'members:invite');
    validateRole(role);
    if (role === TeamRole.OWNER) throw new Error('Owner role cannot be assigned by invitation.');
    const normalizedEmail = normalizeEmail(email);
    if (workspace.members.some(member => member.email === normalizedEmail)) throw new Error('User is already a workspace member.');
    if (!String(token || '').trim()) throw new TypeError('Provide a cryptographically random invitation token.');
    const now = this.clock();
    const invite = { id: makeId('invite'), workspaceId, email: normalizedEmail, role,
      tokenHash: await this.hashToken(token), status: 'pending', invitedBy: actorId,
      createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + clampHours(expiresInHours) * 3600000).toISOString(), acceptedAt: null };
    await this.store.saveInvite(invite);
    return { id: invite.id, workspaceId, email: invite.email, role: invite.role, status: invite.status,
      expiresAt: invite.expiresAt, rawToken: token };
  }
  async acceptInvite({ token, userId, email }) {
    required(token, 'token'); required(userId, 'userId');
    const invite = await this.store.findInviteByTokenHash(await this.hashToken(token));
    if (!invite || invite.status !== 'pending') throw new Error('Invitation is invalid or already used.');
    if (new Date(invite.expiresAt) <= this.clock()) { invite.status = 'expired'; await this.store.saveInvite(invite); throw new Error('Invitation has expired.'); }
    if (normalizeEmail(email) !== invite.email) throw new Error('Invitation email does not match the accepting account.');
    const workspace = await this.store.getWorkspace(invite.workspaceId);
    if (!workspace) throw new Error('Workspace no longer exists.');
    if (!workspace.members.some(member => member.userId === userId)) {
      workspace.members.push({ userId, email: invite.email, role: invite.role, joinedAt: this.clock().toISOString() });
      workspace.updatedAt = this.clock().toISOString();
      await this.store.saveWorkspace(workspace);
    }
    invite.status = 'accepted'; invite.acceptedAt = this.clock().toISOString();
    await this.store.saveInvite(invite);
    return { workspaceId: workspace.id, member: workspace.members.find(member => member.userId === userId) };
  }
  async changeRole({ workspaceId, actorId, userId, role }) {
    validateRole(role);
    if (role === TeamRole.OWNER) throw new Error('Use the ownership-transfer flow to assign owner.');
    const workspace = await this.#authorizedWorkspace(workspaceId, actorId, 'members:role');
    const target = workspace.members.find(member => member.userId === userId);
    if (!target) throw new Error('Member not found.');
    if (target.role === TeamRole.OWNER) throw new Error('Owner role cannot be changed here.');
    target.role = role; workspace.updatedAt = this.clock().toISOString();
    await this.store.saveWorkspace(workspace); return clone(target);
  }
  async removeMember({ workspaceId, actorId, userId }) {
    const workspace = await this.#authorizedWorkspace(workspaceId, actorId, 'members:remove');
    const target = workspace.members.find(member => member.userId === userId);
    if (!target) return false;
    if (target.role === TeamRole.OWNER) throw new Error('Transfer ownership before removing the owner.');
    workspace.members = workspace.members.filter(member => member.userId !== userId);
    workspace.updatedAt = this.clock().toISOString(); await this.store.saveWorkspace(workspace); return true;
  }
  async #authorizedWorkspace(workspaceId, actorId, capability) {
    const workspace = await this.store.getWorkspace(workspaceId);
    if (!workspace) throw new Error('Workspace not found.');
    const actor = workspace.members.find(member => member.userId === actorId);
    if (!actor || !ROLE_CAPABILITIES[actor.role]?.includes(capability)) throw new Error('Permission denied.');
    return workspace;
  }
}
export function hasCapability(role, capability) { return ROLE_CAPABILITIES[role]?.includes(capability) ?? false; }
export function mayManageRole(actorRole, targetRole) { return ROLE_RANK[actorRole] > ROLE_RANK[targetRole] && actorRole !== 'viewer'; }
function validateRole(role) { if (!Object.hasOwn(ROLE_RANK, role)) throw new TypeError(`Invalid team role: ${role}`); }
function normalizeEmail(email) { const value = String(email || '').trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new TypeError('Valid email is required.'); return value; }
function required(value, label) { if (!String(value || '').trim()) throw new TypeError(`${label} is required.`); }
function clampHours(value) { const hours = Number(value); return Number.isFinite(hours) ? Math.max(1, Math.min(hours, 720)) : 72; }
function makeId(prefix) { return `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`; }
function clone(value) { return value == null ? value : (typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value))); }
