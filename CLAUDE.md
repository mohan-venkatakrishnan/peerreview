# PeerReview — Build Plan & Project Context

> **Purpose of this file:** Kickoff document for building PeerReview with Claude Code.
> Place this at the repo root as `CLAUDE.md` (or keep as `PLAN.md` and reference it in your first prompt).
> A working interactive prototype exists at `reference/prototype.jsx` — it is the source of truth for design and flows.

---

## 1. What PeerReview is

PeerReview (peerreview.tapdot.org) is a **review exchange for indie developers**, built under the tapdot umbrella.

The core loop:

1. A developer lists their product (must have a live listing on a supported platform).
2. They are assigned another developer's product to review.
3. They leave a **genuine review on the actual platform** (Chrome Web Store, Product Hunt, etc.) — not on PeerReview itself.
4. They paste the **direct link to their review** (plus optional review text) back into PeerReview.
5. The product owner reads the review on the platform and marks it **Verified** or **Flagged**.
6. Every review given earns exactly one review credit → someone is assigned the giver's product. Strict one-for-one.

**Review lifecycle:** `Submitted → Pending → Verified | Flagged`

**Trust Score** (never call it "quality score") is the reputation metric: driven by verified reviews, give/get ratio, and review ratings from product owners.

### Supported platforms (closed list — do not make open-ended)
- Chrome Web Store
- Firefox Add-ons
- Microsoft Edge Add-ons
- Product Hunt
- Google Play Store
- Apple App Store

Platform is auto-detected from the listing URL during onboarding. A product cannot be listed without a valid listing URL on one of these.

### Monetisation (mirrors LaunchPad's philosophy)
All features on every plan. Tiers differ ONLY by listing count:
- **Free** — 5 product listings
- **Pro ($7/mo)** — up to 10 product listings
- **Studio ($19/mo)** — unlimited listings

### Important positioning constraint
Never market this as "get store reviews/ratings." Google prohibits incentivised reviews. The value prop is **genuine feedback and community**. Reviews live on real platforms because that's where they're useful — PeerReview only facilitates the exchange and verification.

---

## 2. tapdot conventions (hard rules)

- **Privacy by architecture**: browser-side processing wherever possible; no third-party data transmission; no trackers.
- Google sign-in is used **only** for account identity — call this out in UI copy on the sign-in page.
- **Privacy masked by default**: on public profiles, name / email / photo are masked unless the member explicitly toggles sharing on (Settings → Public profile privacy).
- Honest UX copy: explain limitations plainly (see LaunchPad / Electron app precedent).
- Infrastructure: free tiers preferred (GitHub Pages, Cloudflare KV / Web Analytics). Not-for-profit cost constraints apply.
- Analytics, if any: Cloudflare Web Analytics (cookieless, script-tag only).

---

## 3. Design system (locked — do not change without asking)

**Theme:** "Verification and trust" — stamp/seal motif. Lakers palette: deep navy + gold. Dark mode default, light mode supported.

### Colour tokens

```js
// dark (default)
bg:        "#05091a"
surface:   "#0d1530"
surfaceHover: "#111c3a"
border:    "#1a2a4a"
borderGold:"rgba(201,168,76,0.25)"
gold:      "#C9A84C"     // primary accent
goldMuted: "#8B6914"
goldGlow:  "rgba(201,168,76,0.08)"
text:      "#F0EDE6"
textMuted: "#6b7fa3"
textSub:   "#8A95B0"
verified:  "#2ECC71"
flagged:   "#E74C3C"
pending:   "#f59e0b"

// light
bg: "#FAFAF7", surface: "#F0EDE6", gold: "#8B6914", text: "#05091a"
// (full light palette in reference/prototype.jsx)
```

### Typography
- Headings: **Playfair Display** (serif — gravitas)
- Body/UI: **Inter**
- URLs, links, code, ranks: **JetBrains Mono**

### Signature motifs
- **SealMark** — rotating dashed-circle seal with star + checkmark. Used as: logo, verification stamp, loading states, watermark, avatar badge.
- **Stamp-in animation** — `scale(1.6) rotate(-8deg) → overshoot → settle`, used whenever something gets verified. This is THE signature interaction.
- **BadgeIcon** set (gold line-art SVG): crown (Top Reviewer), flame (On Fire streak), shield (Trusted), bolt (Fast Turnaround), gem (Deep Diver), seal (Founding Member).
- **ParallaxBackdrop** — ambient drifting gold orbs + faint grid + watermark seal. Pure CSS keyframes (`drift1/2/3`). **Never state-driven** (see Known Pitfalls).
- Page transitions: fade + 8px lift, ~220ms.
- Scroll-triggered fade-up reveals with stagger (`fade-up-d1/d2/d3`).

### Branding
- Product name is always **PeerReview** (capital P, capital R, no space).
- Always shown with "by tapdot" attribution chip in nav.
- Tagline: **"Genuine reviews. Mutual trust."**

---

## 4. Pages (all exist in the prototype)

