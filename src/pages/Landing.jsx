import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../tokens/theme";
import { PLATFORMS, LANDING_STATS, HOW_IT_WORKS, TESTIMONIALS, PRICING } from "../data/mock";
import SealMark from "../components/SealMark";
import StateBadge from "../components/StateBadge";
import ParallaxBackdrop from "../components/ParallaxBackdrop";
import { LeaderTable } from "./Leaderboard";
import { Card, GoldButton, GhostButton } from "../components/ui";

/* Scroll-triggered fade-up reveal. Sets state once when the element first
   enters the viewport — not continuous scroll state (pitfall #2 is about
   per-frame updates). */
function Reveal({ children, delay = 0, style }) {
  const ref = useRef(null);
  const { fx } = useTheme();
  const lite = fx === "lite";
  // Reduced-motion preference is handled by the fx tier default (see App.jsx)
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || shown || lite) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); obs.disconnect(); }
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [lite, shown]);
  const visible = shown || lite;
  return (
    <div ref={ref} className={visible ? (delay ? `fade-up-d${delay}` : "fade-up") : ""} style={{ opacity: visible ? undefined : 0, ...style }}>
      {children}
    </div>
  );
}

function SectionHeading({ eyebrow, title, sub }) {
  const { c } = useTheme();
  return (
    <Reveal style={{ textAlign: "center", marginBottom: 48 }}>
      <div style={{ fontSize: 11, color: c.gold, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>{eyebrow}</div>
      <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: c.text, letterSpacing: "-0.02em" }}>{title}</h2>
      {sub && <p style={{ fontSize: 15, color: c.textMuted, marginTop: 12, lineHeight: 1.7, maxWidth: 520, margin: "12px auto 0" }}>{sub}</p>}
    </Reveal>
  );
}

