// import { rankQueue } from "../engine/priorityQueue";
// import { getLang } from "../engine/languageConfig";

// const TIER_COLORS = { RED: "#ef4444", YELLOW: "#f59e0b", GREEN: "#22c55e" };
// const TIER_BG     = { RED: "#2d0a0a", YELLOW: "#2d1a00", GREEN: "#002d10" };

// export default function QueueScreen({ langKey = "hi", queue, onBack, onViewReport, onAddNext, onMarkReferred }) {
//   const ui     = getLang(langKey).ui;
//   const locale = getLang(langKey).meta.locale;
//   const ranked = rankQueue(queue);
//   const counts = { RED: 0, YELLOW: 0, GREEN: 0 };
//   ranked.forEach((p) => counts[p.tier]++);

//   // Tier action labels in regional language
//   const TIER_ACTION = {
//     RED:    ui.referImmediately,
//     YELLOW: ui.referIn24h,
//     GREEN:  ui.localManagement,
//   };

//   return (
//     <div style={{ minHeight: "100vh", background: "#0a0f1e", paddingBottom: "100px" }}>
//       {/* Top bar */}
//       <div style={{ padding: "20px 24px", borderBottom: "1px solid #1f2937", position: "sticky", top: 0, background: "#0a0f1e", zIndex: 10, display: "flex", alignItems: "center", gap: "12px" }}>
//         <button onClick={onBack} style={{ background: "none", border: "1px solid #374151", color: "#9ca3af", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "14px" }}>
//           ← {ui.newAssessment?.split(" ")[0] || "Back"}
//         </button>
//         <div>
//           <div style={{ fontSize: "17px", fontWeight: "700", color: "#f9fafb" }}>{ui.queueTitle}</div>
//           <div style={{ fontSize: "12px", color: "#6b7280" }}>{ui.queueSubtitle(ranked.length)}</div>
//         </div>
//       </div>

//       {/* Summary pills */}
//       <div style={{ padding: "16px 24px", display: "flex", gap: "10px" }}>
//         {["RED", "YELLOW", "GREEN"].map((tier) => (
//           <div key={tier} style={{ flex: 1, padding: "10px", borderRadius: "10px", background: TIER_BG[tier], border: `1px solid ${TIER_COLORS[tier]}44`, textAlign: "center" }}>
//             <div style={{ fontSize: "22px", fontWeight: "800", color: TIER_COLORS[tier] }}>{counts[tier]}</div>
//             <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: "600", marginTop: "2px" }}>{tier}</div>
//           </div>
//         ))}
//       </div>

//       {/* Patient cards */}
//       <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
//         {ranked.length === 0 && (
//           <div style={{ textAlign: "center", color: "#4b5563", padding: "48px 0", fontSize: "15px" }}>
//             {ui.noSignsSelected}
//           </div>
//         )}
//         {ranked.map((p, i) => (
//           <div key={p.id} style={{ borderRadius: "14px", border: `1.5px solid ${TIER_COLORS[p.tier]}44`, background: TIER_BG[p.tier], padding: "16px" }}>
//             <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
//               <div style={{ background: TIER_COLORS[p.tier], color: "white", borderRadius: "6px", padding: "2px 10px", fontSize: "12px", fontWeight: "700" }}>
//                 #{i + 1} {p.tier}
//               </div>
//               {(p.meta?.name || p.meta?.sex || p.meta?.age) && (
//                 <span style={{ fontSize: "13px", color: "#9ca3af" }}>
//                   {[p.meta?.name, p.meta?.sex, p.meta?.age].filter(Boolean).join(" · ")}
//                 </span>
//               )}
//               <span style={{ marginLeft: "auto", fontSize: "11px", color: "#6b7280" }}>
//                 {new Date(p.timestamp).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
//               </span>
//             </div>

//             <div style={{ fontSize: "13px", color: "#d1d5db", marginBottom: "10px", lineHeight: "1.5" }}>
//               {p.citedSigns.slice(0, 3).map((s) => s.label).join(" · ")}
//               {p.citedSigns.length > 3 && ` +${p.citedSigns.length - 3}`}
//             </div>

//             <div style={{ fontSize: "12px", fontWeight: "600", color: TIER_COLORS[p.tier], marginBottom: "12px" }}>
//               {TIER_ACTION[p.tier]}
//             </div>

