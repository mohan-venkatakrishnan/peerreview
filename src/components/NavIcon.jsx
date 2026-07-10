/* Line-art nav icons — same stroke language as BadgeIcon (1.6, round joins, gold fills at low opacity) */
export default function NavIcon({ name, size = 18, color = "#C9A84C", strokeWidth = 1.6 }) {
  const s = { stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
  const icons = {
    /* Dashboard — four panes, one sealed gold */
    dashboard: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="2" {...s} />
        <rect x="13.5" y="3.5" width="7" height="7" rx="2" {...s} />
        <rect x="3.5" y="13.5" width="7" height="7" rx="2" {...s} />
        <rect x="13.5" y="13.5" width="7" height="7" rx="2" {...s} fill={color + "26"} />
      </>
    ),
    /* Review queue — speech bubble with a star */
    review: (
      <>
        <path d="M5 4 H19 C20.1 4 21 4.9 21 6 V14 C21 15.1 20.1 16 19 16 H12.5 L8.5 20 V16 H5 C3.9 16 3 15.1 3 14 V6 C3 4.9 3.9 4 5 4 Z" {...s} />
        <path d="M12 6.8 L12.9 9 L15.2 9.9 L12.9 10.8 L12 13 L11.1 10.8 L8.8 9.9 L11.1 9 Z" fill={color} stroke="none" />
      </>
    ),
    /* My product — package cube */
    product: (
      <>
        <path d="M12 3 L20 7.5 V16.5 L12 21 L4 16.5 V7.5 Z" {...s} fill={color + "14"} />
        <path d="M4 7.5 L12 12 L20 7.5" {...s} />
        <path d="M12 12 V21" {...s} />
      </>
    ),
    /* Profile — bust */
    profile: (
      <>
        <circle cx="12" cy="8" r="4" {...s} fill={color + "14"} />
        <path d="M4.5 20 C4.5 16.2 7.8 14 12 14 C16.2 14 19.5 16.2 19.5 20" {...s} />
      </>
    ),
    /* Leaderboard — a ladder, star at the top */
    ladder: (
      <>
        <path d="M8 6.5 V21" {...s} />
        <path d="M16 6.5 V21" {...s} />
        <path d="M8 9.5 H16 M8 13.5 H16 M8 17.5 H16" {...s} />
        <path d="M12 1.6 L12.8 3.4 L14.7 4.1 L12.8 4.8 L12 6.6 L11.2 4.8 L9.3 4.1 L11.2 3.4 Z" fill={color} stroke="none" />
      </>
    ),
    /* My products — stacked boxes */
    products: (
      <>
        <path d="M8.5 8.5 V6 C8.5 4.9 9.4 4 10.5 4 H18 C19.1 4 20 4.9 20 6 V13.5 C20 14.6 19.1 15.5 18 15.5 H15.5" {...s} />
        <rect x="4" y="8.5" width="11.5" height="11.5" rx="2" {...s} fill={color + "14"} />
      </>
    ),
    /* Rules — open book */
    rules: (
      <>
        <path d="M12 6.2 C10 4.7 7 4.2 3.8 4.7 V18.3 C7 17.8 10 18.3 12 19.8 C14 18.3 17 17.8 20.2 18.3 V4.7 C17 4.2 14 4.7 12 6.2 Z" {...s} fill={color + "10"} />
        <path d="M12 6.2 V19.8" {...s} />
      </>
    ),
    /* Settings — sliders */
    settings: (
      <>
        <path d="M4 7 H20 M4 12 H20 M4 17 H20" {...s} />
        <circle cx="14.5" cy="7" r="2.1" {...s} fill={color + "26"} />
        <circle cx="8.5" cy="12" r="2.1" {...s} fill={color + "26"} />
        <circle cx="16.5" cy="17" r="2.1" {...s} fill={color + "26"} />
      </>
    ),
    /* Add — plus in a tile */
    add: (
      <>
        <rect x="3.5" y="3.5" width="17" height="17" rx="4" {...s} />
        <path d="M12 8 V16 M8 12 H16" {...s} />
      </>
    ),
    /* Theme — half moon */
    theme: (
      <path d="M20 13.2 C19 13.7 17.9 14 16.7 14 C12.4 14 9 10.6 9 6.3 C9 5.1 9.3 4 9.8 3 C6 4 3.5 7.4 3.5 11.5 C3.5 16.5 7.5 20.5 12.5 20.5 C16.1 20.5 19.2 18.4 20 13.2 Z" {...s} fill={color + "14"} />
    ),
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, display: "block" }}>{icons[name]}</svg>;
}
