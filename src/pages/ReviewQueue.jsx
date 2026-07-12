import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../tokens/theme";
import { useAppState } from "../state";
import SealMark from "../components/SealMark";
import DatePicker from "../components/DatePicker";
import { Card, Input, GoldButton, GhostButton, PageTitle } from "../components/ui";

const openUrl = (url) => window.open(/^https?:\/\//.test(url) ? url : `https://${url}`, "_blank", "noopener");

const ts = (p) => (p.createdAt ? new Date(p.createdAt).getTime() : 0);
const formatAgo = (iso) => {
  if (!iso) return "recently";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 604800) return `${Math.round(s / 86400)}d ago`;
  if (s < 2592000) return `${Math.round(s / 604800)}w ago`;
  return `${Math.round(s / 2592000)}mo ago`;
};

/* One product. Module-level (never nested) so its input keeps focus across the
   parent's re-renders. `parked` switches it between the queue and the
   Not-interested list. */
function ReviewCard({ product, index, parked, onSubmit, onSkip, onUnskip }) {
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
    <Card className={index === 0 ? "fade-up-d1" : "fade-up-d2"} style={{ marginBottom: 16, opacity: parked ? 0.9 : 1 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 11, background: `linear-gradient(135deg, ${c.gold}25, ${c.gold}50)`, border: `1px solid ${c.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, color: c.gold, fontFamily: "Playfair Display, serif", fontWeight: 700 }}>{product.name[0]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 19, fontWeight: 700, color: c.text, lineHeight: 1.2 }}>{product.name}</h3>
          <div style={{ fontSize: 12, color: c.textMuted, marginTop: 3 }}>
            {product.category} · {product.platform}
            {product.createdAt && <> · <span data-tip={new Date(product.createdAt).toLocaleString()} style={{ cursor: "help" }}>listed {formatAgo(product.createdAt)}</span></>}
          </div>
          <p style={{ fontSize: 13.5, color: c.textSub, lineHeight: 1.65, margin: "10px 0 0" }}>{product.description}</p>
        </div>
      </div>

      {parked ? (
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
          <GoldButton onClick={() => onUnskip(product)}>Move back to queue</GoldButton>
          <GhostButton onClick={() => openUrl(product.url)}>Open listing ↗</GhostButton>
          <span style={{ fontSize: 11, color: c.textMuted, alignSelf: "center" }}>by {product.developer}{product.devScore ? ` · ★ ${product.devScore}` : ""}</span>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
            <GoldButton onClick={() => openUrl(product.url)}>Open listing ↗</GoldButton>
            <GhostButton onClick={() => setOpen(o => !o)}>{open ? "Hide" : "I've left my review →"}</GhostButton>
            <button onClick={() => onSkip(product)} data-tip="Moves this to Not interested. Skipping lowers your Trust Score — you can move it back anytime."
              style={{ background: "transparent", border: `1px solid ${c.border}`, borderRadius: 10, padding: "9px 14px", color: c.textMuted, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              Not interested
            </button>
            <span style={{ fontSize: 11, color: c.textMuted, alignSelf: "center" }}>by {product.developer}{product.devScore ? ` · ★ ${product.devScore}` : ""}</span>
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
        </>
      )}
    </Card>
  );
}

export default function ReviewQueue() {
  const { c, isDark } = useTheme();
  const { reviewablePool, skippedPool, reviewSubmitted, submitReview, skipProduct, unskipProduct } = useAppState();
  const navigate = useNavigate();
  const [tab, setTab] = useState("review"); // 'review' | 'parked'
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [sortDir, setSortDir] = useState("newest"); // 'newest' | 'oldest'
  const [range, setRange] = useState("all"); // all | day | week | month | custom
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const now = Date.now();
  const inRange = (p) => {
    if (range === "all") return true;
    const t = ts(p);
    if (range === "custom") {
      const okFrom = !from || t >= new Date(from).getTime();
      const okTo = !to || t <= new Date(to).getTime() + 86400000 - 1; // include the whole 'to' day
      return okFrom && okTo;
    }
    const days = range === "day" ? 1 : range === "week" ? 7 : 30;
    return t >= now - days * 86400000;
  };

  const source = tab === "parked" ? skippedPool : reviewablePool;
  const categories = [...new Set(source.map(p => p.category).filter(Boolean))].sort();
  const q = search.trim().toLowerCase();
  const filtered = source
    .filter(p =>
      (cat === "all" || p.category === cat) &&
      inRange(p) &&
      (!q || [p.name, p.description, p.platform, p.developer].some(f => (f || "").toLowerCase().includes(q)))
    )
    .sort((a, b) => (sortDir === "newest" ? ts(b) - ts(a) : ts(a) - ts(b)));

  const sel = { background: c.bg, border: `1px solid ${c.border}`, color: c.text, borderRadius: 10, padding: "9px 12px", fontSize: 13, cursor: "pointer", colorScheme: isDark ? "dark" : "light" };

  const Tab = ({ id, label, count }) => (
    <button onClick={() => { setTab(id); setCat("all"); }}
      style={{
        background: "transparent", border: "none", cursor: "pointer",
        padding: "0 2px 10px", fontSize: 14, fontWeight: 600,
        color: tab === id ? c.gold : c.textMuted,
        borderBottom: `2px solid ${tab === id ? c.gold : "transparent"}`,
      }}>
      {label} <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, opacity: 0.8 }}>{count}</span>
    </button>
  );

  return (
    <>
      <PageTitle
        eyebrow="Review Queue"
        title="Products to review"
        sub="Everything you can review right now. Pick any one, leave a genuine review on its store listing, then paste your review link — every review you give earns one back."
      />

      <div className="fade-up" style={{ display: "flex", gap: 22, borderBottom: `1px solid ${c.border}`, marginBottom: 22 }}>
        <Tab id="review" label="To review" count={reviewablePool.length} />
        <Tab id="parked" label="Not interested" count={skippedPool.length} />
      </div>

      {source.length === 0 ? (
        <Card className="fade-up-d1" style={{ textAlign: "center", padding: "56px 24px" }}>
          <div className="float" style={{ display: "inline-block", marginBottom: 18 }}><SealMark size={64} animated gold={c.gold} /></div>
          {tab === "parked" ? (
            <>
              <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 8 }}>Nothing set aside</h3>
              <p style={{ fontSize: 14, color: c.textMuted, lineHeight: 1.7, maxWidth: 440, margin: "0 auto" }}>
                Products you mark “Not interested” land here so you can revisit them later. Skipping lowers your Trust Score, so it’s best kept for products you genuinely can’t review.
              </p>
            </>
          ) : (
            <>
              <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 8 }}>
                {reviewSubmitted ? "You're all caught up" : "Nothing to review yet"}
              </h3>
              <p style={{ fontSize: 14, color: c.textMuted, lineHeight: 1.7, maxWidth: 440, margin: "0 auto 20px" }}>
                {reviewSubmitted
                  ? "You've reviewed every product in the pool. New listings appear here the moment they join."
                  : "As soon as another developer lists a product, it appears here for you to review."}
              </p>
              <GhostButton onClick={() => navigate("/app/products")}>List your product →</GhostButton>
            </>
          )}
        </Card>
      ) : (
        <>
          {tab === "parked" && (
            <div className="fade-up" style={{ display: "flex", alignItems: "flex-start", gap: 10, background: c.goldGlow, border: `1px solid ${c.borderGold}`, borderRadius: 10, padding: "12px 14px", marginBottom: 18, fontSize: 12.5, color: c.textSub, lineHeight: 1.6 }}>
              <span style={{ color: c.pending }}>⚠</span>
              <span>These count against your <strong style={{ color: c.text }}>Trust Score</strong> while they sit here. Move any back to your queue and review it to recover.</span>
            </div>
          )}

          {/* one compact toolbar: search + category + date + sort */}
          <div className="fade-up-d1" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: range === "custom" ? 12 : 18 }}>
            <div style={{ flex: "1 1 200px", minWidth: 160, display: "flex", alignItems: "center", gap: 10, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "9px 14px" }}>
              <span style={{ color: c.textMuted, fontSize: 14 }}>⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
                style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontSize: 13, color: c.text }} />
              {search && <span onClick={() => setSearch("")} style={{ cursor: "pointer", color: c.textMuted, fontSize: 12 }}>✕</span>}
            </div>
            <select value={cat} onChange={e => setCat(e.target.value)} style={sel} aria-label="Category">
              <option value="all">All categories</option>
              {categories.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <select value={range} onChange={e => setRange(e.target.value)} style={sel} aria-label="Date listed">
              <option value="all">Any time</option>
              <option value="day">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="custom">Custom…</option>
            </select>
            <select value={sortDir} onChange={e => setSortDir(e.target.value)} style={sel} aria-label="Sort by listing date">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          {range === "custom" && (
            <div className="fade-up" style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
              <span style={{ fontSize: 12, color: c.textMuted, display: "inline-flex", alignItems: "center", gap: 8 }}>
                From <DatePicker value={from} max={to || undefined} onChange={setFrom} />
              </span>
              <span style={{ fontSize: 12, color: c.textMuted, display: "inline-flex", alignItems: "center", gap: 8 }}>
                To <DatePicker value={to} min={from || undefined} onChange={setTo} />
              </span>
              {(from || to) && (
                <button onClick={() => { setFrom(""); setTo(""); }} style={{ background: "transparent", border: "none", color: c.textMuted, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Clear dates</button>
              )}
            </div>
          )}

          <div className="fade-up" style={{ fontSize: 12, color: c.textMuted, marginBottom: 16 }}>
            {filtered.length === source.length
              ? `${source.length} product${source.length === 1 ? "" : "s"}${tab === "parked" ? " set aside" : " waiting for a review"}`
              : `${filtered.length} of ${source.length} shown`}
          </div>

          {filtered.length === 0 ? (
            <Card className="fade-up" style={{ textAlign: "center", padding: "44px 24px" }}>
              <div style={{ display: "inline-block", marginBottom: 14, opacity: 0.6 }}><SealMark size={48} gold={c.textMuted} /></div>
              <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700, color: c.text, marginBottom: 8 }}>No products match</h3>
              <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 16 }}>Try a different search or category.</p>
              <GhostButton onClick={() => { setSearch(""); setCat("all"); setRange("all"); setFrom(""); setTo(""); }}>Clear filters</GhostButton>
            </Card>
          ) : (
            filtered.map((p, i) => (
              <ReviewCard key={p.productId} product={p} index={i} parked={tab === "parked"}
                onSubmit={submitReview} onSkip={skipProduct} onUnskip={unskipProduct} />
            ))
          )}
        </>
      )}
    </>
  );
}
