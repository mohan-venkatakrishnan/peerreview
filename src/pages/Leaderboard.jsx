import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../tokens/theme";
import { useAppState } from "../state";
import SealMark from "../components/SealMark";
import BadgeIcon from "../components/BadgeIcon";
import SearchBox from "../components/SearchBox";
import ParallaxBackdrop from "../components/ParallaxBackdrop";
import { Card, GoldButton, PageTitle } from "../components/ui";

/* Shared table — used by both the in-app and public leaderboard pages */
export function LeaderTable({ showFilters = true, limit }) {
  const { c } = useTheme();
  const navigate = useNavigate();
  const { leaderboard } = useAppState();
  const [lbCategory, setLbCategory] = useState("All");
  const [lbSort, setLbSort] = useState("trust");
  const [lbSearch, setLbSearch] = useState("");

  const cats = ["All", ...new Set(leaderboard.map(l => l.category))];
  let rows = leaderboard
    .filter(l => lbCategory === "All" || l.category === lbCategory)
    .filter(l => !lbSearch || l.name.toLowerCase().includes(lbSearch.toLowerCase()));
  rows = [...rows].sort((a, b) =>
    lbSort === "volume" ? b.given - a.given :
    lbSort === "verified" ? b.verified - a.verified :
    b.score - a.score
  );
  if (limit) rows = rows.slice(0, limit);

  return (
    <>
      {showFilters && (
        <div className="fade-up-d1" style={{ marginBottom: 16 }}>
          <SearchBox value={lbSearch} onChange={e => setLbSearch(e.target.value)} placeholder="Search reviewers…" />
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {cats.map(cat => (
                <button key={cat} onClick={() => setLbCategory(cat)}
                  style={{
                    background: lbCategory === cat ? c.goldGlow : "transparent",
                    border: `1px solid ${lbCategory === cat ? c.gold : c.border}`,
                    color: lbCategory === cat ? c.gold : c.textMuted,
                    borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                  }}>{cat}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: 3 }}>
              {[["trust", "Trust Score"], ["volume", "Volume"], ["verified", "Verified"]].map(([id, label]) => (
                <button key={id} onClick={() => setLbSort(id)}
                  style={{
                    background: lbSort === id ? c.goldGlow : "transparent",
                    border: lbSort === id ? `1px solid ${c.borderGold}` : "1px solid transparent",
                    color: lbSort === id ? c.gold : c.textMuted,
                    borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                  }}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      <Card className="fade-up-d1" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${c.border}`, display: "flex", gap: 8, alignItems: "center" }}>
          <SealMark size={20} gold={c.gold} />
          <span style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Top reviewers — {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
          {rows[0]?.sample && (
            <span style={{ fontSize: 10, fontWeight: 600, color: c.pending, background: c.pending + "16", border: `1px solid ${c.pending}30`, borderRadius: 8, padding: "2px 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sample — the launch cohort appears here</span>
          )}
          <span style={{ marginLeft: "auto", fontSize: 11, color: c.textMuted }}>{rows.length} reviewers</span>
        </div>
        {rows.length === 0 && <div style={{ padding: 32, textAlign: "center", fontSize: 13, color: c.textMuted }}>No reviewers match your filters.</div>}
        {rows.map((item, i) => (
          <div key={item.rank} onClick={() => { if (!item.sample) navigate(`/app/member/${item.userId ?? item.rank}`); }}
            title={item.sample ? "Sample member — profiles open once real reviewers join" : undefined}
            style={{
              padding: "16px 24px", borderBottom: i < rows.length - 1 ? `1px solid ${c.border}` : "none",
              display: "flex", alignItems: "center", gap: 16, cursor: item.sample ? "default" : "pointer", transition: "background 0.15s",
              background: item.isYou ? c.goldGlow : i === 0 ? `linear-gradient(90deg, ${c.goldGlow}, transparent)` : "transparent",
              borderLeft: item.isYou ? `2px solid ${c.gold}` : "2px solid transparent",
            }}
            onMouseEnter={e => { if (!item.isYou && !item.sample) e.currentTarget.style.background = c.surfaceHover; }}
            onMouseLeave={e => { if (!item.isYou) e.currentTarget.style.background = i === 0 ? `linear-gradient(90deg, ${c.goldGlow}, transparent)` : "transparent"; }}>
            <span style={{ width: 28, fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 600, color: i < 3 ? c.gold : c.textMuted }}>#{item.rank}</span>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${c.gold}30, ${c.gold}60)`, border: `1px solid ${c.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: c.gold }}>{item.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: item.isYou ? c.gold : c.text }}>{item.name}</span>
                <span style={{ display: "flex", gap: 4 }}>
                  {item.badges.map(b => <BadgeIcon key={b} type={b} size={17} gold={c.gold} />)}
                </span>
              </div>
              <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{item.category} · {item.given} given · {item.verified} verified · {item.streak}-wk streak</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: c.gold }}>
                {lbSort === "volume" ? item.given : lbSort === "verified" ? item.verified : `★ ${item.score}`}
              </div>
              <div style={{ fontSize: 10, color: c.textMuted }}>{lbSort === "volume" ? "given" : lbSort === "verified" ? "verified" : "trust"}</div>
            </div>
          </div>
        ))}
        {rows[0]?.sample && (
          <div className="sample-note" style={{ padding: "12px 24px", borderTop: `1px solid ${c.border}`, fontSize: 11, color: c.textMuted, lineHeight: 1.6 }}>
            These are sample members showing how the leaderboard works — they'll be removed once enough real reviewers have joined. Sample profiles can't be opened.
          </div>
        )}
      </Card>
    </>
  );
}

/* /app/leaderboard */
export default function Leaderboard() {
  return (
    <>
      <PageTitle eyebrow="Community" title="Leaderboard" sub="Reputation is earned through verified reviews — not volume alone." />
      <LeaderTable />
    </>
  );
}

/* /leaderboard — public */
export function LeaderboardPublic() {
  const { c, isDark } = useTheme();
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", padding: "100px 24px 60px", position: "relative", overflow: "hidden" }}>
      <ParallaxBackdrop />
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: isDark ? "rgba(5,9,26,0.92)" : "rgba(250,250,247,0.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${c.border}`, padding: "0 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/")}>
            <SealMark size={26} gold={c.gold} />
            <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 600, fontSize: 17, color: c.text }}>PeerReview</span>
          </div>
          <GoldButton size="sm" onClick={() => navigate("/signin")}>Join the exchange</GoldButton>
        </div>
      </nav>
      <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 40, fontWeight: 700, color: c.text, marginBottom: 10 }}>The community leaderboard</h1>
          <p style={{ fontSize: 15, color: c.textMuted }}>Public proof that genuine reviewing pays off.</p>
        </div>
        <LeaderTable />
      </div>
    </div>
  );
}
