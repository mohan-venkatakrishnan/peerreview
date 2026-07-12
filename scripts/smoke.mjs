/* Pre-launch smoke + sentinel checks (web-app-craft). Run after every deploy:
     node scripts/smoke.mjs https://peerreview.tapdot.org
   Sentinels cover BUG CLASSES: SPA-fallback 404s to crawlers, missing security
   headers, phone-width horizontal overflow, unauthenticated API acceptance,
   webhook signature acceptance. Exits 1 on any failure. */

const BASE = process.argv[2] ?? "https://peerreview.tapdot.org";
const API = process.env.VITE_API_URL ?? "https://t3ym6tu8gl.execute-api.us-east-1.amazonaws.com/prod";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
};

/* 1. Every route returns a real HTTP 200 (no redirects, no SPA-fallback 404) */
for (const route of ["/", "/leaderboard", "/signin", "/app", "/app/rules", "/og.png", "/favicon.svg"]) {
  const res = await fetch(BASE + route, { redirect: "manual" });
  check(`route ${route} -> 200`, res.status === 200, `got ${res.status}`);
}

/* 2. Security headers on the root document */
const root = await fetch(BASE + "/");
for (const h of ["strict-transport-security", "x-frame-options", "x-content-type-options", "content-security-policy", "referrer-policy"]) {
  check(`header ${h}`, root.headers.has(h));
}

/* 3. Unauthenticated API is rejected (and with CORS so browsers can see it) */
const me = await fetch(API + "/me");
check("unauth /me -> 401", me.status === 401, `got ${me.status}`);
check("401 carries CORS", me.headers.has("access-control-allow-origin"));

/* 4. Public API works */
const lb = await fetch(API + "/leaderboard");
check("public /leaderboard -> 200", lb.status === 200, `got ${lb.status}`);

/* 5. Webhook rejects unsigned payloads (503 while payments unconfigured) */
const wh = await fetch(API + "/webhook/payment", { method: "POST", body: "{}" });
check("unsigned webhook rejected", wh.status === 401 || wh.status === 503, `got ${wh.status}`);

/* 5b. NO mock/sample data on the live site — the public leaderboard must never
   contain the sample names shipped in mock.js (guards against a mock-mode build
   or a sample fallback leaking onto production). */
const MOCK_NAMES = ["FocusFlow", "InboxIQ", "SnapPalette", "TabStash", "QuickNote", "CommentIQ demo", "Priya K.", "Tom W.", "Aisha M.", "Karan V.", "Emma L."];
const lbBody = await (await fetch(API + "/leaderboard")).text();
const leaked = MOCK_NAMES.filter(n => lbBody.includes(n));
check("live leaderboard has no sample data", leaked.length === 0, leaked.length ? `leaked: ${leaked.join(", ")}` : "");

/* 6. Browser sentinels: 390px zero horizontal overflow, app renders */
try {
  const { default: puppeteer } = await import("puppeteer-core");
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
  const pg = await b.newPage();

  await pg.setViewport({ width: 390, height: 844 });
  await pg.goto(BASE + "/", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 2000));
  const overflow = await pg.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth);
  check("390px zero horizontal overflow (landing)", overflow <= 0, `overflow ${overflow}px`);

  await pg.goto(BASE + "/leaderboard", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1500));
  const overflowLb = await pg.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth);
  check("390px zero horizontal overflow (leaderboard)", overflowLb <= 0, `overflow ${overflowLb}px`);
  const hasRows = await pg.evaluate(() => document.body.innerText.includes("Top reviewers"));
  check("leaderboard renders rows", hasRows);

  await b.close();
} catch (e) {
  check("browser sentinels", false, e.message.slice(0, 100));
}

console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL CHECKS PASSED");
process.exit(failures ? 1 : 0);
