import { useTheme } from "../tokens/theme";

const fmt = (n) => (n == null ? "—" : (Number.isInteger(n) ? n.toLocaleString() : n));

/* "State of the exchange" — live aggregate stats. Used on the dashboard and the
   landing page. Pass `stats` = { products, reviewsExchanged, avgReceived, members }. */
export default function StatsPanel({ stats, title = "The exchange, live", style }) {
  const { c } = useTheme();
  const s = stats || {};
  const items = [
    { label: "Apps onboarded", value: fmt(s.products) },
    { label: "Reviews exchanged", value: fmt(s.reviewsExchanged) },
    { label: "Avg reviews / app", value: fmt(s.avgReceived) },
    { label: "Developers", value: fmt(s.members) },
  ];
  return (
    <div style={{ background: c.surface, border: `1px solid ${c.borderGold}`, borderRadius: 16, padding: "22px 24px", ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 20 }}>
        <span className="live-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: c.verified, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: c.gold, textTransform: "uppercase", letterSpacing: "0.12em" }}>{title}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 4 }}>
        {items.map((it, i) => (
          <div key={it.label} style={{ padding: "6px 12px", textAlign: "center", borderLeft: i > 0 ? `1px solid ${c.border}` : "none" }}>
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: 30, fontWeight: 700, color: c.gold, lineHeight: 1.1 }}>{it.value}</div>
            <div style={{ fontSize: 11, color: c.textMuted, marginTop: 7 }}>{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
