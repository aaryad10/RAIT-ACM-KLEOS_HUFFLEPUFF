/**
 * scleraSynth.js
 * Procedural synthetic sclera patch generator for training the jaundice risk-flag classifier.
 *
 * WHY SYNTHETIC: No public dataset of jaundiced sclera images exists at usable scale
 * (largest clinical studies found: n=51 to n=110 patients, none publicly released).
 * Real "normal sclera" public datasets exist (e.g. SBVPI) but require manual download/
 * access requests. To keep this zero-cost and zero-download, we generate sclera-like
 * color patches procedurally and ground the color distributions in published clinical
 * thresholds rather than trying to synthesize photorealistic eyes.
 *
 * The classifier this feeds is a COLOR-SPACE classifier, not an image classifier —
 * it never learns "what an eye looks like." It learns a decision boundary over
 * Hue/Saturation/Lightness + blue-chromaticity features. That means procedurally
 * generated color patches are a legitimate training signal for it, unlike trying to
 * fake photorealistic eye photos for a CNN (which would NOT be legitimate).
 *
 * CLINICAL GROUNDING (see citations in accompanying README):
 * - Scleral icterus becomes clinically visible at serum bilirubin > 3 mg/dL.
 * - Normal control bilirubin in studies: ~0.77 ± 0.35 mg/dL
 * - Jaundiced patient bilirubin in studies: ~9.57 ± 7.11 mg/dL (wide severity range)
 * - Color shifts from pale yellow (mild) -> deep yellow -> greenish-yellow (severe/cholestatic)
 * - Blue-channel chromaticity is the most discriminative single channel (r = -0.73 with TSB)
 * - Hue in HSL space was used directly as a discriminating feature in at least one study
 */

// ---- Reference color anchors, expressed in HSL (h: 0-360, s: 0-100, l: 0-100) ----
// Normal sclera: near-white, very low saturation, high lightness.
// IMPORTANT: at low saturation, hue is nearly meaningless (a near-gray color has no
// real "hue" — this is a known property of HSL, not a modeling choice). We use a
// hue near the SAME neutral region as the reference patch (slight cool cast, as real
// sclera vasculature/tissue does skew faintly toward blue-white) rather than picking
// an arbitrary distant hue, which would inject a fake systematic signal at low-saturation
// that has nothing to do with real sclera color physics. This was caught during pipeline
// testing — an earlier version used h=200 here and it dominated the classifier with a
// non-physical signal, tanking accuracy to ~56%.
const NORMAL_HSL = { h: 210, s: 6, l: 92 };

// Mild jaundice (~3-8 mg/dL): pale yellow tint emerging.
const MILD_HSL = { h: 50, s: 25, l: 88 };

// Moderate jaundice (~8-15 mg/dL): clear yellow.
const MODERATE_HSL = { h: 48, s: 45, l: 80 };

// Severe / prolonged cholestatic (~15+ mg/dL): deep yellow shifting toward green-yellow.
const SEVERE_HSL = { h: 62, s: 55, l: 68 };

const SEVERITY_ANCHORS = [
  { label: "normal", bilirubinRange: [0.3, 1.4], hsl: NORMAL_HSL, riskTier: "NONE" },
  { label: "mild", bilirubinRange: [3.0, 8.0], hsl: MILD_HSL, riskTier: "YELLOW" },
  { label: "moderate", bilirubinRange: [8.0, 15.0], hsl: MODERATE_HSL, riskTier: "RED" },
  { label: "severe", bilirubinRange: [15.0, 25.0], hsl: SEVERE_HSL, riskTier: "RED" },
];

/** Gaussian-ish noise via Box-Muller, clamped */
function gaussianNoise(mean, stdDev) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Generate one synthetic sclera color sample around a clinical anchor point,
 * with realistic per-sample noise to simulate lighting/camera/individual variance.
 *
 * Noise budget is intentionally generous on lightness/saturation (camera exposure
 * and ambient light vary a lot) and tighter on hue (hue is the more stable signal
 * per the literature — blue chromaticity / hue correlated most strongly with TSB).
 */
function sampleAroundAnchor(anchor, { lightingNoise = 1.0 } = {}) {
  const h = clamp(gaussianNoise(anchor.hsl.h, 4 * lightingNoise), 0, 360);
  const s = clamp(gaussianNoise(anchor.hsl.s, 6 * lightingNoise), 0, 100);
  const l = clamp(gaussianNoise(anchor.hsl.l, 8 * lightingNoise), 40, 99);
  const bilirubin = anchor.bilirubinRange[0] +
    Math.random() * (anchor.bilirubinRange[1] - anchor.bilirubinRange[0]);

  return {
    hsl: { h, s, l },
    label: anchor.label,
    riskTier: anchor.riskTier,
    syntheticBilirubin: Number(bilirubin.toFixed(2)),
  };
}

