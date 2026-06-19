import { useState } from "react";
import { DANGER_SIGNS } from "../engine/dangerSigns";
import VoiceInput from "./VoiceInput";
import { matchSymptoms } from "../engine/nlpMatcher";

const TIER_COLORS = { RED: "#ef4444", YELLOW: "#f59e0b", GREEN: "#22c55e" };
const TIER_BG = { RED: "#450a0a", YELLOW: "#451a03", GREEN: "#052e16" };

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
  titleBlock: {},
  title: { fontSize: "17px", fontWeight: "700", color: "#f9fafb" },
  subtitle: { fontSize: "12px", color: "#6b7280" },
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

const CATEGORIES = {
  general: "General Danger Signs",
  respiratory: "Breathing",
  dehydration: "Dehydration",
  fever: "Fever",
  diarrhea: "Diarrhoea",
  nutrition: "Nutrition",
  ear: "Ear",
  infant: "Infant (0–12 months)",
};

export default function ChecklistScreen({ onBack, onSubmit, showVoice = true }) {
  const [selected, setSelected] = useState([]);

  function toggle(id) {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  const grouped = Object.entries(CATEGORIES).map(([cat, label]) => ({
    label,
    signs: DANGER_SIGNS.filter((s) => s.category === cat),
  })).filter((g) => g.signs.length > 0);

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={onBack}>← Back</button>
        <div style={s.titleBlock}>
          <div style={s.title}>Danger Sign Checklist</div>
          <div style={s.subtitle}>WHO IMNCI Protocol</div>
        </div>
      </div>

      <div style={s.body}>
        {showVoice && (
          <VoiceInput onTranscript={(text) => {
            const matched = matchSymptoms(text);
            if (matched.length > 0)
              setSelected((prev) => [...new Set([...prev, ...matched])]);
          }} />
        )}

        <div style={s.selectedBar}>
          <span style={s.selectedText}>
            {selected.length === 0 ? "No signs selected" : `${selected.length} sign${selected.length > 1 ? "s" : ""} selected`}
          </span>
          {selected.length > 0 && (
            <button style={s.clearBtn} onClick={() => setSelected([])}>Clear all</button>
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
      </div>

      <div style={s.bottomBar}>
        <button
          style={s.assessBtn(selected.length > 0)}
          disabled={selected.length === 0}
          onClick={() => onSubmit(selected)}
        >
          {selected.length > 0 ? `Assess Patient →` : "Select at least one sign"}
        </button>
      </div>
    </div>
  );
}