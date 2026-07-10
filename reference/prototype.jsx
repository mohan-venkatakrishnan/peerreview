import { useState, useEffect, useRef } from "react";

/* ============ DESIGN TOKENS ============ */
const DARK = {
  bg: "#05091a", surface: "#0d1530", surfaceHover: "#111c3a",
  border: "#1a2a4a", borderGold: "rgba(201,168,76,0.25)",
  gold: "#C9A84C", goldMuted: "#8B6914", goldGlow: "rgba(201,168,76,0.08)",
  text: "#F0EDE6", textMuted: "#6b7fa3", textSub: "#8A95B0",
  verified: "#2ECC71", flagged: "#E74C3C", pending: "#f59e0b",
};
const LIGHT = {
  bg: "#FAFAF7", surface: "#F0EDE6", surfaceHover: "#E8E4D8",
  border: "#D8D4C8", borderGold: "rgba(139,105,20,0.3)",
  gold: "#8B6914", goldMuted: "#C9A84C", goldGlow: "rgba(201,168,76,0.1)",
  text: "#05091a", textMuted: "#6B7280", textSub: "#4A5568",
  verified: "#16A34A", flagged: "#DC2626", pending: "#D97706",
};

/* ============ MOCK DATA ============ */
const MY_PRODUCTS = [
  { id: 1, name: "CommentIQ", platform: "Chrome Web Store", category: "Chrome Extension", url: "chromewebstore.google.com/detail/commentiq", reviews: 8, pending: 2, verified: 6 },
];

const ASSIGNED = {
  name: "FocusFlow",
  developer: "Nadia R.",
  devScore: 4.7,
  category: "Chrome Extension",
  platform: "Chrome Web Store",
  description: "A pomodoro timer that blocks distracting sites during focus sessions. Built for deep work.",
  url: "chromewebstore.google.com/detail/focusflow",
  assignedAgo: "2 hours ago",
  deadline: "5 days",
};

const INCOMING_REVIEWS = [
  { id: 1, reviewer: "Karan V.", score: 4.8, given: 22, product: "CommentIQ", excerpt: "Really impressed by the sentiment breakdown. The on-device processing means my data never leaves the browser — that's rare. Would love export to CSV though.", link: "chromewebstore.google.com/detail/commentiq/reviews#r-8842", time: "3 hours ago", state: "pending" },
  { id: 2, reviewer: "Emma L.", score: 4.9, given: 41, product: "CommentIQ", excerpt: "Clean UI, does what it says. The comment clustering saved me hours on my channel audit.", link: "chromewebstore.google.com/detail/commentiq/reviews#r-8836", time: "1 day ago", state: "pending" },
];

const REVIEW_HISTORY = [
  { id: 1, product: "TabStash", developer: "Miguel S.", state: "verified", time: "2 days ago", rating: 5 },
  { id: 2, product: "QuickNote", developer: "Sana P.", state: "verified", time: "5 days ago", rating: 4 },
  { id: 3, product: "DevTimer", developer: "Chris O.", state: "pending", time: "6 days ago", rating: null },
  { id: 4, product: "LinkVault", developer: "Rita M.", state: "verified", time: "2 weeks ago", rating: 5 },
];

const LEADERBOARD_FULL = [
  { rank: 1, name: "Priya K.", given: 47, received: 45, verified: 44, score: 4.9, streak: 12, category: "Chrome Extension", badges: ["crown", "flame", "shield"] },
  { rank: 2, name: "Tom W.", given: 38, received: 36, verified: 35, score: 4.8, streak: 8, category: "SaaS Tool", badges: ["gem", "shield"] },
  { rank: 3, name: "Aisha M.", given: 31, received: 30, verified: 29, score: 4.7, streak: 15, category: "Web App", badges: ["flame", "bolt"] },
  { rank: 4, name: "You (Mohan)", given: 12, received: 8, verified: 10, score: 4.6, streak: 4, isYou: true, category: "Chrome Extension", badges: ["seal", "bolt"] },
  { rank: 5, name: "Dev R.", given: 24, received: 22, verified: 20, score: 4.6, streak: 3, category: "Mobile App", badges: ["gem"] },
  { rank: 6, name: "Lena S.", given: 19, received: 18, verified: 17, score: 4.5, streak: 6, category: "Web App", badges: ["shield"] },
  { rank: 7, name: "Jake T.", given: 15, received: 14, verified: 12, score: 4.4, streak: 2, category: "Chrome Extension", badges: ["seal"] },
];

/* Badge definitions — earned achievements */
const BADGE_DEFS = {
  crown: { name: "Top Reviewer", desc: "Ranked #1 in a monthly leaderboard" },
  flame: { name: "On Fire", desc: "8+ week review streak" },
  shield: { name: "Trusted", desc: "95%+ of reviews verified" },
  bolt: { name: "Fast Turnaround", desc: "Reviews within 24h of assignment" },
  gem: { name: "Deep Diver", desc: "Consistently detailed, high-trust reviews" },
  seal: { name: "Founding Member", desc: "Joined in the first launch cohort" },
};

const PLATFORMS = ["Chrome Web Store", "Firefox Add-ons", "Edge Add-ons", "Product Hunt", "Google Play Store", "Apple App Store"];
const CATEGORIES = ["Chrome Extension", "Web App", "Mobile App", "SaaS Tool", "Desktop App", "Developer Tool"];

