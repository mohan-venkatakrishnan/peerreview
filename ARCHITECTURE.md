# PeerReview — Tech Architecture (Phase 3 design)

> Status: DRAFT for approval. Mirrors the LaunchPad AWS stack (Amplify + Cognito +
> API Gateway + Lambda + DynamoDB + S3 + LemonSqueezy, Terraform-managed).
> Nothing here is built until this doc is signed off.

## 1. Stack (LaunchPad parity)

| Concern | Choice | LaunchPad precedent |
|---|---|---|
| Hosting | AWS Amplify, custom domain `peerreview.tapdot.org` | ✔ same (`amplify.tf`, `customHttp.yml`) |
| Auth | Cognito user pool + Google IdP (hosted UI, code grant) | ✔ same (`cognito.tf`) |
| API | API Gateway (REST) + one Lambda per endpoint, Node 20 ESM | ✔ same (`lambda/<fn>/index.mjs`) |
| Data | DynamoDB, per-purpose tables, PAY_PER_REQUEST | ✔ same (`dynamodb.tf`) |
| Static data | S3 (leaderboard snapshot, avatars) | ✔ same (`s3.tf`) |
| Payments | LemonSqueezy webhooks → Lambda | ✔ same (`webhook-payment`) |
| IaC | Terraform, AWS provider ~>5.0, tags `{App, Environment}` | ✔ same |
| Frontend state | keep React context (small app); zustand only if it grows | LaunchPad uses zustand |

**Deviation from CLAUDE.md to approve:** CLAUDE.md §7 says GitHub Pages. Amplify is
recommended instead for LaunchPad parity (env-var builds, PR previews, custom domain
+ cert managed in one place). Cost at our scale: ~$0 (free tier covers it).
The `.github/workflows/deploy.yml` Pages workflow stays in the repo as a fallback.

## 2. System diagram

```
Browser (React SPA, Amplify-hosted, peerreview.tapdot.org)
  │  Cognito Hosted UI ──► Google sign-in ──► JWT (id token)
  ▼
API Gateway (Cognito authorizer, claims.sub = userId)
  ├─ get-me · user-prefs ────────────► users table
  ├─ products CRUD ──────────────────► products table
  ├─ get-assignment · submit-review ─► assignments table
  ├─ skip-assignment
  ├─ get-incoming · verify-review · flag-review
  │      └─ verify → credits owner’s reviewer +1, recompute trust, enqueue match
  ├─ get-member (public profile, SERVER-side privacy masking)
  └─ webhook-payment (LemonSqueezy, unauthenticated + signature check)
Matching engine: Lambda (invoked on verify + EventBridge hourly sweep)
Leaderboard: EventBridge (hourly) → Lambda → leaderboard.json in S3 (public, cached)
Expiry: DynamoDB TTL on assignments.dueAt + the hourly sweep reassigns
```

## 3. Data model (DynamoDB)

**peerreview-users** — hash `userId` (Cognito sub)
`email, name, avatarKey?, plan (free|pro|studio), matching (category|open),
privacy {showName, showEmail, showPhoto} (all default FALSE),
creditBalance (atomic counter), given, received, verifiedGiven, flaggedGiven,
ratingSum, ratingCount, trustScore, streakWeeks, badges[], createdAt`
GSI `email-index` (LemonSqueezy webhook resolves email → userId, as in LaunchPad).

**peerreview-products** — hash `userId`, range `productId`
`name, url, platform, category, description, status (active|paused|removed),
receivedCount, pendingCount, createdAt`
GSI `pool-index`: hash `status`, range `enqueuedAt` — the matching pool, oldest first.

**peerreview-assignments** — hash `assignmentId`
`reviewerId, ownerId, productId, state (assigned|submitted|verified|flagged|expired),
assignedAt, dueAt (TTL), submittedAt, reviewLink, reviewText?, ownerRating?, category`
GSI `reviewer-index` (reviewerId, assignedAt) — "my queue" and history.
GSI `owner-index` (ownerId, state) — "incoming reviews to verify".

No credits ledger table: `creditBalance` is an atomic ADD with the assignment record
as the audit trail. Revisit only if disputes demand a ledger.

## 4. Matching engine — OPEN POOL (updated 2026-07-12)

> **Superseded:** the original strict one-for-one push-matcher below is retired.
> It starved on cold-start / two-person pools and left product-less members with
> nothing to review. PeerReview now runs an **open pool**: members browse
> everything they can review and pick for themselves. The subsections below marked
> *(legacy)* describe the old design and are kept for context only.

**Not-interested (skip) + Trust penalty (2026-07-12):** a member can park a
product they can't/won't review via `POST /assignment/skip {productId}` (and undo
with `{productId, undo:true}` — reuses the existing route, no new infra). Parked
ids live in a string set `skippedProductIds` on the user. `buildQueue` returns
`{pool, skipped}` and excludes parked ids from the pool. Parking dings Trust
Score: `computeTrust` (identical in lambda/assignment and lambda/incoming) applies
`penalty = min(0.15, count(skippedProductIds) × 0.03)` as `trust × (1 − penalty)`
— capped at 15%, fully recovered by moving items back. Recomputed on skip/undo
and on every verify/flag.

**Open-pool model (current):**
1. A listing is queued (`poolStatus=queued`) when created and **stays queued while
   active** — re-enqueued after every verify/flag/skip/expire. Products never leave
   the pool except when the owner removes them.
