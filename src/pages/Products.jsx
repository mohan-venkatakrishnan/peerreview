import { useNavigate } from "react-router-dom";
import { useTheme } from "../tokens/theme";
import { useAppState } from "../state";
import { FREE_LIMIT } from "../data/mock";
import SealMark from "../components/SealMark";
import { Card, GoldButton, GhostButton, PageTitle } from "../components/ui";

export default function Products() {
  const { c } = useTheme();
  const { products, setProductForm } = useAppState();
  const navigate = useNavigate();
  const atLimit = products.length >= FREE_LIMIT;
  const usage = `${products.length} product${products.length === 1 ? "" : "s"} listed`;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <PageTitle eyebrow="Manage" title="My products" sub={`${usage}. Free while we're getting started — every feature included.`} />
        <div className="fade-up">
          {atLimit
            ? <GhostButton size="sm" disabled>Listing limit reached</GhostButton>
            : <GoldButton size="sm" onClick={() => navigate("/onboarding")}>+ Add product</GoldButton>}
        </div>
      </div>

      {products.length === 0 && (
        <Card className="fade-up-d1" style={{ textAlign: "center", padding: "56px 24px" }}>
          <div className="float" style={{ display: "inline-block", marginBottom: 18 }}><SealMark size={64} gold={c.gold} /></div>
          <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 8 }}>List your first product</h3>
          <p style={{ fontSize: 14, color: c.textMuted, lineHeight: 1.7, maxWidth: 420, margin: "0 auto 20px" }}>
            Paste a live listing from any supported platform. Once it's in the pool, you'll be matched to review someone else's — and they'll review yours.
          </p>
          <GoldButton onClick={() => navigate("/onboarding")}>+ Add your product</GoldButton>
        </Card>
      )}

      {products.map((p, i) => (
        <Card key={p.id} className={`fade-up-d${Math.min(i + 1, 3)}`} style={{ marginBottom: 16 }}>
          <div className="wrap-sm" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: `linear-gradient(135deg, ${c.gold}25, ${c.gold}50)`, border: `1px solid ${c.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: c.gold, fontWeight: 700 }}>{p.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: c.text }}>{p.name}</div>
              <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{p.category} · {p.platform}</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: c.textMuted, marginTop: 6 }}>{p.url}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, fontSize: 10, fontWeight: 600, color: c.textSub, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: "3px 9px" }}>
                {(p.matching ?? "category") === "open" ? "⊕ Open match" : "◎ Category match"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 24, textAlign: "center", alignItems: "center" }}>
              {[["Reviews", p.reviews], ["Verified", p.verified]].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 18, fontWeight: 500, color: c.gold, fontFamily: "JetBrains Mono, monospace" }}>{v}</div>
                  <div style={{ fontSize: 10, color: c.textMuted }}>{l}</div>
                </div>
              ))}
              <span data-tip={p.pending ? "In the review pool — open for members to review." : "Not currently in the review pool."}
                style={{ fontSize: 10, fontWeight: 600, whiteSpace: "nowrap", color: p.pending ? c.pending : c.textMuted, background: (p.pending ? c.pending : c.textMuted) + "16", border: `1px solid ${(p.pending ? c.pending : c.textMuted)}30`, borderRadius: 8, padding: "4px 10px", cursor: "help" }}>
                {p.pending ? "◷ In pool" : "Not queued"}
              </span>
            </div>
            <GhostButton size="sm" onClick={() => { setProductForm({ id: p.id, name: p.name, url: p.url, category: p.category, desc: p.description || "", platform: p.platform, matching: p.matching || "category" }); navigate("/onboarding"); }}>Edit</GhostButton>
          </div>
        </Card>
      ))}
    </>
  );
}
