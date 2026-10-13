/**
 * Xspresso collaboration utilities (ES module; no external dependencies).
 * Supports campaign comments, notes, and assigned tasks. Persistence is injected
 * so the same service can use an API/database in production or memory in demos.
 */

export class MemoryCollaborationRepository {
  constructor() {
    this.comments = new Map();
    this.tasks = new Map();
  }
  async listComments(campaignId) {
    return structuredCopy(this.comments.get(campaignId) || []);
  }
  async saveComment(campaignId, comment) {
    const rows = this.comments.get(campaignId) || [];
    rows.push(structuredCopy(comment));
    this.comments.set(campaignId, rows);
    return structuredCopy(comment);
  }
  async listTasks(campaignId) {
    return structuredCopy(this.tasks.get(campaignId) || []);
  }
  async saveTask(campaignId, task) {
    const rows = this.tasks.get(campaignId) || [];
    const index = rows.findIndex(row => row.id === task.id);
    if (index < 0) rows.push(structuredCopy(task));
    else rows[index] = structuredCopy(task);
    this.tasks.set(campaignId, rows);
    return structuredCopy(task);
  }
}

export class CollaborationService {
  constructor({ repository = new MemoryCollaborationRepository(), now = () => new Date() } = {}) {
    this.repository = repository;
    this.now = now;
  }
  async addComment({ campaignId, authorId, body, parentId = null }) {
    required(campaignId, 'campaignId');
    required(authorId, 'authorId');
    const text = String(body ?? '').trim();
    if (!text) throw new TypeError('Comment body cannot be empty.');
    if (text.length > 5000) throw new RangeError('Comment exceeds 5000 characters.');
    const comment = { id: makeId('comment'), campaignId, authorId, body: text,
      parentId, createdAt: this.now().toISOString(), editedAt: null, deletedAt: null };
    return this.repository.saveComment(campaignId, comment);
  }
  async editComment({ campaignId, commentId, actorId, body }) {
    const rows = await this.repository.listComments(campaignId);
    const comment = rows.find(row => row.id === commentId);
    if (!comment || comment.deletedAt) throw new Error('Comment not found.');
    if (comment.authorId !== actorId) throw new Error('Only the comment author may edit it.');
    const text = String(body ?? '').trim();
    if (!text || text.length > 5000) throw new TypeError('Comment must contain 1–5000 characters.');
    comment.body = text;
    comment.editedAt = this.now().toISOString();
    const all = rows.map(row => row.id === commentId ? comment : row);
    // Re-save through repository's public API; repository implementations may
    // override saveComment to persist updates by ID.
    if (typeof this.repository.replaceComments === 'function') {
      await this.repository.replaceComments(campaignId, all);
      return structuredCopy(comment);
    }
    this.repository.comments?.set(campaignId, all);
    return structuredCopy(comment);
  }
  async deleteComment({ campaignId, commentId, actorId, canModerate = false }) {
    const rows = await this.repository.listComments(campaignId);
    const comment = rows.find(row => row.id === commentId);
    if (!comment || comment.deletedAt) return false;
    if (comment.authorId !== actorId && !canModerate) throw new Error('Not permitted to delete this comment.');
    comment.body = '[deleted]';
    comment.deletedAt = this.now().toISOString();
    if (typeof this.repository.replaceComments === 'function') await this.repository.replaceComments(campaignId, rows);
    else this.repository.comments?.set(campaignId, rows);
    return true;
  }
  async createTask({ campaignId, title, description = '', assigneeId = null, dueAt = null, createdBy }) {
    required(campaignId, 'campaignId'); required(createdBy, 'createdBy');
    const taskTitle = String(title ?? '').trim();
    if (!taskTitle) throw new TypeError('Task title is required.');
    const task = { id: makeId('task'), campaignId, title: taskTitle,
      description: String(description).trim(), assigneeId, dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      status: 'open', createdBy, createdAt: this.now().toISOString(), updatedAt: this.now().toISOString() };
    return this.repository.saveTask(campaignId, task);
  }
  async updateTask({ campaignId, taskId, patch, actorId }) {
    const tasks = await this.repository.listTasks(campaignId);
    const current = tasks.find(task => task.id === taskId);
    if (!current) throw new Error('Task not found.');
    const allowed = ['title', 'description', 'assigneeId', 'dueAt', 'status'];
    for (const key of allowed) if (Object.hasOwn(patch || {}, key)) current[key] = patch[key];
    if (!['open', 'in_progress', 'done', 'cancelled'].includes(current.status)) throw new TypeError('Invalid task status.');
    if (current.title !== undefined) {
      current.title = String(current.title).trim();
      if (!current.title) throw new TypeError('Task title cannot be empty.');
    }
    current.updatedBy = actorId || null;
    current.updatedAt = this.now().toISOString();
    return this.repository.saveTask(campaignId, current);
  }
}

function required(value, name) { if (!String(value ?? '').trim()) throw new TypeError(`${name} is required.`); }
function makeId(prefix) { return `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`; }
function structuredCopy(value) { return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