/* ============ SHARED COMPONENTS ============ */
function SealMark({ size = 80, animated = false, gold = "#C9A84C" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none"
      style={{ animation: animated ? "rotateSeal 20s linear infinite" : "none", flexShrink: 0 }}>
      <circle cx="40" cy="40" r="36" stroke={gold} strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="40" cy="40" r="28" stroke={gold} strokeWidth="0.75" opacity="0.5" />
      <path d="M40 16 L43 31 L58 24 L47 35 L62 40 L47 45 L58 56 L43 49 L40 64 L37 49 L22 56 L33 45 L18 40 L33 35 L22 24 L37 31 Z" fill={gold} opacity="0.15" />
      <circle cx="40" cy="40" r="8" fill={gold} opacity="0.2" />
      <path d="M36 40 L39 43 L45 37" stroke={gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StateBadge({ state, c }) {
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

function BadgeIcon({ type, size = 26, gold = "#C9A84C", showTooltip = true }) {
  const icons = {
    crown: <path d="M5 19 L5 10 L9 13 L13 6 L17 13 L21 10 L21 19 Z M5 21 L21 21" stroke={gold} strokeWidth="1.6" fill={gold + "22"} strokeLinejoin="round" strokeLinecap="round" />,
    flame: <path d="M13 3 C13 3 7 9 7 14 C7 17.9 9.7 21 13 21 C16.3 21 19 17.9 19 14 C19 11.5 17.5 9.5 16.5 8 C16.5 10 15.5 11 14.5 11 C14.5 8 14 5 13 3 Z" stroke={gold} strokeWidth="1.6" fill={gold + "22"} strokeLinejoin="round" />,
    shield: <path d="M13 3 L21 6 L21 12 C21 17 17.5 20.5 13 22 C8.5 20.5 5 17 5 12 L5 6 Z M9.5 12 L12 14.5 L16.5 9.5" stroke={gold} strokeWidth="1.6" fill={gold + "18"} strokeLinejoin="round" strokeLinecap="round" />,
    bolt: <path d="M14 3 L6 14 L12 14 L11 21 L20 10 L14 10 Z" stroke={gold} strokeWidth="1.6" fill={gold + "22"} strokeLinejoin="round" />,
    gem: <path d="M8 4 L18 4 L22 9 L13 21 L4 9 Z M4 9 L22 9 M10 9 L13 21 L16 9 M8 4 L10 9 L13 4 L16 9 L18 4" stroke={gold} strokeWidth="1.4" fill={gold + "18"} strokeLinejoin="round" />,
    seal: <><circle cx="13" cy="13" r="9" stroke={gold} strokeWidth="1.5" strokeDasharray="3 2.2" fill={gold + "15"} /><path d="M10 13 L12 15 L16.5 10.5" stroke={gold} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></>,
  };
  return (
    <span title={showTooltip ? `${BADGE_DEFS[type].name} — ${BADGE_DEFS[type].desc}` : undefined} style={{ display: "inline-flex", cursor: showTooltip ? "help" : "default" }}>
      <svg width={size} height={size} viewBox="0 0 26 26" fill="none">{icons[type]}</svg>
    </span>
  );
}

/* ============ MAIN APP ============ */
export default function PeerReviewApp() {
  const [isDark, setIsDark] = useState(true);
  const [page, setPage] = useState("landing");
  const [transitioning, setTransitioning] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const [reviewLinkPasted, setReviewLinkPasted] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [verifiedIds, setVerifiedIds] = useState([]);
  const [flaggedIds, setFlaggedIds] = useState([]);
  const [stampAnimating, setStampAnimating] = useState(null);
  const [productForm, setProductForm] = useState({ name: "", platform: "", url: "", category: "", desc: "", matching: "category" });
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState("");
  const [lbCategory, setLbCategory] = useState("All");
  const [lbSort, setLbSort] = useState("trust");
  const [lbSearch, setLbSearch] = useState("");
  const [reviewsSearch, setReviewsSearch] = useState("");
  const [viewProfile, setViewProfile] = useState(null);
  const [privacy, setPrivacy] = useState({ showName: false, showEmail: false, showPhoto: false });

  const c = isDark ? DARK : LIGHT;

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSpotlightOpen(o => !o); setSpotlightQuery(""); }
      if (e.key === "Escape") setSpotlightOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const navigate = (to) => {
    setTransitioning(true);
    setTimeout(() => {
      setPage(to);
      setTransitioning(false);
      window.scrollTo(0, 0);
    }, 220);
  };

  const verifyReview = (id) => {
    setStampAnimating(id);
    setTimeout(() => {
      setVerifiedIds(v => [...v, id]);
      setStampAnimating(null);
    }, 500);
  };
  const flagReview = (id) => setFlaggedIds(f => [...f, id]);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; }
    @keyframes rotateSeal { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
    @keyframes stampIn { 0% { transform: scale(1.6) rotate(-8deg); opacity: 0; } 55% { transform: scale(0.92) rotate(2deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
    @keyframes slideRight { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(201,168,76,0.15); } 50% { box-shadow: 0 0 36px rgba(201,168,76,0.3); } }
    @keyframes spotlightIn { from { opacity: 0; transform: translateY(-12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes drift1 { 0%, 100% { transform: translate(0, 0); } 33% { transform: translate(24px, -18px); } 66% { transform: translate(-16px, 14px); } }
    @keyframes drift2 { 0%, 100% { transform: translate(0, 0); } 33% { transform: translate(-28px, 20px); } 66% { transform: translate(18px, -12px); } }
    @keyframes drift3 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(20px, -24px); } }
    .fade-up { animation: fadeUp 0.55s ease forwards; }
    .fade-up-d1 { animation: fadeUp 0.55s ease 0.08s forwards; opacity: 0; }
    .fade-up-d2 { animation: fadeUp 0.55s ease 0.16s forwards; opacity: 0; }
    .fade-up-d3 { animation: fadeUp 0.55s ease 0.24s forwards; opacity: 0; }
    .stamp-in { animation: stampIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
    .float { animation: float 4s ease-in-out infinite; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 3px; }
    input, select, textarea { font-family: 'Inter', sans-serif; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: ${c.gold} !important; }
  `;

  /* ---------- shared UI helpers ---------- */
  const GoldButton = ({ children, onClick, full, size = "md" }) => (
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

  const GhostButton = ({ children, onClick, full, size = "md" }) => (
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

  const Card = ({ children, style, className }) => (
    <div className={className} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: 24, ...style }}>
      {children}
    </div>
  );

  const Input = ({ label, value, onChange, placeholder, mono }) => (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.textSub, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: "100%", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 14, color: c.text, fontFamily: mono ? "JetBrains Mono, monospace" : "Inter, sans-serif", transition: "border-color 0.2s" }} />
    </div>
  );

  /* ============ PARALLAX BACKDROP (pure CSS — no re-renders) ============ */
  const ParallaxBackdrop = ({ intensity = 1 }) => (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute", top: "8%", left: "6%", width: 460, height: 460,
        background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)",
        borderRadius: "50%", animation: `drift1 ${18 / intensity}s ease-in-out infinite`,
      }} />
      <div style={{
        position: "absolute", top: "45%", right: "4%", width: 340, height: 340,
        background: "radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)",
        borderRadius: "50%", animation: `drift2 ${24 / intensity}s ease-in-out infinite`,
      }} />
      <div style={{
        position: "absolute", bottom: "6%", left: "28%", width: 520, height: 240,
        background: "radial-gradient(ellipse, rgba(201,168,76,0.04) 0%, transparent 70%)",
        animation: `drift3 ${30 / intensity}s ease-in-out infinite`,
      }} />
      <div style={{
        position: "absolute", inset: "-60px", opacity: 0.03,
        backgroundImage: `linear-gradient(${c.gold} 1px, transparent 1px), linear-gradient(90deg, ${c.gold} 1px, transparent 1px)`,
        backgroundSize: "60px 60px", animation: `drift2 ${40 / intensity}s ease-in-out infinite`,
      }} />
      <div style={{ position: "absolute", bottom: "-6%", right: "-4%", opacity: 0.04, animation: `drift1 ${26 / intensity}s ease-in-out infinite` }}>
        <SealMark size={420} gold={c.gold} />
      </div>
    </div>
  );

  /* ============ SPOTLIGHT SEARCH ============ */
  const SPOTLIGHT_INDEX = [
    { type: "Page", label: "Dashboard", icon: "◈", action: () => navigate("dashboard") },
    { type: "Page", label: "Review Queue", icon: "◎", action: () => navigate("review-queue") },
    { type: "Page", label: "My Product Reviews", icon: "⊕", action: () => navigate("my-reviews") },
    { type: "Page", label: "Profile", icon: "✦", action: () => navigate("profile") },
    { type: "Page", label: "Leaderboard", icon: "▲", action: () => navigate("leaderboard-app") },
    { type: "Page", label: "My Products", icon: "▣", action: () => navigate("products") },
    { type: "Page", label: "Settings", icon: "⚙", action: () => navigate("settings") },
    { type: "Product", label: "CommentIQ — your product", icon: "C", action: () => navigate("my-reviews") },
    { type: "Product", label: "FocusFlow — assigned to you", icon: "F", action: () => navigate("review-queue") },
    { type: "Reviewer", label: "Karan V. — reviewed CommentIQ", icon: "K", action: () => navigate("my-reviews") },
    { type: "Reviewer", label: "Emma L. — reviewed CommentIQ", icon: "E", action: () => navigate("my-reviews") },
    { type: "Action", label: "Add a new product", icon: "+", action: () => navigate("products") },
    { type: "Action", label: "Toggle dark / light mode", icon: "◑", action: () => setIsDark(d => !d) },
  ];

  const Spotlight = () => {
    if (!spotlightOpen) return null;
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
            {results.map((r, i) => (
              <div key={r.label} onClick={() => { setSpotlightOpen(false); r.action(); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 10, cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = c.goldGlow}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: c.gold, fontWeight: 600 }}>{r.icon}</div>
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
  };

  const SearchBox = ({ value, onChange, placeholder }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "9px 14px", marginBottom: 20 }}>
      <span style={{ color: c.textMuted, fontSize: 14 }}>⌕</span>
      <input value={value} onChange={onChange} placeholder={placeholder}
        style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: c.text }} />
      {value && <span onClick={() => onChange({ target: { value: "" } })} style={{ cursor: "pointer", color: c.textMuted, fontSize: 12 }}>✕</span>}
    </div>
  );

  /* ============ APP SHELL (sidebar) ============ */
  const APP_PAGES = [
    { id: "dashboard", label: "Dashboard", icon: "◈" },
    { id: "review-queue", label: "Review Queue", icon: "◎", badge: reviewSubmitted ? null : 1 },
    { id: "my-reviews", label: "My Product", icon: "⊕", badge: INCOMING_REVIEWS.filter(r => !verifiedIds.includes(r.id) && !flaggedIds.includes(r.id)).length || null },
    { id: "profile", label: "Profile", icon: "✦" },
    { id: "leaderboard-app", label: "Leaderboard", icon: "▲" },
    { id: "products", label: "My Products", icon: "▣" },
    { id: "settings", label: "Settings", icon: "⚙" },
  ];

  const AppShell = ({ children, active }) => (
    <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
      <ParallaxBackdrop intensity={0.7} />
      {/* Sidebar */}
      <aside style={{ width: 232, background: c.surface, borderRight: `1px solid ${c.border}`, padding: "24px 16px", position: "fixed", top: 0, bottom: 0, display: "flex", flexDirection: "column", zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 20, cursor: "pointer" }} onClick={() => navigate("landing")}>
          <SealMark size={26} gold={c.gold} />
          <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 600, fontSize: 16, color: c.text }}>PeerReview</span>
        </div>
        <div onClick={() => { setSpotlightOpen(true); setSpotlightQuery(""); }}
          style={{ display: "flex", alignItems: "center", gap: 10, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "9px 12px", marginBottom: 24, cursor: "pointer", transition: "border-color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = c.borderGold}
          onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
          <span style={{ color: c.textMuted, fontSize: 13 }}>⌕</span>
          <span style={{ flex: 1, fontSize: 12, color: c.textMuted }}>Search…</span>
          <span style={{ fontSize: 9, color: c.textMuted, border: `1px solid ${c.border}`, borderRadius: 4, padding: "1px 5px", fontFamily: "JetBrains Mono, monospace" }}>⌘K</span>
        </div>
        <nav style={{ flex: 1 }}>
          {APP_PAGES.map(p => (
            <div key={p.id} onClick={() => navigate(p.id)}
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
              <span style={{ fontSize: 15, width: 18 }}>{p.icon}</span>
              <span style={{ flex: 1 }}>{p.label}</span>
              {p.badge && <span style={{ background: c.gold, color: "#05091a", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 7px" }}>{p.badge}</span>}
            </div>
          ))}
        </nav>
        <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 16, display: "flex", alignItems: "center", gap: 10, padding: "16px 8px 0" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${c.gold}40, ${c.gold}70)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: c.gold, border: `1px solid ${c.borderGold}` }}>M</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>Mohan</div>
            <div style={{ fontSize: 11, color: c.textMuted }}>★ 4.6 · Free plan</div>
          </div>
          <button onClick={() => setIsDark(!isDark)} style={{ background: "transparent", border: "none", cursor: "pointer", color: c.textMuted, fontSize: 15 }}>{isDark ? "☀" : "◑"}</button>
        </div>
      </aside>
      {/* Main */}
      <main style={{ marginLeft: 232, flex: 1, padding: "40px 48px", maxWidth: 1100, position: "relative", zIndex: 1 }}>
        {children}
      </main>
    </div>
  );

  const PageTitle = ({ eyebrow, title, sub }) => (
    <div className="fade-up" style={{ marginBottom: 32 }}>
      {eyebrow && <div style={{ fontSize: 11, color: c.gold, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>{eyebrow}</div>}
      <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 32, fontWeight: 700, color: c.text, letterSpacing: "-0.02em" }}>{title}</h1>
      {sub && <p style={{ fontSize: 14, color: c.textMuted, marginTop: 8, lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );

  /* ============ PAGES ============ */

  /* ---- LANDING (condensed) ---- */
  const Landing = () => (
    <div>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: isDark ? "rgba(5,9,26,0.92)" : "rgba(250,250,247,0.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${c.border}`, padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SealMark size={28} gold={c.gold} />
            <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 600, fontSize: 18, color: c.text }}>PeerReview</span>
            <span style={{ fontSize: 10, color: c.textMuted, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 4, padding: "2px 6px" }}>by tapdot</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => setIsDark(!isDark)} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: c.textMuted }}>{isDark ? "☀" : "◑"}</button>
            <GoldButton size="sm" onClick={() => navigate("signin")}>Join the exchange</GoldButton>
          </div>
        </div>
      </nav>
      <section style={{ minHeight: "88vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 24px 60px", position: "relative", overflow: "hidden" }}>
        <ParallaxBackdrop />
        <div style={{
          position: "absolute", top: "12%", left: "12%", width: 380, height: 380,
          background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)", borderRadius: "50%",
          animation: "drift1 16s ease-in-out infinite",
        }} />
        <div style={{ maxWidth: 760, textAlign: "center", position: "relative", zIndex: 1 }}>
          <div className="float" style={{ marginBottom: 28, display: "inline-block" }}><SealMark size={68} animated gold={c.gold} /></div>
          <h1 className="fade-up" style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(40px, 7vw, 68px)", lineHeight: 1.12, letterSpacing: "-0.02em", color: c.text, marginBottom: 22 }}>
            Genuine reviews.<br /><span style={{ color: c.gold }}>Mutual trust.</span>
          </h1>
          <p className="fade-up-d1" style={{ fontSize: 17, lineHeight: 1.7, color: c.textSub, maxWidth: 540, margin: "0 auto 36px" }}>
            Review a developer's product. A developer reviews yours. Every review verified by a real person.
          </p>
          <div className="fade-up-d2" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <GoldButton size="lg" onClick={() => navigate("signin")}>List your product — it's free</GoldButton>
            <GhostButton onClick={() => navigate("leaderboard-public")}>See the leaderboard →</GhostButton>
          </div>
          <p className="fade-up-d3" style={{ marginTop: 40, fontSize: 12, color: c.textMuted }}>
            This is the full landing page you approved — click "Join the exchange" to walk the entire app flow →
          </p>
        </div>
      </section>
    </div>
  );

  /* ---- SIGN IN ---- */
  const SignIn = () => (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <ParallaxBackdrop />
      <Card className="fade-up" style={{ maxWidth: 420, width: "100%", padding: 40, textAlign: "center", position: "relative", zIndex: 1 }}>
        <div className="float" style={{ display: "inline-block", marginBottom: 24 }}><SealMark size={56} animated gold={c.gold} /></div>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 700, color: c.text, marginBottom: 8 }}>Welcome to PeerReview</h1>
        <p style={{ fontSize: 14, color: c.textMuted, marginBottom: 32, lineHeight: 1.6 }}>Sign in to join the exchange. We only use your account for sign-in — nothing else, nowhere else.</p>
        <button onClick={() => { setOnboardStep(0); navigate("onboarding"); }}
          style={{ width: "100%", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 600, color: c.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "border-color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = c.borderGold}
          onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <p style={{ marginTop: 24, fontSize: 11, color: c.textMuted, lineHeight: 1.6 }}>
          Privacy by architecture. Your sign-in identity is used for account access only — never sent to third parties, never tracked.
        </p>
      </Card>
    </div>
  );

  /* ---- ONBOARDING ---- */
  const Onboarding = () => {
    const steps = ["Your product", "Matching", "Done"];
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
        <ParallaxBackdrop intensity={0.8} />
        <div style={{ maxWidth: 520, width: "100%", position: "relative", zIndex: 1 }}>
          {/* Progress */}
          <div className="fade-up" style={{ display: "flex", gap: 8, marginBottom: 32 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ flex: 1 }}>
                <div style={{ height: 3, borderRadius: 2, background: i <= onboardStep ? c.gold : c.border, transition: "background 0.4s" }} />
                <div style={{ fontSize: 11, color: i <= onboardStep ? c.gold : c.textMuted, marginTop: 8, fontWeight: 600 }}>{s}</div>
              </div>
            ))}
          </div>

          {onboardStep === 0 && (
            <Card className="fade-up" style={{ padding: 36 }}>
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 24, fontWeight: 700, color: c.text, marginBottom: 6 }}>Add your product</h2>
              <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 28, lineHeight: 1.6 }}>Your product must have a live listing on a supported platform. We detect the platform from your URL.</p>
              <Input label="Product name" placeholder="e.g. CommentIQ" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
              <Input label="Store listing URL" placeholder="chromewebstore.google.com/detail/…" mono value={productForm.url} onChange={e => setProductForm({ ...productForm, url: e.target.value })} />
              {productForm.url.length > 8 && (
                <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: -8, marginBottom: 18, fontSize: 12, color: c.verified }}>
                  ✓ Platform detected: <strong>Chrome Web Store</strong>
                </div>
              )}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.textSub, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Category</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setProductForm({ ...productForm, category: cat })}
                      style={{
                        background: productForm.category === cat ? c.goldGlow : c.bg,
                        border: `1px solid ${productForm.category === cat ? c.gold : c.border}`,
                        color: productForm.category === cat ? c.gold : c.textSub,
                        borderRadius: 20, padding: "7px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                      }}>{cat}</button>
                  ))}
                </div>
              </div>
              <Input label="One line description" placeholder="What does it do?" value={productForm.desc} onChange={e => setProductForm({ ...productForm, desc: e.target.value })} />
              <div style={{ marginTop: 8 }}>
                <GoldButton full onClick={() => setOnboardStep(1)}>Continue →</GoldButton>
              </div>
            </Card>
          )}

          {onboardStep === 1 && (
            <Card className="fade-up" style={{ padding: 36 }}>
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 24, fontWeight: 700, color: c.text, marginBottom: 6 }}>How should we match you?</h2>
              <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 28, lineHeight: 1.6 }}>Choose who reviews your product — and whose products you review.</p>
              {[
                { id: "category", title: "Category match", desc: "You review products in your category. Chrome extension devs review your extension. Deeper, more relevant feedback.", icon: "◎" },
                { id: "open", title: "Open match", desc: "Anyone in the pool can be matched with you. Faster matching, broader perspectives.", icon: "⊕" },
              ].map(opt => (
                <div key={opt.id} onClick={() => setProductForm({ ...productForm, matching: opt.id })}
                  style={{
                    border: `1px solid ${productForm.matching === opt.id ? c.gold : c.border}`,
                    background: productForm.matching === opt.id ? c.goldGlow : c.bg,
                    borderRadius: 12, padding: 20, marginBottom: 12, cursor: "pointer", transition: "all 0.2s",
                    display: "flex", gap: 16, alignItems: "flex-start",
                  }}>
                  <span style={{ fontSize: 22, color: productForm.matching === opt.id ? c.gold : c.textMuted }}>{opt.icon}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 4 }}>{opt.title}</div>
                    <div style={{ fontSize: 13, color: c.textMuted, lineHeight: 1.6 }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <GhostButton onClick={() => setOnboardStep(0)}>← Back</GhostButton>
                <div style={{ flex: 1 }}><GoldButton full onClick={() => setOnboardStep(2)}>Continue →</GoldButton></div>
              </div>
            </Card>
          )}

          {onboardStep === 2 && (
            <Card className="fade-up" style={{ padding: 44, textAlign: "center" }}>
              <div className="stamp-in" style={{ display: "inline-block", marginBottom: 24 }}>
                <SealMark size={80} gold={c.gold} />
              </div>
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 700, color: c.text, marginBottom: 10 }}>You're in the pool</h2>
              <p style={{ fontSize: 14, color: c.textMuted, lineHeight: 1.7, marginBottom: 28, maxWidth: 360, margin: "0 auto 28px" }}>
                <strong style={{ color: c.text }}>{productForm.name || "Your product"}</strong> is listed. You'll be assigned your first product to review shortly. Every review you give earns one back.
              </p>
              <GoldButton size="lg" onClick={() => navigate("dashboard")}>Go to dashboard →</GoldButton>
            </Card>
          )}
        </div>
      </div>
    );
  };

  /* ---- DASHBOARD ---- */
  const Dashboard = () => (
    <AppShell active="dashboard">
      <PageTitle eyebrow="Dashboard" title="Good evening, Mohan" sub="Here's where your exchange stands." />

      {/* Stats row */}
      <div className="fade-up-d1" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          ["12", "Reviews given", c.gold],
          ["8", "Reviews received", c.gold],
          ["★ 4.6", "Trust Score", c.verified],
          ["#4", "Leaderboard rank", c.gold],
        ].map(([val, label, color]) => (
          <Card key={label} style={{ padding: 20 }}>
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 700, color }}>{val}</div>
            <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>{label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        {/* Review queue card */}
        <Card className="fade-up-d2" style={{ position: "relative", overflow: "hidden" }}>
          {!reviewSubmitted ? (
            <>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${c.gold}, transparent)` }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em" }}>◎ Your review queue</div>
                <span style={{ fontSize: 11, color: c.textMuted }}>Due in {ASSIGNED.deadline}</span>
              </div>
              <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 6 }}>{ASSIGNED.name}</h3>
              <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 12 }}>{ASSIGNED.category} · by {ASSIGNED.developer} (★ {ASSIGNED.devScore})</div>
              <p style={{ fontSize: 14, color: c.textSub, lineHeight: 1.7, marginBottom: 20 }}>{ASSIGNED.description}</p>
              <GoldButton onClick={() => navigate("review-queue")}>Start reviewing →</GoldButton>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div className="stamp-in" style={{ display: "inline-block", marginBottom: 12 }}><SealMark size={48} gold={c.gold} /></div>
              <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>Queue clear</div>
              <p style={{ fontSize: 13, color: c.textMuted }}>Your review is pending verification by {ASSIGNED.developer}. A new assignment lands soon.</p>
            </div>
          )}
        </Card>

        {/* My product status */}
        <Card className="fade-up-d3">
          <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>⊕ Your product</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 14 }}>CommentIQ</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["Reviews received", "8"],
              ["Verified by you", "6"],
              ["Awaiting your verification", INCOMING_REVIEWS.filter(r => !verifiedIds.includes(r.id) && !flaggedIds.includes(r.id)).length],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: c.textMuted }}>{label}</span>
                <span style={{ color: c.text, fontWeight: 600 }}>{val}</span>
              </div>
            ))}
          </div>
          {INCOMING_REVIEWS.filter(r => !verifiedIds.includes(r.id) && !flaggedIds.includes(r.id)).length > 0 && (
            <div style={{ marginTop: 18 }}>
              <GhostButton full size="sm" onClick={() => navigate("my-reviews")}>Verify incoming reviews →</GhostButton>
            </div>
          )}
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="fade-up-d3" style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Recent activity</div>
        {REVIEW_HISTORY.slice(0, 3).map((r, i) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < 2 ? `1px solid ${c.border}` : "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: c.gold }}>◎</div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, color: c.text }}>You reviewed <strong>{r.product}</strong></span>
              <span style={{ fontSize: 12, color: c.textMuted }}> · {r.time}</span>
            </div>
            <StateBadge state={r.state} c={c} />
          </div>
        ))}
      </Card>
    </AppShell>
  );

  /* ---- REVIEW QUEUE / ASSIGNED PRODUCT ---- */
  const ReviewQueue = () => (
    <AppShell active="review-queue">
      <PageTitle eyebrow="Review Queue" title="Your assignment" sub="Review this product genuinely on its store listing, then paste your review link below." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Product card */}
        <Card className="fade-up-d1">
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: `linear-gradient(135deg, ${c.gold}25, ${c.gold}50)`, border: `1px solid ${c.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: c.gold }}>F</div>
            <div>
              <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700, color: c.text }}>{ASSIGNED.name}</h3>
              <div style={{ fontSize: 12, color: c.textMuted }}>{ASSIGNED.category} · {ASSIGNED.platform}</div>
            </div>
          </div>
          <p style={{ fontSize: 14, color: c.textSub, lineHeight: 1.7, marginBottom: 20 }}>{ASSIGNED.description}</p>
          <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "12px 14px", fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: c.textSub, marginBottom: 20, wordBreak: "break-all" }}>
            {ASSIGNED.url}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <GoldButton>Open listing ↗</GoldButton>
            <GhostButton>Skip this one</GhostButton>
          </div>
          <div style={{ marginTop: 20, padding: 14, background: c.goldGlow, border: `1px solid ${c.borderGold}`, borderRadius: 10, fontSize: 12, color: c.textSub, lineHeight: 1.6 }}>
            <strong style={{ color: c.gold }}>✦ Developer:</strong> {ASSIGNED.developer} · trust score ★ {ASSIGNED.devScore}. They will verify your review — genuine, thoughtful reviews earn verified status and grow your reputation.
          </div>
        </Card>

        {/* Submit review */}
        <Card className="fade-up-d2">
          <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>Submit your review</div>
          {!reviewSubmitted ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 22 }}>
                {[
                  ["1", "Open the store listing", true],
                  ["2", "Leave a genuine review on the platform", true],
                  ["3", "Paste the direct link to your review", reviewLinkPasted.length > 8],
                ].map(([n, label, done]) => (
                  <div key={n} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", border: `1.5px solid ${done ? c.verified : c.border}`, background: done ? c.verified + "20" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: done ? c.verified : c.textMuted, transition: "all 0.3s" }}>
                      {done ? "✓" : n}
                    </div>
                    <span style={{ fontSize: 13, color: done ? c.text : c.textMuted }}>{label}</span>
                  </div>
                ))}
              </div>
              <Input label="Your review link" mono placeholder="Paste the URL of your review…" value={reviewLinkPasted} onChange={e => setReviewLinkPasted(e.target.value)} />
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.textSub, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Review text <span style={{ color: c.textMuted, fontWeight: 400, textTransform: "none" }}>(optional — helps faster verification)</span></label>
                <textarea placeholder="Paste your review text here…" rows={4}
                  style={{ width: "100%", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 13, color: c.text, resize: "vertical", lineHeight: 1.6 }} />
              </div>
              {reviewLinkPasted.length > 8 && (
                <div className="fade-up" style={{ fontSize: 12, color: c.verified, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  ✓ Link matches {ASSIGNED.platform} review format
                </div>
              )}
              <GoldButton full onClick={() => { if (reviewLinkPasted.length > 8) { setReviewSubmitted(true); } }}>
                Submit for verification
              </GoldButton>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div className="stamp-in" style={{ display: "inline-block", marginBottom: 16 }}><SealMark size={64} gold={c.gold} /></div>
              <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700, color: c.text, marginBottom: 8 }}>Review submitted</h3>
              <p style={{ fontSize: 13, color: c.textMuted, lineHeight: 1.7, marginBottom: 8 }}>
                Now pending verification by {ASSIGNED.developer}.
              </p>
              <StateBadge state="pending" c={c} />
              <div style={{ marginTop: 20, padding: 14, background: c.goldGlow, border: `1px solid ${c.borderGold}`, borderRadius: 10, fontSize: 12, color: c.textSub, lineHeight: 1.6, textAlign: "left" }}>
                <strong style={{ color: c.gold }}>✦ What happens next:</strong> you've earned a review credit. Someone in the pool has been assigned <strong>CommentIQ</strong> — your review is on its way.
              </div>
              <div style={{ marginTop: 16 }}>
                <GhostButton full size="sm" onClick={() => navigate("dashboard")}>Back to dashboard</GhostButton>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );

  /* ---- MY PRODUCT / VERIFY REVIEWS ---- */
  const MyReviews = () => (
    <AppShell active="my-reviews">
      <PageTitle eyebrow="My Product" title="CommentIQ" sub="Reviews your product has received. Read each one on the platform, then verify or flag it." />

      <div className="fade-up-d1" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {[["8", "Total received"], ["6", "Verified by you"], [INCOMING_REVIEWS.filter(r => !verifiedIds.includes(r.id) && !flaggedIds.includes(r.id)).length, "Awaiting verification"]].map(([val, label]) => (
          <Card key={label} style={{ padding: 20 }}>
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 700, color: c.gold }}>{val}</div>
            <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>{label}</div>
          </Card>
        ))}
      </div>

      <div className="fade-up-d2">
        <SearchBox value={reviewsSearch} onChange={e => setReviewsSearch(e.target.value)} placeholder="Search reviews by reviewer or content…" />
      </div>

      {INCOMING_REVIEWS.filter(r => !reviewsSearch || r.reviewer.toLowerCase().includes(reviewsSearch.toLowerCase()) || r.excerpt.toLowerCase().includes(reviewsSearch.toLowerCase())).map((r, i) => {
        const isVerified = verifiedIds.includes(r.id);
        const isFlagged = flaggedIds.includes(r.id);
        const isStamping = stampAnimating === r.id;
        return (
          <Card key={r.id} className={i === 0 ? "fade-up-d2" : "fade-up-d3"} style={{ marginBottom: 16, position: "relative", overflow: "hidden" }}>
            {isVerified && (
              <div className="stamp-in" style={{ position: "absolute", top: 16, right: 16, opacity: 0.9 }}>
                <SealMark size={44} gold={c.verified} />
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${c.gold}30, ${c.gold}60)`, border: `1px solid ${c.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: c.gold }}>{r.reviewer[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{r.reviewer}</div>
                <div style={{ fontSize: 11, color: c.textMuted }}>★ {r.score} trust · {r.given} reviews given · {r.time}</div>
              </div>
              {isVerified ? <StateBadge state="verified" c={c} /> : isFlagged ? <StateBadge state="flagged" c={c} /> : <StateBadge state="pending" c={c} />}
            </div>
            <p style={{ fontSize: 14, color: c.textSub, lineHeight: 1.7, marginBottom: 14, fontStyle: "italic" }}>"{r.excerpt}"</p>
            <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: "10px 12px", fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: c.textMuted, marginBottom: 16, wordBreak: "break-all", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: c.gold }}>↗</span> {r.link}
            </div>
            {!isVerified && !isFlagged && (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => verifyReview(r.id)}
                  style={{
                    flex: 1, background: isStamping ? c.verified : `linear-gradient(135deg, ${c.verified}, #1f9e57)`,
                    border: "none", borderRadius: 10, padding: "11px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                    transition: "all 0.2s",
                  }}>
                  {isStamping ? "Stamping…" : "✓ Verify — genuine & helpful"}
                </button>
                <button onClick={() => flagReview(r.id)}
                  style={{ background: "transparent", border: `1px solid ${c.flagged}50`, borderRadius: 10, padding: "11px 18px", color: c.flagged, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  ⚑ Flag
                </button>
              </div>
            )}
          </Card>
        );
      })}
    </AppShell>
  );

  /* ---- PROFILE ---- */
  const Profile = () => (
    <AppShell active="profile">
      <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 36 }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: `linear-gradient(135deg, ${c.gold}30, ${c.gold}70)`, border: `2px solid ${c.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700, color: c.gold, fontFamily: "Playfair Display, serif" }}>M</div>
          <div style={{ position: "absolute", bottom: -6, right: -6 }}><SealMark size={34} gold={c.gold} /></div>
        </div>
        <div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 30, fontWeight: 700, color: c.text }}>Mohan</h1>
          <div style={{ fontSize: 13, color: c.textMuted, marginTop: 4 }}>Member since July 2026 · tapdot.org</div>
          <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
            {["seal", "bolt", "shield"].map(b => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 6, background: c.goldGlow, border: `1px solid ${c.borderGold}`, borderRadius: 12, padding: "5px 12px" }}>
                <BadgeIcon type={b} size={16} gold={c.gold} />
                <span style={{ fontSize: 11, fontWeight: 600, color: c.gold }}>{BADGE_DEFS[b].name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fade-up-d1" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[["12", "Given"], ["8", "Received"], ["★ 4.6", "Trust Score"], ["1.5", "Give/get ratio"]].map(([val, label]) => (
          <Card key={label} style={{ padding: 20, textAlign: "center" }}>
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 700, color: c.gold }}>{val}</div>
            <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>{label}</div>
          </Card>
        ))}
      </div>

      <Card className="fade-up-d2" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>Badges</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {Object.entries(BADGE_DEFS).map(([id, b]) => {
            const earned = ["seal", "bolt", "shield"].includes(id);
            return (
              <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8, padding: "18px 12px", borderRadius: 12, background: earned ? c.goldGlow : c.bg, border: `1px solid ${earned ? c.borderGold : c.border}`, opacity: earned ? 1 : 0.45, transition: "all 0.2s" }}>
                <BadgeIcon type={id} size={30} gold={earned ? c.gold : c.textMuted} showTooltip={false} />
                <div style={{ fontSize: 12, fontWeight: 700, color: earned ? c.gold : c.textSub }}>{b.name}</div>
                <div style={{ fontSize: 10, color: c.textMuted, lineHeight: 1.5 }}>{b.desc}</div>
                {!earned && <div style={{ fontSize: 9, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Locked</div>}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="fade-up-d3">
        <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>Review history</div>
        {REVIEW_HISTORY.map((r, i) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < REVIEW_HISTORY.length - 1 ? `1px solid ${c.border}` : "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: c.gold }}>{r.product[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{r.product}</div>
              <div style={{ fontSize: 12, color: c.textMuted }}>by {r.developer} · {r.time}</div>
            </div>
            {r.rating && <span style={{ fontSize: 12, color: c.gold, fontWeight: 600 }}>rated ★ {r.rating}</span>}
            <StateBadge state={r.state} c={c} />
          </div>
        ))}
      </Card>
    </AppShell>
  );

  /* ---- PUBLIC PROFILE (viewing someone else) ---- */
  const maskName = (name) => {
    const parts = name.replace(" (Mohan)", "").split(" ");
    return parts.map(p => p.length <= 2 ? p : p[0] + "•".repeat(Math.min(p.length - 2, 4)) + p[p.length - 1]).join(" ");
  };
  const maskEmail = (email) => {
    const [user, domain] = email.split("@");
    return user[0] + "•••@•••." + domain.split(".").pop();
  };

  const PublicProfile = () => {
    const p = viewProfile || LEADERBOARD_FULL[0];
    /* Simulate each user's privacy choice — Priya shares everything, others mask */
    const shares = p.rank === 1 ? { showName: true, showEmail: true, showPhoto: true } : { showName: p.rank % 2 === 0, showEmail: false, showPhoto: p.rank % 2 === 0 };
    const email = p.name.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "") + "@gmail.com";
    const displayName = shares.showName ? p.name.replace(" (Mohan)", "") : maskName(p.name);
    return (
      <AppShell active="leaderboard-app">
        <div className="fade-up" style={{ marginBottom: 24 }}>
          <GhostButton size="sm" onClick={() => navigate("leaderboard-app")}>← Back to leaderboard</GhostButton>
        </div>

        {/* Hero card */}
        <Card className="fade-up-d1" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ height: 110, background: `linear-gradient(135deg, ${c.goldGlow}, transparent 60%), radial-gradient(circle at 80% 20%, rgba(201,168,76,0.12), transparent 50%)`, borderBottom: `1px solid ${c.border}`, position: "relative" }}>
            <div style={{ position: "absolute", right: 24, top: 20, opacity: 0.15 }}><SealMark size={72} animated gold={c.gold} /></div>
            <div style={{ position: "absolute", left: 32, top: 24, fontSize: 11, color: c.gold, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>Reviewer profile · Rank #{p.rank}</div>
          </div>
          <div style={{ padding: "0 32px 28px", display: "flex", gap: 24, alignItems: "flex-end", marginTop: -44 }}>
            <div style={{ position: "relative" }}>
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                background: `linear-gradient(135deg, ${c.gold}35, ${c.gold}70)`,
                border: `3px solid ${c.surface}`, boxShadow: `0 0 0 1px ${c.borderGold}, 0 8px 32px rgba(0,0,0,0.3)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 34, fontWeight: 700, color: c.gold, fontFamily: "Playfair Display, serif",
                filter: shares.showPhoto ? "none" : "blur(0px)",
              }}>
                {shares.showPhoto ? p.name[0] : "?"}
              </div>
              <div style={{ position: "absolute", bottom: -4, right: -4 }}><SealMark size={32} gold={c.gold} /></div>
            </div>
            <div style={{ flex: 1, paddingBottom: 6 }}>
              <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 700, color: c.text, display: "flex", alignItems: "center", gap: 10 }}>
                {displayName}
                {!shares.showName && <span title="This member keeps their name private" style={{ fontSize: 12, color: c.textMuted, cursor: "help" }}>🔒</span>}
              </h1>
              <div style={{ fontSize: 13, color: c.textMuted, marginTop: 4, fontFamily: "JetBrains Mono, monospace" }}>
                {shares.showEmail ? email : maskEmail(email)}
                {!shares.showEmail && <span title="Email hidden by member's choice" style={{ marginLeft: 6, cursor: "help" }}>🔒</span>}
              </div>
              <div style={{ fontSize: 12, color: c.textMuted, marginTop: 6 }}>{p.category} developer · {p.streak}-week streak</div>
            </div>
            <div style={{ textAlign: "center", paddingBottom: 6 }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 34, fontWeight: 700, color: c.gold }}>★ {p.score}</div>
              <div style={{ fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Trust Score</div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="fade-up-d2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
          {[[p.given, "Reviews given"], [p.received, "Reviews received"], [p.verified, "Verified"], [(p.given / Math.max(p.received, 1)).toFixed(1), "Give/get ratio"]].map(([val, label]) => (
            <Card key={label} style={{ padding: 20, textAlign: "center" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 24, fontWeight: 700, color: c.gold }}>{val}</div>
              <div style={{ fontSize: 11, color: c.textMuted, marginTop: 4 }}>{label}</div>
            </Card>
          ))}
        </div>

        {/* Badge trophy case */}
        <Card className="fade-up-d3">
          <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>Badge collection</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {p.badges.map((b, i) => (
              <div key={b} className={`fade-up-d${Math.min(i + 1, 3)}`} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                padding: "24px 28px", borderRadius: 16, minWidth: 140,
                background: `linear-gradient(160deg, ${c.goldGlow}, ${c.bg})`,
                border: `1px solid ${c.borderGold}`,
                boxShadow: "0 0 24px rgba(201,168,76,0.06)",
              }}>
                <div className="float" style={{ animationDelay: `${i * 0.4}s` }}>
                  <BadgeIcon type={b} size={44} gold={c.gold} showTooltip={false} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.gold, textAlign: "center" }}>{BADGE_DEFS[b].name}</div>
                <div style={{ fontSize: 10, color: c.textMuted, textAlign: "center", lineHeight: 1.5, maxWidth: 120 }}>{BADGE_DEFS[b].desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: "12px 16px", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, fontSize: 12, color: c.textMuted, lineHeight: 1.6 }}>
            🔒 This member controls what's visible here. Name, email, and photo are masked by default — each is shown only if they've chosen to share it.
          </div>
        </Card>
      </AppShell>
    );
  };

  /* ---- LEADERBOARD (app + public share the table) ---- */
  const LeaderTable = ({ showFilters = true }) => {
    const cats = ["All", ...new Set(LEADERBOARD_FULL.map(l => l.category))];
    let rows = LEADERBOARD_FULL
      .filter(l => lbCategory === "All" || l.category === lbCategory)
      .filter(l => !lbSearch || l.name.toLowerCase().includes(lbSearch.toLowerCase()));
    rows = [...rows].sort((a, b) =>
      lbSort === "volume" ? b.given - a.given :
      lbSort === "verified" ? b.verified - a.verified :
      b.score - a.score
    );
    return (
    <>
      {showFilters && (
        <div className="fade-up-d1" style={{ marginBottom: 16 }}>
          <SearchBox value={lbSearch} onChange={e => setLbSearch(e.target.value)} placeholder="Search reviewers…" />
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {cats.map(cat => (
                <button key={cat} onClick={() => setLbCategory(cat)}
                  style={{
                    background: lbCategory === cat ? c.goldGlow : "transparent",
                    border: `1px solid ${lbCategory === cat ? c.gold : c.border}`,
                    color: lbCategory === cat ? c.gold : c.textMuted,
                    borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                  }}>{cat}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: 3 }}>
              {[["trust", "Trust Score"], ["volume", "Volume"], ["verified", "Verified"]].map(([id, label]) => (
                <button key={id} onClick={() => setLbSort(id)}
                  style={{
                    background: lbSort === id ? c.goldGlow : "transparent",
                    border: lbSort === id ? `1px solid ${c.borderGold}` : "1px solid transparent",
                    color: lbSort === id ? c.gold : c.textMuted,
                    borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                  }}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      <Card className="fade-up-d1" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${c.border}`, display: "flex", gap: 8, alignItems: "center" }}>
        <SealMark size={20} gold={c.gold} />
        <span style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Top reviewers — July 2026</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: c.textMuted }}>{rows.length} reviewers</span>
      </div>
      {rows.length === 0 && <div style={{ padding: 32, textAlign: "center", fontSize: 13, color: c.textMuted }}>No reviewers match your filters.</div>}
      {rows.map((item, i) => (
        <div key={item.rank} onClick={() => { setViewProfile(item); navigate("public-profile"); }}
          style={{
          padding: "16px 24px", borderBottom: i < LEADERBOARD_FULL.length - 1 ? `1px solid ${c.border}` : "none",
          display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "background 0.15s",
          background: item.isYou ? c.goldGlow : i === 0 ? `linear-gradient(90deg, ${c.goldGlow}, transparent)` : "transparent",
          borderLeft: item.isYou ? `2px solid ${c.gold}` : "2px solid transparent",
        }}
          onMouseEnter={e => { if (!item.isYou) e.currentTarget.style.background = c.surfaceHover; }}
          onMouseLeave={e => { if (!item.isYou) e.currentTarget.style.background = i === 0 ? `linear-gradient(90deg, ${c.goldGlow}, transparent)` : "transparent"; }}>
          <span style={{ width: 28, fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 600, color: i < 3 ? c.gold : c.textMuted }}>#{item.rank}</span>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${c.gold}30, ${c.gold}60)`, border: `1px solid ${c.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: c.gold }}>{item.name[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: item.isYou ? c.gold : c.text }}>{item.name}</span>
              <span style={{ display: "flex", gap: 4 }}>
                {item.badges.map(b => <BadgeIcon key={b} type={b} size={17} gold={c.gold} />)}
              </span>
            </div>
            <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{item.category} · {item.given} given · {item.verified} verified · {item.streak}-wk streak</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: c.gold }}>
              {lbSort === "volume" ? item.given : lbSort === "verified" ? item.verified : `★ ${item.score}`}
            </div>
            <div style={{ fontSize: 10, color: c.textMuted }}>{lbSort === "volume" ? "given" : lbSort === "verified" ? "verified" : "trust"}</div>
          </div>
        </div>
      ))}
    </Card>
    </>
    );
  };

  const LeaderboardApp = () => (
    <AppShell active="leaderboard-app">
      <PageTitle eyebrow="Community" title="Leaderboard" sub="Reputation is earned through verified reviews — not volume alone." />
      <LeaderTable />
    </AppShell>
  );

  const LeaderboardPublic = () => (
    <div style={{ minHeight: "100vh", padding: "100px 24px 60px", position: "relative", overflow: "hidden" }}>
      <ParallaxBackdrop />
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: isDark ? "rgba(5,9,26,0.92)" : "rgba(250,250,247,0.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${c.border}`, padding: "0 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("landing")}>
            <SealMark size={26} gold={c.gold} />
            <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 600, fontSize: 17, color: c.text }}>PeerReview</span>
          </div>
          <GoldButton size="sm" onClick={() => navigate("signin")}>Join the exchange</GoldButton>
        </div>
      </nav>
      <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 40, fontWeight: 700, color: c.text, marginBottom: 10 }}>The community leaderboard</h1>
          <p style={{ fontSize: 15, color: c.textMuted }}>Public proof that genuine reviewing pays off.</p>
        </div>
        <LeaderTable />
      </div>
    </div>
  );

  /* ---- MY PRODUCTS ---- */
  const Products = () => (
    <AppShell active="products">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <PageTitle eyebrow="Manage" title="My products" sub="Free plan — 1 of 1 listings used." />
        <div className="fade-up"><GoldButton size="sm">+ Add product</GoldButton></div>
      </div>

      {MY_PRODUCTS.map(p => (
        <Card key={p.id} className="fade-up-d1" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: `linear-gradient(135deg, ${c.gold}25, ${c.gold}50)`, border: `1px solid ${c.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: c.gold, fontWeight: 700 }}>C</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: c.text }}>{p.name}</div>
              <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{p.category} · {p.platform}</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: c.textMuted, marginTop: 6 }}>{p.url}</div>
            </div>
            <div style={{ display: "flex", gap: 24, textAlign: "center" }}>
              {[["Received", p.reviews], ["Verified", p.verified], ["Pending", p.pending]].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: c.gold, fontFamily: "Playfair Display, serif" }}>{v}</div>
                  <div style={{ fontSize: 10, color: c.textMuted }}>{l}</div>
                </div>
              ))}
            </div>
            <GhostButton size="sm">Edit</GhostButton>
          </div>
        </Card>
      ))}

      {/* Upgrade prompt */}
      <Card className="fade-up-d2" style={{ background: `linear-gradient(160deg, ${c.goldGlow}, ${c.surface})`, border: `1px solid ${c.borderGold}`, display: "flex", alignItems: "center", gap: 20 }}>
        <SealMark size={44} gold={c.gold} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 4 }}>Have more products?</div>
          <div style={{ fontSize: 13, color: c.textSub }}>Pro lists up to 5 products. Studio is unlimited. Same features on every plan.</div>
        </div>
        <GoldButton size="sm">Upgrade — $7/mo</GoldButton>
      </Card>
    </AppShell>
  );

  /* ---- SETTINGS ---- */
  const Settings = () => (
    <AppShell active="settings">
      <PageTitle eyebrow="Account" title="Settings" />
      <Card className="fade-up-d1" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>Matching preference</div>
        {[
          { id: "category", title: "Category match", desc: "Matched within your product category" },
          { id: "open", title: "Open match", desc: "Matched with anyone in the pool" },
        ].map(opt => (
          <div key={opt.id} onClick={() => setProductForm({ ...productForm, matching: opt.id })}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 10, border: `1px solid ${productForm.matching === opt.id ? c.gold : c.border}`, background: productForm.matching === opt.id ? c.goldGlow : "transparent", marginBottom: 10, cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${productForm.matching === opt.id ? c.gold : c.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {productForm.matching === opt.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.gold }} />}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{opt.title}</div>
              <div style={{ fontSize: 12, color: c.textMuted }}>{opt.desc}</div>
            </div>
          </div>
        ))}
      </Card>

      <Card className="fade-up-d2" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Public profile privacy</div>
        <p style={{ fontSize: 12, color: c.textMuted, marginBottom: 16, lineHeight: 1.6 }}>Everything is masked by default. You choose what other members see when they visit your profile.</p>
        {[
          ["showName", "Show my full name", "Otherwise shown as M••••n"],
          ["showEmail", "Show my email", "Otherwise shown as m•••@•••.com"],
          ["showPhoto", "Show my profile photo", "Otherwise shown as ?"],
        ].map(([key, label, hint], i) => (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < 2 ? `1px solid ${c.border}` : "none" }}>
            <div>
              <div style={{ fontSize: 14, color: c.text }}>{label}</div>
              <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{hint}</div>
            </div>
            <div onClick={() => setPrivacy(pr => ({ ...pr, [key]: !pr[key] }))}
              style={{ width: 40, height: 22, borderRadius: 12, background: privacy[key] ? c.gold : c.border, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: privacy[key] ? 21 : 3, transition: "left 0.2s" }} />
            </div>
          </div>
        ))}
      </Card>

      <Card className="fade-up-d2" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>Notifications</div>
        {["New review assignment", "Review received on my product", "My review was verified", "Weekly digest"].map((n, i) => (
          <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < 3 ? `1px solid ${c.border}` : "none" }}>
            <span style={{ fontSize: 14, color: c.text }}>{n}</span>
            <div style={{ width: 40, height: 22, borderRadius: 12, background: i < 3 ? c.gold : c.border, position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: i < 3 ? 21 : 3, transition: "left 0.2s" }} />
            </div>
          </div>
        ))}
      </Card>

      <Card className="fade-up-d3" style={{ borderColor: c.flagged + "40" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.flagged, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Danger zone</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Delete account</div>
            <div style={{ fontSize: 12, color: c.textMuted }}>Removes your products, reviews, and reputation permanently.</div>
          </div>
          <button style={{ background: "transparent", border: `1px solid ${c.flagged}50`, borderRadius: 8, padding: "8px 16px", color: c.flagged, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Delete</button>
        </div>
      </Card>
    </AppShell>
  );

  /* ============ ROUTER ============ */
  const pages = {
    landing: <Landing />,
    signin: <SignIn />,
    onboarding: <Onboarding />,
    dashboard: <Dashboard />,
    "review-queue": <ReviewQueue />,
    "my-reviews": <MyReviews />,
    profile: <Profile />,
    "leaderboard-app": <LeaderboardApp />,
    "leaderboard-public": <LeaderboardPublic />,
    "public-profile": <PublicProfile />,
    products: <Products />,
    settings: <Settings />,
  };

  return (
    <div style={{ background: c.bg, color: c.text, minHeight: "100vh", transition: "background 0.3s" }}>
      <style>{css}</style>
      <div style={{ opacity: transitioning ? 0 : 1, transform: transitioning ? "translateY(8px)" : "translateY(0)", transition: "opacity 0.22s ease, transform 0.22s ease" }}>
        {pages[page]}
      </div>
      <Spotlight />
    </div>
  );
}
