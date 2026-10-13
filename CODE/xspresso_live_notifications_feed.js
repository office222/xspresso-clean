// xspresso_live_notifications_feed.js
// Real-time (or polling) notifications feed for Xspresso SaaS

export class NotificationsFeed {
  constructor(container, fetchNotificationsFn) {
    this.container = container;
    this.fetchNotifications = fetchNotificationsFn;
    this.interval = null;
  }

  startPolling(ms = 30000) {
    this.stopPolling();
    this.interval = setInterval(() => this.render(), ms);
  }

  stopPolling() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }

  async render() {
    const notes = await this.fetchNotifications();
    this.container.innerHTML = '';
    if (!notes.length) return this.container.textContent = 'No notifications yet.';
    notes.forEach(note => {
      const div = document.createElement('div');
      div.className = 'xspresso-notification';
      div.textContent = `[${note.type}] ${note.message}`;
      this.container.appendChild(div);
    });
  }
}

// Example usage (provide fetchNotificationsFn to hit your backend):
// const feed = new NotificationsFeed(document.querySelector('#feed'), myFetcher);
// feed.startPolling(10000);
