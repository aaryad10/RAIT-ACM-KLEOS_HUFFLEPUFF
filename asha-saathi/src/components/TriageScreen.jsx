import { useState } from "react";
import { DANGER_SIGNS } from "../engine/dangerSigns";
import { runTriage } from "../engine/triageEngine";
import { rankQueue, createPatientRecord } from "../engine/priorityQueue";
import { generateReferralReport } from "../engine/referralReport";
import ReferralReport from "./ReferralReport";
import VoiceInput from "./VoiceInput";
import { matchSymptoms } from "../engine/nlpMatcher";

const TIER_COLORS = { RED: "#ef4444", YELLOW: "#f59e0b", GREEN: "#22c55e" };
const TIER_BG = { RED: "#450a0a", YELLOW: "#451a03", GREEN: "#052e16" };

const s = {
  page: { minHeight: "100vh", padding: "20px 16px", maxWidth: "520px", margin: "0 auto" },
  header: { marginBottom: "24px" },
  appName: { fontSize: "22px", fontWeight: "800", color: "#f9fafb", letterSpacing: "-0.5px" },
  tagline: { fontSize: "12px", color: "#9ca3af", marginTop: "2px" },
  queueBtn: {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "8px 14px", borderRadius: "8px", border: "1px solid #374151",
    background: "#1f2937", color: "#f9fafb", cursor: "pointer",
    fontSize: "13px", fontWeight: "500", marginBottom: "16px",
  },
  metaRow: { display: "flex", gap: "10px", marginBottom: "16px" },
  input: {
    flex: 1, padding: "10px 12px", borderRadius: "8px",
    border: "1px solid #374151", background: "#111827",
    color: "#f9fafb", fontSize: "14px", outline: "none",
  },
  select: {
    flex: 1, padding: "10px 12px", borderRadius: "8px",
    border: "1px solid #374151", background: "#111827",
    color: "#f9fafb", fontSize: "14px", outline: "none",
  },
  sectionLabel: { fontSize: "11px", fontWeight: "600", color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" },
  signList: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "24px" },
  signItem: (selected, tier) => ({
    display: "flex", alignItems: "center", gap: "10px",
    padding: "11px 14px", borderRadius: "10px", cursor: "pointer",
    border: `1px solid ${selected ? TIER_COLORS[tier] : "#374151"}`,
    background: selected ? TIER_BG[tier] : "#111827",
    transition: "all 0.15s ease",
  }),
  tierDot: (tier) => ({
    width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
    background: TIER_COLORS[tier],
  }),
  signLabel: { fontSize: "14px", color: "#f9fafb", lineHeight: "1.4" },
  submitBtn: {
    width: "100%", padding: "14px", borderRadius: "12px",
    background: "#3b82f6", color: "white", border: "none",
    fontSize: "16px", fontWeight: "600", cursor: "pointer",
  },
};

