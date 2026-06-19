const TIER_COLORS = { RED: "#ef4444", YELLOW: "#f59e0b", GREEN: "#22c55e" };
const TIER_BG = { RED: "#1a0000", YELLOW: "#1a1000", GREEN: "#001a08" };
const TIER_SURFACE = { RED: "#2d0a0a", YELLOW: "#2d1a00", GREEN: "#002d10" };

const TIER_LABELS = {
  RED: "REFER IMMEDIATELY",
  YELLOW: "REFER WITHIN 24 HOURS",
  GREEN: "LOCAL MANAGEMENT",
};

const TIER_ICONS = { RED: "🚨", YELLOW: "⚠️", GREEN: "✅" };
<div style={{
  fontSize: "11px", fontWeight: "700", color: "#6b7280",
  letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px",
}}>
  ASHA Worker View
</div>

export default function ResultScreen({ result, patientMeta, onAddToQueue, onBack }) {
  const color = TIER_COLORS[result.tier];
  const bg = TIER_BG[result.tier];
  const surface = TIER_SURFACE[result.tier];

    function speakResult() {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(
        `${result.tier}. ${TIER_LABELS[result.tier]}. ${result.referralTimeframe}.`
    );
    msg.lang = "en-IN";
    msg.rate = 0.85;
    window.speechSynthesis.speak(msg);
    }

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column" }}>
      {/* Big color hero */}
      <div style={{
        background: surface, padding: "48px 24px 32px",
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        borderBottom: `1px solid ${color}33`,
      }}>
        <div style={{ fontSize: "56px", marginBottom: "12px" }}>{TIER_ICONS[result.tier]}</div>
        <div style={{
          fontSize: "13px", fontWeight: "700", color, letterSpacing: "0.15em",
          textTransform: "uppercase", marginBottom: "8px",
        }}>
          {result.tier}
        </div>
        <div style={{ fontSize: "26px", fontWeight: "800", color: "#f9fafb", lineHeight: "1.2", marginBottom: "10px" }}>
          {TIER_LABELS[result.tier]}
        </div>
        <div style={{
          background: `${color}22`, border: `1px solid ${color}44`,
          borderRadius: "20px", padding: "6px 16px",
          fontSize: "13px", color, fontWeight: "500",
        }}>
          {result.referralTimeframe}
        </div>

        {patientMeta?.name && (
          <div style={{ marginTop: "12px", fontSize: "14px", color: "#9ca3af" }}>
            {patientMeta.name}{patientMeta.sex ? ` · ${patientMeta.sex}` : ""}{patientMeta.age ? ` · ${patientMeta.age}` : ""}
          </div>
        )}
      </div>

      {/* Signs observed */}
      <div style={{ padding: "24px", flex: 1 }}>
        {result.citedSigns.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
              Observed Danger Signs
            </div>
            {result.citedSigns.map((sign) => (
              <div key={sign.id} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "12px 14px", borderRadius: "10px",
                background: surface, marginBottom: "6px",
                border: `1px solid ${color}33`,
              }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontSize: "15px", color: "#f9fafb" }}>{sign.label}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: "11px", color: "#4b5563", textAlign: "center", marginBottom: "24px" }}>
          Protocol: WHO IMNCI Danger Sign Framework · MoHFW ASHA Module
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: "16px 24px 32px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <button onClick={speakResult} style={{
          width: "100%", padding: "14px", borderRadius: "12px",
          background: surface, color, border: `1px solid ${color}66`,
          fontSize: "15px", fontWeight: "600", cursor: "pointer",
        }}>
          🔊 Speak Result
        </button>
        <button onClick={onAddToQueue} style={{
          width: "100%", padding: "16px", borderRadius: "14px",
          background: color, color: "white", border: "none",
          fontSize: "17px", fontWeight: "700", cursor: "pointer",
        }}>
          Add to Queue →
        </button>
        <button onClick={onBack} style={{
          width: "100%", padding: "14px", borderRadius: "12px",
          background: "none", color: "#6b7280",
          border: "1px solid #1f2937",
          fontSize: "15px", cursor: "pointer",
        }}>
          Back to Checklist
        </button>
      </div>
    </div>
  );
}