2. `lambda/assignment` `buildPool(userId)` returns the member's queue: all queued
   products where `P.owner ≠ me`, `me ∉ P.reviewerIds`, and
   (`P.matching = open` OR the member has no categories of their own OR the
   member's categories include `P.category` — a product-less reviewer sees all).
3. `POST /assignment/submit {productId, ownerId, link, text}` creates a `submitted`
   assignment directly and atomically adds the member to `P.reviewerIds`
   (`ConditionExpression: NOT contains(reviewerIds, me)` blocks double-submit).
   `reviewerIds` therefore lists **actual reviewers only** — a skip never adds to it,
   so a skipped product stays available to that member.
4. Owner verify/flag unchanged (§ trust + received counts). Reviewer `given +1` on
   submit; `verifiedGiven`/trust on verify.
5. `lambda/matcher` auto-assign is early-returned; the EventBridge sweep is kept
   only to expire any legacy `assigned` rows. `creditBalance` still increments on
   verify but no longer gates visibility (dormant; reconcile if a credit UI returns).

**Legacy one-for-one push-matcher (retired):**
1. *(legacy)* Owner verify enqueued the reviewer's own product (`creditBalance +1`).
2. *(legacy)* Matcher (on-verify + sweep) picked, per queued product, a reviewer R
   where `R ≠ O`, R had no active assignment, R hadn't reviewed P, no 30-day
   reciprocity, and (P.matching = open OR R has a product in C).
3. *(legacy)* Assignment created with conditional writes, `dueAt = now+7d`; expiry
   TTL/sweep; skip allowed once per chain; multi-product round-robin.

## 5. Trust Score formula (locked once approved)

```
V = (verifiedGiven + 2) / (verifiedGiven + flaggedGiven + 4)   # Laplace-smoothed verified rate
R = ratingCount ? (ratingSum / ratingCount) / 5 : 0.70          # owner ratings, neutral default
G = min(given / max(received, 1), 1.5) / 1.5                    # give/get, capped at 1.5

TrustScore = round(5 × (0.45·V + 0.35·R + 0.20·G), 1)
```

Examples: new user → ★3.2 · 10 verified/0 flagged, avg 4.5★, ratio 1.2 → ★4.4 ·
heavy flags (3v/5f) → ★2.4. Flags are the dominant lever (by design); the ratio
term rewards givers but can't compensate for flagged reviews. Recompute on every
verify/flag/rating event; monthly leaderboard snapshot freezes badge awards.

## 6. Review link validation (per-platform, closed list)

Checked at submit time in `submit-review` (owner verification remains the human gate):
```
Chrome Web Store   ^https://chromewebstore\.google\.com/detail/[\w-]+/[a-p]{32}(/reviews.*)?
Firefox Add-ons    ^https://addons\.mozilla\.org/.+/firefox/addon/[\w.-]+(/reviews.*)?
Edge Add-ons       ^https://microsoftedge\.microsoft\.com/addons/detail/[\w-]+/[a-z]{32}
Product Hunt       ^https://www\.producthunt\.com/(products|posts)/[\w-]+(\?comment=\d+|/reviews.*)?
Google Play        ^https://play\.google\.com/store/apps/details\?id=[\w.]+
Apple App Store    ^https://apps\.apple\.com/[a-z]{2}/app/[\w-]+/id\d+(\?see-all=reviews)?
```
Same table drives platform auto-detect in onboarding (product URL, not review URL).

## 7. Privacy by architecture

- `get-member` masks name/email/avatar **server-side** per the member's privacy
  flags — masked data never reaches another user's browser.
- Avatars in S3 under private prefix; served via short-lived presigned URL only
  when `showPhoto=true`; else never issued.
- No trackers; Cloudflare Web Analytics script tag only, if any.
- Google identity used solely for sign-in (Cognito stores sub + email; no scopes
  beyond openid/email/profile).

## 8. Plans & payments

LemonSqueezy products: Pro $7/mo, Studio $19/mo. `webhook-payment` Lambda
(signature-verified) resolves payer email → userId via `email-index`, sets
`users.plan`. Listing limits enforced in `save-product` (free 5 / pro 10 / studio ∞).
Downgrade: extra listings become `paused` (never deleted), oldest kept active.

## 9. Frontend integration

`VITE_USE_MOCK=true` keeps today's mock behaviour. A thin `src/data/api.js`
implements the same shapes as `mock.js`; each page swaps at one import site.
Env (LaunchPad naming): `VITE_AWS_REGION, VITE_COGNITO_USER_POOL_ID,
VITE_COGNITO_CLIENT_ID, VITE_COGNITO_DOMAIN, VITE_API_URL, VITE_USE_MOCK`.

## 10. Build order (after sign-off)

1. Terraform skeleton: provider, tags, Cognito + Google IdP, users table, `get-me`
2. Amplify app + domain (GoDaddy CNAME → Amplify)
3. Products CRUD + plan limits; real onboarding
4. Assignments + matching engine + expiry sweep
5. submit/verify/flag + trust recompute + credits
6. Leaderboard snapshot → S3; public profile with server-side masking
7. LemonSqueezy webhook + plan gates
8. Waitlist mode flag (Phase 4: pool opens at ~20–30 products)

Estimated AWS cost at launch scale: ≪ $1/month (all pay-per-request/free tier).

## 11. Open questions for sign-off

1. Amplify instead of GitHub Pages — approve the CLAUDE.md deviation?
2. Trust Score weights (0.45/0.35/0.20) and the ★3.2 new-user start — OK?
3. Anti-reciprocity window 30 days, deadline 7 days, 3 expiries/90d pause — OK?
4. Same AWS account/region as LaunchPad, or separate? (Same account, separate
   `peerreview-*` names + tags recommended — one bill, clean separation.)