export default function TriageScreen() {
  const [selectedSigns, setSelectedSigns] = useState([]);
  const [result, setResult] = useState(null);
  const [queue, setQueue] = useState([]);
  const [view, setView] = useState("checklist");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [reportPatient, setReportPatient] = useState(null);

  function toggleSign(id) {
    setSelectedSigns((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function handleSubmit() {
    setResult(runTriage(selectedSigns));
    setView("result");
  }

  function handleAddToQueue() {
    setQueue((prev) => [...prev, createPatientRecord(result, { age, sex })]);
    setView("queue");
  }

  function handleAddNextPatient() {
    setSelectedSigns([]); setResult(null); setAge(""); setSex("");
    setView("checklist");
  }

  if (view === "report") {
    return <ReferralReport report={generateReferralReport(reportPatient)} onBack={() => setView("queue")} />;
  }

  // ---- RESULT SCREEN — full bleed color ----
  if (view === "result") {
    const color = TIER_COLORS[result.tier];
    const bg = TIER_BG[result.tier];
    return (
      <div style={{ minHeight: "100vh", background: bg, padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: color, marginBottom: "24px", boxShadow: `0 0 40px ${color}88` }} />
        <div style={{ fontSize: "48px", fontWeight: "800", color, letterSpacing: "-1px", marginBottom: "8px" }}>{result.tier}</div>
        <div style={{ fontSize: "20px", fontWeight: "600", color: "#f9fafb", marginBottom: "6px" }}>{result.label}</div>
        <div style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "32px" }}>{result.referralTimeframe}</div>

        {result.citedSigns.length > 0 && (
          <div style={{ width: "100%", maxWidth: "400px", background: "#ffffff11", borderRadius: "12px", padding: "16px", marginBottom: "32px" }}>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Signs observed</div>
            {result.citedSigns.map((sign) => (
              <div key={sign.id} style={{ fontSize: "14px", color: "#f9fafb", padding: "4px 0", borderBottom: "1px solid #ffffff11" }}>{sign.label}</div>
            ))}
          </div>
        )}

        <button onClick={handleAddToQueue} style={{ width: "100%", maxWidth: "400px", padding: "14px", borderRadius: "12px", background: color, color: "white", border: "none", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}>
          Add to Queue
        </button>
      </div>
    );
  }

  // ---- QUEUE VIEW ----
  if (view === "queue") {
    const ranked = rankQueue(queue);
    return (
      <div style={s.page}>
        <div style={s.header}>
          <div style={s.appName}>ASHA Saathi</div>
          <div style={s.tagline}>Patient Queue</div>
        </div>

        <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "16px" }}>{ranked.length} patient{ranked.length !== 1 ? "s" : ""} • ranked by urgency</div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
          {ranked.map((p, i) => (
            <div key={p.id} style={{ borderRadius: "12px", border: `1px solid ${TIER_COLORS[p.tier]}44`, background: TIER_BG[p.tier], padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: TIER_COLORS[p.tier], flexShrink: 0 }} />
                <span style={{ fontWeight: "700", color: TIER_COLORS[p.tier], fontSize: "13px" }}>#{i + 1} {p.tier}</span>
                {(p.meta?.sex || p.meta?.age) && (
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>· {[p.meta.sex, p.meta.age].filter(Boolean).join(", ")}</span>
                )}
                <span style={{ marginLeft: "auto", fontSize: "11px", color: "#6b7280" }}>{new Date(p.timestamp).toLocaleTimeString()}</span>
              </div>
              <div style={{ fontSize: "13px", color: "#d1d5db", marginBottom: "10px", paddingLeft: "20px" }}>
                {p.citedSigns.map(s => s.label).join(" · ") || "No signs cited"}
              </div>
              <button onClick={() => { setReportPatient(p); setView("report"); }}
                style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${TIER_COLORS[p.tier]}66`, background: "transparent", color: TIER_COLORS[p.tier], fontSize: "12px", fontWeight: "500", cursor: "pointer" }}>
                View Report →
              </button>
            </div>
          ))}
        </div>

        <button onClick={handleAddNextPatient} style={s.submitBtn}>+ Add Next Patient</button>
      </div>
    );
  }

  // ---- CHECKLIST ----
  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.appName}>ASHA Saathi</div>
        <div style={s.tagline}>Offline triage · WHO IMNCI protocol</div>
      </div>

      <VoiceInput onTranscript={(text) => {
        const matched = matchSymptoms(text);
        if (matched.length > 0) setSelectedSigns((prev) => [...new Set([...prev, ...matched])]);
      }} />

      {queue.length > 0 && (
        <button style={s.queueBtn} onClick={() => setView("queue")}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6" }} />
          View Queue ({queue.length})
        </button>
      )}

      <div style={s.metaRow}>
        <input style={s.input} type="text" placeholder="Age (e.g. 3 yrs)" value={age} onChange={(e) => setAge(e.target.value)} />
        <select style={s.select} value={sex} onChange={(e) => setSex(e.target.value)}>
          <option value="">Sex</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>

      <div style={s.sectionLabel}>Select observed danger signs</div>
      <div style={s.signList}>
        {DANGER_SIGNS.map((sign) => (
          <label key={sign.id} style={s.signItem(selectedSigns.includes(sign.id), sign.tier)}>
            <div style={s.tierDot(sign.tier)} />
            <span style={s.signLabel}>{sign.label}</span>
            <input type="checkbox" checked={selectedSigns.includes(sign.id)} onChange={() => toggleSign(sign.id)} style={{ marginLeft: "auto", accentColor: TIER_COLORS[sign.tier], width: "16px", height: "16px" }} />
          </label>
        ))}
      </div>

      <button onClick={handleSubmit} style={s.submitBtn}>Assess Patient →</button>
    </div>
  );
}