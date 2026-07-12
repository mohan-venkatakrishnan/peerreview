import { useNavigate } from "react-router-dom";
import { useTheme } from "../tokens/theme";
import { useAppState } from "../state";
import NavIcon from "./NavIcon";

export default function Spotlight() {
  const { c, setIsDark } = useTheme();
  const { spotlightOpen, setSpotlightOpen, spotlightQuery, setSpotlightQuery } = useAppState();
  const navigate = useNavigate();

  if (!spotlightOpen) return null;

  const SPOTLIGHT_INDEX = [
    { type: "Page", label: "Dashboard", nav: "dashboard", action: () => navigate("/app") },
    { type: "Page", label: "Review Queue", nav: "review", action: () => navigate("/app/review") },
    { type: "Page", label: "Incoming Reviews", nav: "review", action: () => navigate("/app/product") },
    { type: "Page", label: "Profile", nav: "profile", action: () => navigate("/app/profile") },
    { type: "Page", label: "Leaderboard", nav: "ladder", action: () => navigate("/app/leaderboard") },
    { type: "Page", label: "My Products", nav: "products", action: () => navigate("/app/products") },
    { type: "Page", label: "Rules & Badges", nav: "rules", action: () => navigate("/app/rules") },
    { type: "Page", label: "Settings", nav: "settings", action: () => navigate("/app/settings") },
    { type: "Product", label: "CommentIQ — your product", icon: "C", action: () => navigate("/app/product") },
    { type: "Action", label: "Review products in the pool", nav: "review", action: () => navigate("/app/review") },
    { type: "Reviewer", label: "Karan V. — reviewed CommentIQ", icon: "K", action: () => navigate("/app/product") },
    { type: "Reviewer", label: "Emma L. — reviewed CommentIQ", icon: "E", action: () => navigate("/app/product") },
    { type: "Action", label: "Add a new product", nav: "add", action: () => navigate("/app/products") },
    { type: "Action", label: "Toggle dark / light mode", nav: "theme", action: () => setIsDark(d => !d) },
  ];

  const q = spotlightQuery.toLowerCase();
  const results = q ? SPOTLIGHT_INDEX.filter(i => i.label.toLowerCase().includes(q) || i.type.toLowerCase().includes(q)) : SPOTLIGHT_INDEX.slice(0, 7);

  return (
    <div onClick={() => setSpotlightOpen(false)}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(2,4,12,0.6)", backdropFilter: "blur(6px)", animation: "overlayIn 0.15s ease", display: "flex", justifyContent: "center", paddingTop: "14vh" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: "min(560px, 92vw)", height: "fit-content", background: c.surface, border: `1px solid ${c.borderGold}`, borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 40px rgba(201,168,76,0.1)", animation: "spotlightIn 0.2s cubic-bezier(0.16,1,0.3,1)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: `1px solid ${c.border}` }}>
          <span style={{ color: c.gold, fontSize: 16 }}>⌕</span>
          <input autoFocus value={spotlightQuery} onChange={e => setSpotlightQuery(e.target.value)}
            placeholder="Search pages, products, reviewers…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: c.text }} />
          <span style={{ fontSize: 10, color: c.textMuted, border: `1px solid ${c.border}`, borderRadius: 5, padding: "2px 6px", fontFamily: "JetBrains Mono, monospace" }}>ESC</span>
        </div>
        <div style={{ maxHeight: 340, overflowY: "auto", padding: 8 }}>
          {results.length === 0 && <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: c.textMuted }}>No results for "{spotlightQuery}"</div>}
          {results.map((r) => (
            <div key={r.label} onClick={() => { setSpotlightOpen(false); r.action(); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 10, cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = c.goldGlow}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: c.gold, fontWeight: 600 }}>
                {r.nav ? <NavIcon name={r.nav} size={15} color={c.gold} /> : r.icon}
              </div>
              <span style={{ flex: 1, fontSize: 14, color: c.text }}>{r.label}</span>
              <span style={{ fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{r.type}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "10px 20px", borderTop: `1px solid ${c.border}`, fontSize: 11, color: c.textMuted, display: "flex", gap: 16 }}>
          <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span>
        </div>
      </div>
    </div>
  );
}
