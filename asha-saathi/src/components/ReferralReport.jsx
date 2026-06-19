export default function ReferralReport({ report, onBack }) {
  return (
    <div style={{ padding: "24px", maxWidth: "600px" }}>
      <div
        style={{
          border: "2px solid #444",
          borderRadius: "8px",
          padding: "24px",
          background: "#1e1e1e",
        }}
      >
        <h2 style={{ marginTop: 0 }}>{report.reportTitle}</h2>
        <small style={{ color: "#888" }}>{report.formatNote}</small>

        <hr style={{ margin: "16px 0", borderColor: "#444" }} />

        <p><strong>Patient:</strong> {report.patientSummary}</p>
        <p><strong>Date of Assessment:</strong> {report.dateOfAssessment}</p>
        <p><strong>Time of Assessment:</strong> {report.timeOfAssessment}</p>

        <hr style={{ margin: "16px 0", borderColor: "#444" }} />

        <p>
          <strong>Classification:</strong>{" "}
          <span
            style={{
              color:
                report.classification === "RED"
                  ? "#d32f2f"
                  : report.classification === "YELLOW"
                  ? "#f9a825"
                  : "#2e7d32",
              fontWeight: "bold",
            }}
          >
            {report.classification} — {report.classificationLabel}
          </span>
        </p>
        <p><strong>Referral Timeframe:</strong> {report.referralTimeframe}</p>

        <p><strong>Observed Danger Signs:</strong></p>
        <ul>
          {report.observedDangerSigns.length === 0 && <li>None recorded</li>}
          {report.observedDangerSigns.map((sign, i) => (
            <li key={i}>{sign}</li>
          ))}
        </ul>

        <hr style={{ margin: "16px 0", borderColor: "#444" }} />

        <p><small><strong>Protocol Basis:</strong> {report.protocolBasis}</small></p>
        <p><small style={{ color: "#888" }}>{report.disclaimer}</small></p>
      </div>

      <button onClick={onBack} style={{ marginTop: "16px", padding: "10px 20px" }}>
        Back to Queue
      </button>
    </div>
  );
}