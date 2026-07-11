/* UI/UX regression across viewports × product-count scenarios.
   Drives every app page in mock mode at 5/10/50 products on desktop, tablet,
   and two phone widths, asserting: zero horizontal overflow, sidebar/bottom-nav
   present and not overlapping content, stat bars intact, no element wider than
   the viewport. Run against a local mock build:
     VITE_USE_MOCK not-false  ->  npm run dev  (port 5180)
     node scripts/ui-regression.mjs [http://localhost:5180]
*/
const BASE = process.argv[2] ?? "http://localhost:5180";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const VIEWPORTS = [
  { name: "desktop", w: 1440, h: 900 },
  { name: "laptop", w: 1180, h: 820 },
  { name: "tablet", w: 768, h: 1024 },
  { name: "phone", w: 390, h: 844 },
  { name: "phone-sm", w: 360, h: 780 },
];
const SCENARIOS = [1, 5, 10, 50];
const PAGES = [
  { path: "/app", key: "dashboard" },
  { path: "/app/review", key: "review" },
  { path: "/app/product", key: "my-product" },
  { path: "/app/profile", key: "profile" },
  { path: "/app/leaderboard", key: "leaderboard" },
  { path: "/app/products", key: "products" },
  { path: "/app/rules", key: "rules" },
  { path: "/app/settings", key: "settings" },
  { path: "/app/member/1", key: "member" },
  { path: "/", key: "landing" },
  { path: "/leaderboard", key: "public-lb" },
];

let failures = 0;
const fail = (msg) => { console.log("  FAIL " + msg); failures += 1; };

const { default: puppeteer } = await import("puppeteer-core");
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });

for (const vp of VIEWPORTS) {
  for (const count of SCENARIOS) {
    const label = `${vp.name} ${vp.w}px · ${count} product${count === 1 ? "" : "s"}`;
    console.log(`\n== ${label} ==`);
    const page = await browser.newPage();
    await page.setViewport({ width: vp.w, height: vp.h });
    // seed the QA product count before the app boots
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await page.evaluate((n) => {
      localStorage.setItem("peerreview-fx", "lite"); // deterministic, no motion
      if (n > 1) localStorage.setItem("peerreview-qa-products", String(n));
      else localStorage.removeItem("peerreview-qa-products");
    }, count);

    for (const pg of PAGES) {
      const errors = [];
      page.removeAllListeners("pageerror");
      page.on("pageerror", (e) => errors.push(e.message.slice(0, 80)));
      await page.goto(BASE + pg.path, { waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 500));

      const m = await page.evaluate(() => {
        const de = document.scrollingElement;
        const overflow = de.scrollWidth - window.innerWidth;
        // white-screen sentinel: a crashed React tree leaves #root empty
        const rootEmpty = (document.getElementById("root")?.childElementCount ?? 0) === 0;
        // widest element that pokes past the viewport
        let worst = null, worstW = window.innerWidth + 1;
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > worstW + 2) {
            const sel = el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : "");
            if (!worst || r.right > worst.right) worst = { sel, right: Math.round(r.right) };
          }
        }
        const nav = document.querySelector("aside.side-nav");
        return {
          overflow,
          worst,
          hasNav: !!nav,
          navBox: nav ? { top: Math.round(nav.getBoundingClientRect().top), h: Math.round(nav.getBoundingClientRect().height) } : null,
          bodyText: document.body.innerText.length,
          rootEmpty,
        };
      });

      const tags = [];
      if (m.overflow > 1) { fail(`${pg.key}: horizontal overflow ${m.overflow}px` + (m.worst ? ` (widest: ${m.worst.sel} → ${m.worst.right}px)` : "")); tags.push("overflow"); }
      if (m.rootEmpty) { fail(`${pg.key}: WHITE SCREEN — React root is empty (component crashed)`); tags.push("whitescreen"); }
      if (m.bodyText < 40) { fail(`${pg.key}: page nearly empty (${m.bodyText} chars) — render error?`); tags.push("empty"); }
      if (errors.length) { fail(`${pg.key}: JS error — ${errors[0]}`); tags.push("js"); }
      // app pages must show the nav; on ≤900px it's the bottom bar
      const isApp = pg.path.startsWith("/app");
      if (isApp && !m.hasNav) { fail(`${pg.key}: sidebar/bottom-nav missing`); tags.push("nav"); }
      if (isApp && m.hasNav && vp.w <= 900 && m.navBox.top < vp.h - 120) { fail(`${pg.key}: bottom nav not pinned to bottom (top=${m.navBox.top})`); tags.push("navpos"); }

      if (!tags.length) console.log(`  ok   ${pg.key}`);
    }
    await page.close();
  }
}

await browser.close();
console.log(failures ? `\n${failures} UI REGRESSION FAILURE(S)` : "\nALL UI/UX REGRESSION CHECKS PASSED");
process.exit(failures ? 1 : 0);
