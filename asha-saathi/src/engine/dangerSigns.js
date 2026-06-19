/**
 * dangerSigns.js
 * IMNCI Danger Signs Database — multilingual version.
 *
 * Labels are no longer hardcoded here. Call getDangerSigns(langKey) to get
 * the full array with labels in the requested language.
 * The raw SIGN_DEFS array holds only the stable structural data (id, tier, category).
 */
import { getLang } from "./languageConfig";

/** Stable structural definitions — never changes regardless of language */
export const SIGN_DEFS = [
  // RED
  { id: "not_able_to_drink",        tier: "RED",    category: "general" },
  { id: "vomits_everything",         tier: "RED",    category: "general" },
  { id: "convulsions",               tier: "RED",    category: "general" },
  { id: "lethargic_unconscious",     tier: "RED",    category: "general" },
  { id: "chest_indrawing",           tier: "RED",    category: "respiratory" },
  { id: "stridor",                   tier: "RED",    category: "respiratory" },
  { id: "severe_dehydration",        tier: "RED",    category: "dehydration" },
  { id: "blood_in_stool",            tier: "RED",    category: "diarrhea" },
  { id: "high_fever_with_stiff_neck",tier: "RED",    category: "fever" },
  { id: "bulging_fontanelle",        tier: "RED",    category: "infant" },
  // YELLOW
  { id: "fast_breathing",            tier: "YELLOW", category: "respiratory" },
  { id: "some_dehydration",          tier: "YELLOW", category: "dehydration" },
  { id: "fever_no_stiff_neck",       tier: "YELLOW", category: "fever" },
  { id: "ear_pain_discharge",        tier: "YELLOW", category: "ear" },
  { id: "persistent_diarrhea",       tier: "YELLOW", category: "diarrhea" },
  { id: "low_weight",                tier: "YELLOW", category: "nutrition" },
  { id: "pallor",                    tier: "YELLOW", category: "general" },
  // GREEN
  { id: "mild_fever_only",               tier: "GREEN", category: "fever" },
  { id: "mild_cough_no_fast_breathing",  tier: "GREEN", category: "respiratory" },
  { id: "mild_diarrhea_no_dehydration",  tier: "GREEN", category: "diarrhea" },
];

/**
 * Returns the full DANGER_SIGNS array with labels in the given language.
 * Falls back to English for any missing labels.
 * @param {string} langKey - e.g. "hi", "mr", "ta", "en"
 */
export function getDangerSigns(langKey = "en") {
  const langSigns = getLang(langKey).signs;
  const fallback  = getLang("en").signs;
  return SIGN_DEFS.map((def) => ({
    ...def,
    label: langSigns[def.id] || fallback[def.id] || def.id,
  }));
}

/**
 * Legacy export for any component that hasn't been updated yet.
 * Returns English labels so nothing breaks during migration.
 */
export const DANGER_SIGNS = getDangerSigns("en");