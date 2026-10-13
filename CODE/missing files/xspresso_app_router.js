// xspresso_app_router.js
// Simple hash-based router for Xspresso SPA

export class AppRouter {
  constructor(routes) {
    this.routes = routes;
    window.addEventListener('hashchange', this.route.bind(this));
    this.route();
  }

  route() {
    const fragment = location.hash.slice(1).toLowerCase();
    let handled = false;
    for (let path in this.routes) {
      if (fragment.startsWith(path)) {
        this.routes[path]();
        handled = true;
        break;
      }
    }
    if (!handled && this.routes["/"]) {
      this.routes["/"]();
    }
  }
}

// Example usage (in main_app.js or index.js):
// import { AppRouter } from './xspresso_app_router.js';
// const router = new AppRouter({
//   'dashboard': showDashboard,
//   'builder': showBuilder,
//   'review': showReview,
//   'monitor': showMonitor,
//   'settings': showSettings,
//   '/': showDashboard
// });
