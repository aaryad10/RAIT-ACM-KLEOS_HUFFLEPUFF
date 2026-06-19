/**
 * Priority Queue logic for multi-patient triage sessions.
 * Ranking rule: RED before YELLOW before GREEN. Within the same tier,
 * earlier timestamp (earlier arrival) comes first — matches IMNCI urgency +
 * fairness ordering described in ASHA Saathi's doc.
 */

const TIER_RANK = { RED: 0, YELLOW: 1, GREEN: 2 };

/**
 * @param {Array} patients - array of patient session objects, each with a `tier` and `timestamp`
 * @returns {Array} new array, sorted by severity then arrival time
 */
export function rankQueue(patients) {
  return [...patients].sort((a, b) => {
    const tierDiff = TIER_RANK[a.tier] - TIER_RANK[b.tier];
    if (tierDiff !== 0) return tierDiff;
    return a.timestamp - b.timestamp;
  });
}

/**
 * Creates a new patient record from a triage result, ready to be added to the queue.
 * @param {object} triageResult - output of runTriage()
 * @param {object} meta - optional metadata, e.g. { age: "3 yrs", sex: "Female" }
 */
export function createPatientRecord(triageResult, meta = {}) {
  return {
    id: crypto.randomUUID(),
    tier: triageResult.tier,
    label: triageResult.label,
    referralTimeframe: triageResult.referralTimeframe,
    citedSigns: triageResult.citedSigns,
    timestamp: Date.now(),
    meta, // e.g. age/sex if we collect it later — optional for now
  };
}