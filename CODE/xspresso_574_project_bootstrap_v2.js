// Xspresso project bootstrap
// File: xspresso_574_project_bootstrap_v2.js

import { buildNavigationItems } from './xspresso_573_app_router_v2.js';

export function createAppBootstrap() {
  return {
    appName: 'Xspresso',
    version: 'v1',
    theme: {
      primary: '#ff7a18',
      background: '#ffffff',
      text: '#111111',
      accent: '#c65a1e',
    },
    navigation: buildNavigationItems(),
    defaults: {
      tone: 'simple',
      goal: 'sales',
      platform: 'general',
      monitoringEnabled: true,
      followUpEnabled: true,
    },
  };
}

export function getBootstrapMessage() {
  return 'Xspresso is done-for-you marketing that gets responses, builds your list, follows up automatically, and lets you stay in command.';
}