import { useTheme } from "../tokens/theme";

/* The dashed rings and star rotate; the tick and its disc stay fixed.
   Rotates everywhere by default (pass animated={false} to pin it);
   FX-lite / reduced-motion users get a still seal. */
export default function SealMark({ size = 80, animated = true, gold = "#C9A84C" }) {
  const { fx } = useTheme();
  const spin = animated && fx !== "lite";
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" style={{ flexShrink: 0 }}>
      <g style={{ transformOrigin: "40px 40px", animation: spin ? "rotateSeal 20s linear infinite" : "none" }}>
        <circle cx="40" cy="40" r="36" stroke={gold} strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx="40" cy="40" r="28" stroke={gold} strokeWidth="0.75" opacity="0.5" />
        <path d="M40 16 L43 31 L58 24 L47 35 L62 40 L47 45 L58 56 L43 49 L40 64 L37 49 L22 56 L33 45 L18 40 L33 35 L22 24 L37 31 Z" fill={gold} opacity="0.15" />
      </g>
      <circle cx="40" cy="40" r="8" fill={gold} opacity="0.2" />
      <path d="M36 40 L39 43 L45 37" stroke={gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
