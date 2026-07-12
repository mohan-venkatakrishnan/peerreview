import { useEffect, useRef, useState } from "react";
import { useTheme } from "../tokens/theme";
import { useAppState } from "../state";
import BadgeIcon, { BADGE_DEFS } from "./BadgeIcon";

/* Celebrates a newly-earned badge once per badge per user, in the empty space
   on the right, vertically centered. "Seen" badges are remembered in
   localStorage keyed by user, so the animation never repeats. */
const storageKey = (uid) => `peerreview-celebrated-${uid || "anon"}`;
const loadSeen = (uid) => {
  try { return new Set(JSON.parse(localStorage.getItem(storageKey(uid)) || "[]")); }
  catch { return new Set(); }
};

export default function BadgeCelebration() {
  const { c } = useTheme();
  const { account, badges } = useAppState();
  const uid = account?.id;
  const seenRef = useRef(null);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [leaving, setLeaving] = useState(false);

  // Enqueue any badge we haven't celebrated yet; mark it seen immediately so a
  // background poll re-delivering the same list can't queue it twice.
  useEffect(() => {
    if (!uid || !Array.isArray(badges)) return;
    if (!seenRef.current) seenRef.current = loadSeen(uid);
    const fresh = badges.filter(b => BADGE_DEFS[b] && !seenRef.current.has(b));
    if (!fresh.length) return;
    fresh.forEach(b => seenRef.current.add(b));
    localStorage.setItem(storageKey(uid), JSON.stringify([...seenRef.current]));
    setQueue(q => [...q, ...fresh]);
  }, [uid, badges]);

  // Show one at a time.
  useEffect(() => {
    if (current || !queue.length) return;
    setLeaving(false);
    setCurrent(queue[0]);
    setQueue(q => q.slice(1));
  }, [queue, current]);

  const dismiss = () => { setLeaving(true); setTimeout(() => { setCurrent(null); setLeaving(false); }, 380); };

  useEffect(() => {
    if (!current) return;
    const t1 = setTimeout(() => setLeaving(true), 4400);
    const t2 = setTimeout(() => { setCurrent(null); setLeaving(false); }, 4820);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [current]);

  if (!current) return null;
  const def = BADGE_DEFS[current] ?? { name: current, desc: "" };

  return (
    <div style={{ position: "fixed", right: 20, top: "50%", transform: "translateY(-50%)", zIndex: 120, pointerEvents: "none" }}>
      <div className={`badge-pop badge-pulse${leaving ? " leaving" : ""}`} onClick={dismiss}
        style={{ width: 194, background: c.surface, border: `1px solid ${c.gold}`, borderRadius: 16, padding: "22px 18px 20px", textAlign: "center", pointerEvents: "auto", cursor: "pointer" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: c.gold, textTransform: "uppercase", marginBottom: 14 }}>Badge earned</div>
        <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 14px", display: "grid", placeItems: "center" }}>
          <svg className="badge-ring" width="96" height="96" viewBox="0 0 96 96" style={{ position: "absolute", inset: 0 }}>
            <circle cx="48" cy="48" r="44" fill="none" stroke={c.gold} strokeWidth="1.5" strokeDasharray="4 5" opacity="0.5" />
            <circle cx="48" cy="48" r="35" fill="none" stroke={c.gold} strokeWidth="1" opacity="0.25" />
          </svg>
          <div className="stamp-in" style={{ display: "grid", placeItems: "center" }}>
            <BadgeIcon type={current} size={52} gold={c.gold} showTooltip={false} />
          </div>
        </div>
        <div style={{ fontFamily: "Playfair Display, serif", fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 5, lineHeight: 1.2 }}>{def.name}</div>
        <div style={{ fontSize: 11.5, color: c.textMuted, lineHeight: 1.5 }}>{def.desc}</div>
        <div style={{ fontSize: 10, color: c.textMuted, marginTop: 12, opacity: 0.7 }}>tap to dismiss</div>
      </div>
    </div>
  );
}
