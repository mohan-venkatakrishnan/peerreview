import { useTheme } from "../tokens/theme";

export default function SearchBox({ value, onChange, placeholder }) {
  const { c } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "9px 14px", marginBottom: 20 }}>
      <span style={{ color: c.textMuted, fontSize: 14 }}>⌕</span>
      <input value={value} onChange={onChange} placeholder={placeholder}
        style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: c.text }} />
      {value && <span onClick={() => onChange({ target: { value: "" } })} style={{ cursor: "pointer", color: c.textMuted, fontSize: 12 }}>✕</span>}
    </div>
  );
}
