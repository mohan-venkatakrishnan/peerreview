import { useTheme } from "../tokens/theme";
import SealMark from "./SealMark";

/* App loader: the PeerReview seal with a golden outline that fills around it.
   fullPane centers it in the visible pane (viewport minus sidebar). */
export default function Loader({ label = "Loading…", fullPane = false }) {
  const { c } = useTheme();
  const inner = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ position: "relative", width: 66, height: 66, display: "grid", placeItems: "center" }}>
        <svg width="66" height="66" viewBox="0 0 66 66" style={{ position: "absolute", inset: 0 }}>
          <circle cx="33" cy="33" r="29" fill="none" stroke={c.border} strokeWidth="3" />
          <circle cx="33" cy="33" r="29" fill="none" stroke={c.gold} strokeWidth="3" strokeLinecap="round"
            strokeDasharray="182" className="loader-ring" transform="rotate(-90 33 33)" />
        </svg>
        <SealMark size={34} gold={c.gold} animated={false} />
      </div>
      <div style={{ fontSize: 14, color: c.textMuted }}>{label}</div>
    </div>
  );
  if (fullPane) return <div className="pane-center" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{inner}</div>;
  return <div style={{ minHeight: "55vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>{inner}</div>;
}
