import { BADGE_DEFS } from "../data/mock";

export { BADGE_DEFS };

/* Gold line-art badge icons — 26×26, stroke ~1.5, subtle gold fills */
export default function BadgeIcon({ type, size = 26, gold = "#C9A84C", showTooltip = true }) {
  const s = { stroke: gold, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
  const f = gold + "22";
  const icons = {
    crown: <path d="M5 19 L5 10 L9 13 L13 6 L17 13 L21 10 L21 19 Z M5 21 L21 21" {...s} strokeWidth="1.6" fill={f} />,
    flame: <path d="M13 3 C13 3 7 9 7 14 C7 17.9 9.7 21 13 21 C16.3 21 19 17.9 19 14 C19 11.5 17.5 9.5 16.5 8 C16.5 10 15.5 11 14.5 11 C14.5 8 14 5 13 3 Z" {...s} strokeWidth="1.6" fill={f} />,
    flame2: <><path d="M13 2.5 C13 2.5 6.5 9 6.5 14.2 C6.5 18.3 9.4 21.5 13 21.5 C16.6 21.5 19.5 18.3 19.5 14.2 C19.5 11.5 17.8 9.3 16.7 7.7 C16.7 9.8 15.6 10.9 14.5 10.9 C14.5 7.7 14 4.7 13 2.5 Z" {...s} fill={f} /><path d="M13 21.5 C11.2 21.5 9.8 19.9 9.8 17.9 C9.8 15.9 13 12.8 13 12.8 C13 12.8 16.2 15.9 16.2 17.9 C16.2 19.9 14.8 21.5 13 21.5 Z" fill={gold} opacity="0.45" stroke="none" /></>,
    comet: <><circle cx="9" cy="17" r="4.5" {...s} fill={f} /><path d="M12.5 13.5 L21 5 M13.8 16 L20 12 M10.5 12.2 L15 4.5" {...s} /></>,
    shield: <path d="M13 3 L21 6 L21 12 C21 17 17.5 20.5 13 22 C8.5 20.5 5 17 5 12 L5 6 Z M9.5 12 L12 14.5 L16.5 9.5" {...s} strokeWidth="1.6" fill={gold + "18"} />,
    bolt: <path d="M14 3 L6 14 L12 14 L11 21 L20 10 L14 10 Z" {...s} strokeWidth="1.6" fill={f} />,
    rocket: <><path d="M13 3 C16.5 5 18 9 17.5 13.5 L13 18 L8.5 13.5 C8 9 9.5 5 13 3 Z" {...s} fill={f} /><circle cx="13" cy="10" r="1.8" {...s} /><path d="M8.5 15 C7 15.8 6.3 17.5 6 19.8 C8.3 19.5 10 18.8 10.8 17.3 M17.5 15 C19 15.8 19.7 17.5 20 19.8 C17.7 19.5 16 18.8 15.2 17.3" {...s} /></>,
    gem: <path d="M8 4 L18 4 L22 9 L13 21 L4 9 Z M4 9 L22 9 M10 9 L13 21 L16 9 M8 4 L10 9 L13 4 L16 9 L18 4" {...s} strokeWidth="1.4" fill={gold + "18"} />,
    diamond: <><path d="M13 3 L21 10 L13 22 L5 10 Z" {...s} fill={f} /><path d="M5 10 L21 10 M13 3 L10 10 L13 22 L16 10 Z" {...s} strokeWidth="1.1" /></>,
    seal: <><circle cx="13" cy="13" r="9" {...s} strokeDasharray="3 2.2" fill={gold + "15"} /><path d="M10 13 L12 15 L16.5 10.5" {...s} strokeWidth="1.7" /></>,
    box: <><path d="M13 3.5 L21 7.8 V16.2 L13 20.5 L5 16.2 V7.8 Z" {...s} fill={gold + "14"} /><path d="M5 7.8 L13 12 L21 7.8 M13 12 V20.5" {...s} /></>,
    boxes: <><rect x="4" y="12" width="8.5" height="8.5" rx="1.5" {...s} fill={gold + "14"} /><rect x="13.5" y="12" width="8.5" height="8.5" rx="1.5" {...s} /><rect x="8.75" y="3.5" width="8.5" height="8.5" rx="1.5" {...s} fill={f} /></>,
    factory: <path d="M4 21 V10 L9 13 V10 L14 13 V10 L19 13 V5 L22 5 V21 Z M7.5 16.5 H9.5 M12 16.5 H14 M16.5 16.5 H18.5" {...s} fill={gold + "12"} />,
    quill: <><path d="M20 4 C14 5 9 9 7.5 15 C10 15.5 14 15 16.5 12 C18.8 9.3 19.8 6.5 20 4 Z" {...s} fill={f} /><path d="M7.5 15 L5 21 M10.5 11.5 L15 7.5" {...s} /></>,
    pen: <><path d="M16.5 4.5 L21.5 9.5 L10 21 L4.5 21.5 L5 16 Z" {...s} fill={gold + "14"} /><path d="M14 7 L19 12" {...s} /></>,
    stack: <><path d="M13 3.5 L22 8 L13 12.5 L4 8 Z" {...s} fill={f} /><path d="M4 13 L13 17.5 L22 13 M4 17.5 L13 22 L22 17.5" {...s} /></>,
    medal: <><circle cx="13" cy="15.5" r="5.5" {...s} fill={f} /><path d="M13 13 L13.9 15 L16 15.3 L14.5 16.8 L14.9 19 L13 18 L11.1 19 L11.5 16.8 L10 15.3 L12.1 15 Z" fill={gold} stroke="none" /><path d="M9.5 11 L7 3.5 L11 3.5 L13 8 L15 3.5 L19 3.5 L16.5 11" {...s} /></>,
    trophy: <><path d="M8 4 H18 V10 C18 13 16 15.5 13 15.5 C10 15.5 8 13 8 10 Z" {...s} fill={f} /><path d="M8 6 H4.5 C4.5 9.5 6 11.5 8.5 12 M18 6 H21.5 C21.5 9.5 20 11.5 17.5 12 M13 15.5 V18 M9.5 21 H16.5 M11 18 H15 L15.5 21 H10.5 Z" {...s} /></>,
    star: <path d="M13 3 L15.6 9.2 L22 9.8 L17.2 14.1 L18.7 20.8 L13 17.3 L7.3 20.8 L8.8 14.1 L4 9.8 L10.4 9.2 Z" {...s} fill={f} />,
    spotlight: <><path d="M13 5 L14.9 9.6 L19.8 9.9 L16 13 L17.2 17.8 L13 15.1 L8.8 17.8 L10 13 L6.2 9.9 L11.1 9.6 Z" {...s} fill={gold + "22"} /><path d="M13 2.2 V3.8 M21.5 6 L20.2 6.9 M4.5 6 L5.8 6.9 M20.8 15.5 L19.4 15 M5.2 15.5 L6.6 15" {...s} strokeWidth="1.3" /></>,
    laurel: <><path d="M13 4 L14.5 8.5 L19 8.5 L15.5 11.5 L16.8 16 L13 13.3 L9.2 16 L10.5 11.5 L7 8.5 L11.5 8.5 Z" {...s} strokeWidth="1.2" fill={f} /><path d="M5.5 10 C4.5 14 6 18.5 9.5 21 M20.5 10 C21.5 14 20 18.5 16.5 21" {...s} /><path d="M6 13 L8 13.5 M6.8 16 L8.8 16 M8.5 18.7 L10.3 18 M20 13 L18 13.5 M19.2 16 L17.2 16 M17.5 18.7 L15.7 18" {...s} strokeWidth="1.2" /></>,
    handshake: <><path d="M3.5 9 L8 7 L13 9.5 L17.5 7 L22.5 9" {...s} /><path d="M8 7 L8 15 C10 18 12 19 13 19 C14 19 16 18 18 15 L18 8" {...s} fill={gold + "10"} /><path d="M10.5 12 L13 14.2 L15.5 12" {...s} /></>,
    scale: <><path d="M13 4 V20 M9 20 H17 M5 7 H21" {...s} /><path d="M7.5 7 L5 13 C5 14.7 6.1 15.8 7.5 15.8 C8.9 15.8 10 14.7 10 13 Z M18.5 7 L16 13 C16 14.7 17.1 15.8 18.5 15.8 C19.9 15.8 21 14.7 21 13 Z" {...s} strokeWidth="1.3" fill={gold + "14"} /></>,
    heart: <path d="M13 20.5 C7 16 4 12.5 4 9.3 C4 6.9 5.9 5 8.2 5 C10 5 11.8 6 13 8 C14.2 6 16 5 17.8 5 C20.1 5 22 6.9 22 9.3 C22 12.5 19 16 13 20.5 Z" {...s} fill={f} />,
    compass: <><circle cx="13" cy="13" r="9" {...s} fill={gold + "0d"} /><path d="M16.5 9.5 L14.2 14.2 L9.5 16.5 L11.8 11.8 Z" {...s} strokeWidth="1.3" fill={f} /></>,
    globe: <><circle cx="13" cy="13" r="9" {...s} /><ellipse cx="13" cy="13" rx="4" ry="9" {...s} strokeWidth="1.1" /><path d="M4 13 H22 M5.3 8.5 H20.7 M5.3 17.5 H20.7" {...s} strokeWidth="1.1" /></>,
    owl: <><circle cx="13" cy="14" r="7.5" {...s} fill={gold + "10"} /><path d="M6.5 9.5 L5 5 L9.5 7.2 M19.5 9.5 L21 5 L16.5 7.2" {...s} /><circle cx="10" cy="13" r="1.9" {...s} strokeWidth="1.2" /><circle cx="16" cy="13" r="1.9" {...s} strokeWidth="1.2" /><path d="M13 15.5 L12 17 H14 Z" fill={gold} stroke="none" /></>,
    sun: <><circle cx="13" cy="13" r="5" {...s} fill={f} /><path d="M13 3.5 V6 M13 20 V22.5 M3.5 13 H6 M20 13 H22.5 M6.3 6.3 L8 8 M18 18 L19.7 19.7 M19.7 6.3 L18 8 M8 18 L6.3 19.7" {...s} /></>,
    calendar: <><rect x="4.5" y="6" width="17" height="15" rx="2" {...s} fill={gold + "0d"} /><path d="M4.5 10.5 H21.5 M9 3.5 V7.5 M17 3.5 V7.5" {...s} /><path d="M10.5 15 L12.3 17 L16 13.5" {...s} /></>,
  };
  return (
    <span title={showTooltip ? `${BADGE_DEFS[type]?.name} — ${BADGE_DEFS[type]?.desc}` : undefined} style={{ display: "inline-flex", cursor: showTooltip ? "help" : "default" }}>
      <svg width={size} height={size} viewBox="0 0 26 26" fill="none">{icons[type] ?? icons.seal}</svg>
    </span>
  );
}
