import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../tokens/theme";
import { useAppState } from "../state";
import { PLANS, ACCOUNTS } from "../data/mock";
import SealMark from "./SealMark";
import BadgeCelebration from "./BadgeCelebration";
import FeedbackModal from "./FeedbackModal";
import ParallaxBackdrop from "./ParallaxBackdrop";
import NavIcon from "./NavIcon";
import { Avatar, SwitchAccountDialog } from "./ui";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || "");

const APP_PAGES = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", path: "/app" },
  { id: "review-queue", label: "Review Queue", icon: "review", path: "/app/review" },
  { id: "my-reviews", label: "Incoming Reviews", icon: "review", path: "/app/product" },
  { id: "profile", label: "Profile", icon: "profile", path: "/app/profile" },
  { id: "leaderboard-app", label: "Leaderboard", icon: "ladder", path: "/app/leaderboard" },
  { id: "products", label: "My Products", icon: "products", path: "/app/products" },
  { id: "rules", label: "Rules & Badges", icon: "rules", path: "/app/rules" },
  { id: "settings", label: "Settings", icon: "settings", path: "/app/settings" },
];

function activeFromPath(pathname) {
  if (pathname === "/app") return "dashboard";
  if (pathname.startsWith("/app/review")) return "review-queue";
  if (pathname.startsWith("/app/products")) return "products";
  if (pathname.startsWith("/app/product")) return "my-reviews";
  if (pathname.startsWith("/app/profile")) return "profile";
  if (pathname.startsWith("/app/leaderboard") || pathname.startsWith("/app/member")) return "leaderboard-app";
  if (pathname.startsWith("/app/rules")) return "rules";
  if (pathname.startsWith("/app/settings")) return "settings";
  return "";
}

