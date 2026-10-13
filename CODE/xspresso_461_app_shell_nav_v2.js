/* Xspresso v2 - app shell and navigation */

export const navItems = [
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
];

export function buildAppShell(user = {}) {
  return {
    title: "Xspresso",
    subtitle: user.name ? `Welcome back, ${user.name}` : "Welcome back",
    navItems,
    primaryAction: "Create Campaign",
    quickStats: {
      activeCampaigns: 0,
      alerts: 0,
      creditsRemaining: 0,
      monitoredAds: 0
    }
  };
}

export function getPrimaryAction(route) {
  switch (route) {
    case "dashboard": return "Create Campaign";
    case "campaign": return "Generate Draft";
    case "review": return "Launch Now";
    case "monitoring": return "Fix Underperforming Ad";
    case "billing": return "Add Credits";
    default: return "Create Campaign";
  }
}

export function buildBreadcrumb(route = "dashboard") {
  return route.split("/").filter(Boolean).map(part => part.replace(/-/g, " "));
}
