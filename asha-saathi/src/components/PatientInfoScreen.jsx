import { getLang } from "../engine/languageConfig";

const s = {
  page: { minHeight: "100vh", background: "#0a0f1e", padding: "0" },
  topBar: { padding: "20px 24px", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", gap: "12px" },
  backBtn: { background: "none", border: "1px solid #374151", color: "#9ca3af", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "14px" },
  title: { fontSize: "18px", fontWeight: "700", color: "#f9fafb" },
  body: { padding: "28px 24px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" },
  section: { marginBottom: "28px" },
  input: { width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid #374151", background: "#111827", color: "#f9fafb", fontSize: "16px", outline: "none", boxSizing: "border-box" },
  optionRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
  optionBtn: (selected) => ({
    flex: 1, minWidth: "80px", padding: "14px 10px", borderRadius: "12px",
    border: `2px solid ${selected ? "#3b82f6" : "#374151"}`,
    background: selected ? "#1d3a6e" : "#111827",
    color: selected ? "#60a5fa" : "#9ca3af",
    fontSize: "15px", fontWeight: "600", cursor: "pointer", textAlign: "center",
  }),
  divider: { height: "1px", background: "#1f2937", margin: "8px 0 28px" },
  actionSection: { display: "flex", flexDirection: "column", gap: "12px" },
  primaryBtn: { width: "100%", padding: "16px", borderRadius: "14px", background: "#3b82f6", color: "white", border: "none", fontSize: "17px", fontWeight: "700", cursor: "pointer" },
  secondaryBtn: { width: "100%", padding: "16px", borderRadius: "14px", background: "#111827", color: "#9ca3af", border: "1px solid #374151", fontSize: "17px", fontWeight: "600", cursor: "pointer" },
};

export default function PatientInfoScreen({ langKey = "hi", onBack, onStartVoice, onSkipToChecklist, patientMeta, setPatientMeta }) {
  const ui = getLang(langKey).ui;

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={onBack}>← {ui.backToChecklist?.split("·")[0]?.trim() || "Back"}</button>
        <span style={s.title}>{ui.patientName?.replace(" (Optional)", "").replace(" (वैकल्पिक)", "").replace(" (ऐच्छिक)", "") || "Patient Info"}</span>
      </div>

      <div style={s.body}>
        <div style={s.section}>
          <div style={s.label}>{ui.patientName}</div>
          <input
            style={s.input}
            placeholder={ui.patientNamePlaceholder}
            value={patientMeta.name || ""}
            onChange={(e) => setPatientMeta((p) => ({ ...p, name: e.target.value }))}
          />
        </div>

        <div style={s.section}>
          <div style={s.label}>{ui.ageGroup}</div>
          <div style={s.optionRow}>
            {ui.ageGroups.map((g) => (
              <button key={g} style={s.optionBtn(patientMeta.age === g)} onClick={() => setPatientMeta((p) => ({ ...p, age: g }))}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div style={s.section}>
          <div style={s.label}>{ui.gender}</div>
          <div style={s.optionRow}>
            {[ui.male, ui.female].map((g) => (
              <button key={g} style={s.optionBtn(patientMeta.sex === g)} onClick={() => setPatientMeta((p) => ({ ...p, sex: g }))}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div style={s.divider} />

        <div style={s.actionSection}>
          <button style={s.primaryBtn} onClick={onStartVoice}>{ui.startVoice}</button>
          <button style={s.secondaryBtn} onClick={onSkipToChecklist}>{ui.skipChecklist}</button>
        </div>
      </div>
    </div>
  );
}