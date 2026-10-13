export function createAppRouter(routes = {}, fallback = 'dashboard') {
  const listeners = new Set();

  function getRoute() {
    const hash = window.location.hash.replace('#/', '') || fallback;
    return routes[hash] ? hash : fallback;
  }

  function navigate(route) {
    const next = routes[route] ? route : fallback;
    if (window.location.hash !== `#/${next}`) {
      window.location.hash = `#/${next}`;
    }
    listeners.forEach((fn) => fn(next));
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  window.addEventListener('hashchange', () => {
    const route = getRoute();
    listeners.forEach((fn) => fn(route));
  });

  return {
    getRoute,
    navigate,
    onChange,
    routes,
  };
}

export function mountRoute(root, routeMap, routeName) {
  const view = routeMap[routeName] || routeMap.dashboard;
  root.innerHTML = '';
  root.appendChild(view());
}
