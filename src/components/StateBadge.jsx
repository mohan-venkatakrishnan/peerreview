import { useTheme } from "../tokens/theme";

export default function StateBadge({ state }) {
  const { c } = useTheme();
  const map = {
    verified: { label: "Verified", color: c.verified },
    pending: { label: "Pending", color: c.pending },
    flagged: { label: "Flagged", color: c.flagged },
  };
  const m = map[state];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: m.color, background: m.color + "18", border: `1px solid ${m.color}40`, borderRadius: 12, padding: "3px 10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {state === "verified" && "✓"} {state === "pending" && "◷"} {state === "flagged" && "⚑"} {m.label}
    </span>
  );
}
