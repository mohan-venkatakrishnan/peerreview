import { useEffect, useRef } from "react";
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

/* Outer div = mouse-parallax target (transformed via direct style writes),
   inner div = CSS drift animation. Separate elements so they don't fight. */
function StarLayer({ stars, drift, dur, gold, lite, scale = 1, layerRef }) {
  return (
    <div ref={layerRef} style={{ position: "absolute", inset: "-60px", willChange: "transform" }}>
      <div style={{ position: "absolute", inset: 0, animation: lite ? "none" : `${drift} ${dur}s ease-in-out infinite` }}>
        {stars.map((s, i) => (
          <span key={i} style={{
            position: "absolute", left: `${s.left}%`, top: `${s.top}%`,
            fontSize: s.size * scale, lineHeight: 1, color: gold,
            opacity: 0.3,
            textShadow: `0 0 ${s.bright ? 12 : 6}px ${gold}`,
            // NEGATIVE delay = every star is already mid-twinkle at first paint
            animation: lite ? "none" : `twinkle ${s.dur}s ease-in-out -${s.delay}s infinite`,
          }}>{s.bright ? "★" : "☆"}</span>
        ))}
      </div>
    </div>
  );
}

/* Ambient gold orbs + faint grid + watermark seal + twinkling star field.
   Ambient motion is pure CSS keyframes; mouse parallax writes transforms
   straight to the DOM via refs — NEVER through React state (pitfall #2). */
export default function ParallaxBackdrop({ intensity = 1 }) {
  const { c, fx } = useTheme();
  const lite = fx === "lite";
  const anim = (name, dur) => (lite ? "none" : `${name} ${dur / intensity}s ease-in-out infinite`);
  const orbsRef = useRef(null);
  const farRef = useRef(null);
  const midRef = useRef(null);
  const nearRef = useRef(null);

  useEffect(() => {
    if (lite || !window.matchMedia?.("(pointer: fine)").matches) return;
    let raf = 0;
    let ev = null;
    const apply = () => {
      raf = 0;
      if (!ev) return;
      const x = ev.clientX / window.innerWidth - 0.5;
      const y = ev.clientY / window.innerHeight - 0.5;
      if (orbsRef.current) orbsRef.current.style.transform = `translate3d(${x * -16}px, ${y * -10}px, 0)`;
      if (farRef.current) farRef.current.style.transform = `translate3d(${x * -10}px, ${y * -6}px, 0)`;
      if (midRef.current) midRef.current.style.transform = `translate3d(${x * -24}px, ${y * -15}px, 0)`;
      if (nearRef.current) nearRef.current.style.transform = `translate3d(${x * -44}px, ${y * -28}px, 0)`;
    };
    const onMove = (e) => { ev = e; if (!raf) raf = requestAnimationFrame(apply); };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => { window.removeEventListener("mousemove", onMove); if (raf) cancelAnimationFrame(raf); };
  }, [lite]);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {/* orbs + grid + watermark — one mouse-parallax layer */}
      <div ref={orbsRef} style={{ position: "absolute", inset: "-40px", willChange: "transform" }}>
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
          position: "absolute", inset: "-20px", opacity: 0.03,
          backgroundImage: `linear-gradient(${c.gold} 1px, transparent 1px), linear-gradient(90deg, ${c.gold} 1px, transparent 1px)`,
          backgroundSize: "60px 60px", animation: anim("drift2", 40),
        }} />
        <div style={{ position: "absolute", bottom: "-6%", right: "-4%", opacity: 0.04, animation: anim("drift1", 26) }}>
          <SealMark size={420} gold={c.gold} />
        </div>
      </div>
      {/* Golden shining review stars — three parallax depths */}
      <StarLayer layerRef={farRef} stars={STARS_FAR} drift="drift2" dur={44 / intensity} gold={c.gold} lite={lite} scale={0.8} />
      <StarLayer layerRef={midRef} stars={STARS_MID} drift="drift1" dur={26 / intensity} gold={c.gold} lite={lite} />
      <StarLayer layerRef={nearRef} stars={STARS_NEAR} drift="drift3" dur={16 / intensity} gold={c.gold} lite={lite} scale={1.5} />
    </div>
  );
}