/**
 * Generate a synthetic "captured frame" pair: a sclera patch sample AND a
 * same-frame reference patch (simulating the self-relative calibration approach —
 * the brightest/most neutral sub-region of the same sclera). The reference patch
 * has independent, smaller lighting noise since it's sampled from the same image.
 */
function generateFrame(anchor, opts) {
  const lightingNoise = 0.6 + Math.random() * 1.0; // simulate different capture conditions per "patient"

  // Shared ambient tint affects BOTH the sclera and the reference patch equally —
  // this shared bias is exactly what self-relative calibration is designed to cancel.
  // Drawn once per frame, then applied to both patches below.
  const ambientHueBias = gaussianNoise(0, 5 * lightingNoise);
  const ambientLightBias = gaussianNoise(0, 4 * lightingNoise);

  const sclera = sampleAroundAnchor(anchor, { lightingNoise });
  sclera.hsl.h = clamp(sclera.hsl.h + ambientHueBias, 0, 360);
  sclera.hsl.l = clamp(sclera.hsl.l + ambientLightBias, 30, 99);

  // REALISTIC CASE — uniform disease tint: for a meaningful fraction of samples,
  // jaundice colors the ENTIRE visible sclera evenly, including whatever patch
  // would be picked as "brightest." This is the realistic clinical case (bilirubin
  // deposits throughout tissue, doesn't spare bright regions) and is exactly the
  // scenario where pure self-relative (hueDiff-only) calibration fails — caught
  // during pipeline testing on a synthetic image where a uniformly jaundiced sclera
  // was misclassified as NONE because hueDiff read ~0. Modeling it here means the
  // classifier learns to lean on yellownessIndex (absolute clinical-band signal)
  // rather than over-trusting hueDiff (which only helps when the tint is UNEVEN,
  // e.g. true ambient lighting artifacts rather than a true systemic disease tint).
  const isUniformTint = anchor.label !== "normal" && Math.random() < 0.5;

  // Reference patch: a near-white region in the SAME frame.
  // - Normal case / non-uniform-tint case: anchored at the TRUE neutral color
  //   (NORMAL_HSL) + shared ambient bias, simulating ambient ARTIFACT only.
  // - Uniform-tint case: anchored at the SAME disease-affected color as the sclera
  //   sample, simulating a true systemic tint that affects the whole sclera evenly.
  const reference = isUniformTint
    ? {
        hsl: {
          h: clamp(sclera.hsl.h + gaussianNoise(0, 2), 0, 360),
          s: clamp(gaussianNoise(anchor.hsl.s, 3), 0, 100),
          l: clamp(sclera.hsl.l + gaussianNoise(3, 2), 30, 100), // reference is usually slightly brighter even within a uniform tint
        },
      }
    : {
        hsl: {
          h: clamp(NORMAL_HSL.h + ambientHueBias + gaussianNoise(0, 2), 0, 360),
          s: clamp(gaussianNoise(NORMAL_HSL.s, 2), 0, 100),
          l: clamp(gaussianNoise(NORMAL_HSL.l, 3) + ambientLightBias, 70, 100),
        },
      };

  return { sclera, reference, lightingNoise };
}

/**
 * Build a labeled synthetic dataset.
 * @param {number} samplesPerClass
 * @returns {Array<{features: object, label: string, riskTier: string, syntheticBilirubin: number}>}
 */
export function buildSyntheticDataset(samplesPerClass = 300) {
  const dataset = [];
  for (const anchor of SEVERITY_ANCHORS) {
    for (let i = 0; i < samplesPerClass; i++) {
      const frame = generateFrame(anchor);
      dataset.push({
        sclera: frame.sclera.hsl,
        reference: frame.reference.hsl,
        label: frame.sclera.label,
        riskTier: frame.sclera.riskTier,
        syntheticBilirubin: frame.sclera.syntheticBilirubin,
      });
    }
  }
  // Shuffle
  for (let i = dataset.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dataset[i], dataset[j]] = [dataset[j], dataset[i]];
  }
  return dataset;
}

export { SEVERITY_ANCHORS, NORMAL_HSL, MILD_HSL, MODERATE_HSL, SEVERE_HSL };