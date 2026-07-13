import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../tokens/theme";
import { useAppState } from "../state";
import { BADGE_DEFS } from "../data/mock";
import SealMark from "../components/SealMark";
import BadgeIcon from "../components/BadgeIcon";
import StateBadge from "../components/StateBadge";
import SearchBox from "../components/SearchBox";
import { Card, GhostButton, StatBar } from "../components/ui";

export default function Profile() {
  const { c } = useTheme();
  const { account, history, stats, badges } = useAppState();
  // Give/get ratio is given ÷ received. With 0 received it's undefined — show ∞
  // when you've given but received nothing yet (great for ranking), else "—".
  const ratio = stats.received > 0 ? (stats.given / stats.received).toFixed(1) : (stats.given > 0 ? "∞" : "—");
  const ratioSub = stats.received > 0 ? "givers rank higher" : (stats.given > 0 ? "all give, no get yet" : "givers rank higher");
  const ratioTip = stats.received > 0
    ? "Reviews given ÷ reviews received. Giving more than you receive keeps it high — and lifts your Trust Score and rank."
    : (stats.given > 0
        ? "You've given reviews but received none yet, so the ratio is effectively infinite (∞) — the best it can be. It'll show a number once your products start getting reviewed."
        : "Reviews given ÷ reviews received. It appears once you've given or received a review.");
  const [historySearch, setHistorySearch] = useState("");
  const filteredHistory = history.filter(r => !historySearch ||
    r.product.toLowerCase().includes(historySearch.toLowerCase()) ||
    (r.developer || "").toLowerCase().includes(historySearch.toLowerCase()));
  const navigate = useNavigate();
  return (
    <>
      <div className="fade-up wrap-sm" style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 36 }}>
        <div style={{ position: "relative" }}>
          {account.avatar
            ? <div style={{ width: 88, height: 88, borderRadius: "50%", backgroundImage: `url(${account.avatar})`, backgroundSize: "cover", backgroundPosition: "center", border: `2px solid ${c.borderGold}` }} />
            : <div style={{ width: 88, height: 88, borderRadius: "50%", background: `linear-gradient(135deg, ${c.gold}30, ${c.gold}70)`, border: `2px solid ${c.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700, color: c.gold, fontFamily: "Playfair Display, serif" }}>{account.name[0]}</div>}
          <div style={{ position: "absolute", bottom: -6, right: -6 }}><SealMark size={34} gold={c.gold} /></div>
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 30, fontWeight: 700, color: c.text }}>{account.name}</h1>
          <div style={{ fontSize: 13, color: c.textMuted, marginTop: 4 }}>Member since July 2026 · tapdot.org</div>
          <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
            {badges.map(b => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 6, background: c.goldGlow, border: `1px solid ${c.borderGold}`, borderRadius: 12, padding: "5px 12px" }}>
                <BadgeIcon type={b} size={16} gold={c.gold} />
                <span style={{ fontSize: 11, fontWeight: 600, color: c.gold }}>{BADGE_DEFS[b].name}</span>
              </div>
            ))}
          </div>
        </div>
        <GhostButton size="sm" onClick={() => navigate("/app/settings")}>Edit profile</GhostButton>
      </div>

      <StatBar className="fade-up-d1" style={{ marginBottom: 28 }} items={[
        { label: "Reviews given", value: String(stats.given) },
        { label: "Reviews received", value: String(stats.received) },
        { label: "Trust Score", value: `★ ${account.score}`, color: c.gold },
        { label: "Give/get ratio", value: ratio, sub: ratioSub, tip: ratioTip },
      ]} />

      <Card className="fade-up-d2" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em" }}>Earned badges</div>
          <span style={{ fontSize: 11, color: c.textMuted, fontFamily: "JetBrains Mono, monospace" }}>{badges.length} of {Object.keys(BADGE_DEFS).length}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {badges.filter(id => BADGE_DEFS[id]).map(id => (
            <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8, padding: "18px 12px", borderRadius: 12, background: c.goldGlow, border: `1px solid ${c.borderGold}` }}>
              <BadgeIcon type={id} size={30} gold={c.gold} showTooltip={false} />
              <div style={{ fontSize: 12, fontWeight: 700, color: c.gold }}>{BADGE_DEFS[id].name}</div>
              <div style={{ fontSize: 10, color: c.textMuted, lineHeight: 1.5 }}>{BADGE_DEFS[id].desc}</div>
            </div>
          ))}
          {badges.length === 0 && <div style={{ gridColumn: "1 / -1", fontSize: 13, color: c.textMuted, padding: "8px 0" }}>No badges yet — your first verified review earns First Ink.</div>}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "26px 0 14px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: c.textSub, textTransform: "uppercase", letterSpacing: "0.08em" }}>Still to earn</div>
          <span style={{ fontSize: 11, color: c.textMuted, fontFamily: "JetBrains Mono, monospace" }}>{Object.keys(BADGE_DEFS).length - badges.length}</span>
        </div>
        {["Milestones", "Volume", "Quality", "Speed & Streaks", "Community", "Explorer"].map(group => {
          const pending = Object.entries(BADGE_DEFS).filter(([id, b]) => b.group === group && !badges.includes(id));
          if (!pending.length) return null;
          return (
            <div key={group} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{group}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
                {pending.map(([id, b]) => (
                  <div key={id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 10, background: c.bg, border: `1px solid ${c.border}`, opacity: 0.75 }}>
                    <BadgeIcon type={id} size={24} gold={c.textMuted} showTooltip={false} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: c.textSub }}>{b.name}</div>
                      <div style={{ fontSize: 10, color: c.textMuted, lineHeight: 1.45 }}>{b.how}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Card>

      <Card className="fade-up-d3">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em" }}>Review history</div>
          <span style={{ fontSize: 11, color: c.textMuted }}>{history.length} total</span>
        </div>
        {history.length > 5 && (
          <SearchBox value={historySearch} onChange={e => setHistorySearch(e.target.value)} placeholder="Search by product or developer…" />
        )}
        {filteredHistory.map((r, i) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < filteredHistory.length - 1 ? `1px solid ${c.border}` : "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: c.gold }}>{r.product[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{r.product}</div>
              <div style={{ fontSize: 12, color: c.textMuted }}>{r.developer ? `by ${r.developer} · ` : ""}{r.time}</div>
            </div>
            {r.rating && <span style={{ fontSize: 12, color: c.gold, fontWeight: 600 }}>rated ★ {r.rating}</span>}
            <StateBadge state={r.state} />
          </div>
        ))}
        {history.length === 0 && <div style={{ fontSize: 13, color: c.textMuted, padding: "8px 0" }}>No reviews yet — your first assignment starts the story.</div>}
        {history.length > 0 && filteredHistory.length === 0 && <div style={{ fontSize: 13, color: c.textMuted, padding: "8px 0" }}>No reviews match “{historySearch}”.</div>}
      </Card>
    </>
  );
}
