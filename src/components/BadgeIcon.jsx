import { BADGE_DEFS } from "../data/mock";

export { BADGE_DEFS };

export default function BadgeIcon({ type, size = 26, gold = "#C9A84C", showTooltip = true }) {
  const icons = {
    crown: <path d="M5 19 L5 10 L9 13 L13 6 L17 13 L21 10 L21 19 Z M5 21 L21 21" stroke={gold} strokeWidth="1.6" fill={gold + "22"} strokeLinejoin="round" strokeLinecap="round" />,
    flame: <path d="M13 3 C13 3 7 9 7 14 C7 17.9 9.7 21 13 21 C16.3 21 19 17.9 19 14 C19 11.5 17.5 9.5 16.5 8 C16.5 10 15.5 11 14.5 11 C14.5 8 14 5 13 3 Z" stroke={gold} strokeWidth="1.6" fill={gold + "22"} strokeLinejoin="round" />,
    shield: <path d="M13 3 L21 6 L21 12 C21 17 17.5 20.5 13 22 C8.5 20.5 5 17 5 12 L5 6 Z M9.5 12 L12 14.5 L16.5 9.5" stroke={gold} strokeWidth="1.6" fill={gold + "18"} strokeLinejoin="round" strokeLinecap="round" />,
    bolt: <path d="M14 3 L6 14 L12 14 L11 21 L20 10 L14 10 Z" stroke={gold} strokeWidth="1.6" fill={gold + "22"} strokeLinejoin="round" />,
    gem: <path d="M8 4 L18 4 L22 9 L13 21 L4 9 Z M4 9 L22 9 M10 9 L13 21 L16 9 M8 4 L10 9 L13 4 L16 9 L18 4" stroke={gold} strokeWidth="1.4" fill={gold + "18"} strokeLinejoin="round" />,
    seal: <><circle cx="13" cy="13" r="9" stroke={gold} strokeWidth="1.5" strokeDasharray="3 2.2" fill={gold + "15"} /><path d="M10 13 L12 15 L16.5 10.5" stroke={gold} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></>,
  };
  return (
    <span title={showTooltip ? `${BADGE_DEFS[type].name} — ${BADGE_DEFS[type].desc}` : undefined} style={{ display: "inline-flex", cursor: showTooltip ? "help" : "default" }}>
      <svg width={size} height={size} viewBox="0 0 26 26" fill="none">{icons[type]}</svg>
    </span>
  );
}
