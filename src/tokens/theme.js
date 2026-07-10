import { createContext, useContext } from "react";

/* ============ DESIGN TOKENS ============ */
export const DARK = {
  bg: "#05091a", surface: "#0d1530", surfaceHover: "#111c3a",
  border: "#1a2a4a", borderGold: "rgba(201,168,76,0.25)",
  gold: "#C9A84C", goldMuted: "#8B6914", goldGlow: "rgba(201,168,76,0.08)",
  text: "#F0EDE6", textMuted: "#6b7fa3", textSub: "#8A95B0",
  verified: "#2ECC71", flagged: "#E74C3C", pending: "#f59e0b",
};
export const LIGHT = {
  bg: "#FAFAF7", surface: "#F0EDE6", surfaceHover: "#E8E4D8",
  border: "#D8D4C8", borderGold: "rgba(139,105,20,0.3)",
  gold: "#8B6914", goldMuted: "#C9A84C", goldGlow: "rgba(201,168,76,0.1)",
  text: "#05091a", textMuted: "#6B7280", textSub: "#4A5568",
  verified: "#16A34A", flagged: "#DC2626", pending: "#D97706",
};

/* Theme context — provides { c, isDark, setIsDark, fx, setFx } app-wide.
   fx tier: "full" = all motion, "lite" = static (low-end browsers / testing). */
export const ThemeContext = createContext({ c: DARK, isDark: true, setIsDark: () => {}, fx: "full", setFx: () => {} });
export const useTheme = () => useContext(ThemeContext);
