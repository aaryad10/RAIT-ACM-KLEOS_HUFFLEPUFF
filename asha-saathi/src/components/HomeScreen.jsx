import { getLang } from "../engine/languageConfig";

const s = {
  page: { minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", padding: "0" },
  header: { padding: "32px 24px 24px", borderBottom: "1px solid #1f2937" },
  logo: { fontSize: "26px", fontWeight: "800", color: "#f9fafb", letterSpacing: "-0.5px" },
  subtitle: { fontSize: "13px", color: "#6b7280", marginTop: "4px" },
  offlineRow: { display: "flex", alignItems: "center", gap: "6px", marginTop: "12px" },
  offlineDot: { width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" },
  offlineText: { fontSize: "12px", color: "#22c55e", fontWeight: "500" },
  body: { flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "14px" },
  bigBtn: (border) => ({
    width: "100%", padding: "22px 24px", borderRadius: "16px",
    background: "#0f172a", border: `1px solid ${border}`,
    display: "flex", alignItems: "center", gap: "16px",
    cursor: "pointer", textAlign: "left",
  }),
  btnIcon: (color) => ({
    width: "48px", height: "48px", borderRadius: "12px", background: color,
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0,
  }),
  btnTitle: { fontSize: "18px", fontWeight: "700", color: "#f9fafb" },
  btnSub: { fontSize: "13px", color: "#9ca3af", marginTop: "2px" },
  footer: { padding: "16px 24px", borderTop: "1px solid #1f2937", display: "flex", justifyContent: "space-between", alignItems: "center" },
  footerText: { fontSize: "12px", color: "#6b7280" },
};

export default function HomeScreen({ langKey = "hi", onNewAssessment, onViewQueue, queueCount, redCount, yellowCount, greenCount, referredCount }) {
  const ui = getLang(langKey).ui;
  const locale = getLang(langKey).meta.locale;
  const now = new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const totalToday = redCount + yellowCount + greenCount;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.logo}>{ui.appName}</div>
        <div style={s.subtitle}>{ui.tagline}</div>
        <div style={s.offlineRow}>
          <div style={s.offlineDot} />
          <span style={s.offlineText}>{ui.offlineReady}</span>
        </div>
      </div>

      <div style={s.body}>
        {totalToday > 0 && (
          <div style={{ background: "#111827", borderRadius: "14px", border: "1px solid #1f2937", padding: "16px" }}>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
              {/* Keep stat labels as RED/YELLOW/GREEN — universal colour coding the doctor also sees */}
              Today
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
              {[
                { label: "RED",      count: redCount,      color: "#ef4444", bg: "#2d0a0a" },
                { label: "YELLOW",   count: yellowCount,   color: "#f59e0b", bg: "#2d1a00" },
                { label: "GREEN",    count: greenCount,    color: "#22c55e", bg: "#002d10" },
                { label: "REFERRED", count: referredCount, color: "#3b82f6", bg: "#0f172a" },
              ].map(({ label, count, color, bg }) => (
                <div key={label} style={{ background: bg, borderRadius: "10px", padding: "10px 8px", textAlign: "center", border: `1px solid ${color}33` }}>
                  <div style={{ fontSize: "22px", fontWeight: "800", color }}>{count}</div>
                  <div style={{ fontSize: "9px", color: "#6b7280", fontWeight: "600", marginTop: "2px", letterSpacing: "0.05em" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button style={s.bigBtn("#3b82f6")} onClick={onNewAssessment}>
          <div style={s.btnIcon("#1d4ed8")}>➕</div>
          <div>
            <div style={s.btnTitle}>{ui.newAssessment}</div>
            <div style={s.btnSub}>{ui.newAssessmentSub}</div>
          </div>
        </button>

        <button style={s.bigBtn("#f59e0b44")} onClick={onViewQueue}>
          <div style={s.btnIcon("#92400e")}>📋</div>
          <div>
            <div style={s.btnTitle}>
              {ui.viewQueue}
              {queueCount > 0 && (
                <span style={{ marginLeft: "10px", background: "#f59e0b", color: "#000", borderRadius: "20px", padding: "2px 10px", fontSize: "13px", fontWeight: "700" }}>
                  {queueCount}
                </span>
              )}
            </div>
            <div style={s.btnSub}>{ui.viewQueueSub}</div>
          </div>
        </button>

        <button style={s.bigBtn("#22c55e44")} onClick={() => {}}>
          <div style={s.btnIcon("#14532d")}>📁</div>
          <div>
            <div style={s.btnTitle}>{ui.referralHistory}</div>
            <div style={s.btnSub}>{ui.referralHistorySub}</div>
          </div>
        </button>
      </div>

      <div style={s.footer}>
        <span style={s.footerText}>ASHA Saathi v1.0 · KLEOS 2026</span>
        <span style={s.footerText}>{now}</span>
      </div>
    </div>
  );
}