export default function ReferralReport({ report, onBack, patientMeta }) {
  const doctorName = "Dr. Priya Sharma";
  const facilityName = "Primary Health Centre, Wardha";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", padding: "0" }}>
      {/* Top bar */}
      <div style={{
        padding: "20px 24px", borderBottom: "1px solid #1f2937",
        display: "flex", alignItems: "center", gap: "12px",
        position: "sticky", top: 0, background: "#0a0f1e", zIndex: 10,
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "1px solid #374151", color: "#9ca3af",
          borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "14px",
        }}>← Back</button>
        <div>
          <div style={{ fontSize: "17px", fontWeight: "700", color: "#f9fafb" }}>Referral Report</div>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>NHM-format · Auto-generated</div>
        </div>
      </div>

      {/* Report card */}
      <div style={{ padding: "24px 20px", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{
          background: "#111827", borderRadius: "16px",
          border: "1px solid #1f2937", overflow: "hidden",
        }}>
          {/* Report header */}
          <div style={{
            background: "#1f2937", padding: "20px 24px",
            borderBottom: "1px solid #374151",
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px" }}>
                PHC Referral Note
              </div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#f9fafb" }}>ASHA Saathi</div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{facilityName}</div>
            </div>
            <div style={{
              background: report.classification === "RED" ? "#450a0a" : report.classification === "YELLOW" ? "#451a03" : "#052e16",
              border: `1px solid ${report.classification === "RED" ? "#ef444466" : report.classification === "YELLOW" ? "#f59e0b66" : "#22c55e66"}`,
              borderRadius: "10px", padding: "8px 14px", textAlign: "center",
            }}>
              <div style={{
                fontSize: "18px", fontWeight: "800",
                color: report.classification === "RED" ? "#ef4444" : report.classification === "YELLOW" ? "#f59e0b" : "#22c55e",
              }}>
                {report.classification}
              </div>
              <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>{report.referralTimeframe}</div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Patient + Doctor row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ background: "#1f2937", borderRadius: "10px", padding: "14px" }}>
                <div style={{ fontSize: "10px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Patient</div>
                <div style={{ fontSize: "15px", fontWeight: "600", color: "#f9fafb" }}>{report.patientSummary || "Not specified"}</div>
              </div>
              <div style={{ background: "#1f2937", borderRadius: "10px", padding: "14px" }}>
                <div style={{ fontSize: "10px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Referring To</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#f9fafb" }}>{doctorName}</div>
                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{facilityName}</div>
              </div>
            </div>

            {/* Date + Time row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ background: "#1f2937", borderRadius: "10px", padding: "14px" }}>
                <div style={{ fontSize: "10px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Date</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#f9fafb" }}>{report.dateOfAssessment}</div>
              </div>
              <div style={{ background: "#1f2937", borderRadius: "10px", padding: "14px" }}>
                <div style={{ fontSize: "10px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Time</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#f9fafb" }}>{report.timeOfAssessment}</div>
              </div>
            </div>

            {/* Danger signs */}
            <div>
              <div style={{ fontSize: "10px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                Observed Danger Signs
              </div>
              {report.observedDangerSigns.length === 0
                ? <div style={{ fontSize: "14px", color: "#4b5563", fontStyle: "italic" }}>None recorded</div>
                : report.observedDangerSigns.map((sign, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 12px", borderRadius: "8px",
                    background: "#0a0f1e", marginBottom: "6px",
                    border: "1px solid #1f2937",
                  }}>
                    <div style={{
                      width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
                      background: report.classification === "RED" ? "#ef4444" : report.classification === "YELLOW" ? "#f59e0b" : "#22c55e",
                    }} />
                    <span style={{ fontSize: "14px", color: "#d1d5db" }}>{sign}</span>
                  </div>
                ))
              }
            </div>

            {/* Protocol + disclaimer */}
            <div style={{ borderTop: "1px solid #1f2937", paddingTop: "16px" }}>
              <div style={{ fontSize: "11px", color: "#4b5563", marginBottom: "6px" }}>
                <strong style={{ color: "#6b7280" }}>Protocol:</strong> {report.protocolBasis}
              </div>
              <div style={{ fontSize: "11px", color: "#374151", lineHeight: "1.5" }}>
                {report.disclaimer}
              </div>
            </div>

            {/* Generated by */}
            <div style={{
              background: "#0a0f1e", borderRadius: "8px", padding: "10px 14px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: "11px", color: "#4b5563" }}>Generated by ASHA Saathi</span>
              <span style={{ fontSize: "11px", color: "#4b5563" }}>KLEOS 2026 · D8-PS1</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
          <button onClick={onBack} style={{
            width: "100%", padding: "14px", borderRadius: "12px",
            background: "#111827", color: "#9ca3af",
            border: "1px solid #1f2937", fontSize: "15px", cursor: "pointer",
          }}>
            ← Back to Queue
          </button>
        </div>
      </div>
    </div>
  );
}