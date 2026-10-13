export function createHelpCenterPanel({ topics = [], onSearch = () => {}, onOpen = () => {} } = {}) {
  const root = document.createElement('section');
  root.className = 'panel help-center-panel';

  root.innerHTML = `
    <div class="panel-header">
      <h2>Help Center</h2>
      <p>Find answers fast, without leaving the app.</p>
    </div>
    <div class="help-search-row">
      <input type="search" class="help-search" placeholder="Search help topics..." aria-label="Search help topics" />
      <button class="btn btn-primary" type="button">Search</button>
    </div>
    <div class="help-topics"></div>
  `;

  const input = root.querySelector('.help-search');
  const button = root.querySelector('button');
  const topicsEl = root.querySelector('.help-topics');

  function renderTopics(items) {
    topicsEl.innerHTML = '';
    if (!items.length) {
      topicsEl.innerHTML = '<p class="muted">No topics found.</p>';
      return;
    }

    items.forEach(topic => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'help-topic-item';
      item.textContent = topic.title;
      item.addEventListener('click', () => onOpen(topic));
      topicsEl.appendChild(item);
    });
  }

  function search() {
    const query = input.value.trim().toLowerCase();
    const filtered = topics.filter(topic => {
      const haystack = `${topic.title} ${topic.body || ''} ${topic.tags ? topic.tags.join(' ') : ''}`.toLowerCase();
      return !query || haystack.includes(query);
    });
    onSearch(query, filtered);
    renderTopics(filtered);
  }

  button.addEventListener('click', search);
  input.addEventListener('input', () => {
    if (input.value.length === 0) renderTopics(topics);
  });

  renderTopics(topics);
  return root;
}

export const helpCenterTopics = [
  { id: 'getting-started', title: 'Getting Started', body: 'How to create your first campaign.', tags: ['start', 'campaign'] },
  { id: 'monitoring', title: 'Monitoring Ads', body: 'How Xspresso watches CPC and performance.', tags: ['monitoring', 'ads'] },
  { id: 'credits', title: 'Credits and Usage', body: 'How credits are used for actions and monitoring.', tags: ['credits', 'billing'] },
  { id: 'platform-switch', title: 'Platform Switching', body: 'What happens when you move campaigns between platforms.', tags: ['platform', 'switch'] }
];
