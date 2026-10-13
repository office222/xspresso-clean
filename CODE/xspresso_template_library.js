// xspresso_template_library.js
// Template Library/Manager for Xspresso

/*
Allows:
- saving current campaigns as templates
- browsing available templates
- loading/applying a template
- editing/restoring templates
*/

const templates = [];

export function saveAsTemplate(campaign) {
  if (!campaign) return false;
  templates.push({ ...campaign, id: 'tpl_' + Date.now() });
  return true;
}

export function getTemplates() {
  return templates;
}

export function renderTemplateLibrary() {
  if (!templates.length) {
    return `<div class="template-library"><h3>Templates</h3><p>No templates saved yet.</p></div>`;
  }
  return `<div class="template-library">
    <h3>Templates</h3>
    <ul>
    ${templates.map(t => `<li><strong>${t.headline || t.name || 'Untitled'}</strong> <button onclick="loadTemplate('${t.id}')">Load</button></li>`).join('')}
    </ul>
  </div>`;
}

window.loadTemplate = function(id) {
  const tpl = templates.find(t => t.id === id);
  if (tpl) alert('Loading template: ' + (tpl.headline || tpl.name)); // Replace with real logic
}
