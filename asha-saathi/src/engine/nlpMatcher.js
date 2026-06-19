/**
 * Rule-based NLP matcher.
 * Maps transcribed speech keywords to IMNCI danger sign IDs.
 * Handles both romanized Hindi/Marathi and English terms.
 */
const KEYWORD_MAP = [
  { keywords: ["bukhar", "fever", "bukhaar", "tap", "tapp"], signId: "fever_no_stiff_neck" },
  { keywords: ["saas", "saans", "breathing", "breath", "chest", "seena", "indrawing"], signId: "chest_indrawing" },
  { keywords: ["tez saas", "fast breath", "tezi", "rapid"], signId: "fast_breathing" },
  { keywords: ["ulti", "vomit", "sab ulti", "vomits everything"], signId: "vomits_everything" },
  { keywords: ["dast", "loose", "diarrhea", "loose stool", "potty"], signId: "mild_diarrhea_no_dehydration" },
  { keywords: ["fits", "seizure", "convulsion", "jhatkay", "jhatke"], signId: "convulsions" },
  { keywords: ["behosh", "unconscious", "lethargic", "neend", "nahi uth"], signId: "lethargic_unconscious" },
  { keywords: ["pi nahi", "drink nahi", "breastfeed", "dudh nahi", "pee nahi"], signId: "not_able_to_drink" },
  { keywords: ["khoon", "blood", "stool mein khoon", "blood stool"], signId: "blood_in_stool" },
  { keywords: ["gardan", "stiff neck", "gardan akad", "neck stiff"], signId: "high_fever_with_stiff_neck" },
  { keywords: ["aankhein andar", "sunken eyes", "aankhein", "dehydration"], signId: "some_dehydration" },
  { keywords: ["awaaz", "stridor", "noise breath", "noisy"], signId: "stridor" },
  { keywords: ["kaan", "ear", "kan dard", "discharge"], signId: "ear_pain_discharge" },
  { keywords: ["pale", "safed haath", "pallor", "anemia"], signId: "pallor" },
  { keywords: ["wajan nahi", "thin", "wasting", "low weight", "kam wajan"], signId: "low_weight" },
];

/**
 * @param {string} transcript - raw text from Whisper
 * @returns {string[]} array of matched danger sign IDs
 */
export function matchSymptoms(transcript) {
  if (!transcript) return [];
  const lower = transcript.toLowerCase();
  const matched = [];

  for (const rule of KEYWORD_MAP) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      if (!matched.includes(rule.signId)) {
        matched.push(rule.signId);
      }
    }
  }
  return matched;
}