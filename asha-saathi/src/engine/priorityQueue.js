// const TIER_RANK = { RED: 0, YELLOW: 1, GREEN: 2 };

// /**
//  * Within RED tier, more danger signs = higher priority.
//  * Within same sign count, earlier timestamp wins.
//  */
// export function rankQueue(patients) {
//   return [...patients].sort((a, b) => {
//     const tierDiff = TIER_RANK[a.tier] - TIER_RANK[b.tier];
//     if (tierDiff !== 0) return tierDiff;

//     // Within same tier — for RED, rank by number of danger signs (more = worse)
//     if (a.tier === "RED") {
//       const severityDiff = b.citedSigns.length - a.citedSigns.length;
//       if (severityDiff !== 0) return severityDiff;
//     }

//     // Final tiebreaker — earlier arrival first
//     return a.timestamp - b.timestamp;
//   });
// }

// export function createPatientRecord(triageResult, meta = {}) {
//   return {
//     id: crypto.randomUUID(),
//     tier: triageResult.tier,
//     label: triageResult.label,
//     referralTimeframe: triageResult.referralTimeframe,
//     citedSigns: triageResult.citedSigns,
//     timestamp: Date.now(),
//     referred: false,
//     meta,
//   };
// }

/**
 * priorityQueue.js — Smart queue ranking
 *
 * Scoring factors (within same tier):
 *  1. Danger sign count       — more signs = higher priority
 *  2. Repeat visit            — came back again = condition worsening
 *  3. Waiting time            — waiting > 30 min gets a bump
 *  4. Distance to PHC         — farther patients referred sooner (travel time buffer)
 *  5. Referral not completed  — was referred before but didn't go = needs push
 *
 * Output label (for display only — not a new clinical tier):
 *  RED   → "Refer Now" or "Refer Next" based on score within RED group
 *  YELLOW→ "Refer Within 24h" or "Monitor Closely"
 *  GREEN → "Home Observation"
 */
import { PHC_CONFIG } from "./PHCConfig";

const TIER_RANK = { RED: 0, YELLOW: 1, GREEN: 2 };

/**
 * Compute a priority score for a patient within their tier.
 * Higher score = higher priority.
 */
function computeScore(patient) {
  let score = 0;

  // Factor 1: Number of danger signs (0–10 range, each sign = 10 pts)
  score += (patient.citedSigns?.length || 0) * 10;

  // Factor 2: Repeat visit (+25 pts — came back means it's not resolving)
  if (patient.meta?.isRepeatVisit) score += 25;

  // Factor 3: Waiting time — bump if waiting > 30 min (+15 pts)
  const waitMin = (Date.now() - patient.timestamp) / 60000;
  if (waitMin > 30) score += 15;
  if (waitMin > 60) score += 10; // additional bump for > 1hr wait

  // Factor 4: Distance — farther patients need earlier referral to reach PHC before closing
  // PHC_CONFIG.distanceKm > 10km = significant travel burden
  if (PHC_CONFIG.distanceKm > 10) score += 20;
  else if (PHC_CONFIG.distanceKm > 5) score += 10;

  // Factor 5: Previously referred but didn't go (+20 pts — needs follow-through)
  if (patient.meta?.referralNotCompleted) score += 20;

  return score;
}

/**
 * Get the display action label for a patient based on their tier and rank within it.
 * @param {object} patient
 * @param {number} rankWithinTier - 0-indexed position within their tier group
 */
export function getQueueLabel(patient, rankWithinTier) {
  if (patient.tier === "RED") {
    return rankWithinTier === 0 ? "REFER NOW" : "REFER NEXT";
  }
  if (patient.tier === "YELLOW") {
    return rankWithinTier === 0 ? "REFER WITHIN 24H" : "MONITOR CLOSELY";
  }
  return "HOME OBSERVATION";
}

/**
 * Sort patients by tier first, then by computed score within tier.
 */
export function rankQueue(patients) {
  // Attach scores
  const scored = patients.map((p) => ({ ...p, _score: computeScore(p) }));

  return scored.sort((a, b) => {
    // Tier is always the primary sort
    const tierDiff = TIER_RANK[a.tier] - TIER_RANK[b.tier];
    if (tierDiff !== 0) return tierDiff;

    // Within same tier: higher score = higher priority
    const scoreDiff = b._score - a._score;
    if (scoreDiff !== 0) return scoreDiff;

    // Final tiebreaker: earlier arrival
    return a.timestamp - b.timestamp;
  });
}

/**
 * Get rank of a patient within their own tier group (0 = top of that tier).
 */
export function getRankWithinTier(rankedQueue, patientId) {
  const tierOfPatient = rankedQueue.find((p) => p.id === patientId)?.tier;
  const tierGroup = rankedQueue.filter((p) => p.tier === tierOfPatient);
  return tierGroup.findIndex((p) => p.id === patientId);
}

export function createPatientRecord(triageResult, meta = {}) {
  return {
    id: crypto.randomUUID(),
    tier: triageResult.tier,
    label: triageResult.label,
    referralTimeframe: triageResult.referralTimeframe,
    citedSigns: triageResult.citedSigns,
    eyeScreening: triageResult.eyeScreening || null,
    timestamp: Date.now(),
    referred: false,
    meta: {
      ...meta,
      isRepeatVisit: meta.isRepeatVisit || false,
      referralNotCompleted: meta.referralNotCompleted || false,
    },
  };
}