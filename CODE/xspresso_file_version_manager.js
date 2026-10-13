// Xspresso File/Version Manager
// Keep track of user files, campaign versions, templates, etc.

export default function FileVersionManager({ files, onSelect }) {
  return `
    <div class="file-version-manager">
      <h2>Files & Versions</h2>
      <ul>
        ${files.map(f => `<li><strong>${f.name}</strong> v${f.version||1} <button onclick=\"${onSelect}(\'${f.id}\')\">Open</button></li>`).join('')}
      </ul>
      <button>Add New</button>
    </div>
  `;
}
