import { useTheme } from "../tokens/theme";

export default function StateBadge({ state }) {
  const { c } = useTheme();
  const map = {
    verified: { label: "Verified", color: c.verified, icon: "✓" },
    pending: { label: "Pending", color: c.pending, icon: "◷" },
    submitted: { label: "Pending", color: c.pending, icon: "◷" }, // reviewer's view: awaiting verification
    flagged: { label: "Flagged", color: c.flagged, icon: "⚑" },
    skipped: { label: "Skipped", color: c.textMuted, icon: "–" },
    expired: { label: "Expired", color: c.textMuted, icon: "–" },
    assigned: { label: "In progress", color: c.gold, icon: "◎" },
  };
  // Never crash on an unexpected state — fall back to a neutral chip
  const m = map[state] ?? { label: String(state ?? "—"), color: c.textMuted, icon: "" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: m.color, background: m.color + "18", border: `1px solid ${m.color}40`, borderRadius: 12, padding: "3px 10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {m.icon} {m.label}
    </span>
  );
}
