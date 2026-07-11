import { useState } from "react";
import { useTheme } from "../tokens/theme";
import { useAppState } from "../state";
import SealMark from "../components/SealMark";
import StateBadge from "../components/StateBadge";
import SearchBox from "../components/SearchBox";
import { Card, PageTitle, StatBar } from "../components/ui";

export default function MyProduct() {
  const { c } = useTheme();
  const { incoming, products, stats, stampAnimating, verifyReview, flagReview } = useAppState();
  const [reviewsSearch, setReviewsSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);
  const openLink = (url) => window.open(/^https?:\/\//.test(url) ? url : `https://${url}`, "_blank", "noopener");
  const copyLink = (id, url) => {
    const full = /^https?:\/\//.test(url) ? url : `https://${url}`;
    navigator.clipboard?.writeText(full).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 1500); });
  };
  const productOf = (r) => products.find(p => p.id === r.productId || p.name === r.product);
  const visible = incoming.filter(r => productFilter === "all" || productOf(r)?.id === productFilter);
  const awaiting = visible.filter(r => r.state === "pending" || r.state === "submitted").length;
  const verifiedByMe = visible.filter(r => r.state === "verified").length;
  const productName = products.length > 1 ? "Incoming reviews" : (products[0]?.name ?? "My product");

  return (
    <>
      <PageTitle eyebrow={products.length > 1 ? "My Products" : "My Product"} title={productName} sub="Reviews your products have received. Read each one on the platform, then verify or flag it." />

      {products.length > 1 && (
        <div className="fade-up" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {[{ id: "all", name: "All products" }, ...products].map(p => (
            <button key={p.id} onClick={() => setProductFilter(p.id)}
              style={{
                background: productFilter === p.id ? c.goldGlow : "transparent",
                border: `1px solid ${productFilter === p.id ? c.gold : c.border}`,
                color: productFilter === p.id ? c.gold : c.textMuted,
                borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
              }}>{p.name}</button>
          ))}
        </div>
      )}

      <StatBar className="fade-up-d1" style={{ marginBottom: 28 }} items={[
        { label: "Total received", value: String(visible.length) },
        { label: "Verified by you", value: String(verifiedByMe), sub: visible.length ? `${Math.round((verifiedByMe / visible.length) * 100)}% of received` : undefined },
        { label: "Awaiting verification", value: String(awaiting), color: awaiting > 0 ? c.pending : undefined },
      ]} />

      <div className="fade-up-d2">
        <SearchBox value={reviewsSearch} onChange={e => setReviewsSearch(e.target.value)} placeholder="Search reviews by reviewer or content…" />
      </div>

      {visible.length === 0 && (
        <Card className="fade-up-d2" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div className="float" style={{ display: "inline-block", marginBottom: 16 }}><SealMark size={56} animated gold={c.gold} /></div>
          <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700, color: c.text, marginBottom: 8 }}>No reviews yet</h3>
          <p style={{ fontSize: 13, color: c.textMuted, lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
            Your product is in the pool. When someone reviews it, it appears here for you to verify or flag.
          </p>
        </Card>
      )}

      {visible.filter(r => !reviewsSearch || r.reviewer.toLowerCase().includes(reviewsSearch.toLowerCase()) || r.excerpt.toLowerCase().includes(reviewsSearch.toLowerCase())).map((r, i) => {
        const isVerified = r.state === "verified";
        const isFlagged = r.state === "flagged";
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
                <div style={{ fontSize: 11, color: c.textMuted }}>★ {r.score} trust · {r.given} reviews given · {r.time}{productOf(r) && productFilter === "all" && products.length > 1 ? ` · on ${productOf(r).name}` : ""}</div>
              </div>
              {isVerified ? <StateBadge state="verified" /> : isFlagged ? <StateBadge state="flagged" /> : <StateBadge state="pending" />}
            </div>
            <p style={{ fontSize: 14, color: c.textSub, lineHeight: 1.7, marginBottom: 14, fontStyle: "italic" }}>"{r.excerpt}"</p>
            <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: "8px 10px 8px 12px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span onClick={() => openLink(r.link)} title="Open the review on its platform"
                style={{ flex: 1, fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: c.gold, wordBreak: "break-all", cursor: "pointer", textDecoration: "underline", textDecorationColor: c.borderGold, textUnderlineOffset: 3 }}>
                {r.link}
              </span>
              <button onClick={() => copyLink(r.id, r.link)} title="Copy link"
                style={{ flexShrink: 0, background: "transparent", border: `1px solid ${copiedId === r.id ? c.verified : c.border}`, borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: copiedId === r.id ? c.verified : c.textMuted, fontSize: 11, display: "inline-flex", alignItems: "center", gap: 5 }}>
                {copiedId === r.id
                  ? <>✓ Copied</>
                  : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg> Copy</>}
              </button>
              <button onClick={() => openLink(r.link)} title="Open link"
                style={{ flexShrink: 0, background: "transparent", border: `1px solid ${c.border}`, borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: c.textMuted, fontSize: 11, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg> Open
              </button>
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
    </>
  );
}
