import { useTheme } from "../tokens/theme";
import { useAppState } from "../state";

const TONES = {
  gold: { key: "gold", icon: "✦" },
  verified: { key: "verified", icon: "✓" },
  flagged: { key: "flagged", icon: "⚑" },
};

export default function Toast() {
  const { c } = useTheme();
  const { toast } = useAppState();
  if (!toast) return null;
  const tone = TONES[toast.tone] ?? TONES.gold;
  const col = c[tone.key] || c.gold;
  return (
    <div style={{ position: "fixed", left: "50%", bottom: 32, transform: "translateX(-50%)", zIndex: 210, pointerEvents: "none" }}>
      <div key={toast.key} className="toast-in" style={{ display: "flex", alignItems: "center", gap: 11, background: c.surface, border: `1px solid ${col}55`, borderRadius: 12, padding: "12px 18px", boxShadow: "0 14px 44px rgba(0,0,0,0.5)", maxWidth: "88vw" }}>
        <span style={{ display: "inline-flex", width: 22, height: 22, borderRadius: "50%", background: col + "22", color: col, alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{tone.icon}</span>
        <span style={{ fontSize: 13.5, color: c.text, fontWeight: 500 }}>{toast.message}</span>
      </div>
    </div>
  );
}
