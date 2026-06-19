import { rankQueue } from "../engine/priorityQueue";

const TIER_COLORS = { RED: "#ef4444", YELLOW: "#f59e0b", GREEN: "#22c55e" };
const TIER_BG = { RED: "#2d0a0a", YELLOW: "#2d1a00", GREEN: "#002d10" };

const TIER_LABELS = {
  RED: "REFER IMMEDIATELY",
  YELLOW: "REFER WITHIN 24H",
  GREEN: "LOCAL MGMT",
};

export default function QueueScreen({ queue, onBack, onViewReport, onAddNext }) {
  const ranked = rankQueue(queue);
  const counts = { RED: 0, YELLOW: 0, GREEN: 0 };
  ranked.forEach((p) => counts[p.tier]++);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", paddingBottom: "100px" }}>
      {/* Top bar */}
      <div style={{
        padding: "20px 24px", borderBottom: "1px solid #1f2937",
        position: "sticky", top: 0, background: "#0a0f1e", zIndex: 10,
        display: "flex", alignItems: "center", gap: "12px",
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "1px solid #374151", color: "#9ca3af",
          borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "14px",
        }}>← Home</button>
        <div>
          <div style={{ fontSize: "17px", fontWeight: "700", color: "#f9fafb" }}>Today's Queue</div>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>{ranked.length} patients · ranked by urgency</div>
        </div>
      </div>

      {/* Summary pills */}
      <div style={{ padding: "16px 24px", display: "flex", gap: "10px" }}>
        {["RED", "YELLOW", "GREEN"].map((tier) => (
          <div key={tier} style={{
            flex: 1, padding: "10px", borderRadius: "10px",
            background: TIER_BG[tier], border: `1px solid ${TIER_COLORS[tier]}44`,
            textAlign: "center",
          }}>
            <div style={{ fontSize: "22px", fontWeight: "800", color: TIER_COLORS[tier] }}>{counts[tier]}</div>
            <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: "600", marginTop: "2px" }}>{tier}</div>
          </div>
        ))}
      </div>

      {/* Patient cards */}
      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {ranked.length === 0 && (
          <div style={{ textAlign: "center", color: "#4b5563", padding: "48px 0", fontSize: "15px" }}>
            No patients in queue yet
          </div>
        )}
        {ranked.map((p, i) => (
          <div key={p.id} style={{
            borderRadius: "14px", border: `1.5px solid ${TIER_COLORS[p.tier]}44`,
            background: TIER_BG[p.tier], padding: "16px",
            overflow: "hidden",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{
                background: TIER_COLORS[p.tier], color: "white",
                borderRadius: "6px", padding: "2px 10px",
                fontSize: "12px", fontWeight: "700",
              }}>#{i + 1} {p.tier}</div>
              {(p.meta?.name || p.meta?.sex || p.meta?.age) && (
                <span style={{ fontSize: "13px", color: "#9ca3af" }}>
                  {[p.meta?.name, p.meta?.sex, p.meta?.age].filter(Boolean).join(" · ")}
                </span>
              )}
              <span style={{ marginLeft: "auto", fontSize: "11px", color: "#6b7280" }}>
                {new Date(p.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            <div style={{ fontSize: "13px", color: "#d1d5db", marginBottom: "10px", lineHeight: "1.5" }}>
              {p.citedSigns.slice(0, 3).map((s) => s.label).join(" · ")}
              {p.citedSigns.length > 3 && ` +${p.citedSigns.length - 3} more`}
            </div>

            <div style={{ fontSize: "12px", fontWeight: "600", color: TIER_COLORS[p.tier], marginBottom: "12px" }}>
              {TIER_LABELS[p.tier]}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => onViewReport(p)} style={{
                flex: 1, padding: "10px", borderRadius: "10px",
                border: `1px solid ${TIER_COLORS[p.tier]}55`,
                background: "transparent", color: TIER_COLORS[p.tier],
                fontSize: "13px", fontWeight: "600", cursor: "pointer",
              }}>
                View Report
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Fixed bottom button */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "16px 24px", background: "#0a0f1e", borderTop: "1px solid #1f2937",
      }}>
        <button onClick={onAddNext} style={{
          width: "100%", padding: "16px", borderRadius: "14px",
          background: "#3b82f6", color: "white", border: "none",
          fontSize: "17px", fontWeight: "700", cursor: "pointer",
        }}>
          + Add Next Patient
        </button>
      </div>
    </div>
  );
}