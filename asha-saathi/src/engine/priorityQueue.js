const TIER_RANK = { RED: 0, YELLOW: 1, GREEN: 2 };

/**
 * Within RED tier, more danger signs = higher priority.
 * Within same sign count, earlier timestamp wins.
 */
export function rankQueue(patients) {
  return [...patients].sort((a, b) => {
    const tierDiff = TIER_RANK[a.tier] - TIER_RANK[b.tier];
    if (tierDiff !== 0) return tierDiff;

    // Within same tier — for RED, rank by number of danger signs (more = worse)
    if (a.tier === "RED") {
      const severityDiff = b.citedSigns.length - a.citedSigns.length;
      if (severityDiff !== 0) return severityDiff;
    }

    // Final tiebreaker — earlier arrival first
    return a.timestamp - b.timestamp;
  });
}

export function createPatientRecord(triageResult, meta = {}) {
  return {
    id: crypto.randomUUID(),
    tier: triageResult.tier,
    label: triageResult.label,
    referralTimeframe: triageResult.referralTimeframe,
    citedSigns: triageResult.citedSigns,
    timestamp: Date.now(),
    referred: false,
    meta,
  };
}