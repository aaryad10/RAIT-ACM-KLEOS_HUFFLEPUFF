import { useState } from "react";
import { DANGER_SIGNS } from "../engine/dangerSigns";
import { runTriage } from "../engine/triageEngine";
import { rankQueue, createPatientRecord } from "../engine/priorityQueue";
import { generateReferralReport } from "../engine/referralReport";
import ReferralReport from "./ReferralReport";
import VoiceInput from "./VoiceInput";
import { matchSymptoms } from "../engine/nlpMatcher";

const TIER_COLORS = {
  RED: "#d32f2f",
  YELLOW: "#f9a825",
  GREEN: "#2e7d32",
};

export default function TriageScreen() {
  const [selectedSigns, setSelectedSigns] = useState([]);
  const [result, setResult] = useState(null);
  const [queue, setQueue] = useState([]);
  const [view, setView] = useState("checklist"); // "checklist" | "result" | "queue" | "report"
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [reportPatient, setReportPatient] = useState(null);

  function toggleSign(id) {
    setSelectedSigns((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function handleSubmit() {
    const triageResult = runTriage(selectedSigns);
    setResult(triageResult);
    setView("result");
  }

  function handleAddToQueue() {
    const record = createPatientRecord(result, { age, sex });
    setQueue((prev) => [...prev, record]);
    setView("queue");
  }

  function handleAddNextPatient() {
    setSelectedSigns([]);
    setResult(null);
    setAge("");
    setSex("");
    setView("checklist");
  }

  // ---- REPORT VIEW ----
  if (view === "report") {
    const report = generateReferralReport(reportPatient);
    return <ReferralReport report={report} onBack={() => setView("queue")} />;
  }

  // ---- QUEUE VIEW ----
  if (view === "queue") {
    const ranked = rankQueue(queue);
    return (
      <div style={{ padding: "24px" }}>
        <h1>Patient Queue ({ranked.length})</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "600px" }}>
          {ranked.map((p, index) => (
            <div
              key={p.id}
              style={{
                padding: "14px",
                borderRadius: "8px",
                borderLeft: `6px solid ${TIER_COLORS[p.tier]}`,
                background: "#1e1e1e",
              }}
            >
              <strong>
                #{index + 1} — {p.tier}
              </strong>{" "}
              — {p.label}
              {p.meta?.age || p.meta?.sex ? (
                <span style={{ color: "#aaa" }}>
                  {" "}
                  ({[p.meta?.sex, p.meta?.age].filter(Boolean).join(", ")})
                </span>
              ) : null}
              <br />
              <small>
                {new Date(p.timestamp).toLocaleTimeString()} ·{" "}
                {p.citedSigns.map((s) => s.label).join(", ") || "No signs cited"}
              </small>
              <br />
              <button
                onClick={() => {
                  setReportPatient(p);
                  setView("report");
                }}
                style={{ marginTop: "8px", padding: "6px 14px" }}
              >
                View Referral Report
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddNextPatient}
          style={{ marginTop: "24px", padding: "12px 24px", fontSize: "16px" }}
        >
          + Add Next Patient
        </button>
      </div>
    );
  }

  // ---- RESULT SCREEN ----
  if (view === "result") {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <h1 style={{ color: TIER_COLORS[result.tier] }}>{result.tier}</h1>
        <h2>{result.label}</h2>
        <p>{result.referralTimeframe}</p>

        <h3>Danger signs observed:</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {result.citedSigns.length === 0 && <li>None</li>}
          {result.citedSigns.map((sign) => (
            <li key={sign.id}>{sign.label}</li>
          ))}
        </ul>

        <button
          onClick={handleAddToQueue}
          style={{ marginTop: "24px", padding: "12px 24px", fontSize: "16px" }}
        >
          Add to Queue
        </button>
      </div>
    );
  }

  // ---- CHECKLIST SCREEN (default) ----
  return (
    <div style={{ padding: "24px" }}>
      <h1>ASHA Saathi — Select Observed Signs</h1>
        <VoiceInput onTranscript={(text) => {
    console.log("Transcript:", text);
    const matched = matchSymptoms(text);
    if (matched.length > 0) {
        setSelectedSigns((prev) => [...new Set([...prev, ...matched])]);
    }
    }} />
      {queue.length > 0 && (
        <button onClick={() => setView("queue")} style={{ marginBottom: "16px", padding: "8px 16px" }}>
          View Queue ({queue.length})
        </button>
      )}

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", maxWidth: "500px" }}>
        <input
          type="text"
          placeholder="Age (e.g. 3 yrs)"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          style={{ padding: "8px", flex: 1 }}
        />
        <select value={sex} onChange={(e) => setSex(e.target.value)} style={{ padding: "8px", flex: 1 }}>
          <option value="">Sex</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "500px" }}>
        {DANGER_SIGNS.map((sign) => (
          <label
            key={sign.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px",
              border: "1px solid #444",
              borderRadius: "8px",
              cursor: "pointer",
              background: selectedSigns.includes(sign.id) ? "#1565c0" : "transparent",
            }}
          >
            <input
              type="checkbox"
              checked={selectedSigns.includes(sign.id)}
              onChange={() => toggleSign(sign.id)}
            />
            {sign.label}
          </label>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        style={{ marginTop: "24px", padding: "12px 24px", fontSize: "16px" }}
      >
        Get Triage Result
      </button>
    </div>
  );
}