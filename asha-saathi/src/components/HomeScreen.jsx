const s = {
  page: {
    minHeight: "100vh", background: "#0a0f1e",
    display: "flex", flexDirection: "column",
    padding: "0",
  },
  header: {
    padding: "32px 24px 24px",
    borderBottom: "1px solid #1f2937",
  },
  logo: { fontSize: "26px", fontWeight: "800", color: "#f9fafb", letterSpacing: "-0.5px" },
  subtitle: { fontSize: "13px", color: "#6b7280", marginTop: "4px" },
  offlineRow: {
    display: "flex", alignItems: "center", gap: "6px",
    marginTop: "12px",
  },
  offlineDot: {
    width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e",
    boxShadow: "0 0 6px #22c55e",
  },
  offlineText: { fontSize: "12px", color: "#22c55e", fontWeight: "500" },
  body: { flex: 1, padding: "32px 24px", display: "flex", flexDirection: "column", gap: "14px" },
  bigBtn: (bg, border) => ({
    width: "100%", padding: "22px 24px", borderRadius: "16px",
    background: bg, border: `1px solid ${border}`,
    display: "flex", alignItems: "center", gap: "16px",
    cursor: "pointer", textAlign: "left",
  }),
  btnIcon: (color) => ({
    width: "48px", height: "48px", borderRadius: "12px",
    background: color, display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: "24px", flexShrink: 0,
  }),
  btnTitle: { fontSize: "18px", fontWeight: "700", color: "#f9fafb" },
  btnSub: { fontSize: "13px", color: "#9ca3af", marginTop: "2px" },
  footer: {
    padding: "16px 24px", borderTop: "1px solid #1f2937",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  footerText: { fontSize: "12px", color: "#6b7280" },
};

export default function HomeScreen({ onNewAssessment, onViewQueue, queueCount }) {
  const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.logo}>ASHA Saathi</div>
        <div style={s.subtitle}>WHO IMNCI · Offline Triage System</div>
        <div style={s.offlineRow}>
          <div style={s.offlineDot} />
          <span style={s.offlineText}>Offline Ready</span>
        </div>
      </div>

      <div style={s.body}>
        <button style={s.bigBtn("#0f172a", "#3b82f6")} onClick={onNewAssessment}>
          <div style={s.btnIcon("#1d4ed8")}>➕</div>
          <div>
            <div style={s.btnTitle}>New Assessment</div>
            <div style={s.btnSub}>Start triage for a new patient</div>
          </div>
        </button>

        <button style={s.bigBtn("#0f172a", "#f59e0b44")} onClick={onViewQueue}>
          <div style={s.btnIcon("#92400e")}>📋</div>
          <div>
            <div style={s.btnTitle}>
              Today's Queue
              {queueCount > 0 && (
                <span style={{ marginLeft: "10px", background: "#f59e0b", color: "#000", borderRadius: "20px", padding: "2px 10px", fontSize: "13px", fontWeight: "700" }}>
                  {queueCount}
                </span>
              )}
            </div>
            <div style={s.btnSub}>View and manage active patients</div>
          </div>
        </button>

        <button style={s.bigBtn("#0f172a", "#22c55e44")} onClick={() => {}}>
          <div style={s.btnIcon("#14532d")}>📁</div>
          <div>
            <div style={s.btnTitle}>Referral History</div>
            <div style={s.btnSub}>Previous referrals stored locally</div>
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