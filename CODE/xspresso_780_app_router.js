// xspresso_780_app_router.js
// Simple app router for Xspresso

export const ROUTES = {
  dashboard: "dashboard",
  builder: "builder",
  review: "review",
  launch: "launch",
  monitoring: "monitoring",
  leads: "leads",
  library: "library",
  templates: "templates",
  billing: "billing",
  settings: "settings",
  help: "help"
};

export function getRouteFromHash(hash = window.location.hash) {
  const clean = String(hash || "").replace(/^#/, "").trim();
  return ROUTES[clean] ? clean : ROUTES.dashboard;
}

export function setRoute(route) {
  if (!ROUTES[route]) return ROUTES.dashboard;
  window.location.hash = `#${route}`;
  return route;
}

export function renderRoute(route, mountMap = {}) {
  const active = ROUTES[route] ? route : ROUTES.dashboard;
  Object.keys(mountMap).forEach(key => {
    const el = mountMap[key];
    if (el) el.style.display = key === active ? "block" : "none";
  });
  return active;
}

export function initRouter(mountMap = {}) {
  const apply = () => renderRoute(getRouteFromHash(), mountMap);
  window.addEventListener("hashchange", apply);
  apply();
  return apply;
}
