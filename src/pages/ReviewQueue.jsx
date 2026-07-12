import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../tokens/theme";
import { useAppState } from "../state";
import SealMark from "../components/SealMark";
import SearchBox from "../components/SearchBox";
import { Card, Input, GoldButton, GhostButton, PageTitle } from "../components/ui";

const openUrl = (url) => window.open(/^https?:\/\//.test(url) ? url : `https://${url}`, "_blank", "noopener");

/* One product in the pool. Module-level (never nested) so its input keeps
   focus across the parent's re-renders. */
function ReviewCard({ product, index, onSubmit }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const ready = link.trim().length > 8;

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true); setError(null);
    try { await onSubmit(product.productId, product.ownerId, link.trim(), text); }
    catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <Card className={index === 0 ? "fade-up-d1" : "fade-up-d2"} style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 11, background: `linear-gradient(135deg, ${c.gold}25, ${c.gold}50)`, border: `1px solid ${c.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, color: c.gold, fontFamily: "Playfair Display, serif", fontWeight: 700 }}>{product.name[0]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 19, fontWeight: 700, color: c.text, lineHeight: 1.2 }}>{product.name}</h3>
          <div style={{ fontSize: 12, color: c.textMuted, marginTop: 3 }}>{product.category} · {product.platform}</div>
          <p style={{ fontSize: 13.5, color: c.textSub, lineHeight: 1.65, margin: "10px 0 0" }}>{product.description}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <GoldButton onClick={() => openUrl(product.url)}>Open listing ↗</GoldButton>
        <GhostButton onClick={() => setOpen(o => !o)}>{open ? "Hide" : "I've left my review →"}</GhostButton>
        <span style={{ fontSize: 11, color: c.textMuted, alignSelf: "center" }}>
          by {product.developer}{product.devScore ? ` · ★ ${product.devScore}` : ""}
        </span>
      </div>

      {open && (
        <div className="fade-up" style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${c.border}` }}>
          <Input label="Your review link" mono placeholder={`Paste the URL of your review on ${product.platform}…`} value={link} onChange={e => setLink(e.target.value)} />
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.textSub, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Review text <span style={{ color: c.textMuted, fontWeight: 400, textTransform: "none" }}>(optional — helps faster verification)</span></label>
            <textarea placeholder="Paste your review text here…" rows={3} value={text} onChange={e => setText(e.target.value)}
              style={{ width: "100%", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 13, color: c.text, resize: "vertical", lineHeight: 1.6 }} />
          </div>
          {error && <div className="fade-up" style={{ fontSize: 12, color: c.flagged, marginBottom: 12 }}>⚠ {error}</div>}
          <GoldButton full disabled={!ready || busy} onClick={submit}>
            {busy ? "Submitting…" : "Submit for verification"}
          </GoldButton>
        </div>
      )}
    </Card>
  );
}

export default function ReviewQueue() {
  const { c } = useTheme();
  const { reviewablePool, reviewSubmitted, submitReview } = useAppState();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");

  const categories = [...new Set(reviewablePool.map(p => p.category).filter(Boolean))].sort();
  const q = search.trim().toLowerCase();
  const filtered = reviewablePool.filter(p =>
    (cat === "all" || p.category === cat) &&
    (!q || [p.name, p.description, p.platform, p.developer].some(f => (f || "").toLowerCase().includes(q)))
  );

  return (
    <>
      <PageTitle
        eyebrow="Review Queue"
        title="Products to review"
        sub="Everything you can review right now. Pick any one, leave a genuine review on its store listing, then paste your review link — every review you give earns one back."
      />

      {reviewablePool.length === 0 ? (
        <Card className="fade-up-d1" style={{ textAlign: "center", padding: "56px 24px" }}>
          <div className="float" style={{ display: "inline-block", marginBottom: 18 }}><SealMark size={64} animated gold={c.gold} /></div>
          <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 8 }}>
            {reviewSubmitted ? "You're all caught up" : "Nothing to review yet"}
          </h3>
          <p style={{ fontSize: 14, color: c.textMuted, lineHeight: 1.7, maxWidth: 440, margin: "0 auto 20px" }}>
            {reviewSubmitted
              ? "You've reviewed every product in the pool. New listings appear here the moment they join."
              : "As soon as another developer lists a product, it appears here for you to review."}
          </p>
          <GhostButton onClick={() => navigate("/app/products")}>List your product →</GhostButton>
        </Card>
      ) : (
        <>
          <div className="fade-up-d1">
            <SearchBox value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products by name, platform, or developer…" />
          </div>

          {categories.length > 0 && (
            <div className="fade-up-d1" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              {["all", ...categories].map(k => (
                <button key={k} onClick={() => setCat(k)}
                  style={{
                    background: cat === k ? c.goldGlow : "transparent",
                    border: `1px solid ${cat === k ? c.gold : c.border}`,
                    color: cat === k ? c.gold : c.textMuted,
                    borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                  }}>{k === "all" ? "All categories" : k}</button>
              ))}
            </div>
          )}

          <div className="fade-up" style={{ fontSize: 12, color: c.textMuted, marginBottom: 16 }}>
            {filtered.length === reviewablePool.length
              ? `${reviewablePool.length} product${reviewablePool.length === 1 ? "" : "s"} waiting for a review`
              : `${filtered.length} of ${reviewablePool.length} shown`}
          </div>

          {filtered.length === 0 ? (
            <Card className="fade-up" style={{ textAlign: "center", padding: "44px 24px" }}>
              <div style={{ display: "inline-block", marginBottom: 14, opacity: 0.6 }}><SealMark size={48} gold={c.textMuted} /></div>
              <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700, color: c.text, marginBottom: 8 }}>No products match</h3>
              <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 16 }}>Try a different search or category.</p>
              <GhostButton onClick={() => { setSearch(""); setCat("all"); }}>Clear filters</GhostButton>
            </Card>
          ) : (
            filtered.map((p, i) => (
              <ReviewCard key={p.productId} product={p} index={i} onSubmit={submitReview} />
            ))
          )}
        </>
      )}
    </>
  );
}
