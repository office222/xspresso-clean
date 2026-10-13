// xspresso_workspace_selector.js
// Allows user to switch workspace/project/team (if enabled in Xspresso SaaS)

export class WorkspaceSelector {
  constructor(container, workspaces = [], onChange = () => {}) {
    this.container = container;
    this.workspaces = workspaces;
    this.onChange = onChange;
    this.selected = workspaces[0] || null;
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    const label = document.createElement('label');
    label.textContent = 'Workspace:';
    const select = document.createElement('select');
    select.className = 'xspresso-workspace-select';
    this.workspaces.forEach(ws => {
      const opt = document.createElement('option');
      opt.value = ws.id;
      opt.textContent = ws.name;
      if (ws.id === (this.selected && this.selected.id)) opt.selected = true;
      select.appendChild(opt);
    });
    select.onchange = e => {
      this.selected = this.workspaces.find(w => w.id === select.value);
      this.onChange(this.selected);
    };
    label.appendChild(select);
    this.container.appendChild(label);
  }
}

// Usage: new WorkspaceSelector(document.querySelector('#workspace-panel'), arrayOfWorkspaces, ws => goToWorkspace(ws));
