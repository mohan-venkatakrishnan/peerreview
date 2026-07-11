import { useTheme } from "../tokens/theme";

export function GoldButton({ children, onClick, full, size = "md" }) {
  const { c } = useTheme();
  return (
    <button onClick={onClick} style={{
      background: `linear-gradient(135deg, ${c.gold}, #a07830)`, border: "none",
      borderRadius: 10, padding: size === "lg" ? "14px 32px" : size === "sm" ? "8px 16px" : "11px 24px",
      color: "#05091a", fontSize: size === "lg" ? 15 : size === "sm" ? 13 : 14, fontWeight: 700, cursor: "pointer",
      boxShadow: "0 0 24px rgba(201,168,76,0.25)", width: full ? "100%" : "auto",
      transition: "transform 0.15s", letterSpacing: "-0.01em",
    }}
      onMouseEnter={e => e.target.style.transform = "translateY(-1px)"}
      onMouseLeave={e => e.target.style.transform = "none"}>
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, full, size = "md" }) {
  const { c } = useTheme();
  return (
    <button onClick={onClick} style={{
      background: "transparent", border: `1px solid ${c.border}`, borderRadius: 10,
      padding: size === "sm" ? "8px 16px" : "11px 24px", color: c.textSub,
      fontSize: size === "sm" ? 13 : 14, fontWeight: 500, cursor: "pointer", width: full ? "100%" : "auto",
      transition: "border-color 0.2s",
    }}
      onMouseEnter={e => e.target.style.borderColor = c.borderGold}
      onMouseLeave={e => e.target.style.borderColor = c.border}>
      {children}
    </button>
  );
}

export function Card({ children, style, className }) {
  const { c } = useTheme();
  return (
    <div className={className} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: 24, ...style }}>
      {children}
    </div>
  );
}

export function Input({ label, value, onChange, placeholder, mono }) {
  const { c } = useTheme();
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.textSub, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: "100%", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 14, color: c.text, fontFamily: mono ? "JetBrains Mono, monospace" : "Inter, sans-serif", transition: "border-color 0.2s" }} />
    </div>
  );
}

/* StatBar — one card, hairline-divided stat cells. The house style for stats. */
export function StatBar({ items, className, style }) {
  const { c } = useTheme();
  return (
    <Card className={className} style={{ padding: 0, overflow: "hidden", display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, ...style }}>
      {items.map((s, i) => (
        <div key={s.label} style={{ padding: "20px 24px", borderLeft: i > 0 ? `1px solid ${c.border}` : "none" }}>
          <div style={{ fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{s.label}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 700, color: s.color || c.text, lineHeight: 1 }}>{s.value}</span>
            {s.delta && <span style={{ fontSize: 10, fontWeight: 600, color: c.verified, background: c.verified + "14", border: `1px solid ${c.verified}30`, borderRadius: 8, padding: "2px 7px" }}>{s.delta}</span>}
          </div>
          {s.sub && <div style={{ fontSize: 11, color: c.textMuted, marginTop: 7 }}>{s.sub}</div>}
        </div>
      ))}
    </Card>
  );
}

/* TrustRing — score as a progress ring inside a dashed seal echo */
export function TrustRing({ score = 4.6, size = 112, label = "Trust Score" }) {
  const { c } = useTheme();
  const r = (size - 22) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / 5));
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r + 8} stroke={c.borderGold} strokeWidth="1" strokeDasharray="3 4" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={c.border} strokeWidth="4" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={c.gold} strokeWidth="4" fill="none"
          strokeLinecap="round" strokeDasharray={`${circ * pct} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontSize: size * 0.25, fontWeight: 700, color: c.gold, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 8, letterSpacing: "0.14em", color: c.textMuted, textTransform: "uppercase", marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

/* Thin progress bar — deadline, verified ratio, plan usage */
export function MeterBar({ pct, color, height = 4, style }) {
  const { c } = useTheme();
  return (
    <div style={{ height, borderRadius: height, background: c.border, overflow: "hidden", ...style }}>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: "100%", borderRadius: height, background: color || `linear-gradient(90deg, ${c.gold}, #a07830)`, transition: "width 0.4s ease" }} />
    </div>
  );
}

/* Avatar — uploaded photo (data URL) or gold initial */
export function Avatar({ account, size = 34, fontSize = 13 }) {
  const { c } = useTheme();
  if (account.avatar) {
    return <div style={{ width: size, height: size, borderRadius: "50%", backgroundImage: `url(${account.avatar})`, backgroundSize: "cover", backgroundPosition: "center", border: `1px solid ${c.borderGold}`, flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg, ${c.gold}40, ${c.gold}70)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize, fontWeight: 700, color: c.gold, border: `1px solid ${c.borderGold}`, flexShrink: 0 }}>
      {account.name[0]}
    </div>
  );
}

export function PageTitle({ eyebrow, title, sub }) {
  const { c } = useTheme();
  return (
    <div className="fade-up" style={{ marginBottom: 32 }}>
      {eyebrow && <div style={{ fontSize: 11, color: c.gold, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>{eyebrow}</div>}
      <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 32, fontWeight: 700, color: c.text, letterSpacing: "-0.02em" }}>{title}</h1>
      {sub && <p style={{ fontSize: 14, color: c.textMuted, marginTop: 8, lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
}
