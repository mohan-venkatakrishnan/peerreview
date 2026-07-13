import { useTheme } from "../tokens/theme";

/* A product's icon if it has one, else the gold letter-initial tile. Keeps the
   look consistent everywhere a product is shown. */
export default function ProductIcon({ name = "", icon, size = 46, radius = 11 }) {
  const { c } = useTheme();
  if (icon) {
    // No border on a real icon — the outline read as a hard/pixelated edge.
    // backgroundColor shows through any transparency so it looks consistent
    // across cards (not blended into a gold-tinted featured card).
    return (
      <div style={{ width: size, height: size, flexShrink: 0, borderRadius: radius, backgroundColor: c.bg, backgroundImage: `url(${icon})`, backgroundSize: "cover", backgroundPosition: "center" }} />
    );
  }
  return (
    <div style={{ width: size, height: size, flexShrink: 0, borderRadius: radius, background: `linear-gradient(135deg, ${c.gold}25, ${c.gold}50)`, border: `1px solid ${c.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.42), color: c.gold, fontFamily: "Playfair Display, serif", fontWeight: 700 }}>
      {(name || "?")[0]}
    </div>
  );
}
