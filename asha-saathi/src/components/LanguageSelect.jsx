/**
 * LanguageSelect.jsx
 * First screen shown on app launch.
 * Worker picks their language once; everything downstream uses it.
 */
import { useState } from "react";
import { LANGUAGE_LIST } from "../engine/languageConfig";

export default function LanguageSelect({ onSelect }) {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0f1e",
      display: "flex", flexDirection: "column",
      padding: "0",
    }}>
      {/* Header */}
      <div style={{ padding: "48px 28px 32px" }}>
        <div style={{ fontSize: "28px", fontWeight: "800", color: "#f9fafb", letterSpacing: "-0.5px" }}>
          ASHA Saathi
        </div>
        <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "6px" }}>
          WHO IMNCI · Offline Triage System
        </div>

        <div style={{ marginTop: "32px" }}>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#f9fafb", marginBottom: "4px" }}>
            अपनी भाषा चुनें
          </div>
          <div style={{ fontSize: "13px", color: "#6b7280" }}>
            Choose your language · ನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ
          </div>
        </div>
      </div>

      {/* Language grid */}
      <div style={{ flex: 1, padding: "0 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {LANGUAGE_LIST.map(({ key, label, sublabel }) => {
          const isSelected = selected === key;
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              style={{
                width: "100%", padding: "18px 20px",
                borderRadius: "14px", cursor: "pointer",
                border: `2px solid ${isSelected ? "#3b82f6" : "#1f2937"}`,
                background: isSelected ? "#0f1f3d" : "#111827",
                display: "flex", alignItems: "center", gap: "16px",
                transition: "all 0.12s", textAlign: "left",
              }}
            >
              {/* Selection indicator */}
              <div style={{
                width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${isSelected ? "#3b82f6" : "#374151"}`,
                background: isSelected ? "#3b82f6" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isSelected && (
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "white" }} />
                )}
              </div>

              <div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#f9fafb", lineHeight: "1.2" }}>
                  {label}
                </div>
                {sublabel !== label && (
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{sublabel}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirm button */}
      <div style={{ padding: "24px 20px 40px" }}>
        <button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          style={{
            width: "100%", padding: "18px", borderRadius: "14px",
            background: selected ? "#3b82f6" : "#1f2937",
            color: selected ? "white" : "#6b7280",
            border: "none", fontSize: "18px", fontWeight: "700",
            cursor: selected ? "pointer" : "not-allowed",
            transition: "all 0.15s",
          }}
        >
          {selected ? "आगे बढ़ें · Continue →" : "भाषा चुनें · Select a language"}
        </button>
      </div>
    </div>
  );
}