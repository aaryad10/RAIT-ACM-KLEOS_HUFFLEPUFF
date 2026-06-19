import { useState } from "react";
import { DANGER_SIGNS } from "../engine/dangerSigns";
import { runTriage } from "../engine/triageEngine";

export default function TriageScreen() {
  const [selectedSigns, setSelectedSigns] = useState([]);
  const [result, setResult] = useState(null);

  function toggleSign(id) {
    setSelectedSigns((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function handleSubmit() {
    const triageResult = runTriage(selectedSigns);
    setResult(triageResult);
  }

  function handleReset() {
    setSelectedSigns([]);
    setResult(null);
  }

  // ---- RESULT SCREEN ----
  if (result) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <h1
          style={{
            color:
              result.tier === "RED"
                ? "#d32f2f"
                : result.tier === "YELLOW"
                ? "#f9a825"
                : "#2e7d32",
          }}
        >
          {result.tier}
        </h1>
        <h2>{result.label}</h2>
        <p>{result.referralTimeframe}</p>

        <h3>Danger signs observed:</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {result.citedSigns.length === 0 && <li>None</li>}
          {result.citedSigns.map((sign) => (
            <li key={sign.id}>{sign.label}</li>
          ))}
        </ul>

        <button onClick={handleReset} style={{ marginTop: "24px", padding: "12px 24px" }}>
          New Patient
        </button>
      </div>
    );
  }

  // ---- CHECKLIST SCREEN ----
  return (
    <div style={{ padding: "24px" }}>
      <h1>ASHA Saathi — Select Observed Signs</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "500px" }}>
        {DANGER_SIGNS.map((sign) => (
          <label
            key={sign.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              cursor: "pointer",
              background: selectedSigns.includes(sign.id) ? "#e3f2fd" : "white",
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