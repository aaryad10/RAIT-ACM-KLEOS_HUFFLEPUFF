import { useState } from "react";
import { getDangerSigns } from "../engine/dangerSigns";
import VoiceInput from "./VoiceInput";
import { matchSymptoms } from "../engine/nlpMatcher";
import { getLang } from "../engine/languageConfig";

const TIER_COLORS = { RED: "#ef4444", YELLOW: "#f59e0b", GREEN: "#22c55e" };
const TIER_BG     = { RED: "#450a0a", YELLOW: "#451a03", GREEN: "#052e16" };

const CATEGORY_KEYS = [
  "general", "respiratory", "dehydration", "fever",
  "diarrhea", "nutrition", "ear", "infant",
];

const CATEGORY_LABELS = {
  general:     "General Danger Signs",
  respiratory: "Breathing",
  dehydration: "Dehydration",
  fever:       "Fever",
  diarrhea:    "Diarrhoea",
  nutrition:   "Nutrition",
  ear:         "Ear",
  infant:      "Infant (0–12 months)",
};

// Unmatched symptom note — shown when voice heard something but nothing matched
const UNMATCHED_NOTE = {
  hi: { label: "अन्य लक्षण (यादी में नहीं)", placeholder: "जो लक्षण ऊपर नहीं मिला वो यहाँ लिखें..." },
  mr: { label: "इतर लक्षणे (यादीत नाही)", placeholder: "वरील यादीत न मिळालेले लक्षण येथे लिहा..." },
  ta: { label: "மற்ற அறிகுறிகள் (பட்டியலில் இல்லை)", placeholder: "பட்டியலில் இல்லாத அறிகுறியை இங்கே எழுதுங்கள்..." },
  te: { label: "ఇతర లక్షణాలు (జాబితాలో లేవు)", placeholder: "జాబితాలో లేని లక్షణాన్ని ఇక్కడ రాయండి..." },
  kn: { label: "ಇತರ ಚಿಹ್ನೆಗಳು (ಪಟ್ಟಿಯಲ್ಲಿ ಇಲ್ಲ)", placeholder: "ಪಟ್ಟಿಯಲ್ಲಿ ಇಲ್ಲದ ಚಿಹ್ನೆ ಇಲ್ಲಿ ಬರೆಯಿರಿ..." },
  bn: { label: "অন্যান্য উপসর্গ (তালিকায় নেই)", placeholder: "তালিকায় না থাকা উপসর্গ এখানে লিখুন..." },
  gu: { label: "અન્ય ચિહ્નો (યાદીમાં નથી)", placeholder: "યાદીમાં ન મળ્યું તે ચિહ્ન અહીં લખો..." },
  en: { label: "Other symptoms (not in list)", placeholder: "Note any symptom not found above..." },
};

const s = {
  page: { minHeight: "100vh", background: "#0a0f1e", paddingBottom: "100px" },
  topBar: {
    padding: "20px 24px", borderBottom: "1px solid #1f2937",
    display: "flex", alignItems: "center", gap: "12px",
    position: "sticky", top: 0, background: "#0a0f1e", zIndex: 10,
  },
  backBtn: {
    background: "none", border: "1px solid #374151", color: "#9ca3af",
    borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "14px",
  },
  body: { padding: "20px 24px" },
  selectedBar: {
    background: "#1f2937", borderRadius: "10px", padding: "10px 14px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: "16px",
  },
  selectedText: { fontSize: "13px", color: "#9ca3af" },
  clearBtn: {
    background: "none", border: "none", color: "#6b7280",
    fontSize: "13px", cursor: "pointer", padding: "0",
  },
  sectionLabel: {
    fontSize: "11px", fontWeight: "600", color: "#6b7280",
    textTransform: "uppercase", letterSpacing: "0.1em",
    margin: "20px 0 10px",
  },
  signGrid: { display: "flex", flexDirection: "column", gap: "8px" },
  signCard: (selected, tier) => ({
    display: "flex", alignItems: "center", gap: "12px",
    padding: "14px 16px", borderRadius: "12px", cursor: "pointer",
    border: `1.5px solid ${selected ? TIER_COLORS[tier] : "#1f2937"}`,
    background: selected ? TIER_BG[tier] : "#111827",
    transition: "all 0.12s",
  }),
  dot: (tier) => ({
    width: "10px", height: "10px", borderRadius: "50%",
    background: TIER_COLORS[tier], flexShrink: 0,
  }),
  signText: { fontSize: "15px", color: "#f9fafb", flex: 1, lineHeight: "1.4" },
  checkbox: (tier) => ({
    width: "20px", height: "20px", accentColor: TIER_COLORS[tier], flexShrink: 0,
  }),
  unmatchedBox: {
    marginTop: "24px", padding: "16px", borderRadius: "12px",
    background: "#111827", border: "1px solid #374151",
  },
  unmatchedLabel: {
    fontSize: "11px", fontWeight: "600", color: "#6b7280",
    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px",
  },
  unmatchedHint: {
    fontSize: "12px", color: "#f59e0b", marginBottom: "10px",
    display: "flex", alignItems: "center", gap: "6px",
  },
  unmatchedInput: {
    width: "100%", padding: "12px 14px", borderRadius: "10px",
    border: "1px solid #374151", background: "#0a0f1e",
    color: "#f9fafb", fontSize: "14px", outline: "none",
    resize: "vertical", minHeight: "60px", boxSizing: "border-box",
    fontFamily: "inherit",
  },
  bottomBar: {
    position: "fixed", bottom: 0, left: 0, right: 0,
    padding: "16px 24px", background: "#0a0f1e",
    borderTop: "1px solid #1f2937",
  },
  assessBtn: (hasSelected) => ({
    width: "100%", padding: "16px", borderRadius: "14px",
    background: hasSelected ? "#3b82f6" : "#1f2937",
    color: hasSelected ? "white" : "#6b7280",
    border: "none", fontSize: "17px", fontWeight: "700",
    cursor: hasSelected ? "pointer" : "not-allowed",
    transition: "all 0.15s",
  }),
};

