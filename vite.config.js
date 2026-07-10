import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// peerreview.tapdot.org is a custom domain at the site root, so base stays "/"
export default defineConfig({
  plugins: [react()],
  base: "/",
  // Fixed port so PeerReview never collides with the LaunchPad dev server (5173)
  server: { port: 5180 },
});
