/**
 * referralRouter.js
 * Recommends the best facility for a patient based on:
 *  - Tier severity (RED gets CHC-capable routing)
 *  - Total time to be seen (travel + estimated wait)
 *  - Doctor availability
 *  - Ambulance availability (for RED patients)
 *
 * This is the novelty: not "nearest PHC" but "fastest to actual care".
 */
import { FACILITIES, totalTimeMin, estimateWaitMin } from "./facilityConfig";

/**
 * Score a facility for a given patient tier.
 * Lower score = better recommendation.
 */
function scoreFacility(facility, tier) {
  // If no doctors available, facility is unusable
  if (facility.doctorsAvailable === 0) return Infinity;

  let score = totalTimeMin(facility); // base = total time to be seen

  // RED patients: prefer ambulance-capable + CHC-level facilities
  if (tier === "RED") {
    if (!facility.hasAmbulance) score += 30;
    if (facility.type === "PHC") score += 20; // CHC/DH preferred for RED
  }

  // YELLOW: any PHC is fine, just minimize total time
  // GREEN: nearest is fine, no adjustment needed

  return score;
}

/**
 * Returns ranked facilities for a patient, best first.
 * @param {string} tier - "RED" | "YELLOW" | "GREEN"
 * @returns {Array} facilities with scores and recommendation metadata
 */
export function rankFacilities(tier) {
  return FACILITIES
    .map((f) => ({
      ...f,
      waitMin: estimateWaitMin(f),
      totalMin: totalTimeMin(f),
      score: scoreFacility(f, tier),
    }))
    .sort((a, b) => a.score - b.score);
}

/**
 * Get the single recommended facility for a patient.
 */
export function getRecommendedFacility(tier) {
  return rankFacilities(tier)[0];
}