export default function ChecklistScreen({ langKey = "hi", onBack, onSubmit, showVoice = true }) {
  const [selected, setSelected]           = useState([]);
  const [unmatchedNote, setUnmatchedNote] = useState("");
  const [lastTranscript, setLastTranscript] = useState("");
  const [voiceMatchedNothing, setVoiceMatchedNothing] = useState(false);

  const ui = getLang(langKey).ui;
  const DANGER_SIGNS = getDangerSigns(langKey);
  const noteStrings = UNMATCHED_NOTE[langKey] || UNMATCHED_NOTE.en;

  function toggle(id) {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  function handleTranscript(text) {
    setLastTranscript(text);
    const matched = matchSymptoms(text);
    if (matched.length > 0) {
      setSelected((prev) => [...new Set([...prev, ...matched])]);
      setVoiceMatchedNothing(false);
    } else {
      // Voice heard something but nothing matched IMNCI list
      setVoiceMatchedNothing(true);
      // Pre-fill the unmatched note with the raw transcript so worker can edit it
      if (text && text.trim()) {
        setUnmatchedNote((prev) => prev ? prev + "; " + text.trim() : text.trim());
      }
    }
  }

  const grouped = CATEGORY_KEYS.map((cat) => ({
    label: CATEGORY_LABELS[cat],
    signs: DANGER_SIGNS.filter((s) => s.category === cat),
  })).filter((g) => g.signs.length > 0);

  const canAssess = selected.length > 0 || unmatchedNote.trim().length > 0;

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={onBack}>← {ui.backToChecklist?.split("·")[0] || "Back"}</button>
        <div>
          <div style={{ fontSize: "17px", fontWeight: "700", color: "#f9fafb" }}>{ui.checklistTitle}</div>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>{ui.checklistSubtitle}</div>
        </div>
      </div>

      <div style={s.body}>
        {showVoice && (
          <VoiceInput
            langKey={langKey}
            onTranscript={handleTranscript}
          />
        )}

        <div style={s.selectedBar}>
          <span style={s.selectedText}>
            {selected.length === 0 ? ui.noSignsSelected : ui.signsSelected(selected.length)}
          </span>
          {selected.length > 0 && (
            <button style={s.clearBtn} onClick={() => { setSelected([]); setVoiceMatchedNothing(false); }}>
              {ui.clearAll}
            </button>
          )}
        </div>

        {grouped.map(({ label, signs }) => (
          <div key={label}>
            <div style={s.sectionLabel}>{label}</div>
            <div style={s.signGrid}>
              {signs.map((sign) => (
                <label key={sign.id} style={s.signCard(selected.includes(sign.id), sign.tier)}>
                  <div style={s.dot(sign.tier)} />
                  <span style={s.signText}>{sign.label}</span>
                  <input
                    type="checkbox"
                    checked={selected.includes(sign.id)}
                    onChange={() => toggle(sign.id)}
                    style={s.checkbox(sign.tier)}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}

        {/* Unmatched symptom note box */}
        <div style={s.unmatchedBox}>
          <div style={s.unmatchedLabel}>{noteStrings.label}</div>
          {voiceMatchedNothing && (
            <div style={s.unmatchedHint}>
              ⚠️ <span style={{ fontSize: "12px" }}>
                {langKey === "hi" ? "आवाज़ में लक्षण IMNCI सूची में नहीं मिला — नीचे नोट करें"
                 : langKey === "mr" ? "आवाजातील लक्षण यादीत नाही — खाली नोंद करा"
                 : "Voice symptom not in IMNCI list — note it below"}
              </span>
            </div>
          )}
          <textarea
            style={s.unmatchedInput}
            placeholder={noteStrings.placeholder}
            value={unmatchedNote}
            onChange={(e) => setUnmatchedNote(e.target.value)}
          />
        </div>
      </div>

      <div style={s.bottomBar}>
        <button
          style={s.assessBtn(canAssess)}
          disabled={!canAssess}
          onClick={() => onSubmit(selected, unmatchedNote.trim())}
        >
          {canAssess ? ui.assessPatient : ui.selectAtLeastOne}
        </button>
      </div>
    </div>
  );
}