| Route | Page | Notes |
|---|---|---|
| `/` | Landing | Hero + seal, stats bar, how-it-works (4 steps), review lifecycle strip, leaderboard preview, testimonials, pricing, CTA |
| `/leaderboard` | Public leaderboard | Same table as in-app, public, with join CTA |
| `/signin` | Sign in | Google button + privacy copy |
| `/onboarding` | Onboarding | 3 steps: product form (platform auto-detect from URL) → matching preference (category / open) → seal-stamp success |
| `/app` | Dashboard | Stats row, review queue card, my product status, recent activity |
| `/app/review` | Review Queue | Assigned product, open-listing button, 3-step checklist, paste review link + optional text, submit → pending state |
| `/app/product` | My Product | Incoming reviews; verify (stamp animation) or flag; search box |
| `/app/profile` | Profile (own) | Avatar + seal, badge chips, stats, badge showcase grid (earned vs locked), review history |
| `/app/member/:id` | Public profile | Banner hero, masked name/email/photo per member's privacy choice, trust score, stats, floating badge trophy case |
| `/app/leaderboard` | Leaderboard | Search, category filter chips, sort toggle (Trust Score / Volume / Verified), badges inline, rows click → public profile |
| `/app/products` | My Products | Listings with stats, plan usage ("1 of 1"), upgrade prompt card |
| `/app/settings` | Settings | Matching preference, **public profile privacy toggles (default OFF)**, notifications, danger zone |

Global: **Spotlight search** (⌘K / Ctrl+K + sidebar trigger) searching pages, products, reviewers, actions.

---

## 5. Target architecture

```
peerreview/
├── CLAUDE.md                  ← this file
├── reference/
│   └── prototype.jsx          ← the approved interactive prototype (source of truth)
├── index.html
├── package.json               ← Vite + React + react-router-dom
├── src/
│   ├── main.jsx
│   ├── App.jsx                ← router + theme provider
│   ├── tokens/
│   │   └── theme.js           ← DARK / LIGHT palettes, fonts
│   ├── components/
│   │   ├── SealMark.jsx
│   │   ├── BadgeIcon.jsx      ← + BADGE_DEFS
│   │   ├── StateBadge.jsx
│   │   ├── ParallaxBackdrop.jsx
│   │   ├── Spotlight.jsx
│   │   ├── SearchBox.jsx
│   │   ├── AppShell.jsx       ← sidebar + layout
│   │   └── ui.jsx             ← GoldButton, GhostButton, Card, Input, PageTitle
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── SignIn.jsx
│   │   ├── Onboarding.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ReviewQueue.jsx
│   │   ├── MyProduct.jsx
│   │   ├── Profile.jsx
│   │   ├── PublicProfile.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── Products.jsx
│   │   └── Settings.jsx
│   └── data/
│       └── mock.js            ← all mock data; future: swap for API layer
└── .github/workflows/deploy.yml  ← GitHub Pages deploy (tapdot pattern)
```

Stack: **Vite + React + react-router-dom**. Inline-style token approach from the prototype is acceptable to keep initially; migrating to CSS modules or Tailwind is a later decision, not a day-one one.

---

## 6. Known pitfalls (learned from the prototype — do not repeat)

1. **Never define components inside another component.** The prototype defined all pages inside the root App component; every state change recreated component types and remounted the whole tree. All components must be module-level. This is the #1 refactor requirement.
2. **Never drive parallax/ambient animation from React state** (mousemove/scroll setState at root caused a constant re-render loop). Use pure CSS keyframes, or refs + direct style writes outside React.
3. Inputs must live in components that don't remount per keystroke (consequence of #1).
4. Keyboard listeners (⌘K) should be registered once in a top-level effect.
5. `localStorage`/`sessionStorage` are fine in the real app (unlike Claude artifacts) — use localStorage for theme preference, following the LaunchPad pattern.

---

## 7. Build phases

### Phase 1 — Scaffold & decompose (first session)
- [ ] `npm create vite@latest` (React), add react-router-dom
- [ ] Copy prototype into `reference/prototype.jsx`
- [ ] Decompose into the target architecture above, fixing pitfall #1
- [ ] Verify all pages render, navigation works, dark/light toggle persists via localStorage
- [ ] Deploy skeleton to GitHub Pages under peerreview.tapdot.org (CNAME on GoDaddy, same as tools.tapdot.org)

### Phase 2 — Polish the front-end
- [ ] Empty states for every list (dashboard with no assignment, product with no reviews, filtered leaderboard with no results) — use the seal motif
- [ ] Loading/skeleton states
- [ ] Responsive pass (sidebar → bottom nav or drawer on mobile)
- [ ] Reduced-motion support (`prefers-reduced-motion`: disable drift/float/stamp animations)
- [ ] Keyboard navigation in Spotlight (↑↓ + Enter)

### Phase 3 — Real data layer (design before building)
Decisions to make deliberately (do NOT let a session improvise these):
- [ ] Auth: Google sign-in (which provider — Firebase Auth? Supabase? Cloudflare Access?) — must fit not-for-profit free tiers
- [ ] Storage: products, reviews, verifications, trust scores (Supabase free tier / Cloudflare D1 / KV — evaluate)
- [ ] Matching engine: one-for-one credit queue, category vs open matching
- [ ] Review link validation: per-platform URL pattern checks
- [ ] Trust Score formula: verified count, give/get ratio, owner ratings — write it down before coding

### Phase 4 — Launch mechanics
- [ ] Waitlist mode (collect listings before opening the pool; batch launch at ~20–30 products)
- [ ] Founding Member badge for launch cohort (already in badge set)
- [ ] Public leaderboard as the landing page trust signal
- [ ] Reddit cohort outreach ("review my extension" threads — the origin story)

---

## 8. First prompt to use in Claude Code

> Read CLAUDE.md and reference/prototype.jsx. Scaffold the Vite + React project per section 5, then decompose the prototype into module-level components and pages exactly as specified — preserving all visuals, animations, and flows. Fix the architecture pitfalls in section 6, especially: no components defined inside components, parallax stays pure CSS. Use react-router-dom for the routes in section 4. Keep all mock data in src/data/mock.js. When done, run the dev server and list anything that differs visually from the prototype.

---

*PeerReview · a tapdot product · Genuine reviews. Mutual trust.*
