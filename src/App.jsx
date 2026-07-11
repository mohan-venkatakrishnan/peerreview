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
    @keyframes drift1 { 0%, 100% { transform: translate(0, 0); } 33% { transform: translate(24px, -18px); } 66% { transform: translate(-16px, 14px); } }
    @keyframes drift2 { 0%, 100% { transform: translate(0, 0); } 33% { transform: translate(-28px, 20px); } 66% { transform: translate(18px, -12px); } }
    @keyframes drift3 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(20px, -24px); } }
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
