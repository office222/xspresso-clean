// xspresso_451_ui_shell_components.js
// UI shell and navigation component helpers for Xspresso

export function buildAppShell() {
  return {
    topBar: true,
    sideNav: [
      "Dashboard",
      "Create Campaign",
      "Monitoring",
      "Leads",
      "Library",
      "Templates",
      "Credits",
      "Billing",
      "Settings",
      "Help"
    ],
    contentArea: true,
    rightPanel: true,
    footer: true
  };
}

export function buildNavigationMenu(active = "Dashboard") {
  const items = ["Dashboard", "Create Campaign", "Monitoring", "Leads", "Library", "Templates", "Credits", "Billing", "Settings", "Help"];
  return items.map((item) => ({
    label: item,
    active: item === active,
    href: `#${item.toLowerCase().replace(/\s+/g, "-")}`
  }));
}

export function buildTopBar(userName = "Welcome back") {
  return {
    brand: "Xspresso",
    userName,
    primaryCTA: "Create Campaign",
    secondaryCTA: "View Dashboard"
  };
}

export function buildQuickActions() {
  return [
    "Create Campaign",
    "Review Draft",
    "Launch Now",
    "Fix Underperforming Ad",
    "Add Credits"
  ];
}

export function buildStatusStrip(status = {}) {
  return {
    message: status.message || "Xspresso keeps the work organized so you can stay in command.",
    level: status.level || "info"
  };
}
