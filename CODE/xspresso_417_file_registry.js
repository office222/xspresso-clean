// xspresso_417_file_registry.js
// A small registry so Xspresso can keep track of files and avoid duplicate names.

export const FILE_REGISTRY = [
  'xspresso_400_index.html',
  'xspresso_401_styles.css',
  'xspresso_402_data_models.js',
  'xspresso_403_campaign_builder.js',
  'xspresso_404_monitoring_engine.js',
  'xspresso_405_app.js',
  'xspresso_407_billing_credits_panel.js',
  'xspresso_408_library_templates_panel.js',
  'xspresso_409_platform_switch_modal.js',
  'xspresso_410_lead_followup_screen.js',
  'xspresso_411_settings_panel.js',
  'xspresso_412_dashboard_detail_views.js',
  'xspresso_413_alerts_notifications.js',
  'xspresso_414_campaign_editor.js',
  'xspresso_415_launch_screen.js',
  'xspresso_416_activity_log.js',
];

export function isRegisteredFile(filename) {
  return FILE_REGISTRY.includes(filename);
}

export function nextSuggestedFilename(prefixNumber, slug) {
  return `xspresso_${String(prefixNumber).padStart(3, '0')}_${slug}.js`;
}

export function registerFilename(filename) {
  if (!FILE_REGISTRY.includes(filename)) {
    FILE_REGISTRY.push(filename);
  }
  return FILE_REGISTRY;
}

export function listRegisteredFiles() {
  return [...FILE_REGISTRY];
}

export default {
  FILE_REGISTRY,
  isRegisteredFile,
  nextSuggestedFilename,
  registerFilename,
  listRegisteredFiles,
};
