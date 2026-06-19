import { DANGER_SIGNS } from "./dangerSigns";

/**
 * Determines triage classification from a list of selected danger sign IDs.
 * Logic mirrors IMNCI's worst-sign-wins approach: if ANY selected sign is RED,
 * the patient is RED, regardless of other signs present. Same cascade for YELLOW.
 *
 * @param {string[]} selectedSignIds - array of DANGER_SIGNS ids the ASHA worker observed
 * @returns {{
 *   tier: "RED" | "YELLOW" | "GREEN",
 *   label: string,
 *   citedSigns: {id: string, label: string, tier: string}[],
 *   referralTimeframe: string
 * }}
 */
export function runTriage(selectedSignIds) {
  if (!selectedSignIds || selectedSignIds.length === 0) {
    return {
      tier: "GREEN",
      label: "No danger signs observed",
      citedSigns: [],
      referralTimeframe: "Manage locally. Routine advice.",
    };
  }

  // Resolve full sign objects from the ids passed in
  const matchedSigns = DANGER_SIGNS.filter((sign) =>
    selectedSignIds.includes(sign.id)
  );

  const redSigns = matchedSigns.filter((s) => s.tier === "RED");
  const yellowSigns = matchedSigns.filter((s) => s.tier === "YELLOW");

  if (redSigns.length > 0) {
    return {
      tier: "RED",
      label: "Refer immediately",
      citedSigns: redSigns,
      referralTimeframe: "Refer NOW — emergency",
    };
  }

  if (yellowSigns.length > 0) {
    return {
      tier: "YELLOW",
      label: "Refer within 24 hours",
      citedSigns: yellowSigns,
      referralTimeframe: "Refer within 24h",
    };
  }

  // Only GREEN-tier or unmatched signs present
  const greenSigns = matchedSigns.filter((s) => s.tier === "GREEN");
  return {
    tier: "GREEN",
    label: "Manage locally",
    citedSigns: greenSigns.length > 0 ? greenSigns : matchedSigns,
    referralTimeframe: "No referral needed. Routine advice.",
  };
}