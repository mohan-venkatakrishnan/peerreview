import { useTheme } from "../tokens/theme";

/* Public "Open pool status" — the give/get meter + the deterrent message,
   shown to everyone. `watchlist` (names of takers) is passed only for the
   owner account, so those names never reach a normal user's browser. */
function ListBox({ c, title, color, sub, items }) {
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 11, color, fontWeight: 600, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</div>
      {sub && <div style={{ fontSize: 10.5, color: c.textMuted, marginBottom: 8 }}>{sub}</div>}
      {!sub && <div style={{ height: 8 }} />}
      {items.map((w, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, color: c.text, padding: "5px 0", borderTop: i > 0 ? `1px solid ${c.border}` : "none" }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</span>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: c.textMuted, flexShrink: 0, marginLeft: 8 }}>gave <strong style={{ color: c.verified }}>{w.given}</strong> · got <strong style={{ color: c.pending }}>{w.received}</strong></span>
        </div>
      ))}
    </div>
  );
}

export default function PoolStatus({ givers, takers, watchlist, topGivers, style }) {
  const { c } = useTheme();
  if (givers == null) return null;
  const total = givers + takers;
  if (total <= 0) return null;
  const giverPct = Math.round((givers / total) * 100);
  const healthy = givers >= takers;

  return (
    <div style={{ background: c.surface, border: `1px solid ${c.borderGold}`, borderRadius: 16, padding: "22px 24px", ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: c.gold, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          <span style={{ fontSize: 13 }}>⚖</span> Open pool status
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: healthy ? c.verified : c.flagged, background: (healthy ? c.verified : c.flagged) + "18", border: `1px solid ${(healthy ? c.verified : c.flagged)}40`, borderRadius: 20, padding: "4px 12px" }}>
          {healthy ? "🔓 Open" : "⚠ Locking risk"}
        </span>
      </div>

      {/* tipping-point meter */}
      <div style={{ position: "relative", height: 12, borderRadius: 7, background: c.flagged + "2A", overflow: "hidden", marginBottom: 6 }}>
        <div style={{ width: `${giverPct}%`, height: "100%", background: `linear-gradient(90deg, ${c.verified}, ${healthy ? c.verified : c.flagged})`, transition: "width 0.5s" }} />
        <div style={{ position: "absolute", left: "50%", top: -2, bottom: -2, width: 2, background: c.text, opacity: 0.5 }} title="tipping point" />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: c.textMuted, marginBottom: 14 }}>
        <span style={{ color: c.verified }}>{givers} giving fairly</span>
        <span>tipping point</span>
        <span style={{ color: c.flagged }}>{takers} taking more</span>
      </div>

      <div style={{ fontSize: 12.5, color: c.textSub, lineHeight: 1.65 }}>
        The pool stays open while givers lead. <strong style={{ color: c.text }}>Every review you give keeps it open for everyone</strong> — if takers overtake givers, the exchange locks to a strict one-for-one queue.
      </div>

      {(topGivers?.length > 0 || watchlist?.length > 0) && (
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {topGivers?.length > 0 && <ListBox c={c} title="✦ Top givers" color={c.verified} items={topGivers} />}
          {watchlist?.length > 0 && <ListBox c={c} title="Taking more than they give" color={c.pending} sub="give a review back to clear it" items={watchlist} />}
        </div>
      )}
    </div>
  );
}
