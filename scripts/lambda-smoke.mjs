/* Offline happy-path smoke for the API lambdas. Runs the REAL handler code with
   a stubbed AWS SDK (see _awsstub/) — no network, no prod data. Catches thrown
   handlers / broken control flow (e.g. a misplaced .catch) that unit-less lambda
   code otherwise only reveals in production.
     node --import ./scripts/_awsstub/register.mjs scripts/lambda-smoke.mjs   */

process.env.ASSIGNMENTS_TABLE = "assignments";
process.env.PRODUCTS_TABLE = "products";
process.env.USERS_TABLE = "users";
process.env.MATCHER_FUNCTION = "peerreview-matcher";
process.env.SITE_URL = "https://peerreview.tapdot.org";
process.env.NOTIFY_ENABLED = "false"; // notify() is a no-op

const P = (v) => Promise.resolve(v);
const CHROME_REVIEW = "https://chromewebstore.google.com/detail/x/reviews";

// Script DynamoDB responses by command type + target table.
globalThis.__ddb = (cmd) => {
  const t = cmd.constructor.name;
  const inp = cmd.input || {};
  const table = inp.TableName || "";

  if (t === "GetCommand") {
    if (table.includes("assignment"))
      return P({ Item: { assignmentId: "a1", ownerId: "owner1", reviewerId: "rev1", productId: "p1", state: "submitted", platform: "Chrome Web Store", category: "Web App", assignedAt: "2026-01-01T00:00:00Z", reviewLink: CHROME_REVIEW, reviewText: "genuinely useful" } });
    if (table.includes("product"))
      return P({ Item: { userId: "owner1", productId: "p1", name: "P", status: "active", platform: "Chrome Web Store", category: "Web App", description: "d", url: "chromewebstore.google.com/detail/x", reviewerIds: [] } });
    return P({ Item: { userId: inp.Key?.userId ?? "u", name: "Test User", email: "t@example.com", trustScore: 3.2, given: 1, received: 1, privacy: { showName: true }, categories: [] } });
  }
  if (t === "QueryCommand") {
    if (inp.IndexName === "owner-index")
      return P({ Items: [{ assignmentId: "a1", reviewerId: "rev1", productId: "p1", state: "submitted", reviewLink: CHROME_REVIEW, reviewText: "genuinely useful", submittedAt: "2026-01-01T00:00:00Z" }] });
    if (inp.IndexName === "reviewer-index")
      return P({ Items: [{ assignmentId: "h1", ownerId: "owner1", productId: "p1", state: "verified", submittedAt: "2026-01-01T00:00:00Z" }] });
    if (inp.IndexName === "pool-index")
      return P({ Items: [{ userId: "owner1", productId: "p1", name: "P", status: "active", platform: "Chrome Web Store", category: "Web App", matching: "open", url: "x", description: "d", reviewerIds: [] }] });
    return P({ Items: [] });
  }
  if (t === "UpdateCommand") {
    if (inp.ReturnValues === "ALL_NEW") {
      if (table.includes("product")) return P({ Attributes: { status: "active", receivedCount: 1 } });
      return P({ Attributes: { verifiedGiven: 1, flaggedGiven: 0, ratingSum: 5, ratingCount: 1, given: 1, received: 1, email: "rev@example.com" } });
    }
    return P({});
  }
  return P({}); // Put / Delete / Transact
};

const ev = (method, path, body, sub) => ({
  httpMethod: method, path,
  body: body ? JSON.stringify(body) : undefined,
  requestContext: { authorizer: { claims: { sub } } },
});

const cases = [
  ["incoming  GET  /incoming", "../lambda/incoming/index.mjs", ev("GET", "/incoming", null, "owner1"), 200],
  ["incoming  POST /verify", "../lambda/incoming/index.mjs", ev("POST", "/incoming/verify", { assignmentId: "a1", rating: 5 }, "owner1"), 200],
  ["incoming  POST /flag", "../lambda/incoming/index.mjs", ev("POST", "/incoming/flag", { assignmentId: "a1", reason: "spam" }, "owner1"), 200],
  ["assignment GET  /assignment", "../lambda/assignment/index.mjs", ev("GET", "/assignment", null, "rev1"), 200],
  ["assignment POST /submit", "../lambda/assignment/index.mjs", ev("POST", "/assignment/submit", { productId: "p1", ownerId: "owner1", link: CHROME_REVIEW, text: "nice" }, "rev1"), 200],
  ["me        GET  /me", "../lambda/me/index.mjs", ev("GET", "/me", null, "rev1"), 200],
];

let failures = 0;
for (const [name, mod, event, want] of cases) {
  try {
    const { handler } = await import(mod);
    const res = await handler(event);
    const ok = res && res.statusCode === want;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}  -> ${res?.statusCode}${ok ? "" : ` (want ${want}) ${String(res?.body).slice(0, 120)}`}`);
    if (!ok) failures++;
  } catch (e) {
    console.log(`FAIL  ${name}  -> THREW ${e.name}: ${e.message}`);
    failures++;
  }
}
console.log(failures ? `\n${failures} LAMBDA SMOKE FAILURE(S)` : "\nALL LAMBDA SMOKE CHECKS PASSED");
process.exit(failures ? 1 : 0);
