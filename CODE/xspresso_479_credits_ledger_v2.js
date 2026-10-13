// xspresso_479_credits_ledger_v2.js
// Credits ledger and usage tracking for Xspresso

export function createLedger() {
  return {
    entries: [],
    totalUsed: 0,
    totalAdded: 0,
  };
}

export function addLedgerEntry(ledger, entry) {
  const normalized = {
    id: `led_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type: entry.type,
    description: entry.description || '',
    credits: Number(entry.credits || 0),
    campaignId: entry.campaignId || null,
    createdAt: new Date().toISOString(),
  };

  const next = {
    ...ledger,
    entries: [normalized, ...(ledger.entries || [])],
    totalUsed: ledger.totalUsed || 0,
    totalAdded: ledger.totalAdded || 0,
  };

  if (normalized.credits >= 0) next.totalAdded += normalized.credits;
  else next.totalUsed += Math.abs(normalized.credits);

  return next;
}

export function getCreditsRemaining(subscription, ledger) {
  const included = subscription?.creditsIncluded || 0;
  const used = ledger?.totalUsed || 0;
  const added = ledger?.totalAdded || 0;
  return included + added - used;
}

export function buildUsageSummary(subscription, ledger) {
  return {
    plan: subscription?.plan || 'unknown',
    creditsIncluded: subscription?.creditsIncluded || 0,
    totalUsed: ledger?.totalUsed || 0,
    totalAdded: ledger?.totalAdded || 0,
    creditsRemaining: getCreditsRemaining(subscription, ledger),
  };
}
