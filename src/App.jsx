import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { DARK, LIGHT, ThemeContext, useTheme } from "./tokens/theme";
import { AppStateProvider, useAppState, USE_MOCK } from "./state";
import { handleCallback, isAuthed } from "./data/auth";
import Spotlight from "./components/Spotlight";
import SealMark from "./components/SealMark";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import ReviewQueue from "./pages/ReviewQueue";
import MyProduct from "./pages/MyProduct";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Leaderboard, { LeaderboardPublic } from "./pages/Leaderboard";
import Products from "./pages/Products";
import Rules from "./pages/Rules";
import Settings from "./pages/Settings";
import AppShell from "./components/AppShell";

/* Global keyframes + resets. Rendered once; only c.gold varies with theme. */
function GlobalStyles() {
  const { c } = useTheme();
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    section[id] { scroll-margin-top: 80px; }
    body { font-family: 'Inter', sans-serif; background: ${c.bg}; }
    @keyframes rotateSeal { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
    @keyframes stampIn { 0% { transform: scale(1.6) rotate(-8deg); opacity: 0; } 55% { transform: scale(0.92) rotate(2deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
    @keyframes slideRight { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(201,168,76,0.15); } 50% { box-shadow: 0 0 36px rgba(201,168,76,0.3); } }
    @keyframes spotlightIn { from { opacity: 0; transform: translateY(-12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes drift1 { 0%, 100% { transform: translate(0, 0); } 33% { transform: translate(48px, -36px); } 66% { transform: translate(-34px, 30px); } }
    @keyframes drift2 { 0%, 100% { transform: translate(0, 0); } 33% { transform: translate(-56px, 40px); } 66% { transform: translate(38px, -26px); } }
    @keyframes drift3 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(44px, -50px); } }
    @keyframes twinkle { 0%, 100% { opacity: 0.12; transform: scale(0.85); } 50% { opacity: 0.9; transform: scale(1.15); } }
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
    .fx-lite .fade-up, .fx-lite .fade-up-d1, .fx-lite .fade-up-d2, .fx-lite .fade-up-d3 { animation: none; opacity: 1; }
    .fx-lite .float, .fx-lite .stamp-in { animation: none; }
    /* overflow-x: clip, NEVER hidden — hidden silently kills position:sticky */
    html, body { overflow-x: clip; }
    /* Instant custom tooltip (native title has a fixed ~1s delay) */
    [data-tip] { position: relative; }
    [data-tip]:hover::after {
      content: attr(data-tip);
      position: absolute; bottom: calc(100% + 8px); right: 0;
      background: ${c.surface}; color: ${c.text}; border: 1px solid ${c.borderGold};
      border-radius: 8px; padding: 8px 12px; font-size: 12px; line-height: 1.5;
      width: max-content; max-width: 240px; z-index: 90; text-align: left; white-space: normal;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4); pointer-events: none;
    }
    /* Loading/error states center in the VISIBLE pane (viewport minus sidebar),
       not inside main's max-width column */
    .pane-center { position: fixed; top: 0; right: 0; bottom: 0; left: 232px; z-index: 1; }
    /* Responsive: works at 390px; sidebar becomes a bottom icon bar */
    @media (max-width: 900px) {
      aside.side-nav {
        top: auto !important; bottom: 0 !important; left: 0; right: 0;
        width: 100% !important; height: 60px !important;
        flex-direction: row !important; align-items: center !important;
        padding: 4px 6px !important;
        border-right: none !important; border-top: 1px solid ${c.border};
        z-index: 60 !important;
      }
      .side-nav .side-search, .side-nav .side-footer { display: none !important; }
      .side-nav .side-brand { margin-bottom: 0 !important; padding: 0 6px !important; }
      .side-nav .side-brand span { display: none; }
      .side-nav nav { display: flex !important; flex: 1; justify-content: space-around; align-items: center; }
      .side-nav nav > div { margin-bottom: 0 !important; padding: 9px !important; border: none !important; }
      .side-nav .nav-label { display: none !important; }
      main.main-pane { margin-left: 0 !important; padding: 24px 16px 92px !important; max-width: 100% !important; }
      .pane-center { left: 0; bottom: 60px; }
      .grid-main { grid-template-columns: 1fr !important; }
      .grid-3 { grid-template-columns: 1fr !important; }
      .statbar { grid-template-columns: 1fr 1fr !important; }
      .statbar > div { border-left: none !important; border-top: 1px solid ${c.border}; }
      .statbar > div:first-child, .statbar > div:nth-child(2) { border-top: none; }
      .wrap-sm { flex-wrap: wrap !important; }
      .dash-head { flex-wrap: wrap; }
    }
  `;
  return <style>{css}</style>;
}

/* ⌘K / Ctrl+K + Escape — registered once at the top level */
function SpotlightHotkeys() {
  const { setSpotlightOpen, setSpotlightQuery } = useAppState();
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSpotlightOpen(o => !o); setSpotlightQuery(""); }
      if (e.key === "Escape") setSpotlightOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return null;
}

/* OAuth code-grant landing: exchange the code, load data, enter the app */
function AuthCallback() {
  const { c } = useTheme();
  const { loadData } = useAppState();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) { navigate("/signin"); return; }
    handleCallback(code)
      .then(async () => { await loadData(); navigate("/app", { replace: true }); })
      .catch(e => setError(e.message));
  }, []);
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div className="float"><SealMark size={56} animated gold={c.gold} /></div>
      <div style={{ fontSize: 14, color: error ? c.flagged : c.textMuted }}>{error ? `Sign-in failed: ${error}` : "Signing you in…"}</div>
    </div>
  );
}

/* Real mode: /app requires a session */
function RequireAuth({ children }) {
  if (!USE_MOCK && !isAuthed()) return <Navigate to="/signin" replace />;
  return children;
}

/* Fade + 8px lift page transition (~220ms): fade out the old route,
   swap, scroll to top, fade the new route in. */
function TransitionedRoutes() {
  const location = useLocation();
  const [displayedLocation, setDisplayedLocation] = useState(location);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (location.pathname === displayedLocation.pathname) {
      setDisplayedLocation(location);
      return;
    }
    // In-app navigation swaps only the Outlet pane — no full-screen fade,
    // the persistent sidebar must not blink
    if (location.pathname.startsWith("/app") && displayedLocation.pathname.startsWith("/app")) {
      setDisplayedLocation(location);
      window.scrollTo(0, 0);
      return;
    }
    setTransitioning(true);
    const t = setTimeout(() => {
      setDisplayedLocation(location);
      setTransitioning(false);
      window.scrollTo(0, 0);
    }, 220);
    return () => clearTimeout(t);
  }, [location]);

  return (
    // transform must be "none" at rest: any transform on this wrapper turns its
    // position:fixed descendants (nav, sidebar, ParallaxBackdrop) into
    // scroll-along elements by making the wrapper their containing block
    <div style={{ opacity: transitioning ? 0 : 1, transform: transitioning ? "translateY(8px)" : "none", transition: "opacity 0.22s ease, transform 0.22s ease" }}>
      <Routes location={displayedLocation}>
        <Route path="/" element={<Landing />} />
        <Route path="/leaderboard" element={<LeaderboardPublic />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/app" element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="review" element={<ReviewQueue />} />
          <Route path="product" element={<MyProduct />} />
          <Route path="profile" element={<Profile />} />
          <Route path="member/:id" element={<PublicProfile />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="products" element={<Products />} />
          <Route path="rules" element={<Rules />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Landing />} />
      </Routes>
    </div>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("peerreview-theme");
    return saved ? saved === "dark" : true;
  });
  useEffect(() => {
    localStorage.setItem("peerreview-theme", isDark ? "dark" : "light");
  }, [isDark]);

  // FX tier — auto-detected once, LaunchPad tier.js pattern. No visible
  // switch; localStorage `peerreview-fx` (full|lite) is a QA-only override.
  const [fx] = useState(() => {
    try {
      const ov = localStorage.getItem("peerreview-fx");
      if (ov === "full" || ov === "lite") return ov;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const saveData = navigator.connection?.saveData;
      const mem = navigator.deviceMemory ?? 8;
      const cores = navigator.hardwareConcurrency ?? 8;
      return (reduced || saveData || mem <= 2 || cores <= 2) ? "lite" : "full";
    } catch {
      return "full";
    }
  });

  const c = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ c, isDark, setIsDark, fx }}>
      <AppStateProvider>
        <BrowserRouter>
          <div className={fx === "lite" ? "fx-lite" : undefined} style={{ background: c.bg, color: c.text, minHeight: "100vh", transition: "background 0.3s" }}>
            <GlobalStyles />
            <SpotlightHotkeys />
            <TransitionedRoutes />
            <Spotlight />
          </div>
        </BrowserRouter>
      </AppStateProvider>
    </ThemeContext.Provider>
  );
}
