/**
 * colorFeatures.js
 * Converts a {sclera, reference} HSL color pair into the feature vector the
 * classifier actually trains/predicts on.
 *
 * WHY SELF-RELATIVE: Raw RGB/HSL from a phone camera is unreliable across devices
 * and lighting (confirmed in literature — multiple studies use a physical
 * calibration card or flash/no-flash subtraction specifically because raw color
 * is not trustworthy on its own). Asking an ASHA worker to carry a calibration
 * card or do a flash/no-flash capture sequence adds friction this app can't afford.
 *
 * Instead: every sclera reading is expressed RELATIVE to a reference white-point
 * sampled from elsewhere in the same frame (the brightest/most neutral sub-region
 * of the same sclera). This cancels out most shared ambient-light bias for free,
 * with zero extra steps from the worker. It is a deliberately simplified version
 * of the same principle published calibration-card and ambient-subtraction
 * techniques are built around — explicitly weaker than those, and that limitation
 * should be stated plainly, not hidden.
 *
 * LIMITATION (state this to evaluators): self-relative calibration corrects for
 * shared ambient tint but NOT for absolute exposure problems (e.g. a yellow-tinted
 * light source illuminating the whole face including the "reference" patch).
 * A physical calibration card remains more rigorous; this is the zero-friction
 * tradeoff version, suitable for a screening SIGNAL rather than a diagnosis.
 */

/**
 * Compute calibrated features from a raw sclera+reference HSL sample.
 * @param {{h:number,s:number,l:number}} sclera
 * @param {{h:number,s:number,l:number}} reference
 */
export function extractFeatures(sclera, reference) {
  // Hue distance from reference, wrapped correctly around the 360° circle
  const rawHueDiff = sclera.h - reference.h;
  const hueDiff = ((rawHueDiff + 180) % 360 + 360) % 360 - 180;

  // Saturation delta — jaundiced sclera is meaningfully more saturated (more "colored")
  // than a near-white reference patch; normal sclera should track close to reference.
  const satDelta = sclera.s - reference.s;

  // Lightness ratio — guards against pure exposure differences swamping the signal
  const lightnessRatio = reference.l === 0 ? 1 : sclera.l / reference.l;

  // "Yellowness index" — proximity of hue to the clinical yellow band (45-65°),
  // weighted by saturation (a yellow hue with near-zero saturation isn't meaningfully yellow)
  const yellowBandCenter = 55;
  const hueDistFromYellow = Math.min(
    Math.abs(sclera.h - yellowBandCenter),
    360 - Math.abs(sclera.h - yellowBandCenter)
  );
  const yellownessIndex = Math.max(0, (1 - hueDistFromYellow / 90)) * (sclera.s / 100);

  return {
    hueDiff: Number(hueDiff.toFixed(3)),
    satDelta: Number(satDelta.toFixed(3)),
    lightnessRatio: Number(lightnessRatio.toFixed(4)),
    yellownessIndex: Number(yellownessIndex.toFixed(4)),
  };
}

/** Convert the engine's internal feature object into a flat array, fixed order — used by the classifier */
export function featuresToVector(features) {
  return [features.hueDiff, features.satDelta, features.lightnessRatio, features.yellownessIndex];
}

export const FEATURE_NAMES = ["hueDiff", "satDelta", "lightnessRatio", "yellownessIndex"];