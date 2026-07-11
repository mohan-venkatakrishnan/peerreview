import { useTheme } from "../tokens/theme";
import SealMark from "./SealMark";

/* Deterministic star field — seeded LCG so positions never change between renders */
const rng = (seed) => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
const makeStars = (n, seed) => {
  const r = rng(seed);
  return Array.from({ length: n }, () => ({
    left: r() * 100, top: r() * 100,
    size: 5 + r() * 7, delay: r() * 5, dur: 2.5 + r() * 4,
    bright: r() > 0.62,
  }));
};
/* Three depth layers: far = many small slow, near = few large fast (parallax).
   Review stars (★/☆) — this is a review exchange, the sky is made of ratings. */
const STARS_FAR = makeStars(44, 11);
const STARS_MID = makeStars(26, 42);
const STARS_NEAR = makeStars(14, 87);

function StarLayer({ stars, drift, dur, gold, lite, scale = 1 }) {
  return (
    <div style={{ position: "absolute", inset: "-40px", animation: lite ? "none" : `${drift} ${dur}s ease-in-out infinite` }}>
      {stars.map((s, i) => (
        <span key={i} style={{
          position: "absolute", left: `${s.left}%`, top: `${s.top}%`,
          fontSize: s.size * scale, lineHeight: 1, color: gold,
          opacity: 0.3,
          textShadow: `0 0 ${s.bright ? 12 : 6}px ${gold}`,
          animation: lite ? "none" : `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite backwards`,
        }}>{s.bright ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

/* Ambient gold orbs + faint grid + watermark seal + twinkling star field.
   Pure CSS keyframes (drift1/2/3, twinkle) — never state-driven. */
export default function ParallaxBackdrop({ intensity = 1 }) {
  const { c, fx } = useTheme();
  const lite = fx === "lite";
  const anim = (name, dur) => (lite ? "none" : `${name} ${dur / intensity}s ease-in-out infinite`);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute", top: "8%", left: "6%", width: 460, height: 460,
        background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)",
        borderRadius: "50%", animation: anim("drift1", 18),
      }} />
      <div style={{
        position: "absolute", top: "45%", right: "4%", width: 340, height: 340,
        background: "radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)",
        borderRadius: "50%", animation: anim("drift2", 24),
      }} />
      <div style={{
        position: "absolute", bottom: "6%", left: "28%", width: 520, height: 240,
        background: "radial-gradient(ellipse, rgba(201,168,76,0.04) 0%, transparent 70%)",
        animation: anim("drift3", 30),
      }} />
      <div style={{
        position: "absolute", inset: "-60px", opacity: 0.03,
        backgroundImage: `linear-gradient(${c.gold} 1px, transparent 1px), linear-gradient(90deg, ${c.gold} 1px, transparent 1px)`,
        backgroundSize: "60px 60px", animation: anim("drift2", 40),
      }} />
      {/* Golden shining stars — three parallax depths */}
      <StarLayer stars={STARS_FAR} drift="drift2" dur={44 / intensity} gold={c.gold} lite={lite} scale={0.8} />
      <StarLayer stars={STARS_MID} drift="drift1" dur={26 / intensity} gold={c.gold} lite={lite} />
      <StarLayer stars={STARS_NEAR} drift="drift3" dur={16 / intensity} gold={c.gold} lite={lite} scale={1.5} />
      <div style={{ position: "absolute", bottom: "-6%", right: "-4%", opacity: 0.04, animation: anim("drift1", 26) }}>
        <SealMark size={420} gold={c.gold} />
      </div>
    </div>
  );
}
