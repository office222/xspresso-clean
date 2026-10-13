export function buildAppShell(navItems = []) {
  return {
    topBar: {
      logoLeft: true,
      title: 'Xspresso',
      primaryCTA: 'Create Campaign'
    },
    sidebar: navItems.length ? navItems : [
      'Dashboard',
      'Create Campaign',
      'Monitoring',
      'Leads',
      'Library',
      'Templates',
      'Credits',
      'Billing',
      'Settings',
      'Help'
    ],
    footer: {
      text: 'Done-for-you marketing. You stay in command.'
    }
  };
}
