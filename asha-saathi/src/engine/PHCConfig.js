/**
 * PHCConfig.js
 * One-time setup values for the ASHA worker's PHC context.
 * In production this would be set during onboarding.
 * Hardcoded here for hackathon demo.
 */
export const PHC_CONFIG = {
  distanceKm: 2,         // Distance from village to PHC in km
  travelTimeMin: 10,     // Estimated travel time in minutes
  phcName: "PHC Wardha", // Name shown in UI
};