// xspresso_481_library_manager.js
// Save, restore, and duplicate user-owned campaigns

export function saveToLibrary(campaign) {
  return {
    libraryId: `lib_${Date.now()}`,
    sourceCampaignId: campaign?.id || null,
    name: campaign?.name || 'Untitled Campaign',
    tags: campaign?.tags || [],
    savedAt: new Date().toISOString(),
    status: 'saved',
  };
}

export function duplicateCampaign(campaign, overrides = {}) {
  return {
    ...campaign,
    ...overrides,
    id: `cmp_${Date.now()}`,
    name: overrides.name || `${campaign?.name || 'Untitled Campaign'} Copy`,
    status: 'draft',
    duplicatedAt: new Date().toISOString(),
  };
}

export function restoreFromLibrary(item, overrides = {}) {
  return {
    ...item,
    ...overrides,
    id: `cmp_${Date.now()}`,
    status: 'draft',
    restoredAt: new Date().toISOString(),
  };
}

export function buildLibrarySummary(items = []) {
  return {
    totalItems: items.length,
    latestItem: items[0] || null,
  };
}
