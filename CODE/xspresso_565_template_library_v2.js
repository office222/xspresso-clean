// Xspresso - Template Library (v2)
// Purpose: Save, restore, duplicate, and reuse the user's own work.

export function createTemplate(name, data = {}, category = 'general') {
  return {
    id: `tpl_${Date.now()}`,
    name,
    category,
    description: 'Saved from a user campaign.',
    data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function saveCampaignAsTemplate(campaign, templateName = '') {
  return createTemplate(
    templateName || `${campaign.name || 'Untitled Campaign'} Template`,
    { ...campaign, id: undefined, status: 'draft' },
    campaign.category || 'general'
  );
}

export function restoreCampaignFromTemplate(template, overrides = {}) {
  return {
    ...(template.data || {}),
    ...overrides,
    id: `cmp_${Date.now()}`,
    name: overrides.name || template.name.replace(/ Template$/, ''),
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function duplicateCampaign(campaign, overrides = {}) {
  return {
    ...campaign,
    ...overrides,
    id: `dup_${Date.now()}`,
    name: overrides.name || `${campaign.name || 'Untitled'} Copy`,
    status: 'draft',
    updatedAt: new Date().toISOString(),
  };
}

export function libraryReducer(state = { items: [] }, action) {
  switch (action.type) {
    case 'ADD_TEMPLATE':
      return { ...state, items: [...state.items, action.payload] };
    case 'REMOVE_TEMPLATE':
      return { ...state, items: state.items.filter((i) => i.id !== action.payload) };
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        items: state.items.map((i) => (i.id === action.payload.id ? { ...i, ...action.payload } : i)),
      };
    default:
      return state;
  }
}
