// xspresso_408_library_templates_panel.js
// Library and template panel for Xspresso.

export const libraryItemTypes = {
  campaign: 'campaign',
  landingPage: 'landingPage',
  adSet: 'adSet',
  followUpSequence: 'followUpSequence',
  template: 'template',
};

export function createLibraryItem(item) {
  return {
    id: item.id || `lib_${Date.now()}`,
    type: item.type || libraryItemTypes.campaign,
    name: item.name || 'Untitled Item',
    description: item.description || '',
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    tags: item.tags || [],
    data: item.data || {},
  };
}

export function duplicateLibraryItem(item, overrides = {}) {
  return {
    ...item,
    id: `dup_${Date.now()}`,
    name: overrides.name || `${item.name} Copy`,
    updatedAt: new Date().toISOString(),
    data: {
      ...item.data,
      ...overrides.data,
    },
  };
}

export function renderLibraryPanel(items = []) {
  const cards = items.map((item) => `
    <article class="library-card" data-id="${item.id}">
      <h3>${item.name}</h3>
      <p>${item.description || 'Saved work from the user library.'}</p>
      <div class="library-meta">
        <span>${item.type}</span>
        <span>${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</span>
      </div>
      <div class="library-actions">
        <button type="button">Restore</button>
        <button type="button">Duplicate</button>
        <button type="button">Export</button>
      </div>
    </article>
  `).join('');

  return `
    <section class="panel library-panel">
      <h2>Library & Templates</h2>
      <div class="library-grid">
        ${cards || '<p>No saved items yet.</p>'}
      </div>
      <p class="library-note">Reuse your own winning work. Never copy other people’s work.</p>
    </section>
  `;
}
