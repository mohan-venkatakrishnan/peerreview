import { Navigate, useNavigate } from "react-router-dom";
import { useTheme } from "../tokens/theme";
import { USE_MOCK } from "../state";
import { login, isAuthed } from "../data/auth";
import SealMark from "../components/SealMark";
import ParallaxBackdrop from "../components/ParallaxBackdrop";
import { Card } from "../components/ui";

export default function SignIn() {
  const { c } = useTheme();
  const navigate = useNavigate();
  // Already signed in? Skip the form and go straight to the app.
  if (!USE_MOCK && isAuthed()) return <Navigate to="/app" replace />;
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <ParallaxBackdrop />
      <Card className="fade-up" style={{ maxWidth: 420, width: "100%", padding: 40, textAlign: "center", position: "relative", zIndex: 1 }}>
        <div className="float" style={{ display: "inline-block", marginBottom: 24 }}><SealMark size={56} animated gold={c.gold} /></div>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 700, color: c.text, marginBottom: 8 }}>Welcome to PeerReview</h1>
        <p style={{ fontSize: 14, color: c.textMuted, marginBottom: 32, lineHeight: 1.6 }}>Sign in to join the exchange. We only use your account for sign-in — nothing else, nowhere else.</p>
        <button onClick={() => (USE_MOCK ? navigate("/onboarding") : login())}
          style={{ width: "100%", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 600, color: c.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "border-color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = c.borderGold}
          onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <p style={{ marginTop: 24, fontSize: 11, color: c.textMuted, lineHeight: 1.6 }}>
          Privacy by architecture. Your sign-in identity is used for account access only — never sent to third parties, never tracked. <span onClick={() => navigate("/privacy")} style={{ color: c.gold, cursor: "pointer" }}>Privacy policy</span>.
        </p>
      </Card>
    </div>
  );
}