/* Account popover opened from the sidebar footer */
function AccountMenu({ onClose, onSwitchGoogle, onFeedback }) {
  const { c } = useTheme();
  const { account, switchAccount, signOut, useMock } = useAppState();
  const navigate = useNavigate();
  const go = (fn) => { onClose(); fn(); };
  const Item = ({ icon, children, onClick, muted }) => (
    <div onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: muted ? c.textMuted : c.text, transition: "background 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.background = c.goldGlow}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <span style={{ width: 16, textAlign: "center", color: c.gold }}>{icon}</span>{children}
    </div>
  );
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
      <div className="fade-up" style={{ position: "absolute", bottom: 96, left: 10, right: 10, zIndex: 50, background: c.surface, border: `1px solid ${c.borderGold}`, borderRadius: 12, padding: 6, boxShadow: "0 16px 48px rgba(0,0,0,0.45)" }}>
        <Item icon="✦" onClick={() => go(() => navigate("/app/profile"))}>View profile</Item>
        <Item icon="✎" onClick={() => go(() => navigate("/app/settings"))}>Edit name &amp; photo</Item>
        <Item icon="✉" onClick={() => go(onFeedback)}>Send feedback</Item>
        <div style={{ borderTop: `1px solid ${c.border}`, margin: "6px 4px", paddingTop: 6 }}>
          <div style={{ fontSize: 9, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", padding: "2px 8px 6px" }}>Switch account</div>
          {!useMock && (
            <Item icon="⇄" onClick={() => go(onSwitchGoogle)}>Switch Google account</Item>
          )}
          {useMock && ACCOUNTS.map(a => (
            <div key={a.id} onClick={() => go(() => switchAccount(a.id))}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, cursor: "pointer", background: a.id === account.id ? c.goldGlow : "transparent", transition: "background 0.15s" }}
              onMouseEnter={e => { if (a.id !== account.id) e.currentTarget.style.background = c.surfaceHover; }}
              onMouseLeave={e => { if (a.id !== account.id) e.currentTarget.style.background = "transparent"; }}>
              <Avatar account={a.id === account.id ? account : { ...a, avatar: null }} size={26} fontSize={11} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{a.name}</div>
                <div style={{ fontSize: 10, color: c.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.email} · {PLANS[a.plan].label}</div>
              </div>
              {a.id === account.id && <span style={{ color: c.verified, fontSize: 12 }}>✓</span>}
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${c.border}`, margin: "6px 4px 0", paddingTop: 6 }}>
          <Item icon="↪" muted onClick={() => go(() => { if (useMock) navigate("/signin"); else signOut(); })}>Sign out</Item>
        </div>
      </div>
    </>
  );
}

/* Layout route: persistent sidebar + Outlet. Only the main pane changes on nav. */
export default function AppShell() {
  const { c, isDark, setIsDark } = useTheme();
  const { incoming, reviewablePool, plan, account, loading, loadError, loadData, saveError, clearSaveError, signOut, setSpotlightOpen, setSpotlightQuery } = useAppState();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = activeFromPath(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);

  const awaiting = incoming.filter(r => r.state === "pending" || r.state === "submitted").length;
  const badges = {
    "review-queue": reviewablePool.length || null,
    "my-reviews": awaiting || null,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
      <ParallaxBackdrop intensity={0.7} />
      <BadgeCelebration />
      {/* Sidebar */}
      <aside className="side-nav" style={{ width: 232, background: c.surface, borderRight: `1px solid ${c.border}`, padding: "24px 16px", position: "fixed", top: 0, bottom: 0, display: "flex", flexDirection: "column", zIndex: 5 }}>
        <div className="side-brand" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 20, cursor: "pointer" }} onClick={() => navigate("/")}>
          <SealMark size={26} gold={c.gold} />
          <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 600, fontSize: 16, color: c.text }}>PeerReview</span>
        </div>
        <div className="side-search" onClick={() => { setSpotlightOpen(true); setSpotlightQuery(""); }}
          style={{ display: "flex", alignItems: "center", gap: 10, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "9px 12px", marginBottom: 24, cursor: "pointer", transition: "border-color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = c.borderGold}
          onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
          <span style={{ color: c.textMuted, fontSize: 13 }}>⌕</span>
          <span style={{ flex: 1, fontSize: 12, color: c.textMuted }}>Search…</span>
          <span style={{ fontSize: 9, color: c.textMuted, border: `1px solid ${c.border}`, borderRadius: 4, padding: "1px 5px", fontFamily: "JetBrains Mono, monospace" }}>{isMac ? "⌘K" : "Ctrl K"}</span>
        </div>
        <nav style={{ flex: 1 }}>
          {APP_PAGES.map(p => (
            <div key={p.id} onClick={() => navigate(p.path)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10,
                cursor: "pointer", marginBottom: 4, fontSize: 14, fontWeight: active === p.id ? 600 : 500,
                color: active === p.id ? c.gold : c.textSub,
                background: active === p.id ? c.goldGlow : "transparent",
                border: `1px solid ${active === p.id ? c.borderGold : "transparent"}`,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { if (active !== p.id) e.currentTarget.style.background = c.surfaceHover; }}
              onMouseLeave={e => { if (active !== p.id) e.currentTarget.style.background = "transparent"; }}>
              <NavIcon name={p.icon} size={17} color={active === p.id ? c.gold : c.textSub} />
              <span className="nav-label" style={{ flex: 1 }}>{p.label}</span>
              {badges[p.id] && <span style={{ background: c.gold, color: "#05091a", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 7px" }}>{badges[p.id]}</span>}
            </div>
          ))}
        </nav>
        {menuOpen && <AccountMenu onClose={() => setMenuOpen(false)} onSwitchGoogle={() => setSwitchOpen(true)} onFeedback={() => setFeedbackOpen(true)} />}
        <div className="side-footer" style={{ borderTop: `1px solid ${c.border}`, padding: "14px 8px 0" }}>
          <div onClick={() => setMenuOpen(o => !o)} role="button" title="Account menu" aria-expanded={menuOpen}
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", borderRadius: 10, padding: "6px 6px", margin: "-6px -6px 0", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = c.surfaceHover}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Avatar account={account} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{account.name}</div>
              <div style={{ fontSize: 11, color: c.textMuted, whiteSpace: "nowrap" }}>★ {account.score} · {PLANS[plan].label} plan</div>
            </div>
            <span style={{ color: c.textMuted, fontSize: 11 }}>{menuOpen ? "▾" : "▴"}</span>
            <button onClick={e => { e.stopPropagation(); setIsDark(!isDark); }} title={isDark ? "Light mode" : "Dark mode"} style={{ background: "transparent", border: "none", cursor: "pointer", color: c.textMuted, fontSize: 15, padding: "0 2px" }}>{isDark ? "☀" : "◑"}</button>
          </div>
        </div>
      </aside>
      <SwitchAccountDialog open={switchOpen} onClose={() => setSwitchOpen(false)} onSwitch={signOut} />
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      {/* Main — only this pane changes when navigating in-app */}
      <main className="main-pane" style={{ marginLeft: 232, flex: 1, padding: "40px 48px", maxWidth: 1100, position: "relative", zIndex: 1 }}>
        {saveError && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: c.flagged + "14", border: `1px solid ${c.flagged}40`, borderRadius: 10, padding: "10px 16px", marginBottom: 18, fontSize: 13, color: c.text }}>
            <span style={{ color: c.flagged }}>⚑</span>
            <span style={{ flex: 1 }}>Couldn't save your last change — {saveError}</span>
            <span onClick={clearSaveError} style={{ cursor: "pointer", color: c.textMuted }}>✕</span>
          </div>
        )}
        {/* Three states, always (web-app-craft): loading with a specific verb,
            error with a human sentence + Retry, then content. Nothing
            plan-dependent renders before the data is known. */}
        {loading ? (
          <div className="pane-center" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
            <div className="float"><SealMark size={56} animated gold={c.gold} /></div>
            <div style={{ fontSize: 14, color: c.textMuted }}>Loading your exchange…</div>
          </div>
        ) : loadError ? (
          <div className="pane-center" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center", padding: 24 }}>
            <SealMark size={48} gold={c.flagged} />
            <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>We couldn't load your exchange</div>
            <div style={{ fontSize: 13, color: c.textMuted, maxWidth: 380, lineHeight: 1.6 }}>{loadError}</div>
            <button onClick={loadData} style={{ background: `linear-gradient(135deg, ${c.gold}, #a07830)`, border: "none", borderRadius: 10, padding: "10px 24px", color: "#05091a", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Retry</button>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
