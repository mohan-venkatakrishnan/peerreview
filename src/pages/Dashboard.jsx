import { useNavigate } from "react-router-dom";
import { useTheme } from "../tokens/theme";
import { useAppState } from "../state";
import SealMark from "../components/SealMark";
import ProductIcon from "../components/ProductIcon";
import StatsPanel from "../components/StatsPanel";
import NavIcon from "../components/NavIcon";
import StateBadge from "../components/StateBadge";
import { Card, GoldButton, GhostButton, StatBar, TrustRing, MeterBar } from "../components/ui";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};
const today = () => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
const reviewSubmittedFromHistory = (history) => history.some(h => h.state === "pending" || h.state === "submitted");

export default function Dashboard() {
  const { c } = useTheme();
  const { reviewablePool, featuredPool, incoming, history, account, stats, products, platformStats, me } = useAppState();
  const fairness = me?.fairness;
  const navigate = useNavigate();
  const queue = [...featuredPool, ...reviewablePool];
  const queueCount = queue.length;
  const next = queue[0] ?? null;
  const caughtUp = reviewSubmittedFromHistory(history);
  // Nudge owners who've taken more than they've given (and have things to
  // review). Reviewing lifts Trust Score + leaderboard rank and keeps the pool
  // alive — all genuinely true, so the ask stays honest.
  const showGiveBack = products.length > 0 && queueCount > 0 && stats.given <= stats.received;
  const awaiting = incoming.filter(r => r.state === "pending" || r.state === "submitted").length;
    const verifiedRate = stats.given > 0 ? Math.round((stats.verified / stats.given) * 100) : null;

  return (
    <>
      {/* Header — greeting + trust ring */}
      <div className="fade-up dash-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: c.gold, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Dashboard · {today()}</div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 32, fontWeight: 700, color: c.text, letterSpacing: "-0.02em" }}>{greeting()}, {account.name}</h1>
          <p style={{ fontSize: 14, color: c.textMuted, marginTop: 8, lineHeight: 1.6 }}>Here's where your exchange stands.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <TrustRing score={account.score} />
          <span data-tip="Your Trust Score blends verified reviews, your give/get ratio, and owner ratings. Products you leave in ‘Not interested’ lower it — move them back and review them to recover."
            style={{ fontSize: 11, color: c.textMuted, cursor: "help", borderBottom: `1px dotted ${c.textMuted}55`, whiteSpace: "nowrap" }}>
            What affects this?
          </span>
        </div>
      </div>

      <StatBar className="fade-up-d1" style={{ marginBottom: 20 }} items={[
        { label: "Reviews given", value: String(stats.given) },
        { label: "Reviews received", value: String(stats.received) },
        { label: "Verified rate", value: verifiedRate === null ? "—" : `${verifiedRate}%`, sub: `${stats.verified} of ${stats.given} verified` },
        { label: "Leaderboard", value: stats.rank ? `#${stats.rank}` : "—", sub: stats.rank ? "keep giving to climb" : "review to get ranked" },
      ]} />

      {showGiveBack && (
        <Card className="fade-up-d1" style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", borderColor: c.borderGold, background: c.goldGlow }}>
          <div className="float" style={{ flexShrink: 0 }}><SealMark size={44} gold={c.gold} /></div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: c.text, fontFamily: "Playfair Display, serif", marginBottom: 4 }}>
              {stats.received > 0 ? `Your ${products.length === 1 ? "product has" : "products have"} received ${stats.received} review${stats.received === 1 ? "" : "s"} — give some back` : "Give a review to get the exchange going"}
            </div>
            <p style={{ fontSize: 13, color: c.textSub, lineHeight: 1.6 }}>
              Reviewing others lifts your Trust Score, climbs you up the leaderboard, and keeps the pool active for everyone. <strong style={{ color: c.gold, whiteSpace: "nowrap" }}>{queueCount} product{queueCount === 1 ? "" : "s"}</strong> {queueCount === 1 ? "is" : "are"} waiting in your queue.
            </p>
          </div>
          <GoldButton onClick={() => navigate("/app/review")}>Review products →</GoldButton>
        </Card>
      )}

      <div className="grid-main" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        {/* Review queue */}
        <Card className="fade-up-d2" style={{ position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {next ? (
            <>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${c.gold}, transparent)` }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.1em" }}><NavIcon name="review" size={13} color={c.gold} /> Your review queue</div>
                <div style={{ fontSize: 11, color: c.textMuted }}><span style={{ color: c.text, fontWeight: 600, fontFamily: "JetBrains Mono, monospace" }}>{queueCount}</span> to review</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <ProductIcon name={next.name} icon={next.icon} size={52} radius={12} />
                <div>
                  <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: c.text, lineHeight: 1.2 }}>{next.name}</h3>
                  <div style={{ fontSize: 12, color: c.textMuted, marginTop: 3 }}>{next.category} · {next.platform}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: c.textSub, lineHeight: 1.7, marginBottom: 18, flex: 1 }}>{next.description}</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <GoldButton onClick={() => navigate("/app/review")}>Start reviewing →</GoldButton>
                <span style={{ fontSize: 11, color: c.textMuted }}>{queueCount > 1 ? `+${queueCount - 1} more in the queue` : "they verify your review"}</span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "28px 0" }}>
              <div className="stamp-in" style={{ display: "inline-block", marginBottom: 12 }}><SealMark size={48} gold={c.gold} /></div>
              <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>{caughtUp ? "All caught up" : "Queue clear"}</div>
              <p style={{ fontSize: 13, color: c.textMuted }}>
                {caughtUp
                  ? "You've reviewed everything in the pool. New listings show up here as they join."
                  : "Nothing to review yet — products appear here as developers list them."}
              </p>
            </div>
          )}
        </Card>

        {/* My product status */}
        <Card className="fade-up-d3" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 18 }}><NavIcon name="product" size={13} color={c.gold} /> Your product{products.length > 1 ? "s" : ""}</div>
          {products.length > 0 ? (
            <>
              {products.slice(0, 3).map((p, i) => (
                <div key={p.id} style={{ marginBottom: i < Math.min(products.length, 3) - 1 ? 16 : 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <ProductIcon name={p.name} icon={p.icon} size={34} radius={9} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: c.textMuted }}>{p.platform}</div>
                    </div>
                    <span style={{ fontSize: 11, color: c.textMuted, fontFamily: "JetBrains Mono, monospace" }}>{p.verified}/{p.reviews}</span>
                  </div>
                  <MeterBar pct={p.reviews > 0 ? (p.verified / p.reviews) * 100 : 0} height={3} />
                </div>
              ))}
              {products.length > 3 && (
                <div onClick={() => navigate("/app/products")} style={{ fontSize: 12, color: c.textMuted, cursor: "pointer", marginBottom: 14 }}>+{products.length - 3} more →</div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
              <SealMark size={40} gold={c.textMuted} />
              <p style={{ fontSize: 13, color: c.textMuted, marginTop: 10 }}>No product listed yet.</p>
              <div style={{ marginTop: 12 }}><GhostButton size="sm" onClick={() => navigate("/app/products")}>+ List your product</GhostButton></div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            {[["Reviews received", String(stats.received)], ["Awaiting your verification", awaiting]].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: c.textMuted }}>{label}</span>
                <span style={{ color: c.text, fontWeight: 600 }}>{val}</span>
              </div>
            ))}
          </div>
          {awaiting > 0 && (
            <div style={{ marginTop: 16 }}>
              <GhostButton full size="sm" onClick={() => navigate("/app/product")}>Verify incoming reviews →</GhostButton>
            </div>
          )}
        </Card>
      </div>

      {/* Recent activity + live exchange stats fill the row */}
      <div className="grid-main" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginTop: 20 }}>
        <Card className="fade-up-d3" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: `1px solid ${c.border}` }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.1em" }}>Recent activity</span>
            <span onClick={() => navigate("/app/profile")} style={{ fontSize: 12, color: c.textMuted, cursor: "pointer" }}>Full history →</span>
          </div>
          {history.length === 0 && (
            <div style={{ padding: "24px", textAlign: "center", fontSize: 13, color: c.textMuted }}>No reviews yet — your first review starts the story.</div>
          )}
          {history.slice(0, 3).map((r, i, arr) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px", borderBottom: i < arr.length - 1 ? `1px solid ${c.border}` : "none" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: c.gold, fontFamily: "Playfair Display, serif", fontWeight: 700 }}>{r.product[0]}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, color: c.text }}>You reviewed <strong>{r.product}</strong></span>
                {r.rating && <span style={{ fontSize: 11, color: c.gold, marginLeft: 8 }}>rated ★ {r.rating}</span>}
              </div>
              <span style={{ fontSize: 11, color: c.textMuted, fontFamily: "JetBrains Mono, monospace" }}>{r.time}</span>
              <StateBadge state={r.state} />
            </div>
          ))}
        </Card>
        <StatsPanel stats={platformStats} poolStatus />
      </div>

      {/* Admin-only: give/get fairness — decide if the open pool ever needs tightening */}
      {fairness && (() => {
        const total = Math.max(fairness.givers + fairness.takers, 1);
        const giverPct = Math.round((fairness.givers / total) * 100);
        const healthy = fairness.givers >= fairness.takers;
        const tile = (val, label, color) => (
          <div style={{ flex: "1 1 90px", textAlign: "center", padding: "12px 8px", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10 }}>
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 10, color: c.textMuted, marginTop: 6 }}>{label}</div>
          </div>
        );
        return (
          <Card className="fade-up-d3" style={{ marginTop: 20, border: `1px solid ${c.borderGold}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: c.gold, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                <span style={{ fontSize: 13 }}>⚖</span> Fairness · admin only
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: healthy ? c.verified : c.flagged, background: (healthy ? c.verified : c.flagged) + "18", border: `1px solid ${(healthy ? c.verified : c.flagged)}40`, borderRadius: 20, padding: "4px 12px" }}>
                {healthy ? "🔓 Open pool — healthy" : "⚠ Locking risk — takers ahead"}
              </span>
            </div>

            {/* the "doomsday" meter — how far from the tipping point */}
            <div style={{ position: "relative", height: 12, borderRadius: 7, background: c.flagged + "2A", overflow: "hidden", marginBottom: 6 }}>
              <div style={{ width: `${giverPct}%`, height: "100%", background: `linear-gradient(90deg, ${c.verified}, ${healthy ? c.verified : c.flagged})`, transition: "width 0.4s" }} />
              <div style={{ position: "absolute", left: "50%", top: -2, bottom: -2, width: 2, background: c.text, opacity: 0.5 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: c.textMuted, marginBottom: 18 }}>
              <span style={{ color: c.verified }}>◀ givers</span>
              <span>tipping point</span>
              <span style={{ color: c.flagged }}>takers ▶</span>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
              {tile(fairness.givers, "givers (give ≥ get)", c.verified)}
              {tile(fairness.takers, "takers (get > give)", c.flagged)}
              {tile(fairness.totalGiven, "reviews given", c.text)}
              {tile(fairness.totalReceived, "reviews received", c.text)}
            </div>

            {fairness.watchlist?.length > 0 && (
              <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 10 }}>Taking more than giving — watch if this list grows:</div>
                {fairness.watchlist.map((w, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, color: c.text, padding: "5px 0", borderTop: i > 0 ? `1px solid ${c.border}` : "none" }}>
                    <span>{w.name}</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11.5, color: c.textMuted }}>gave <strong style={{ color: c.textSub }}>{w.given}</strong> · got <strong style={{ color: c.pending }}>{w.received}</strong></span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, color: c.textMuted, marginTop: 14, lineHeight: 1.6 }}>
              Members see an "Open pool status" meter with the same message: <strong style={{ color: c.textSub }}>give reviews or the exchange locks to strict one-for-one.</strong> If takers ever pull ahead, add soft reciprocity (give-weighted pool priority) before flipping the switch.
            </div>
          </Card>
        );
      })()}
    </>
  );
}
