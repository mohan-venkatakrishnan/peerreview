import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../tokens/theme";
import { useAppState } from "../state";
import SealMark from "../components/SealMark";
import StateBadge from "../components/StateBadge";
import { Card, Input, GoldButton, GhostButton, PageTitle } from "../components/ui";

export default function ReviewQueue() {
  const { c } = useTheme();
  const { assigned, reviewSubmitted, submitReview, skipAssignment, reviewLinkPasted, setReviewLinkPasted } = useAppState();
  const [reviewText, setReviewText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const onSubmit = async () => {
    if (reviewLinkPasted.length <= 8 || busy) return;
    setBusy(true);
    setError(null);
    try { await submitReview(reviewLinkPasted, reviewText); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const onSkip = async () => {
    if (busy) return;
    setBusy(true);
    try { await skipAssignment(); } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  /* No assignment and nothing pending — empty state */
  if (!assigned && !reviewSubmitted) {
    return (
      <>
        <PageTitle eyebrow="Review Queue" title="Your assignment" sub="Review products genuinely on their store listings — every review you give earns one back." />
        <Card className="fade-up-d1" style={{ textAlign: "center", padding: "56px 24px" }}>
          <div className="float" style={{ display: "inline-block", marginBottom: 18 }}><SealMark size={64} animated gold={c.gold} /></div>
          <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 8 }}>Nothing in your queue</h3>
          <p style={{ fontSize: 14, color: c.textMuted, lineHeight: 1.7, maxWidth: 420, margin: "0 auto 20px" }}>
            Assignments land as the pool matches you with a product. Listing your own product speeds this up.
          </p>
          <GhostButton onClick={() => navigate("/app/products")}>Check my products →</GhostButton>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageTitle eyebrow="Review Queue" title="Your assignment" sub="Review this product genuinely on its store listing, then paste your review link below." />

      <div className="grid-main" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Product card */}
        {assigned && (
          <Card className="fade-up-d1">
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: `linear-gradient(135deg, ${c.gold}25, ${c.gold}50)`, border: `1px solid ${c.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: c.gold }}>{assigned.name[0]}</div>
              <div>
                <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700, color: c.text }}>{assigned.name}</h3>
                <div style={{ fontSize: 12, color: c.textMuted }}>{assigned.category} · {assigned.platform}</div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: c.textSub, lineHeight: 1.7, marginBottom: 20 }}>{assigned.description}</p>
            <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "12px 14px", fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: c.textSub, marginBottom: 20, wordBreak: "break-all" }}>
              {assigned.url}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <GoldButton onClick={() => window.open(/^https?:\/\//.test(assigned.url) ? assigned.url : `https://${assigned.url}`, "_blank")}>Open listing ↗</GoldButton>
              <GhostButton onClick={onSkip}>{busy ? "…" : "Skip this one"}</GhostButton>
            </div>
            <div style={{ marginTop: 20, padding: 14, background: c.goldGlow, border: `1px solid ${c.borderGold}`, borderRadius: 10, fontSize: 12, color: c.textSub, lineHeight: 1.6 }}>
              <strong style={{ color: c.gold }}>✦ Developer:</strong> {assigned.developer}{assigned.devScore ? ` · trust score ★ ${assigned.devScore}` : ""}. They will verify your review — genuine, thoughtful reviews earn verified status and grow your reputation.
            </div>
          </Card>
        )}

        {/* Submit review */}
        <Card className="fade-up-d2" style={!assigned ? { gridColumn: "1 / -1", maxWidth: 560, margin: "0 auto", width: "100%" } : undefined}>
          <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>Submit your review</div>
          {assigned ? (
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
                <textarea placeholder="Paste your review text here…" rows={4} value={reviewText} onChange={e => setReviewText(e.target.value)}
                  style={{ width: "100%", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 13, color: c.text, resize: "vertical", lineHeight: 1.6 }} />
              </div>
              {reviewLinkPasted.length > 8 && !error && (
                <div className="fade-up" style={{ fontSize: 12, color: c.verified, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  ✓ Ready to submit for {assigned.platform}
                </div>
              )}
              {error && (
                <div className="fade-up" style={{ fontSize: 12, color: c.flagged, marginBottom: 14 }}>⚠ {error}</div>
              )}
              <GoldButton full onClick={onSubmit}>
                {busy ? "Submitting…" : "Submit for verification"}
              </GoldButton>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div className="stamp-in" style={{ display: "inline-block", marginBottom: 16 }}><SealMark size={64} gold={c.gold} /></div>
              <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700, color: c.text, marginBottom: 8 }}>Review submitted</h3>
              <p style={{ fontSize: 13, color: c.textMuted, lineHeight: 1.7, marginBottom: 8 }}>
                Now pending verification by the product owner.
              </p>
              <StateBadge state="pending" />
              <div style={{ marginTop: 20, padding: 14, background: c.goldGlow, border: `1px solid ${c.borderGold}`, borderRadius: 10, fontSize: 12, color: c.textSub, lineHeight: 1.6, textAlign: "left" }}>
                <strong style={{ color: c.gold }}>✦ What happens next:</strong> once verified you've earned a review credit — someone in the pool gets assigned your product, and their review is on its way.
              </div>
              <div style={{ marginTop: 16 }}>
                <GhostButton full size="sm" onClick={() => navigate("/app")}>Back to dashboard</GhostButton>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
