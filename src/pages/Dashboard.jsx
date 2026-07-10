import { useNavigate } from "react-router-dom";
import { useTheme } from "../tokens/theme";
import { useAppState } from "../state";
import SealMark from "../components/SealMark";
import NavIcon from "../components/NavIcon";
import StateBadge from "../components/StateBadge";
import { Card, GoldButton, GhostButton, StatBar, TrustRing, MeterBar } from "../components/ui";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};
const today = () => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
const reviewSubmittedFromHistory = (history) => history.some(h => h.state === "pending" || h.state === "submitted");
const reviewSubmittedCopy = (pendingVerification) => pendingVerification
  ? "Your review is pending verification by the product owner. A new assignment lands soon."
  : "Nothing assigned right now — a product from the pool will land here soon.";

export default function Dashboard() {
  const { c } = useTheme();
  const { assigned, incoming, history, account, stats, products } = useAppState();
  const navigate = useNavigate();
  const awaiting = incoming.filter(r => r.state === "pending" || r.state === "submitted").length;
  const firstProduct = products[0];
  const verifiedRate = stats.given > 0 ? Math.round((stats.verified / stats.given) * 100) : null;

  return (
    <>
      {/* Header — greeting + trust ring */}
      <div className="fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: c.gold, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Dashboard · {today()}</div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 32, fontWeight: 700, color: c.text, letterSpacing: "-0.02em" }}>{greeting()}, {account.name}</h1>
          <p style={{ fontSize: 14, color: c.textMuted, marginTop: 8, lineHeight: 1.6 }}>Here's where your exchange stands.</p>
        </div>
        <TrustRing score={account.score} />
      </div>

      <StatBar className="fade-up-d1" style={{ marginBottom: 20 }} items={[
        { label: "Reviews given", value: String(stats.given) },
        { label: "Reviews received", value: String(stats.received) },
        { label: "Verified rate", value: verifiedRate === null ? "—" : `${verifiedRate}%`, sub: `${stats.verified} of ${stats.given} verified` },
        { label: "Leaderboard", value: stats.rank ? `#${stats.rank}` : "—", sub: stats.rank ? "keep giving to climb" : "review to get ranked" },
      ]} />

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        {/* Review queue */}
        <Card className="fade-up-d2" style={{ position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {assigned ? (
            <>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${c.gold}, transparent)` }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.1em" }}><NavIcon name="review" size={13} color={c.gold} /> Your review queue</div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 5 }}>Due in <span style={{ color: c.text, fontWeight: 600 }}>{assigned.deadline}</span></div>
                  <MeterBar pct={(5 / 7) * 100} style={{ width: 88, marginLeft: "auto" }} height={3} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: `linear-gradient(135deg, ${c.gold}25, ${c.gold}50)`, border: `1px solid ${c.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: c.gold, fontFamily: "Playfair Display, serif", fontWeight: 700 }}>{assigned.name[0]}</div>
                <div>
                  <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: c.text, lineHeight: 1.2 }}>{assigned.name}</h3>
                  <div style={{ fontSize: 12, color: c.textMuted, marginTop: 3 }}>{assigned.category} · {assigned.platform}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: c.textSub, lineHeight: 1.7, marginBottom: 18, flex: 1 }}>{assigned.description}</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <GoldButton onClick={() => navigate("/app/review")}>Start reviewing →</GoldButton>
                <span style={{ fontSize: 11, color: c.textMuted }}>by {assigned.developer}{assigned.devScore ? ` · ★ ${assigned.devScore}` : ""} — they verify your review</span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "28px 0" }}>
              <div className="stamp-in" style={{ display: "inline-block", marginBottom: 12 }}><SealMark size={48} gold={c.gold} /></div>
              <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>Queue clear</div>
              <p style={{ fontSize: 13, color: c.textMuted }}>{reviewSubmittedCopy(reviewSubmittedFromHistory(history))}</p>
            </div>
          )}
        </Card>

        {/* My product status */}
        <Card className="fade-up-d3" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 18 }}><NavIcon name="product" size={13} color={c.gold} /> Your product</div>
          {firstProduct ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${c.gold}25, ${c.gold}50)`, border: `1px solid ${c.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: c.gold, fontFamily: "Playfair Display, serif", fontWeight: 700 }}>{firstProduct.name[0]}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{firstProduct.name}</div>
                  <div style={{ fontSize: 11, color: c.textMuted }}>{firstProduct.platform}</div>
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: c.textMuted, marginBottom: 6 }}>
                  <span>Verified by you</span><span style={{ color: c.text, fontWeight: 600 }}>{firstProduct.verified} of {firstProduct.reviews}</span>
                </div>
                <MeterBar pct={firstProduct.reviews > 0 ? (firstProduct.verified / firstProduct.reviews) * 100 : 0} />
              </div>
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

      {/* Recent activity */}
      <Card className="fade-up-d3" style={{ marginTop: 20, padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: `1px solid ${c.border}` }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.1em" }}>Recent activity</span>
          <span onClick={() => navigate("/app/profile")} style={{ fontSize: 12, color: c.textMuted, cursor: "pointer" }}>Full history →</span>
        </div>
        {history.length === 0 && (
          <div style={{ padding: "24px", textAlign: "center", fontSize: 13, color: c.textMuted }}>No reviews yet — your first assignment starts the story.</div>
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
    </>
  );
}
