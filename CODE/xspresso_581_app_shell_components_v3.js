export const navigationItems = [
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

export function buildTopBar(userName = "") {
  return {
    title: "Xspresso",
    subtitle: userName ? `Welcome, ${userName}` : "Done-for-you marketing",
    primaryAction: "Create Campaign"
  };
}

export function buildShellState(user = {}, route = "dashboard") {
  return {
    userName: user.name || "",
    route,
    navigationItems,
    showHelpPanel: true,
    showStatusStrip: true
  };
}
