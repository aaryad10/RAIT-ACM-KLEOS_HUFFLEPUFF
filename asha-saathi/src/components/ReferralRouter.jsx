/**
 * ReferralRouter.jsx
 * Shows facility options ranked by total time to care (travel + wait).
 * Recommends the best facility — not just the nearest.
 */
import { rankFacilities } from "../engine/referralRouter";

const TIER_COLORS = { RED: "#ef4444", YELLOW: "#f59e0b", GREEN: "#22c55e" };

export default function ReferralRouter({ tier, patientMeta, onConfirm, onBack }) {
  const ranked = rankFacilities(tier);
  const recommended = ranked[0];
  const color = TIER_COLORS[tier];

  function formatTime(min) {
    if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}m`;
    return `${min}m`;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", paddingBottom: "100px" }}>

      {/* Top bar */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #1f2937", position: "sticky", top: 0, background: "#0a0f1e", zIndex: 10, display: "flex", alignItems: "center", gap: "12px" }}>
        <button onClick={onBack} style={{ background: "none", border: "1px solid #374151", color: "#9ca3af", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "14px" }}>←</button>
        <div>
          <div style={{ fontSize: "17px", fontWeight: "700", color: "#f9fafb" }}>Referral Routing</div>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>Nearest is not always fastest</div>
        </div>
        <div style={{ marginLeft: "auto", background: `${color}22`, border: `1px solid ${color}44`, borderRadius: "8px", padding: "4px 12px", fontSize: "12px", fontWeight: "700", color }}>
          {tier}
        </div>
      </div>

      <div style={{ padding: "20px 24px" }}>

        {/* Recommended banner */}
        <div style={{ background: `${color}15`, border: `1.5px solid ${color}55`, borderRadius: "14px", padding: "16px 20px", marginBottom: "24px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
            ✦ Recommended Referral
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#f9fafb", marginBottom: "4px" }}>
            {recommended.name}
          </div>
          <div style={{ fontSize: "14px", color: "#9ca3af" }}>
            {recommended.type} · {recommended.distanceKm}km away · {recommended.doctorsAvailable} doctor{recommended.doctorsAvailable > 1 ? "s" : ""} available
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
            <div style={{ background: "#1f2937", borderRadius: "8px", padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#3b82f6" }}>{formatTime(recommended.travelTimeMin)}</div>
              <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>Travel</div>
            </div>
            <div style={{ background: "#1f2937", borderRadius: "8px", padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#f59e0b" }}>{formatTime(recommended.waitMin)}</div>
              <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>Est. Wait</div>
            </div>
            <div style={{ background: `${color}22`, borderRadius: "8px", padding: "8px 14px", textAlign: "center", border: `1px solid ${color}44` }}>
              <div style={{ fontSize: "18px", fontWeight: "800", color }}>{formatTime(recommended.totalMin)}</div>
              <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>Total to Care</div>
            </div>
          </div>
          {recommended.hasAmbulance && (
            <div style={{ marginTop: "10px", fontSize: "12px", color: "#22c55e" }}>🚑 Ambulance available</div>
          )}
        </div>

        {/* All facilities comparison */}
        <div style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
          All Facilities — Ranked by Time to Care
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
          {ranked.map((f, i) => {
            const isRec = i === 0;
            return (
              <div key={f.id} style={{
                borderRadius: "12px", padding: "14px 16px",
                background: isRec ? `${color}0a` : "#111827",
                border: `1px solid ${isRec ? color + "44" : "#1f2937"}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: isRec ? color : "#f9fafb" }}>
                    {isRec ? "★ " : `#${i + 1} `}{f.name}
                  </div>
                  <span style={{ fontSize: "11px", color: "#6b7280", background: "#1f2937", borderRadius: "4px", padding: "1px 6px" }}>{f.type}</span>
                  {f.hasAmbulance && <span style={{ fontSize: "11px", color: "#22c55e" }}>🚑</span>}
                  <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: "700", color: isRec ? color : "#9ca3af" }}>
                    {formatTime(f.totalMin)} total
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px" }}>
                  {[
                    { label: "Distance", value: `${f.distanceKm}km` },
                    { label: "Travel", value: formatTime(f.travelTimeMin) },
                    { label: "Queue", value: `${f.currentQueueLength} pts` },
                    { label: "Doctors", value: f.doctorsAvailable },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: "#0a0f1e", borderRadius: "6px", padding: "6px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#f9fafb" }}>{value}</div>
                      <div style={{ fontSize: "9px", color: "#6b7280", marginTop: "1px" }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "8px", fontSize: "11px", color: "#6b7280" }}>
                  ⏱ Est. wait: {formatTime(f.waitMin)} · Hours: {f.operatingHours}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirm button */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 24px", background: "#0a0f1e", borderTop: "1px solid #1f2937" }}>
        <button onClick={() => onConfirm(recommended)} style={{
          width: "100%", padding: "16px", borderRadius: "14px",
          background: color, color: "white", border: "none",
          fontSize: "17px", fontWeight: "700", cursor: "pointer",
        }}>
          Refer to {recommended.name} →
        </button>
      </div>
    </div>
  );
}