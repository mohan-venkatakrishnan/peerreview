import { useState, useEffect } from "react";
import { useTheme } from "../tokens/theme";
import { useAppState } from "../state";
import SealMark from "./SealMark";
import { GoldButton, GhostButton } from "./ui";

const FORMSPREE = "https://formspree.io/f/xlgqeggb";
const TYPES = [
  { id: "bug", label: "Bug", icon: "🐞", ph: "What went wrong? Steps to reproduce help a lot." },
  { id: "idea", label: "Idea", icon: "💡", ph: "What would make PeerReview better?" },
  { id: "help", label: "General help", icon: "✦", ph: "What do you need a hand with?" },
];

export default function FeedbackModal({ open, onClose }) {
  const { c } = useTheme();
  const { account } = useAppState();
  const [type, setType] = useState("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  // fresh each time it opens
  useEffect(() => {
    if (open) { setType("bug"); setMessage(""); setEmail(account?.email || ""); setError(null); setSent(false); setBusy(false); }
  }, [open, account?.email]);

  if (!open) return null;
  const active = TYPES.find(t => t.id === type);
  const ready = message.trim().length >= 3;

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(FORMSPREE, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, message, category: active.label, _subject: `PeerReview ${active.label}: ${message.slice(0, 60)}` }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b?.errors?.[0]?.message || "Couldn't send just now — please try again.");
      }
      setSent(true);
    } catch (e) {
      setError(e.message || "Couldn't send just now — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)", display: "grid", placeItems: "center", padding: 20, animation: "overlayIn 0.2s ease" }}>
      <div onClick={e => e.stopPropagation()} className="fade-up" style={{ width: "100%", maxWidth: 460, background: c.surface, border: `1px solid ${c.borderGold}`, borderRadius: 16, padding: 26, boxShadow: "0 24px 64px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" }}>
        {sent ? (
          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <div className="stamp-in" style={{ display: "inline-block", marginBottom: 16 }}><SealMark size={64} gold={c.gold} /></div>
            <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 8 }}>Thank you</h3>
            <p style={{ fontSize: 13.5, color: c.textMuted, lineHeight: 1.7, maxWidth: 340, margin: "0 auto 22px" }}>
              We got your {active.label.toLowerCase()} and we read every message. {email ? "We'll follow up if it needs a reply." : ""}
            </p>
            <GoldButton onClick={onClose}>Done</GoldButton>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: c.text }}>Send feedback</h3>
                <p style={{ fontSize: 12.5, color: c.textMuted, marginTop: 4 }}>Bugs, ideas, or a hand with something — all read by a real person.</p>
              </div>
              <button onClick={onClose} aria-label="Close" style={{ background: "transparent", border: "none", color: c.textMuted, fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 4 }}>×</button>
            </div>

            <div style={{ display: "flex", gap: 8, margin: "18px 0 16px" }}>
              {TYPES.map(t => (
                <button key={t.id} onClick={() => setType(t.id)}
                  style={{ flex: 1, background: type === t.id ? c.goldGlow : c.bg, border: `1px solid ${type === t.id ? c.gold : c.border}`, color: type === t.id ? c.gold : c.textSub, borderRadius: 10, padding: "9px 6px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>

            <textarea autoFocus value={message} onChange={e => setMessage(e.target.value)} placeholder={active.ph} rows={5}
              style={{ width: "100%", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 13.5, color: c.text, resize: "vertical", lineHeight: 1.6, marginBottom: 14 }} />

            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: c.textSub, marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em" }}>Your email <span style={{ color: c.textMuted, fontWeight: 400, textTransform: "none" }}>(optional — so we can reply)</span></label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email"
              style={{ width: "100%", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13.5, color: c.text, marginBottom: 16 }} />

            {error && <div className="fade-up" style={{ fontSize: 12.5, color: c.flagged, marginBottom: 14 }}>⚠ {error}</div>}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <GhostButton onClick={onClose}>Cancel</GhostButton>
              <GoldButton disabled={!ready || busy} onClick={submit}>{busy ? "Sending…" : "Send feedback"}</GoldButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
