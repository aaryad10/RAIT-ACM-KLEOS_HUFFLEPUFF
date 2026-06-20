/**
 * facilityConfig.js
 * Mock PHC/CHC facility data for referral routing.
 * In production: fetched from NHM facility registry or updated by ANM supervisor.
 * For demo: realistic mock data based on rural Maharashtra PHC setup.
 */
export const FACILITIES = [
  {
    id: "phc_wardha",
    name: "PHC Wardha",
    type: "PHC",
    distanceKm: 8,
    travelTimeMin: 45,
    doctorsAvailable: 1,
    currentQueueLength: 14,
    hasAmbulance: true,
    operatingHours: "8AM–4PM",
  },
  {
    id: "phc_arvi",
    name: "PHC Arvi",
    type: "PHC",
    distanceKm: 14,
    travelTimeMin: 60,
    doctorsAvailable: 2,
    currentQueueLength: 3,
    hasAmbulance: false,
    operatingHours: "8AM–6PM",
  },
  {
    id: "chc_hinganghat",
    name: "CHC Hinganghat",
    type: "CHC",
    distanceKm: 22,
    travelTimeMin: 90,
    doctorsAvailable: 4,
    currentQueueLength: 7,
    hasAmbulance: true,
    operatingHours: "24 hrs",
  },
];

/**
 * Estimate wait time at a facility in minutes.
 * Rough model: each patient in queue = ~15 min with 1 doctor.
 */
export function estimateWaitMin(facility) {
  if (facility.doctorsAvailable === 0) return 999;
  return Math.round((facility.currentQueueLength / facility.doctorsAvailable) * 15);
}

/**
 * Total time from village to being seen = travel + wait.
 */
export function totalTimeMin(facility) {
  return facility.travelTimeMin + estimateWaitMin(facility);
}