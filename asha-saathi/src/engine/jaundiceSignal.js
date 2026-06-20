/**
 * jaundiceSignal.js
 * Bridges CaptureGuide.jsx's segmentation output to the trained jaundice
 * classifier, and formats the result to look exactly like the sign objects
 * triageEngine.js already works with: { id, label, tier }.
 *
 * INTEGRATION PHILOSOPHY: triageEngine.js's runTriage() is untouched. It stays
 * a pure function over IMNCI danger-sign IDs, exactly as tested and demoed.
 * This module produces a STANDALONE sign-shaped result from the eye-photo
 * pathway, which the screen-level code (not the engine) combines with the
 * IMNCI result using the same worst-tier-wins rule already used everywhere
 * else in the app. This keeps the tested triage core untouched and keeps the
 * jaundice pathway swappable/removable without touching engine code.
 *
 * TIER MAPPING NOTE: the classifier's output classes are NONE/YELLOW/RED
 * (see jaundiceClassifier.js). triageEngine.js's tiers are RED/YELLOW/GREEN
 * (no "NONE" — GREEN is the lowest tier, not an absence of data). NONE here
 * means "no jaundice signal detected," which maps to GREEN: nothing to flag,
 * lowest urgency — same meaning, different label by convention of each module.
 */
import { extractFeatures } from "./colorFeatures.js";
import { classify } from "./jaundiceClassifier.js";

const CLASSIFIER_TO_TRIAGE_TIER = {
  NONE: "GREEN",
  YELLOW: "YELLOW",
  RED: "RED",
};

const SIGN_LABELS = {
  hi: {
    RED: "आँख में पीलापन — संभावित पीलिया (तीव्र)",
    YELLOW: "आँख में हल्का पीलापन — पीलिया जांच आवश्यक",
    GREEN: "आँख का रंग सामान्य",
  },
  mr: {
    RED: "डोळ्यात पिवळेपणा — कावीळ संभाव्य (तीव्र)",
    YELLOW: "डोळ्यात सौम्य पिवळेपणा — कावीळ तपासणी आवश्यक",
    GREEN: "डोळ्याचा रंग सामान्य",
  },
  en: {
    RED: "Scleral yellowing — possible jaundice (marked)",
    YELLOW: "Mild scleral yellowing — jaundice screening recommended",
    GREEN: "Eye coloring within normal range",
  },
};

/**
 * Run the full classification pipeline on a CaptureGuide result.
 * @param {object} trainedModel - output of trainClassifier() / a loaded model JSON
 * @param {object} captureResult - the object CaptureGuide.jsx hands to onCapture()
 * @param {string} langKey
 * @returns {{
 *   success: boolean,
 *   sign: {id: string, label: string, tier: string} | null,
 *   confidence: number | null,
 *   probabilities: object | null,
 *   attribution: array | null,
 *   reason?: string
 * }}
 */
export function getJaundiceSign(trainedModel, captureResult, langKey = "hi") {
  const seg = captureResult?.segmentation;

  if (!seg || !seg.success) {
    return {
      success: false,
      sign: null,
      confidence: null,
      probabilities: null,
      attribution: null,
      reason: seg?.reason || "no_segmentation_result",
    };
  }

  const features = extractFeatures(seg.scleraHsl, seg.referenceHsl);
  const result = classify(trainedModel, features);

  const triageTier = CLASSIFIER_TO_TRIAGE_TIER[result.predictedTier] || "GREEN";
  const labels = SIGN_LABELS[langKey] || SIGN_LABELS.en;

  // GREEN/normal results still produce a sign object (consistent shape), but
  // screen-level code should typically NOT add it to citedSigns the same way
  // a positive finding would — see usage note below. We return it regardless
  // so the caller has full information (confidence, attribution) even for a
  // negative screening result, useful for the report's "Additional Observations."
  const sign = {
    id: "eye_screening_jaundice",
    label: labels[triageTier],
    tier: triageTier,
  };

  return {
    success: true,
    sign,
    confidence: result.confidence,
    probabilities: result.probabilities,
    attribution: result.attribution,
  };
}

/**
 * Convenience: combine an IMNCI triage result with a jaundice screening result
 * using the same worst-tier-wins rule triageEngine.js uses internally. Does NOT
 * modify either input — returns a new combined view.
 *
 * Usage pattern at the screen level:
 *   const imnciResult = runTriage(selectedSignIds);
 *   const jaundice = getJaundiceSign(model, captureResult, langKey);
 *   const combined = combineWithJaundiceSignal(imnciResult, jaundice);
 *
 * @param {object} imnciResult - output of runTriage()
 * @param {object} jaundiceResult - output of getJaundiceSign()
 * @param {object} opts - { includeGreenInCitedSigns: boolean } — whether a
 *   normal/GREEN eye-screening result should still appear in citedSigns (off
 *   by default, since GREEN signs aren't surfaced for IMNCI either — see
 *   triageEngine.js's own GREEN-tier handling, which only cites GREEN signs
 *   when nothing else was selected at all)
 */
const TIER_RANK = { RED: 0, YELLOW: 1, GREEN: 2 };

export function combineWithJaundiceSignal(imnciResult, jaundiceResult, opts = {}) {
  const { includeGreenInCitedSigns = false } = opts;

  if (!jaundiceResult?.success || !jaundiceResult.sign) {
    // No usable eye-screening result — pass IMNCI result through unchanged,
    // but flag that the eye screen was attempted and failed, so the worker
    // knows the absence isn't a clean "didn't try."
    return {
      ...imnciResult,
      eyeScreening: { attempted: true, success: false, reason: jaundiceResult?.reason },
    };
  }

  const jaundiceTier = jaundiceResult.sign.tier;
  const worseTierWins = TIER_RANK[jaundiceTier] < TIER_RANK[imnciResult.tier];

  const shouldCite = jaundiceTier !== "GREEN" || includeGreenInCitedSigns;
  const citedSigns = shouldCite
    ? [...imnciResult.citedSigns, jaundiceResult.sign]
    : imnciResult.citedSigns;

  if (!worseTierWins) {
    // IMNCI result is equal or more urgent — keep its tier/label/timeframe,
    // but still surface the eye-screening finding in citedSigns if positive.
    return {
      ...imnciResult,
      citedSigns,
      eyeScreening: {
        attempted: true,
        success: true,
        tier: jaundiceTier,
        confidence: jaundiceResult.confidence,
        sign: jaundiceResult.sign,
      },
    };
  }

  // Jaundice screen is MORE urgent than the IMNCI checklist result — it now
  // determines the overall tier, same cascade rule runTriage() uses internally.
  const TIER_LABELS = {
    RED: "Refer immediately",
    YELLOW: "Refer within 24 hours",
  };
  const TIER_TIMEFRAMES = {
    RED: "Refer NOW — emergency",
    YELLOW: "Refer within 24h",
  };

  return {
    tier: jaundiceTier,
    label: TIER_LABELS[jaundiceTier],
    citedSigns,
    referralTimeframe: TIER_TIMEFRAMES[jaundiceTier],
    eyeScreening: {
      attempted: true,
      success: true,
      tier: jaundiceTier,
      confidence: jaundiceResult.confidence,
      sign: jaundiceResult.sign,
      droveClassification: true,
    },
  };
}