import { getLang } from "../engine/languageConfig";

const TIER_COLORS  = { RED: "#ef4444", YELLOW: "#f59e0b", GREEN: "#22c55e" };
const TIER_BG      = { RED: "#1a0000", YELLOW: "#1a1000", GREEN: "#001a08" };
const TIER_SURFACE = { RED: "#2d0a0a", YELLOW: "#2d1a00", GREEN: "#002d10" };

export default function FamilyScreen({ langKey = "hi", result, patientMeta, onContinue, onBack }) {
  const ui     = getLang(langKey).ui;
  const locale = getLang(langKey).meta.locale;
  const tier   = result.tier;
  const color  = TIER_COLORS[tier];
  const bg     = TIER_BG[tier];
  const surface = TIER_SURFACE[tier];

  // Pick the right heading/sub/urgency from ui based on tier
  const heading = tier === "RED" ? ui.familyHeadingRed : tier === "YELLOW" ? ui.familyHeadingYellow : ui.familyHeadingGreen;
  const sub     = tier === "RED" ? ui.familySubRed     : tier === "YELLOW" ? ui.familySubYellow     : ui.familySubGreen;
  const urgency = tier === "RED" ? ui.familyUrgencyRed : tier === "YELLOW" ? ui.familyUrgencyYellow : ui.familyUrgencyGreen;

  function speak() {
    speechSynthesis.cancel();
    const signsText = result.citedSigns.map((s) => s.label).join(", ");
    const msg = `${heading}. ${sub}. ${urgency}. ${signsText}.`;
    const utterance = new SpeechSynthesisUtterance(msg);
    utterance.lang = locale;
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  }

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column" }}>
      <div style={{ height: "6px", background: color, width: "100%" }} />

      <div style={{ flex: 1, padding: "32px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Branding */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
          <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>ASHA Saathi · WHO IMNCI</span>
        </div>

        {/* Main heading */}
        <div style={{ marginTop: "8px" }}>
          <div style={{ fontSize: "32px", fontWeight: "800", color: "#f9fafb", lineHeight: "1.2", marginBottom: "10px" }}>
            {heading}
          </div>
          <div style={{ fontSize: "17px", color: "#d1d5db", marginBottom: "6px" }}>{sub}</div>
          <div style={{ display: "inline-block", background: `${color}22`, border: `1px solid ${color}55`, borderRadius: "20px", padding: "5px 14px", fontSize: "13px", color, fontWeight: "600" }}>
            {urgency}
          </div>
        </div>

        {/* Patient info */}
        {(patientMeta?.name || patientMeta?.age || patientMeta?.sex) && (
          <div style={{ background: surface, borderRadius: "12px", padding: "14px 16px", border: `1px solid ${color}33` }}>
            <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
              {ui.familyPatient}
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
              {ui.familySignsLabel}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {result.citedSigns.map((sign) => (
                <div key={sign.id} style={{ display: "flex", alignItems: "center", gap: "12px", background: surface, borderRadius: "10px", padding: "12px 14px", border: `1px solid ${color}33` }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: "15px", color: "#f9fafb", lineHeight: "1.4" }}>{sign.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Protocol note */}
        <div style={{ fontSize: "12px", color: "#4b5563", textAlign: "center", marginTop: "auto", paddingTop: "16px" }}>
          {ui.familyProtocol}
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ padding: "16px 24px 32px", borderTop: `1px solid ${color}22`, display: "flex", flexDirection: "column", gap: "10px" }}>
        <button onClick={speak} style={{ width: "100%", padding: "16px", borderRadius: "14px", background: surface, color, border: `1px solid ${color}55`, fontSize: "18px", fontWeight: "700", cursor: "pointer" }}>
          {ui.familyListen}
        </button>
        <button onClick={onContinue} style={{ width: "100%", padding: "16px", borderRadius: "14px", background: color, color: "white", border: "none", fontSize: "16px", fontWeight: "700", cursor: "pointer" }}>
          {ui.addToQueue}
        </button>
        <button onClick={onBack} style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "none", color: "#6b7280", border: "1px solid #1f2937", fontSize: "14px", cursor: "pointer" }}>
          ← {ui.backToChecklist}
        </button>
      </div>
    </div>
  );
}