function Section({ children, id, style }) {
  return (
    <section id={id} style={{ padding: "96px 24px", position: "relative", zIndex: 1, ...style }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>{children}</div>
    </section>
  );
}

/* ---- Hero ---- */
function Hero() {
  const { c, fx } = useTheme();
  const navigate = useNavigate();
  return (
    <section style={{ minHeight: "88vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "140px 24px 80px", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", top: "12%", left: "12%", width: 380, height: 380,
        background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)", borderRadius: "50%",
        animation: fx === "lite" ? "none" : "drift1 16s ease-in-out infinite",
      }} />
      <div style={{ maxWidth: 760, textAlign: "center", position: "relative", zIndex: 1 }}>
        <div className="float" style={{ marginBottom: 28, display: "inline-block" }}><SealMark size={68} animated gold={c.gold} /></div>
        <h1 className="fade-up" style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(40px, 7vw, 68px)", lineHeight: 1.12, letterSpacing: "-0.02em", color: c.text, marginBottom: 22 }}>
          Genuine reviews.<br /><span style={{ color: c.gold }}>Mutual trust.</span>
        </h1>
        <p className="fade-up-d1" style={{ fontSize: 17, lineHeight: 1.7, color: c.textSub, maxWidth: 540, margin: "0 auto 36px" }}>
          Review a developer's product. A developer reviews yours. Every review verified by a real person.
        </p>
        <div className="fade-up-d2" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <GoldButton size="lg" onClick={() => navigate("/signin")}>List your product — it's free</GoldButton>
          <GhostButton onClick={() => navigate("/leaderboard")}>See the leaderboard →</GhostButton>
        </div>
        <div className="fade-up-d3" style={{ marginTop: 44, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {PLATFORMS.map(p => (
            <span key={p} style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: c.textMuted, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 6, padding: "4px 10px" }}>{p}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---- Stats bar ---- */
function StatsBar() {
  const { c } = useTheme();
  return (
    <Section style={{ padding: "0 24px 96px" }}>
      <Reveal>
        <Card style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 0, padding: 0, overflow: "hidden" }}>
          {LANDING_STATS.map((s, i) => (
            <div key={s.label} style={{ padding: "28px 24px", textAlign: "center", borderLeft: i > 0 ? `1px solid ${c.border}` : "none" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 34, fontWeight: 700, color: c.gold }}>{s.value}</div>
              <div style={{ fontSize: 12, color: c.textMuted, marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </Card>
      </Reveal>
    </Section>
  );
}

/* ---- How it works ---- */
function HowItWorks() {
  const { c } = useTheme();
  return (
    <Section id="how">
      <SectionHeading eyebrow="How it works" title="A strict one-for-one exchange"
        sub="Every review you give earns exactly one review of your product. No pools of karma, no shortcuts." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
        {HOW_IT_WORKS.map((step, i) => (
          <Reveal key={step.n} delay={Math.min(i, 3)}>
            <Card style={{ height: "100%", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -14, right: -6, fontFamily: "Playfair Display, serif", fontSize: 84, fontWeight: 700, color: c.gold, opacity: 0.08, lineHeight: 1 }}>{step.n}</div>
              <div style={{ width: 36, height: 36, borderRadius: "50%", border: `1.5px solid ${c.borderGold}`, background: c.goldGlow, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono, monospace", fontSize: 14, fontWeight: 600, color: c.gold, marginBottom: 16 }}>{step.n}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 8 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: c.textMuted, lineHeight: 1.7 }}>{step.desc}</div>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ---- Review lifecycle strip — the signature section ---- */
function LifecycleStrip() {
  const { c } = useTheme();
  const Arrow = () => <span style={{ color: c.textMuted, fontSize: 18, flexShrink: 0 }}>→</span>;
  return (
    <Section>
      <SectionHeading eyebrow="The lifecycle" title="Every review has a paper trail"
        sub="Reviews live on the real platform. Here, each one moves through a state the product owner controls." />
      <Reveal delay={1}>
        <Card style={{ padding: "36px 32px", background: `linear-gradient(160deg, ${c.goldGlow}, ${c.surface} 55%)`, border: `1px solid ${c.borderGold}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 8 }}>Submitted</div>
              <div style={{ fontSize: 11, color: c.textMuted }}>you paste your review link</div>
            </div>
            <Arrow />
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: 8 }}><StateBadge state="pending" /></div>
              <div style={{ fontSize: 11, color: c.textMuted }}>the owner reads it on the platform</div>
            </div>
            <Arrow />
            <div style={{ textAlign: "center", position: "relative" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, justifyContent: "center" }}>
                <StateBadge state="verified" />
                <span style={{ fontSize: 11, color: c.textMuted }}>or</span>
                <StateBadge state="flagged" />
              </div>
              <div style={{ fontSize: 11, color: c.textMuted }}>verified by hand — flagged earns nothing</div>
            </div>
            <div className="float" style={{ marginLeft: 12 }}>
              <SealMark size={64} animated gold={c.gold} />
            </div>
          </div>
        </Card>
      </Reveal>
    </Section>
  );
}

/* ---- Leaderboard preview ---- */
function LeaderboardPreview() {
  const navigate = useNavigate();
  return (
    <Section>
      <SectionHeading eyebrow="Community" title="Reputation you can point to"
        sub="Trust Scores are earned through verified reviews — not volume alone. The leaderboard is public." />
      <Reveal delay={1}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <LeaderTable showFilters={false} limit={5} />
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <GhostButton onClick={() => navigate("/leaderboard")}>See the full leaderboard →</GhostButton>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/* ---- Testimonials ---- */
function Testimonials() {
  const { c } = useTheme();
  return (
    <Section>
      <SectionHeading eyebrow="From the exchange" title="Feedback from people who ship" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={Math.min(i + 1, 3)}>
            <Card style={{ height: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 30, color: c.gold, lineHeight: 0.6, marginTop: 8 }}>"</div>
              <p style={{ fontSize: 14, color: c.textSub, lineHeight: 1.75, fontStyle: "italic", flex: 1 }}>{t.quote}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${c.gold}30, ${c.gold}60)`, border: `1px solid ${c.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: c.gold }}>{t.name[0]}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: c.textMuted }}>{t.role}</div>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ---- Pricing ---- */
function Pricing() {
  const { c } = useTheme();
  const navigate = useNavigate();
  return (
    <Section id="pricing">
      <SectionHeading eyebrow="Pricing" title="Every feature, on every plan"
        sub="Tiers differ only by how many products you can list. Nothing is paywalled — not verification, not badges, not the leaderboard." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, alignItems: "stretch" }}>
        {PRICING.map((p, i) => (
          <Reveal key={p.name} delay={Math.min(i + 1, 3)} style={{ height: "100%" }}>
            <Card style={{
              height: "100%", display: "flex", flexDirection: "column", gap: 6, padding: 28, position: "relative",
              border: `1px solid ${p.highlight ? c.gold : c.border}`,
              background: p.highlight ? `linear-gradient(160deg, ${c.goldGlow}, ${c.surface} 60%)` : c.surface,
              boxShadow: p.highlight ? "0 0 32px rgba(201,168,76,0.12)" : "none",
            }}>
              {p.highlight && (
                <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: `linear-gradient(135deg, ${c.gold}, #a07830)`, color: "#05091a", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 10, padding: "4px 12px" }}>Most popular</div>
              )}
              <div style={{ fontSize: 13, fontWeight: 600, color: p.highlight ? c.gold : c.textSub, textTransform: "uppercase", letterSpacing: "0.08em" }}>{p.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "8px 0 4px" }}>
                <span style={{ fontFamily: "Playfair Display, serif", fontSize: 40, fontWeight: 700, color: c.text }}>{p.price}</span>
                <span style={{ fontSize: 13, color: c.textMuted }}>{p.period}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: c.gold, marginBottom: 16 }}>{p.listings}</div>
              <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 16, marginBottom: 20, display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                {["One-for-one review exchange", "Owner verification & Trust Score", "Badges and public leaderboard", "Category or open matching"].map(f => (
                  <div key={f} style={{ display: "flex", gap: 9, fontSize: 13, color: c.textSub, alignItems: "center" }}>
                    <span style={{ color: c.verified, fontSize: 12 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              {p.highlight
                ? <GoldButton full onClick={() => navigate("/signin")}>Start with {p.name}</GoldButton>
                : <GhostButton full onClick={() => navigate("/signin")}>Start with {p.name}</GhostButton>}
            </Card>
          </Reveal>
        ))}
      </div>
      <Reveal delay={3} style={{ textAlign: "center", marginTop: 28 }}>
        <p style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.7, maxWidth: 560, margin: "0 auto" }}>
          PeerReview facilitates genuine feedback between developers — it never buys, sells, or incentivises store ratings.
        </p>
      </Reveal>
    </Section>
  );
}

/* ---- Final CTA + footer ---- */
function FinalCta() {
  const { c } = useTheme();
  const navigate = useNavigate();
  return (
    <Section style={{ paddingBottom: 72 }}>
      <Reveal>
        <Card style={{ padding: "64px 32px", textAlign: "center", background: `linear-gradient(160deg, ${c.goldGlow}, ${c.surface} 65%)`, border: `1px solid ${c.borderGold}` }}>
          <div className="float" style={{ display: "inline-block", marginBottom: 20 }}><SealMark size={56} animated gold={c.gold} /></div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 700, color: c.text, marginBottom: 12 }}>Your product deserves a real reader</h2>
          <p style={{ fontSize: 14, color: c.textMuted, lineHeight: 1.7, maxWidth: 460, margin: "0 auto 28px" }}>
            List it free, review one product, and get a genuine review back — verified by you.
          </p>
          <GoldButton size="lg" onClick={() => navigate("/signin")}>Join the exchange</GoldButton>
        </Card>
      </Reveal>
    </Section>
  );
}

function Footer() {
  const { c } = useTheme();
  const navigate = useNavigate();
  return (
    <footer style={{ borderTop: `1px solid ${c.border}`, padding: "36px 24px", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SealMark size={22} gold={c.gold} />
          <span style={{ fontSize: 13, color: c.textSub }}><strong style={{ color: c.text }}>PeerReview</strong> · a tapdot product</span>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 12 }}>
          <span onClick={() => navigate("/leaderboard")} style={{ color: c.textMuted, cursor: "pointer" }}>Leaderboard</span>
          <span onClick={() => navigate("/signin")} style={{ color: c.textMuted, cursor: "pointer" }}>Sign in</span>
        </div>
        <span style={{ fontSize: 11, color: c.textMuted }}>Privacy by architecture — no trackers, no third parties.</span>
      </div>
    </footer>
  );
}

export default function Landing() {
  const { c, isDark, setIsDark } = useTheme();
  const navigate = useNavigate();
  // The hash is processed before React renders, so honor deep links (#how, #pricing) after mount
  useEffect(() => {
    if (window.location.hash) document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "instant", block: "start" });
  }, []);
  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <ParallaxBackdrop />
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: isDark ? "rgba(5,9,26,0.92)" : "rgba(250,250,247,0.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${c.border}`, padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SealMark size={28} gold={c.gold} />
            <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 600, fontSize: 18, color: c.text }}>PeerReview</span>
            <span style={{ fontSize: 10, color: c.textMuted, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 4, padding: "2px 6px" }}>by tapdot</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href="#how" style={{ fontSize: 13, color: c.textSub, textDecoration: "none" }}>How it works</a>
            <a href="#pricing" style={{ fontSize: 13, color: c.textSub, textDecoration: "none" }}>Pricing</a>
            <button onClick={() => setIsDark(!isDark)} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: c.textMuted }}>{isDark ? "☀" : "◑"}</button>
            <GoldButton size="sm" onClick={() => navigate("/signin")}>Join the exchange</GoldButton>
          </div>
        </div>
      </nav>
      <Hero />
      <StatsBar />
      <HowItWorks />
      <LifecycleStrip />
      <LeaderboardPreview />
      <Testimonials />
      <Pricing />
      <FinalCta />
      <Footer />
    </div>
  );
}
