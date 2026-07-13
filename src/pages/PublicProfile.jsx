import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../tokens/theme";
import { useAppState } from "../state";
import { BADGE_DEFS } from "../data/mock";
import { getMember } from "../data/api";
import SealMark from "../components/SealMark";
import Loader from "../components/Loader";
import BadgeIcon from "../components/BadgeIcon";
import ProductIcon from "../components/ProductIcon";
import { Card, GhostButton, StatBar } from "../components/ui";

const openUrl = (url) => url && window.open(/^https?:\/\//.test(url) ? url : `https://${url}`, "_blank", "noopener");

const maskName = (name) => {
  const parts = name.split(" ");
  return parts.map(p => p.length <= 2 ? p : p[0] + "•".repeat(Math.min(p.length - 2, 4)) + p[p.length - 1]).join(" ");
};
const maskEmail = (email) => {
  const [user, domain] = email.split("@");
  return user[0] + "•••@•••." + domain.split(".").pop();
};

export default function PublicProfile() {
  const { c } = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const { leaderboard, useMock } = useAppState();
  const [member, setMember] = useState(null);

  useEffect(() => {
    if (!useMock) getMember(id).then(setMember).catch(() => setMember(undefined));
  }, [id, useMock]);

  let p, shares, email, displayName;
  if (useMock) {
    p = leaderboard.find(l => String(l.rank) === id) || leaderboard[0];
    /* Simulate each user's privacy choice — Priya shares everything, others mask */
    shares = p.rank === 1 ? { showName: true, showEmail: true, showPhoto: true } : { showName: p.rank % 2 === 0, showEmail: false, showPhoto: p.rank % 2 === 0 };
    email = p.name.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "") + "@gmail.com";
    displayName = shares.showName ? p.name : maskName(p.name);
    p.products = [
      { productId: "mp1", name: "CommentIQ", platform: "Chrome Web Store", category: "Chrome Extension", icon: null, url: "chromewebstore.google.com/detail/commentiq", reviews: 4 },
      { productId: "mp2", name: "FloatDeck", platform: "Chrome Web Store", category: "Chrome Extension", icon: null, url: "chromewebstore.google.com/detail/floatdeck", reviews: 2 },
    ];
  } else {
    if (member === null) return <Loader label="Loading member…" />;
    if (member === undefined) return <div style={{ padding: 48, textAlign: "center", color: c.textMuted, fontSize: 14 }}>Member not found.</div>;
    /* server already masked what the member keeps private */
    p = {
      rank: leaderboard.find(r => r.userId === member.userId)?.rank ?? "—",
      name: member.name,
      given: member.given, received: member.received, verified: member.verifiedGiven,
      score: member.trustScore, streak: 0,
      category: member.categories?.[0] ?? "Developer",
      badges: member.badges ?? [],
    };
    shares = { showName: member.nameShared, showEmail: member.emailShared, showPhoto: member.photoShared };
    email = member.email; // pre-masked server-side unless shared
    displayName = member.name;
    p.avatarData = member.avatarData; // null unless the member shares it
    p.products = member.products ?? [];
  }
  const maskedEmail = useMock ? (shares.showEmail ? email : maskEmail(email)) : email;

  return (
    <>
      <div className="fade-up" style={{ marginBottom: 24 }}>
        <GhostButton size="sm" onClick={() => navigate("/app/leaderboard")}>← Back to leaderboard</GhostButton>
      </div>

      {/* Hero card */}
      <Card className="fade-up-d1" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ height: 110, background: `linear-gradient(135deg, ${c.goldGlow}, transparent 60%), radial-gradient(circle at 80% 20%, rgba(201,168,76,0.12), transparent 50%)`, borderBottom: `1px solid ${c.border}`, position: "relative" }}>
          <div style={{ position: "absolute", right: 24, top: 20, opacity: 0.15 }}><SealMark size={72} animated gold={c.gold} /></div>
          <div style={{ position: "absolute", left: 32, top: 24, fontSize: 11, color: c.gold, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>Reviewer profile · Rank #{p.rank}</div>
        </div>
        <div className="wrap-sm" style={{ padding: "0 32px 28px", display: "flex", gap: 24, alignItems: "flex-end", marginTop: -44 }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: 96, height: 96, borderRadius: "50%",
              background: `linear-gradient(135deg, ${c.gold}35, ${c.gold}70)`,
              border: `3px solid ${c.surface}`, boxShadow: `0 0 0 1px ${c.borderGold}, 0 8px 32px rgba(0,0,0,0.3)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 34, fontWeight: 700, color: c.gold, fontFamily: "Playfair Display, serif",
            }}>
              {shares.showPhoto && p.avatarData
                ? <div style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundImage: `url(${p.avatarData})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                : (displayName[0] || "?")}
            </div>
            <div style={{ position: "absolute", bottom: -4, right: -4 }}><SealMark size={32} gold={c.gold} /></div>
          </div>
          <div style={{ flex: 1, paddingBottom: 6 }}>
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 700, color: c.text, display: "flex", alignItems: "center", gap: 10 }}>
              {displayName}
              {!shares.showName && <span title="This member keeps their name private" style={{ fontSize: 12, color: c.textMuted, cursor: "help" }}>🔒</span>}
            </h1>
            <div style={{ fontSize: 13, color: c.textMuted, marginTop: 4, fontFamily: "JetBrains Mono, monospace" }}>
              {maskedEmail}
              {!shares.showEmail && <span title="Email hidden by member's choice" style={{ marginLeft: 6, cursor: "help" }}>🔒</span>}
            </div>
            <div style={{ fontSize: 12, color: c.textMuted, marginTop: 6 }}>{p.category} developer · {p.streak}-week streak</div>
          </div>
          <div style={{ textAlign: "center", paddingBottom: 6 }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 30, fontWeight: 500, color: c.gold, letterSpacing: "-0.02em" }}>★ {p.score}</div>
            <div style={{ fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Trust Score</div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <StatBar className="fade-up-d2" style={{ marginBottom: 20 }} items={[
        { label: "Reviews given", value: String(p.given) },
        { label: "Reviews received", value: String(p.received) },
        { label: "Verified", value: String(p.verified), sub: `${Math.round((p.verified / Math.max(p.given, 1)) * 100)}% of given` },
        { label: "Give/get ratio", value: (p.given / Math.max(p.received, 1)).toFixed(1) },
      ]} />

      {/* Products this member has listed (public), with reviews each has received */}
      {p.products?.length > 0 && (
        <Card className="fade-up-d2" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
            {displayName.split(" ")[0]}'s products <span style={{ color: c.textMuted, fontFamily: "JetBrains Mono, monospace" }}>{p.products.length}</span>
          </div>
          {p.products.map((prod, i) => (
            <div key={prod.productId} onClick={() => openUrl(prod.url)} title="Open the store listing"
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderTop: i > 0 ? `1px solid ${c.border}` : "none", cursor: prod.url ? "pointer" : "default" }}>
              <ProductIcon name={prod.name} icon={prod.icon} size={40} radius={10} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prod.name}</div>
                <div style={{ fontSize: 11, color: c.textMuted }}>{prod.category ? `${prod.category} · ` : ""}{prod.platform}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: c.gold, fontFamily: "JetBrains Mono, monospace" }}>{prod.reviews}</div>
                <div style={{ fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>review{prod.reviews === 1 ? "" : "s"}</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Badge trophy case */}
      <Card className="fade-up-d3">
        <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>Badge collection</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {p.badges.map((b, i) => (
            <div key={b} className={`fade-up-d${Math.min(i + 1, 3)}`} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              padding: "24px 28px", borderRadius: 16, minWidth: 140,
              background: `linear-gradient(160deg, ${c.goldGlow}, ${c.bg})`,
              border: `1px solid ${c.borderGold}`,
              boxShadow: "0 0 24px rgba(201,168,76,0.06)",
            }}>
              <div className="float" style={{ animationDelay: `${i * 0.4}s` }}>
                <BadgeIcon type={b} size={44} gold={c.gold} showTooltip={false} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.gold, textAlign: "center" }}>{BADGE_DEFS[b].name}</div>
              <div style={{ fontSize: 10, color: c.textMuted, textAlign: "center", lineHeight: 1.5, maxWidth: 120 }}>{BADGE_DEFS[b].desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, padding: "12px 16px", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, fontSize: 12, color: c.textMuted, lineHeight: 1.6 }}>
          🔒 This member controls what's visible here. Name and photo are shown by default; email is masked unless they've chosen to share it.
        </div>
      </Card>
    </>
  );
}
