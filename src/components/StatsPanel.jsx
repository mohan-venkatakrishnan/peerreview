import { useEffect, useRef, useState } from "react";
import { useTheme } from "../tokens/theme";

const reduceMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

/* Counts up to `value` on mount and whenever it changes — the "live" feel. */
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value ?? 0);
  const prev = useRef(0);
  const raf = useRef();
  useEffect(() => {
    if (value == null) return;
    if (reduceMotion()) { setDisplay(value); prev.current = value; return; }
    const from = prev.current, to = value, dur = 750, start = performance.now();
    const isInt = Number.isInteger(to);
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = from + (to - from) * eased;
      setDisplay(isInt ? Math.round(cur) : Math.round(cur * 10) / 10);
      if (t < 1) raf.current = requestAnimationFrame(tick); else prev.current = to;
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  if (value == null) return "—";
  return Number.isInteger(value) ? display.toLocaleString() : display.toFixed(1);
}

/* "State of the exchange" — live aggregate stats (dashboard + landing). */
export default function StatsPanel({ stats, title = "The exchange, live", style }) {
  const { c } = useTheme();
  const s = stats || {};
  const items = [
    { label: "Apps onboarded", value: s.products },
    { label: "Reviews exchanged", value: s.reviewsExchanged },
    { label: "Avg reviews / app", value: s.avgReceived },
    { label: "Developers", value: s.members },
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
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: 30, fontWeight: 700, color: c.gold, lineHeight: 1.1 }}><AnimatedNumber value={it.value} /></div>
            <div style={{ fontSize: 11, color: c.textMuted, marginTop: 7 }}>{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
