import { useRef } from "react";
import { useTheme } from "../tokens/theme";
import { useAppState } from "../state";
import { ACCOUNTS, PLANS } from "../data/mock";
import { Card, PageTitle, GhostButton, Avatar, Input } from "../components/ui";

export default function Settings() {
  const { c } = useTheme();
  const { privacy, setPrivacy, account, updateProfile, switchAccount, matching, setMatching, signOut, useMock } = useAppState();
  const fileRef = useRef(null);

  const onPhotoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateProfile({ avatar: reader.result });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <>
      <PageTitle eyebrow="Account" title="Settings" />

      {/* Profile — name & photo */}
      <Card className="fade-up-d1" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>Profile</div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 22 }}>
          <Avatar account={account} size={64} fontSize={24} />
          <div style={{ display: "flex", gap: 10 }}>
            <GhostButton size="sm" onClick={() => fileRef.current?.click()}>Upload photo</GhostButton>
            {account.avatar && <GhostButton size="sm" onClick={() => updateProfile({ avatar: null })}>Remove</GhostButton>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPhotoPick} style={{ display: "none" }} />
        </div>
        <Input label="Display name" value={account.name} onChange={e => updateProfile({ name: e.target.value })} placeholder="Your name" />
        <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.6 }}>
          Signed in as <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{account.email}</span>. Your photo stays in this browser — and it's masked on your public profile unless you turn sharing on below.
        </div>
      </Card>

      {/* Accounts — mock list, or real sign-in controls */}
      <Card className="fade-up-d1" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>Accounts</div>
        {useMock ? (
          <>
            {ACCOUNTS.map(a => (
              <div key={a.id} onClick={() => switchAccount(a.id)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 10, border: `1px solid ${a.id === account.id ? c.gold : c.border}`, background: a.id === account.id ? c.goldGlow : "transparent", marginBottom: 10, cursor: "pointer", transition: "all 0.2s" }}>
                <Avatar account={a.id === account.id ? account : { ...a, avatar: null }} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: c.textMuted }}>{a.email} · {PLANS[a.plan].label} plan</div>
                </div>
                {a.id === account.id && <span style={{ fontSize: 12, color: c.verified, fontWeight: 600 }}>✓ Active</span>}
              </div>
            ))}
            <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.6 }}>Mock accounts — flip VITE_USE_MOCK=false for real Google sign-in.</div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 10, border: `1px solid ${c.gold}`, background: c.goldGlow, marginBottom: 12 }}>
              <Avatar account={account} size={34} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{account.name}</div>
                <div style={{ fontSize: 12, color: c.textMuted }}>{account.email} · {PLANS[account.plan]?.label ?? "Free"} plan</div>
              </div>
              <span style={{ fontSize: 12, color: c.verified, fontWeight: 600 }}>✓ Active</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <GhostButton size="sm" onClick={() => switchAccount()}>Switch Google account</GhostButton>
              <GhostButton size="sm" onClick={signOut}>Sign out</GhostButton>
            </div>
          </>
        )}
      </Card>
      <Card className="fade-up-d1" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>Matching preference</div>
        {[
          { id: "category", title: "Category match", desc: "Matched within your product category" },
          { id: "open", title: "Open match", desc: "Matched with anyone in the pool" },
        ].map(opt => (
          <div key={opt.id} onClick={() => setMatching(opt.id)}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 10, border: `1px solid ${matching === opt.id ? c.gold : c.border}`, background: matching === opt.id ? c.goldGlow : "transparent", marginBottom: 10, cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${matching === opt.id ? c.gold : c.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {matching === opt.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.gold }} />}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{opt.title}</div>
              <div style={{ fontSize: 12, color: c.textMuted }}>{opt.desc}</div>
            </div>
          </div>
        ))}
      </Card>

      <Card className="fade-up-d2" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Public profile privacy</div>
        <p style={{ fontSize: 12, color: c.textMuted, marginBottom: 16, lineHeight: 1.6 }}>Everything is masked by default. You choose what other members see when they visit your profile.</p>
        {[
          ["showName", "Show my full name", "Otherwise shown as M••••n"],
          ["showEmail", "Show my email", "Otherwise shown as m•••@•••.com"],
          ["showPhoto", "Show my profile photo", "Otherwise shown as ?"],
        ].map(([key, label, hint], i) => (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < 2 ? `1px solid ${c.border}` : "none" }}>
            <div>
              <div style={{ fontSize: 14, color: c.text }}>{label}</div>
              <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{hint}</div>
            </div>
            <div onClick={() => setPrivacy(pr => ({ ...pr, [key]: !pr[key] }))}
              style={{ width: 40, height: 22, borderRadius: 12, background: privacy[key] ? c.gold : c.border, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: privacy[key] ? 21 : 3, transition: "left 0.2s" }} />
            </div>
          </div>
        ))}
      </Card>

      <Card className="fade-up-d2" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>Notifications</div>
        {["New review assignment", "Review received on my product", "My review was verified", "Weekly digest"].map((n, i) => (
          <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < 3 ? `1px solid ${c.border}` : "none" }}>
            <span style={{ fontSize: 14, color: c.text }}>{n}</span>
            <div style={{ width: 40, height: 22, borderRadius: 12, background: i < 3 ? c.gold : c.border, position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: i < 3 ? 21 : 3, transition: "left 0.2s" }} />
            </div>
          </div>
        ))}
      </Card>

      <Card className="fade-up-d3" style={{ borderColor: c.flagged + "40" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.flagged, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Danger zone</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Delete account</div>
            <div style={{ fontSize: 12, color: c.textMuted }}>Removes your products, reviews, and reputation permanently.</div>
          </div>
          <button data-tip="Self-serve deletion ships before public launch. Until then, email mohan@tapdot.org and your account, products, and reviews are removed within 48h."
            style={{ background: "transparent", border: `1px solid ${c.flagged}50`, borderRadius: 8, padding: "8px 16px", color: c.flagged, fontSize: 13, fontWeight: 600, cursor: "not-allowed", opacity: 0.65 }}>Delete</button>
        </div>
      </Card>
    </>
  );
}