//             <div style={{ display: "flex", gap: "8px" }}>
//               <button onClick={() => onViewReport(p)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: `1px solid ${TIER_COLORS[p.tier]}55`, background: "transparent", color: TIER_COLORS[p.tier], fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
//                 {ui.viewReport}
//               </button>
//               <button onClick={() => onMarkReferred(p.id)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: `1px solid ${p.referred ? "#22c55e55" : "#37415155"}`, background: p.referred ? "#052e16" : "transparent", color: p.referred ? "#22c55e" : "#6b7280", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
//                 {p.referred ? ui.referred : ui.markReferred}
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Fixed bottom */}
//       <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 24px", background: "#0a0f1e", borderTop: "1px solid #1f2937" }}>
//         <button onClick={onAddNext} style={{ width: "100%", padding: "16px", borderRadius: "14px", background: "#3b82f6", color: "white", border: "none", fontSize: "17px", fontWeight: "700", cursor: "pointer" }}>
//           {ui.addNextPatient}
//         </button>
//       </div>
//     </div>
//   );
// }

import { rankQueue, getRankWithinTier, getQueueLabel } from "../engine/priorityQueue";
import { getLang } from "../engine/languageConfig";
import { PHC_CONFIG } from "../engine/PHCConfig";

const TIER_COLORS = { RED: "#ef4444", YELLOW: "#f59e0b", GREEN: "#22c55e" };
const TIER_BG     = { RED: "#2d0a0a", YELLOW: "#2d1a00", GREEN: "#002d10" };

// Queue label colors
const LABEL_COLORS = {
  "REFER NOW":        { bg: "#ef4444", text: "white" },
  "REFER NEXT":       { bg: "#f97316", text: "white" },
  "REFER WITHIN 24H": { bg: "#f59e0b", text: "black" },
  "MONITOR CLOSELY":  { bg: "#854d0e", text: "white" },
  "HOME OBSERVATION": { bg: "#052e16", text: "#22c55e" },
};

