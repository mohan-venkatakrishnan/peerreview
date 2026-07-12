import { useState, useRef, useEffect } from "react";
import { useTheme } from "../tokens/theme";

/* Theme-matched date picker (the native <input type=date> popup can't be styled
   to the navy/gold theme — only light/dark). Controlled with a YYYY-MM-DD string
   so it's a drop-in for the native input. */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const pad = (n) => String(n).padStart(2, "0");
const parse = (s) => { if (!s) return null; const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmt = (s) => { const d = parse(s); return d ? `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}` : ""; };
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const same = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function DatePicker({ value, onChange, min, max, placeholder = "mm/dd/yyyy" }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => parse(value) || new Date());
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  useEffect(() => { if (open) { const d = parse(value); if (d) setView(new Date(d.getFullYear(), d.getMonth(), 1)); } }, [open, value]);

  const sel = parse(value);
  const minD = min ? startOfDay(parse(min)) : null;
  const maxD = max ? startOfDay(parse(max)) : null;
  const y = view.getFullYear(), m = view.getMonth();
  const firstDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(y, m, i + 1))];
  const disabled = (d) => (minD && d < minD) || (maxD && d > maxD);

  const field = {
    background: c.bg, border: `1px solid ${c.border}`, color: value ? c.text : c.textMuted,
    borderRadius: 8, padding: "7px 10px", fontSize: 13, cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 10, minWidth: 138, justifyContent: "space-between",
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={field}>
        <span>{value ? fmt(value) : placeholder}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.gold} strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4.5" width="18" height="17" rx="2" /><path d="M3 9h18M8 2.5v4M16 2.5v4" />
        </svg>
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100, background: c.surface, border: `1px solid ${c.borderGold}`, borderRadius: 12, padding: 12, width: 256, boxShadow: "0 12px 32px rgba(0,0,0,0.45)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button type="button" onClick={() => setView(new Date(y, m - 1, 1))} style={navBtn(c)}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 600, color: c.text, fontFamily: "'Playfair Display', serif" }}>{MONTHS[m]} {y}</span>
            <button type="button" onClick={() => setView(new Date(y, m + 1, 1))} style={navBtn(c)}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {WEEK.map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: c.textMuted, padding: "4px 0" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((d, i) => {
              if (!d) return <span key={i} />;
              const isSel = same(d, sel);
              const off = disabled(d);
              return (
                <button key={i} type="button" disabled={off}
                  onClick={() => { onChange(toStr(d)); setOpen(false); }}
                  style={{
                    aspectRatio: "1", border: isSel ? `1px solid ${c.gold}` : "1px solid transparent",
                    background: isSel ? c.goldGlow : "transparent",
                    color: off ? c.textMuted + "66" : isSel ? c.gold : c.textSub,
                    borderRadius: 8, fontSize: 12.5, cursor: off ? "not-allowed" : "pointer", padding: 0,
                    fontWeight: isSel ? 700 : 400,
                  }}
                  onMouseEnter={e => { if (!off && !isSel) e.currentTarget.style.background = c.surfaceHover; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          {value && (
            <button type="button" onClick={() => { onChange(""); setOpen(false); }}
              style={{ marginTop: 10, width: "100%", background: "transparent", border: `1px solid ${c.border}`, color: c.textMuted, borderRadius: 8, padding: "6px", fontSize: 12, cursor: "pointer" }}>
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const navBtn = (c) => ({ background: "transparent", border: `1px solid ${c.border}`, color: c.gold, borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16, lineHeight: 1, display: "grid", placeItems: "center" });
