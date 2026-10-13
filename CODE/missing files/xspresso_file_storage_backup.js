// xspresso_file_storage_backup.js
// Handles campaign file save, restore, and backup/restore UI logic in Xspresso

export class FileStorageBackup {
  constructor(storage = window.localStorage) {
    this.storage = storage;
  }

  saveCampaign(id, data) {
    this.storage.setItem('campaign_' + id, JSON.stringify(data));
  }

  loadCampaign(id) {
    const raw = this.storage.getItem('campaign_' + id);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  backupAll() {
    const allKeys = Object.keys(this.storage);
    const campaigns = allKeys.filter(k => k.startsWith('campaign_'));
    return campaigns.map(k => this.loadCampaign(k.substring(9)));
  }

  restoreBackup(arr) {
    arr.forEach(camp => {
      this.saveCampaign(camp.id, camp);
    });
  }

  removeCampaign(id) {
    this.storage.removeItem('campaign_' + id);
  }
}

// Usage:
// const fsb = new FileStorageBackup();
// fsb.saveCampaign('123', {name:'Test',steps:[]})
// fsb.backupAll();
// fsb.restoreBackup(arr)
