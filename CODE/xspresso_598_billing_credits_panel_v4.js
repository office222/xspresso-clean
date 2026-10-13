// Xspresso billing and credits panel v4
export function buildBillingState({ plan = 'starter', creditsIncluded = 0, creditsUsed = 0, renewsAt = null }) {
  return {
    plan,
    creditsIncluded,
    creditsUsed,
    creditsRemaining: creditsIncluded - creditsUsed,
    renewsAt
  };
}

export function creditWarning(state) {
  const remaining = state.creditsRemaining;
  if (remaining <= 0) return { level: 'critical', message: 'You are out of credits.' };
  if (remaining <= state.creditsIncluded * 0.2) return { level: 'warning', message: `You have ${remaining} credits left.` };
  return { level: 'info', message: 'You are within your current credit usage.' };
}

export function usageLine(state) {
  return `${state.creditsUsed}/${state.creditsIncluded} credits used`;
}
