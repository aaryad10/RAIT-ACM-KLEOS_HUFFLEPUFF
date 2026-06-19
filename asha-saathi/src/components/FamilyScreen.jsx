const TIER_COLORS = { RED: "#ef4444", YELLOW: "#f59e0b", GREEN: "#22c55e" };
const TIER_BG = { RED: "#1a0000", YELLOW: "#1a1000", GREEN: "#001a08" };
const TIER_SURFACE = { RED: "#2d0a0a", YELLOW: "#2d1a00", GREEN: "#002d10" };

const HINDI = {
  RED: {
    heading: "तुरंत अस्पताल जाएं",
    sub: "बच्चे को अभी PHC ले जाना ज़रूरी है",
    urgency: "देरी खतरनाक हो सकती है",
    signsLabel: "देखे गए खतरे के संकेत",
    listen: "🔊 सुनें",
    protocol: "यह जानकारी WHO IMNCI प्रोटोकॉल पर आधारित है",
  },
  YELLOW: {
    heading: "24 घंटे में डॉक्टर को दिखाएं",
    sub: "बच्चे को कल तक PHC ले जाएं",
    urgency: "जल्द इलाज ज़रूरी है",
    signsLabel: "देखे गए संकेत",
    listen: "🔊 सुनें",
    protocol: "यह जानकारी WHO IMNCI प्रोटोकॉल पर आधारित है",
  },
  GREEN: {
    heading: "घर पर देखभाल करें",
    sub: "अभी अस्पताल जाने की ज़रूरत नहीं है",
    urgency: "नियमित देखभाल जारी रखें",
    signsLabel: "देखे गए संकेत",
    listen: "🔊 सुनें",
    protocol: "यह जानकारी WHO IMNCI प्रोटोकॉल पर आधारित है",
  },
};

export default function FamilyScreen({ result, patientMeta, onContinue, onBack }) {
  const tier = result.tier;
  const color = TIER_COLORS[tier];
  const bg = TIER_BG[tier];
  const surface = TIER_SURFACE[tier];
  const text = HINDI[tier];

  function speak() {
    speechSynthesis.cancel();
    const signsText = result.citedSigns.map((s) => s.label).join(", ");
    const msg = `${text.heading}. ${text.sub}. ${text.urgency}. ${signsText}.`;
    const utterance = new SpeechSynthesisUtterance(msg);
    utterance.lang = "hi-IN";
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  }

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column" }}>

      {/* Top strip — subtle tier indicator */}
      <div style={{ height: "6px", background: color, width: "100%" }} />

      {/* Main content */}
      <div style={{ flex: 1, padding: "32px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* ASHA branding — small, top */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
          <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>ASHA Saathi · WHO IMNCI</span>
        </div>

        {/* Big heading */}
        <div style={{ marginTop: "8px" }}>
          <div style={{
            fontSize: "32px", fontWeight: "800", color: "#f9fafb",
            lineHeight: "1.2", marginBottom: "10px",
          }}>
            {text.heading}
          </div>
          <div style={{ fontSize: "17px", color: "#d1d5db", marginBottom: "6px" }}>
            {text.sub}
          </div>
          <div style={{
            display: "inline-block",
            background: `${color}22`, border: `1px solid ${color}55`,
            borderRadius: "20px", padding: "5px 14px",
            fontSize: "13px", color, fontWeight: "600",
          }}>
            {text.urgency}
          </div>
        </div>

        {/* Patient info if available */}
        {(patientMeta?.name || patientMeta?.age || patientMeta?.sex) && (
          <div style={{
            background: surface, borderRadius: "12px", padding: "14px 16px",
            border: `1px solid ${color}33`,
          }}>
            <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
              मरीज़
            </div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#f9fafb" }}>
              {[patientMeta.name, patientMeta.sex, patientMeta.age].filter(Boolean).join(" · ")}
            </div>
          </div>
        )}

        {/* Danger signs */}
        {result.citedSigns.length > 0 && (
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#9ca3af", marginBottom: "10px" }}>
              {text.signsLabel}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {result.citedSigns.map((sign) => (
                <div key={sign.id} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  background: surface, borderRadius: "10px",
                  padding: "12px 14px", border: `1px solid ${color}33`,
                }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: "15px", color: "#f9fafb", lineHeight: "1.4" }}>{sign.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Protocol note */}
        <div style={{ fontSize: "12px", color: "#4b5563", textAlign: "center", marginTop: "auto", paddingTop: "16px" }}>
          {text.protocol}
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{
        padding: "16px 24px 32px",
        borderTop: `1px solid ${color}22`,
        display: "flex", flexDirection: "column", gap: "10px",
      }}>
        <button onClick={speak} style={{
          width: "100%", padding: "16px", borderRadius: "14px",
          background: surface, color,
          border: `1px solid ${color}55`,
          fontSize: "18px", fontWeight: "700", cursor: "pointer",
        }}>
          {text.listen}
        </button>

        <button onClick={onContinue} style={{
          width: "100%", padding: "16px", borderRadius: "14px",
          background: color, color: "white", border: "none",
          fontSize: "16px", fontWeight: "700", cursor: "pointer",
        }}>
          Add to Queue →
        </button>

        <button onClick={onBack} style={{
          width: "100%", padding: "12px", borderRadius: "12px",
          background: "none", color: "#6b7280",
          border: "1px solid #1f2937",
          fontSize: "14px", cursor: "pointer",
        }}>
          ← Back to Result
        </button>
      </div>
    </div>
  );
}