import { useTheme } from "../tokens/theme";

const fmt = (n) => (n == null ? "—" : (Number.isInteger(n) ? n.toLocaleString() : n));

/* "State of the exchange" — live aggregate stats. Used on the dashboard and the
   landing page. Pass `stats` = { products, reviewsExchanged, avgReceived, members }. */
export default function StatsPanel({ stats, title = "The exchange, live", style, poolStatus = false }) {
  const { c } = useTheme();
  const s = stats || {};
  const items = [
    { label: "Apps onboarded", value: fmt(s.products) },
    { label: "Reviews exchanged", value: fmt(s.reviewsExchanged) },
    { label: "Avg reviews / app", value: fmt(s.avgReceived) },
    { label: "Developers", value: fmt(s.members) },
  ];
  return (
    <div style={{ background: c.surface, border: `1px solid ${c.borderGold}`, borderRadius: 16, padding: "22px 24px", display: "flex", flexDirection: "column", ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 20 }}>
        <span className="live-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: c.verified, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: c.gold, textTransform: "uppercase", letterSpacing: "0.12em" }}>{title}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 4, flex: 1, alignContent: "center" }}>
        {items.map((it, i) => (
          <div key={it.label} style={{ padding: "6px 12px", textAlign: "center", borderLeft: i > 0 ? `1px solid ${c.border}` : "none" }}>
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: 30, fontWeight: 700, color: c.gold, lineHeight: 1.1 }}>{it.value}</div>
            <div style={{ fontSize: 11, color: c.textMuted, marginTop: 7 }}>{it.label}</div>
          </div>
        ))}
      </div>

      {/* Public give/get health — aggregate only, never names anyone. With the
          'open pool status' deterrent when poolStatus is on (logged-in view). */}
      {s.givers != null && (s.givers + s.takers) > 0 && (() => {
        const total = s.givers + s.takers;
        const giverPct = Math.round((s.givers / total) * 100);
        const healthy = s.givers >= s.takers;
        return (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${c.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Open pool status</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: healthy ? c.verified : c.flagged }}>{healthy ? "🔓 Open" : "⚠ Locking risk"}</span>
            </div>
            <div style={{ position: "relative", height: 8, borderRadius: 5, background: c.pending + "33", overflow: "hidden" }}>
              <div style={{ width: `${giverPct}%`, height: "100%", background: healthy ? c.verified : c.flagged, transition: "width 0.4s" }} />
              <div style={{ position: "absolute", left: "50%", top: -2, bottom: -2, width: 2, background: c.text, opacity: 0.45 }} title="tipping point" />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: c.textMuted, marginTop: 6 }}>
              <span>{s.givers} giving fairly</span><span>{s.takers} taking more</span>
            </div>
            {poolStatus && (
              <div style={{ fontSize: 11, color: c.textSub, marginTop: 11, lineHeight: 1.6 }}>
                The pool stays open while givers lead. <strong style={{ color: c.text }}>Every review you give keeps it open for everyone</strong> — if takers overtake givers, the exchange locks to a strict one-for-one queue.
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