export default function QueueScreen({ langKey = "hi", queue, onBack, onViewReport, onAddNext, onMarkReferred, onToggleRepeatVisit }) {
  const ui     = getLang(langKey).ui;
  const locale = getLang(langKey).meta.locale;
  const ranked = rankQueue(queue);
  const counts = { RED: 0, YELLOW: 0, GREEN: 0 };
  ranked.forEach((p) => counts[p.tier]++);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", paddingBottom: "100px" }}>

      {/* Top bar */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #1f2937", position: "sticky", top: 0, background: "#0a0f1e", zIndex: 10, display: "flex", alignItems: "center", gap: "12px" }}>
        <button onClick={onBack} style={{ background: "none", border: "1px solid #374151", color: "#9ca3af", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "14px" }}>
          ← {ui.newAssessment?.split(" ")[0] || "Back"}
        </button>
        <div>
          <div style={{ fontSize: "17px", fontWeight: "700", color: "#f9fafb" }}>{ui.queueTitle}</div>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>{ui.queueSubtitle(ranked.length)}</div>
        </div>
        {/* PHC distance badge */}
        <div style={{ marginLeft: "auto", background: "#1f2937", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", color: "#6b7280" }}>
          📍 {PHC_CONFIG.phcName} · {PHC_CONFIG.distanceKm}km · ~{PHC_CONFIG.travelTimeMin}min
        </div>
      </div>

      {/* Summary pills */}
      <div style={{ padding: "16px 24px", display: "flex", gap: "10px" }}>
        {["RED", "YELLOW", "GREEN"].map((tier) => (
          <div key={tier} style={{ flex: 1, padding: "10px", borderRadius: "10px", background: TIER_BG[tier], border: `1px solid ${TIER_COLORS[tier]}44`, textAlign: "center" }}>
            <div style={{ fontSize: "22px", fontWeight: "800", color: TIER_COLORS[tier] }}>{counts[tier]}</div>
            <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: "600", marginTop: "2px" }}>{tier}</div>
          </div>
        ))}
      </div>

      {/* Patient cards */}
      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {ranked.length === 0 && (
          <div style={{ textAlign: "center", color: "#4b5563", padding: "48px 0", fontSize: "15px" }}>
            {ui.noSignsSelected}
          </div>
        )}
        {ranked.map((p, i) => {
          const rankInTier  = getRankWithinTier(ranked, p.id);
          const queueLabel  = getQueueLabel(p, rankInTier);
          const labelStyle  = LABEL_COLORS[queueLabel] || { bg: "#1f2937", text: "#9ca3af" };
          const waitMin     = Math.floor((Date.now() - p.timestamp) / 60000);

          return (
            <div key={p.id} style={{ borderRadius: "14px", border: `1.5px solid ${TIER_COLORS[p.tier]}44`, background: TIER_BG[p.tier], padding: "16px" }}>

              {/* Top row: position + name + time */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{ background: TIER_COLORS[p.tier], color: "white", borderRadius: "6px", padding: "2px 10px", fontSize: "12px", fontWeight: "700" }}>
                  #{i + 1} {p.tier}
                </div>
                {(p.meta?.name || p.meta?.sex || p.meta?.age) && (
                  <span style={{ fontSize: "13px", color: "#9ca3af" }}>
                    {[p.meta?.name, p.meta?.sex, p.meta?.age].filter(Boolean).join(" · ")}
                  </span>
                )}
                <span style={{ marginLeft: "auto", fontSize: "11px", color: "#6b7280" }}>
                  {new Date(p.timestamp).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {/* Smart queue label */}
              <div style={{ display: "inline-block", background: labelStyle.bg, color: labelStyle.text, borderRadius: "8px", padding: "4px 12px", fontSize: "12px", fontWeight: "800", letterSpacing: "0.05em", marginBottom: "10px" }}>
                {queueLabel}
              </div>

              {/* Signs */}
              <div style={{ fontSize: "13px", color: "#d1d5db", marginBottom: "8px", lineHeight: "1.5" }}>
                {p.citedSigns.slice(0, 3).map((s) => s.label).join(" · ")}
                {p.citedSigns.length > 3 && ` +${p.citedSigns.length - 3}`}
              </div>

              {/* Context badges */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                {/* Waiting time */}
                <span style={{ fontSize: "11px", color: waitMin > 30 ? "#f59e0b" : "#6b7280", background: "#1f2937", borderRadius: "6px", padding: "2px 8px" }}>
                  ⏱ {waitMin < 1 ? "Just arrived" : `Waiting ${waitMin}m`}
                </span>

                {/* Repeat visit badge */}
                {p.meta?.isRepeatVisit && (
                  <span style={{ fontSize: "11px", color: "#f97316", background: "#1f2937", borderRadius: "6px", padding: "2px 8px" }}>
                    🔁 Repeat visit
                  </span>
                )}

                {/* Referral not completed badge */}
                {p.meta?.referralNotCompleted && (
                  <span style={{ fontSize: "11px", color: "#ef4444", background: "#1f2937", borderRadius: "6px", padding: "2px 8px" }}>
                    ⚠ Referral incomplete
                  </span>
                )}

                {/* Distance context */}
                <span style={{ fontSize: "11px", color: "#6b7280", background: "#1f2937", borderRadius: "6px", padding: "2px 8px" }}>
                  📍 {PHC_CONFIG.distanceKm}km · {PHC_CONFIG.travelTimeMin}min travel
                </span>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={() => onViewReport(p)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: `1px solid ${TIER_COLORS[p.tier]}55`, background: "transparent", color: TIER_COLORS[p.tier], fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                  {ui.viewReport}
                </button>
                <button onClick={() => onMarkReferred(p.id)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: `1px solid ${p.referred ? "#22c55e55" : "#37415155"}`, background: p.referred ? "#052e16" : "transparent", color: p.referred ? "#22c55e" : "#6b7280", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                  {p.referred ? ui.referred : ui.markReferred}
                </button>
                {/* Mark as repeat visit toggle */}
                <button
                  onClick={() => onToggleRepeatVisit(p.id)}
                  style={{ padding: "10px 12px", borderRadius: "10px", border: `1px solid ${p.meta?.isRepeatVisit ? "#f9730055" : "#37415155"}`, background: p.meta?.isRepeatVisit ? "#1a0e00" : "transparent", color: p.meta?.isRepeatVisit ? "#f97316" : "#6b7280", fontSize: "13px", cursor: "pointer" }}
                  title="Mark as repeat visit"
                >
                  🔁
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed bottom */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 24px", background: "#0a0f1e", borderTop: "1px solid #1f2937" }}>
        <button onClick={onAddNext} style={{ width: "100%", padding: "16px", borderRadius: "14px", background: "#3b82f6", color: "white", border: "none", fontSize: "17px", fontWeight: "700", cursor: "pointer" }}>
          {ui.addNextPatient}
        </button>
      </div>
    </div>
  );
}