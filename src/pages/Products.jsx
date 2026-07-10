import { useNavigate } from "react-router-dom";
import { useTheme } from "../tokens/theme";
import { useAppState } from "../state";
import { PLANS } from "../data/mock";
import SealMark from "../components/SealMark";
import { Card, GoldButton, GhostButton, PageTitle } from "../components/ui";

export default function Products() {
  const { c } = useTheme();
  const { plan, setPlan, products: allProducts, useMock } = useAppState();
  const navigate = useNavigate();
  const tier = PLANS[plan];
  const products = useMock ? allProducts.slice(0, Number.isFinite(tier.limit) ? tier.limit : allProducts.length) : allProducts;
  const atLimit = products.length >= tier.limit;
  const emptySlots = Number.isFinite(tier.limit) ? Math.max(0, tier.limit - products.length) : 0;
  const usage = Number.isFinite(tier.limit) ? `${products.length} of ${tier.limit} listings used` : `${products.length} listings · unlimited`;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <PageTitle eyebrow="Manage" title="My products" sub={`${tier.label} plan — ${usage}.`} />
        <div className="fade-up">
          {atLimit
            ? <GhostButton size="sm">Listing limit reached</GhostButton>
            : <GoldButton size="sm" onClick={() => navigate("/onboarding")}>+ Add product</GoldButton>}
        </div>
      </div>

      {/* Plan preview switcher (mock only — real plan comes from billing) */}
      {useMock && (
      <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Preview plan</span>
        <div style={{ display: "flex", gap: 4, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: 3 }}>
          {Object.entries(PLANS).map(([id, p]) => (
            <button key={id} onClick={() => setPlan(id)}
              style={{
                background: plan === id ? c.goldGlow : "transparent",
                border: plan === id ? `1px solid ${c.borderGold}` : "1px solid transparent",
                color: plan === id ? c.gold : c.textMuted,
                borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
              }}>{p.label}</button>
          ))}
        </div>
        <span style={{ fontSize: 11, color: c.textMuted, fontFamily: "JetBrains Mono, monospace" }}>{tier.price}</span>
      </div>
      )}

      {products.map((p, i) => (
        <Card key={p.id} className={`fade-up-d${Math.min(i + 1, 3)}`} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: `linear-gradient(135deg, ${c.gold}25, ${c.gold}50)`, border: `1px solid ${c.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: c.gold, fontWeight: 700 }}>{p.name[0]}</div>
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

      {/* Unused capacity on limited plans */}
      {emptySlots > 0 && Array.from({ length: emptySlots }, (_, i) => (
        <div key={`slot-${i}`} className="fade-up-d3" onClick={() => navigate("/onboarding")} style={{
          border: `1px dashed ${c.border}`, borderRadius: 16, padding: "22px 24px", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "border-color 0.2s",
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = c.borderGold}
          onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
          <div style={{ width: 52, height: 52, borderRadius: 12, border: `1px dashed ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: c.textMuted }}>+</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: c.textSub }}>Empty listing slot</div>
            <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>Add a product with a live listing on a supported platform.</div>
          </div>
        </div>
      ))}

      {/* Upgrade prompt — Free upsells Pro, Pro upsells Studio, Studio shows none */}
      {plan !== "studio" && (
        <Card className="fade-up-d3" style={{ background: `linear-gradient(160deg, ${c.goldGlow}, ${c.surface})`, border: `1px solid ${c.borderGold}`, display: "flex", alignItems: "center", gap: 20 }}>
          <SealMark size={44} gold={c.gold} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 4 }}>Have more products?</div>
            <div style={{ fontSize: 13, color: c.textSub }}>
              {plan === "free"
                ? "Pro lists up to 5 products. Studio is unlimited. Same features on every plan."
                : "Studio removes the listing limit entirely. Same features — only the count changes."}
            </div>
          </div>
          <GoldButton size="sm">{plan === "free" ? "Upgrade — $7/mo" : "Upgrade — $19/mo"}</GoldButton>
        </Card>
      )}
    </>
  );
}
