/**
 * IMNCI Danger Signs Database
 * Source: WHO Integrated Management of Neonatal and Childhood Illness (IMNCI) protocol
 * Each sign maps to a severity tier. RED signs are general danger signs requiring
 * immediate referral regardless of other symptoms.
 *
 * tier: "RED" | "YELLOW" | "GREEN"
 * id: stable identifier, used by the rule engine and NLP matcher — do not change once referenced elsewhere
 */

export const DANGER_SIGNS = [
  // ---- RED: General danger signs (any ONE present = immediate referral) ----
  { id: "not_able_to_drink", label: "Not able to drink or breastfeed", tier: "RED", category: "general" },
  { id: "vomits_everything", label: "Vomits everything", tier: "RED", category: "general" },
  { id: "convulsions", label: "Convulsions (fits) — now or recently", tier: "RED", category: "general" },
  { id: "lethargic_unconscious", label: "Lethargic or unconscious / hard to wake", tier: "RED", category: "general" },
  { id: "chest_indrawing", label: "Chest indrawing (chest pulls in when breathing)", tier: "RED", category: "respiratory" },
  { id: "stridor", label: "Stridor in calm child (noisy breathing at rest)", tier: "RED", category: "respiratory" },
  { id: "severe_dehydration", label: "Sunken eyes + skin pinch goes back very slowly", tier: "RED", category: "dehydration" },
  { id: "blood_in_stool", label: "Blood in stool", tier: "RED", category: "diarrhea" },
  { id: "high_fever_with_stiff_neck", label: "High fever with stiff neck", tier: "RED", category: "fever" },
  { id: "bulging_fontanelle", label: "Bulging or sunken fontanelle (infant)", tier: "RED", category: "infant" },

  // ---- YELLOW: Moderate signs (refer within 24h / treat + follow-up) ----
  { id: "fast_breathing", label: "Fast breathing", tier: "YELLOW", category: "respiratory" },
  { id: "some_dehydration", label: "Restless/irritable + sunken eyes (mild dehydration signs)", tier: "YELLOW", category: "dehydration" },
  { id: "fever_no_stiff_neck", label: "Fever without stiff neck", tier: "YELLOW", category: "fever" },
  { id: "ear_pain_discharge", label: "Ear pain or discharge", tier: "YELLOW", category: "ear" },
  { id: "persistent_diarrhea", label: "Diarrhea lasting 14 days or more", tier: "YELLOW", category: "diarrhea" },
  { id: "low_weight", label: "Visible severe wasting / very low weight for age", tier: "YELLOW", category: "nutrition" },
  { id: "pallor", label: "Palmar pallor (pale palms — possible anemia)", tier: "YELLOW", category: "general" },

  // ---- GREEN: Mild / no danger signs (manage locally, routine advice) ----
  { id: "mild_fever_only", label: "Mild fever, no other danger signs", tier: "GREEN", category: "fever" },
  { id: "mild_cough_no_fast_breathing", label: "Cough/cold, no fast breathing", tier: "GREEN", category: "respiratory" },
  { id: "mild_diarrhea_no_dehydration", label: "Loose stools, no signs of dehydration", tier: "GREEN", category: "diarrhea" },
];