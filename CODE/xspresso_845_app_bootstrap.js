// xspresso_845_app_bootstrap.js
import { seedDemo, getDashboard, sweepMonitoring, getState } from './xspresso_842_app.js';

export function bootstrap() {
  const campaign = seedDemo();
  const dashboard = getDashboard();
  const monitoring = sweepMonitoring();
  return {
    campaign,
    dashboard,
    monitoring,
    state: getState()
  };
}
