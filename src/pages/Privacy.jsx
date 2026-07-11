import { useNavigate } from "react-router-dom";
import { useTheme } from "../tokens/theme";
import SealMark from "../components/SealMark";
import ParallaxBackdrop from "../components/ParallaxBackdrop";

const SECTIONS = [
  { h: "The short version", p: "PeerReview is built privacy-first. We use your Google account only to sign you in. We don't sell data, we don't run ad trackers, and we don't share your information with third parties. Everything below just explains that in more detail." },
  { h: "What we collect", p: "When you sign in with Google, we receive your email address, name, and profile photo from Google — nothing more. We store your account (email, display name, an optional photo you upload), the products you list, the reviews you exchange, and your Trust Score. That's it." },
  { h: "How your profile is shown", p: "Your name, email, and photo are masked by default on your public profile. Other members see a masked name, a hidden email, and your initial instead of your photo — unless you explicitly turn each one on in Settings. Masking is enforced on our servers: a value you keep private never leaves our backend to another member's browser." },
  { h: "Where reviews live", p: "Reviews you write live on the real platform (the store or launch page), not on PeerReview. We only store the link you paste and any optional text, so the product owner can verify it. We never post, edit, or automate anything on those platforms on your behalf." },
  { h: "What we don't do", p: "We don't sell or rent your data. We don't use advertising trackers or third-party analytics that follow you around the web. We don't buy, sell, or incentivise store ratings — the exchange is genuine feedback between developers, and store policies prohibit anything else." },
  { h: "Email", p: "We send a small number of transactional emails about your own activity — when you're assigned a review, when your product receives one, and when your review is verified. These are tied to your account, not marketing. To stop them, email us and we'll turn them off for you." },
  { h: "Data you control", p: "You can edit your name and photo, change what's public, and remove your photo any time in Settings. To delete your account and everything tied to it (products, reviews, reputation), email us and we'll remove it within 48 hours. Self-serve deletion is coming." },
  { h: "Infrastructure", p: "PeerReview runs on AWS (Cognito for sign-in, Lambda + DynamoDB for data), all within a single account under the tapdot umbrella. Your Google identity is used solely for account access." },
  { h: "Contact", p: "Questions, or want your data removed? Email mohan@tapdot.org." },
];

export default function Privacy() {
  const { c, isDark } = useTheme();
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", padding: "100px 24px 80px", position: "relative", overflow: "hidden" }}>
      <ParallaxBackdrop />
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: isDark ? "rgba(5,9,26,0.92)" : "rgba(250,250,247,0.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${c.border}`, padding: "0 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", height: 64, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/")}>
          <SealMark size={26} gold={c.gold} />
          <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 600, fontSize: 17, color: c.text }}>PeerReview</span>
          <span style={{ fontSize: 10, color: c.textMuted, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 4, padding: "2px 6px" }}>by tapdot</span>
        </div>
      </nav>
      <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div className="fade-up" style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: c.gold, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Privacy by architecture</div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(32px, 5vw, 44px)", fontWeight: 700, color: c.text, letterSpacing: "-0.02em" }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: c.textMuted, marginTop: 10 }}>PeerReview · a tapdot product · last updated July 2026</p>
        </div>
        {SECTIONS.map((s, i) => (
          <div key={s.h} className={`fade-up-d${Math.min(i % 3 + 1, 3)}`} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: c.gold, marginBottom: 8 }}>{s.h}</h2>
            <p style={{ fontSize: 15, color: c.textSub, lineHeight: 1.75 }}>{s.p}</p>
          </div>
        ))}
        <div style={{ marginTop: 12, paddingTop: 24, borderTop: `1px solid ${c.border}`, fontSize: 13, color: c.textMuted }}>
          <span onClick={() => navigate("/")} style={{ color: c.gold, cursor: "pointer" }}>← Back to PeerReview</span>
        </div>
      </div>
    </div>
  );
}
