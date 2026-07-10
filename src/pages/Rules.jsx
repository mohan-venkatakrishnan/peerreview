import { useTheme } from "../tokens/theme";
import { BADGE_DEFS } from "../data/mock";
import SealMark from "../components/SealMark";
import BadgeIcon from "../components/BadgeIcon";
import StateBadge from "../components/StateBadge";
import { Card, PageTitle } from "../components/ui";

const VERIFY_CRITERIA = [
  "It exists at the link you submitted, on the product's real platform",
  "It's written in your own words about this product — not generic praise that fits anything",
  "It says something concrete: what worked, what didn't, what you'd change",
  "It reflects genuine use — you actually opened and tried the product",
];

const FLAG_CRITERIA = [
  "The link is dead, or points to someone else's review",
  "Rating-only, or copy-paste boilerplate with nothing specific to the product",
  "Written without using the product",
  "Asks for anything in return (\"5 stars if you 5-star mine\") — instant flag",
];

const BADGE_RULES = {
  crown: "Finish a calendar month ranked #1 on the leaderboard.",
  flame: "Complete an assignment every week for 8+ weeks in a row.",
  shield: "Keep 95% or more of your reviews verified (minimum 10 given).",
  bolt: "Consistently submit your review within 24 hours of assignment.",
  gem: "Earn repeated 5★ ratings from product owners for detailed reviews.",
  seal: "Be part of the first launch cohort. Once it's gone, it's gone.",
};

export default function Rules() {
  const { c } = useTheme();
  return (
    <>
      <PageTitle eyebrow="Rules & Badges" title="How the exchange works"
        sub="Short version: give one genuine review, get one back, and everything is verified by a real person." />

      {/* The exchange */}
      <Card className="fade-up-d1" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>The one-for-one exchange</div>
        {[
          ["Strict one-for-one", "Every review you give earns exactly one review credit. One credit = one person assigned to review your product. No stockpiling, no shortcuts."],
          ["Real listings only", "Products must have a live listing on a supported platform. Reviews are written there — on the store or launch page — because that's where they're useful."],
          ["Deadlines matter", "Assignments are due in 7 days. Skipping is allowed occasionally; letting assignments expire repeatedly pauses new matches."],
          ["Owners verify by hand", "The product owner reads your review on the platform and marks it Verified or Flagged. Nothing is auto-approved."],
        ].map(([title, desc], i, arr) => (
          <div key={title} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: i < arr.length - 1 ? `1px solid ${c.border}` : "none" }}>
            <span style={{ color: c.gold, fontSize: 14, lineHeight: 1.5 }}>✦</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 3 }}>{title}</div>
              <div style={{ fontSize: 13, color: c.textMuted, lineHeight: 1.65 }}>{desc}</div>
            </div>
          </div>
        ))}
      </Card>

      {/* Verified vs flagged */}
      <div className="fade-up-d2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ marginBottom: 14 }}><StateBadge state="verified" /></div>
          <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 10 }}>What earns Verified</div>
          {VERIFY_CRITERIA.map(t => (
            <div key={t} style={{ display: "flex", gap: 10, fontSize: 13, color: c.textSub, lineHeight: 1.6, padding: "5px 0" }}>
              <span style={{ color: c.verified }}>✓</span>{t}
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ marginBottom: 14 }}><StateBadge state="flagged" /></div>
          <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 10 }}>What gets Flagged</div>
          {FLAG_CRITERIA.map(t => (
            <div key={t} style={{ display: "flex", gap: 10, fontSize: 13, color: c.textSub, lineHeight: 1.6, padding: "5px 0" }}>
              <span style={{ color: c.flagged }}>⚑</span>{t}
            </div>
          ))}
          <div style={{ marginTop: 12, fontSize: 12, color: c.textMuted, lineHeight: 1.6 }}>
            Flagged reviews earn no credit. Repeated flags lower your Trust Score and can remove you from the pool.
          </div>
        </Card>
      </div>

      {/* Trust Score */}
      <Card className="fade-up-d2" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <SealMark size={36} gold={c.gold} />
          <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em" }}>Trust Score</div>
        </div>
        <p style={{ fontSize: 13, color: c.textSub, lineHeight: 1.7, marginBottom: 16 }}>
          Your Trust Score (out of 5) is the reputation number next to your name — on the leaderboard, on your profile, and beside every review you leave. It moves with three things:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            ["Verified reviews", "Every review verified by an owner builds your score. Flags pull it down."],
            ["Give / get ratio", "Givers are rewarded. Reviewing more than you receive keeps your ratio — and score — healthy."],
            ["Owner ratings", "Owners rate the helpfulness of your review (1–5★) when verifying it. Detail pays."],
          ].map(([t, d]) => (
            <div key={t} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.gold, marginBottom: 6 }}>{t}</div>
              <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.6 }}>{d}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Badges */}
      <Card className="fade-up-d3" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Badges — how to earn each one</div>
        <p style={{ fontSize: 12, color: c.textMuted, marginBottom: 18, lineHeight: 1.6 }}>Badges show on your profile and next to your name on the leaderboard.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {Object.entries(BADGE_DEFS).map(([id, b]) => (
            <div key={id} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: 16 }}>
              <BadgeIcon type={id} size={34} gold={c.gold} showTooltip={false} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.gold }}>{b.name}</div>
                <div style={{ fontSize: 12, color: c.textSub, marginTop: 4, lineHeight: 1.6 }}>{BADGE_RULES[id]}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Fair play */}
      <Card className="fade-up-d3" style={{ background: `linear-gradient(160deg, ${c.goldGlow}, ${c.surface})`, border: `1px solid ${c.borderGold}` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Fair play</div>
        <p style={{ fontSize: 13, color: c.textSub, lineHeight: 1.7 }}>
          PeerReview exchanges genuine feedback — it never buys, sells, or requires ratings. Say what you honestly think, including criticism: a thoughtful 3★ review gets verified; an empty 5★ one gets flagged. Store policies prohibit incentivised ratings, and so do we.
        </p>
      </Card>
    </>
  );
}
