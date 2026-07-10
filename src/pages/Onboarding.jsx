import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../tokens/theme";
import { useAppState } from "../state";
import { CATEGORIES, detectPlatform } from "../data/mock";
import SealMark from "../components/SealMark";
import ParallaxBackdrop from "../components/ParallaxBackdrop";
import { Card, Input, GoldButton, GhostButton } from "../components/ui";

const STEPS = ["Your product", "Matching", "Done"];

export default function Onboarding() {
  const { c } = useTheme();
  const { productForm, setProductForm, saveProduct, setMatching, useMock } = useAppState();
  const [onboardStep, setOnboardStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const platform = detectPlatform(productForm.url);

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      if (!useMock) {
        await saveProduct(productForm);
        await setMatching(productForm.matching);
      }
      setOnboardStep(2);
    } catch (e) {
      setError(e.message);
      setOnboardStep(0);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <ParallaxBackdrop intensity={0.8} />
      <div style={{ maxWidth: 520, width: "100%", position: "relative", zIndex: 1 }}>
        {/* Progress */}
        <div className="fade-up" style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {STEPS.map((s, i) => (
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
              platform ? (
                <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: -8, marginBottom: 18, fontSize: 12, color: c.verified }}>
                  ✓ Platform detected: <strong>{platform}</strong>
                </div>
              ) : (
                <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: -8, marginBottom: 18, fontSize: 12, color: c.pending }}>
                  ◷ Not a supported listing URL yet — paste the full store/launch page link
                </div>
              )
            )}
            {error && <div className="fade-up" style={{ fontSize: 12, color: c.flagged, marginBottom: 14 }}>⚠ {error}</div>}
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
              <div style={{ flex: 1 }}><GoldButton full onClick={finish}>{saving ? "Listing your product…" : "Continue →"}</GoldButton></div>
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
            <GoldButton size="lg" onClick={() => navigate("/app")}>Go to dashboard →</GoldButton>
          </Card>
        )}
      </div>
    </div>
  );
}
