/**
 * nlpMatcher.js — Multilingual symptom matcher
 *
 * Matches transcribed speech (in any supported language) to IMNCI danger sign IDs.
 * Keywords from ALL languages are merged at runtime so a single matchSymptoms()
 * call works regardless of which language Whisper transcribed in.
 *
 * To add a new sign keyword for any language, update languageConfig.js — not here.
 */
import { LANGUAGES } from "./languageConfig";

/**
 * Build a merged keyword map from all languages.
 * Structure: { signId: Set<string> }
 */
function buildMergedKeywordMap() {
  const map = {};
  for (const lang of Object.values(LANGUAGES)) {
    for (const [signId, keywords] of Object.entries(lang.keywords)) {
      if (!map[signId]) map[signId] = new Set();
      for (const kw of keywords) {
        map[signId].add(kw.toLowerCase());
      }
    }
  }
  return map;
}

// Built once at module load — no runtime cost per call
const MERGED_KEYWORD_MAP = buildMergedKeywordMap();

/**
 * Match a transcript against all known symptom keywords across all languages.
 * @param {string} transcript - raw text from Whisper (any language)
 * @returns {string[]} array of matched IMNCI danger sign IDs
 */
export function matchSymptoms(transcript) {
  if (!transcript) return [];
  const lower = transcript.toLowerCase();
  const matched = [];

  for (const [signId, keywords] of Object.entries(MERGED_KEYWORD_MAP)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        if (!matched.includes(signId)) matched.push(signId);
        break; // one match per sign is enough
      }
    }
  }
  return matched;
}