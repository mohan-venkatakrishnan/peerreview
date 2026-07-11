/* ============ MOCK DATA ============ */
/* Future: swap this module for an API layer. */

export const MY_PRODUCTS = [
  { id: 1, name: "CommentIQ", platform: "Chrome Web Store", category: "Chrome Extension", url: "chromewebstore.google.com/detail/commentiq", reviews: 8, pending: 2, verified: 6, matching: "category" },
  { id: 2, name: "SnapDiff", platform: "Product Hunt", category: "Developer Tool", url: "producthunt.com/posts/snapdiff", reviews: 5, pending: 1, verified: 4, matching: "open" },
  { id: 3, name: "InboxPilot", platform: "Firefox Add-ons", category: "Web App", url: "addons.mozilla.org/en-US/firefox/addon/inboxpilot", reviews: 2, pending: 2, verified: 0, matching: "category" },
];

/* Mock accounts — enables LaunchPad-style account switching until real auth lands */
export const ACCOUNTS = [
  { id: "mohan", name: "Mohan", email: "mohan@tapdot.org", plan: "free", score: 4.6 },
  { id: "riya", name: "Riya S.", email: "riya.builds@gmail.com", plan: "pro", score: 4.8 },
];

/* Plan tiers — identical features, they differ ONLY by listing count */
export const PLANS = {
  free: { label: "Free", limit: 5, price: "$0" },
  pro: { label: "Pro", limit: 10, price: "$7/mo" },
  studio: { label: "Studio", limit: Infinity, price: "$19/mo" },
};

export const ASSIGNED = {
  name: "FocusFlow",
  developer: "Nadia R.",
  devScore: 4.7,
  category: "Chrome Extension",
  platform: "Chrome Web Store",
  description: "A pomodoro timer that blocks distracting sites during focus sessions. Built for deep work.",
  url: "chromewebstore.google.com/detail/focusflow",
  assignedAgo: "2 hours ago",
  deadline: "5 days",
};

export const INCOMING_REVIEWS = [
  { id: 1, reviewer: "Karan V.", score: 4.8, given: 22, product: "CommentIQ", excerpt: "Really impressed by the sentiment breakdown. The on-device processing means my data never leaves the browser — that's rare. Would love export to CSV though.", link: "chromewebstore.google.com/detail/commentiq/reviews#r-8842", time: "3 hours ago", state: "pending" },
  { id: 2, reviewer: "Emma L.", score: 4.9, given: 41, product: "CommentIQ", excerpt: "Clean UI, does what it says. The comment clustering saved me hours on my channel audit.", link: "chromewebstore.google.com/detail/commentiq/reviews#r-8836", time: "1 day ago", state: "pending" },
];

export const REVIEW_HISTORY = [
  { id: 1, product: "TabStash", developer: "Miguel S.", state: "verified", time: "2 days ago", rating: 5 },
  { id: 2, product: "QuickNote", developer: "Sana P.", state: "verified", time: "5 days ago", rating: 4 },
  { id: 3, product: "DevTimer", developer: "Chris O.", state: "pending", time: "6 days ago", rating: null },
  { id: 4, product: "LinkVault", developer: "Rita M.", state: "verified", time: "2 weeks ago", rating: 5 },
];

export const LEADERBOARD_FULL = [
  { rank: 1, name: "Priya K.", given: 47, received: 45, verified: 44, score: 4.9, streak: 12, category: "Chrome Extension", badges: ["crown", "flame", "shield"] },
  { rank: 2, name: "Tom W.", given: 38, received: 36, verified: 35, score: 4.8, streak: 8, category: "SaaS Tool", badges: ["gem", "shield"] },
  { rank: 3, name: "Aisha M.", given: 31, received: 30, verified: 29, score: 4.7, streak: 15, category: "Web App", badges: ["flame", "bolt"] },
  { rank: 4, name: "You", given: 12, received: 8, verified: 10, score: 4.6, streak: 4, isYou: true, category: "Chrome Extension", badges: ["seal", "bolt"] },
  { rank: 5, name: "Dev R.", given: 24, received: 22, verified: 20, score: 4.6, streak: 3, category: "Mobile App", badges: ["gem"] },
  { rank: 6, name: "Lena S.", given: 19, received: 18, verified: 17, score: 4.5, streak: 6, category: "Web App", badges: ["shield"] },
  { rank: 7, name: "Jake T.", given: 15, received: 14, verified: 12, score: 4.4, streak: 2, category: "Chrome Extension", badges: ["seal"] },
];

/* Badge definitions — earned achievements */
export const BADGE_DEFS = {
  // Getting started / milestones
  seal: { name: "Founding Member", desc: "Joined in the first launch cohort", how: "Be part of the first launch cohort. Once it's gone, it's gone.", group: "Milestones" },
  box: { name: "Shipped", desc: "Listed your first product", how: "List your first product with a live store listing.", group: "Milestones" },
  quill: { name: "First Ink", desc: "First verified review", how: "Get your first review verified by a product owner.", group: "Milestones" },
  calendar: { name: "One Year In", desc: "A year in the exchange", how: "Stay an active member for 12 months.", group: "Milestones" },
  // Volume
  stack: { name: "Ten Deep", desc: "10 verified reviews", how: "Have 10 of your reviews verified.", group: "Volume" },
  medal: { name: "Fifty Club", desc: "50 verified reviews", how: "Have 50 of your reviews verified.", group: "Volume" },
  trophy: { name: "Century", desc: "100 verified reviews", how: "Have 100 of your reviews verified.", group: "Volume" },
  boxes: { name: "Portfolio", desc: "5 products listed", how: "Keep 5 products actively listed.", group: "Volume" },
  factory: { name: "Product Studio", desc: "10 products listed", how: "Keep 10 products actively listed.", group: "Volume" },
  // Quality
  shield: { name: "Trusted", desc: "95%+ of reviews verified", how: "Keep 95% or more of your reviews verified (minimum 10 given).", group: "Quality" },
  gem: { name: "Deep Diver", desc: "Consistently detailed reviews", how: "Earn repeated 5-star owner ratings for detailed reviews.", group: "Quality" },
  star: { name: "Five-Star Favorite", desc: "Ten 5-star owner ratings", how: "Collect ten 5-star helpfulness ratings from product owners.", group: "Quality" },
  laurel: { name: "Laureate", desc: "4.8 average over 25 reviews", how: "Hold a 4.8+ average owner rating across 25 verified reviews.", group: "Quality" },
  diamond: { name: "Flawless", desc: "25 verified, zero flags", how: "Reach 25 verified reviews without a single flag.", group: "Quality" },
  pen: { name: "Wordsmith", desc: "Substantial written reviews", how: "Submit 10 verified reviews of 100+ words.", group: "Quality" },
  // Speed & streaks
  bolt: { name: "Fast Turnaround", desc: "Reviews within 24h", how: "Consistently submit within 24 hours of assignment.", group: "Speed & Streaks" },
  rocket: { name: "Same-Day Ten", desc: "10 same-day reviews", how: "Submit 10 reviews on the day they were assigned.", group: "Speed & Streaks" },
  flame: { name: "On Fire", desc: "8-week review streak", how: "Complete an assignment every week for 8+ weeks.", group: "Speed & Streaks" },
  flame2: { name: "Eternal Flame", desc: "26-week review streak", how: "Complete an assignment every week for 26 weeks.", group: "Speed & Streaks" },
  comet: { name: "Comet", desc: "52-week review streak", how: "A full year of unbroken weekly reviews.", group: "Speed & Streaks" },
  // Community
  crown: { name: "Top Reviewer", desc: "#1 on a monthly leaderboard", how: "Finish a calendar month ranked #1 on the leaderboard.", group: "Community" },
  handshake: { name: "Good Neighbor", desc: "Prompt verifier", how: "Verify 10 incoming reviews within 48 hours of submission.", group: "Community" },
  scale: { name: "Fair Judge", desc: "25 owner ratings given", how: "Rate the helpfulness of 25 incoming reviews.", group: "Community" },
  heart: { name: "Giver", desc: "Gives more than receives", how: "Keep a give/get ratio of 1.5+ across 20 reviews.", group: "Community" },
  // Explorer
  compass: { name: "Cross-Platform", desc: "Reviews on 3 platforms", how: "Deliver verified reviews on 3 different platforms.", group: "Explorer" },
  globe: { name: "Polyglot", desc: "Reviews on all 6 platforms", how: "Deliver verified reviews on every supported platform.", group: "Explorer" },
  owl: { name: "Night Owl", desc: "Midnight reviewer", how: "Submit a verified review between midnight and 5am.", group: "Explorer" },
  sun: { name: "Early Bird", desc: "Dawn reviewer", how: "Submit a verified review between 5am and 8am.", group: "Explorer" },
};

export const PLATFORMS = ["Chrome Web Store", "Firefox Add-ons", "Edge Add-ons", "Product Hunt", "Google Play Store", "Apple App Store", "VS Code Marketplace", "JetBrains Marketplace", "Shopify App Store", "WordPress Plugins", "G2", "Capterra"];

/* Listing-URL patterns per platform — client-side mirror of the backend's */
export const PLATFORM_PATTERNS = [
  { name: "Chrome Web Store", re: /^(https:\/\/)?chromewebstore\.google\.com\/detail\/[\w-]+/i },
  { name: "Firefox Add-ons", re: /^(https:\/\/)?addons\.mozilla\.org\/.*firefox\/addon\/[\w.-]+/i },
  { name: "Edge Add-ons", re: /^(https:\/\/)?microsoftedge\.microsoft\.com\/addons\/detail\/[\w-]+/i },
  { name: "Product Hunt", re: /^(https:\/\/)?(www\.)?producthunt\.com\/(products|posts)\/[\w-]+/i },
  { name: "Google Play Store", re: /^(https:\/\/)?play\.google\.com\/store\/apps\/details\?id=[\w.]+/i },
  { name: "Apple App Store", re: /^(https:\/\/)?apps\.apple\.com\/[a-z]{2}\/app\/[\w-]+\/id\d+/i },
  { name: "VS Code Marketplace", re: /^(https:\/\/)?marketplace\.visualstudio\.com\/items\?itemName=[\w.-]+/i },
  { name: "JetBrains Marketplace", re: /^(https:\/\/)?plugins\.jetbrains\.com\/plugin\/[\w.-]+/i },
  { name: "Shopify App Store", re: /^(https:\/\/)?apps\.shopify\.com\/[\w-]+/i },
  { name: "WordPress Plugins", re: /^(https:\/\/)?wordpress\.org\/plugins\/[\w-]+/i },
  { name: "G2", re: /^(https:\/\/)?(www\.)?g2\.com\/products\/[\w-]+/i },
  { name: "Capterra", re: /^(https:\/\/)?(www\.)?capterra\.com\/(p|software|reviews)\/[\w/-]+/i },
];
export const detectPlatform = (url) => PLATFORM_PATTERNS.find(p => p.re.test(String(url ?? "").trim()))?.name ?? null;

/* Landing page content */
export const LANDING_STATS = [
  { value: "1 : 1", label: "Reviews given to received" },
  { value: "100%", label: "Human-verified reviews" },
  { value: "12", label: "Supported platforms & stores" },
  { value: "$0", label: "To join and list your first product" },
];

export const HOW_IT_WORKS = [
  { n: "1", title: "List your product", desc: "Paste your live store listing. We detect the platform automatically — no listing, no entry." },
  { n: "2", title: "Get an assignment", desc: "Another developer's product lands in your queue. Matched within your category, or open to anyone — your choice." },
  { n: "3", title: "Review it where it lives", desc: "Write a genuine review on the actual platform — that's where it's useful. Then paste the direct link back here." },
  { n: "4", title: "Verify and earn", desc: "The owner reads your review and stamps it verified. You earn exactly one credit — someone is assigned your product next." },
];

export const TESTIMONIALS = [
  { name: "Priya K.", role: "Chrome extension developer", quote: "The review I got back found two bugs and a confusing empty state I'd stopped seeing. Feedback from someone who ships is different." },
  { name: "Tom W.", role: "SaaS founder", quote: "I've written 38 reviews here. Reading that many products carefully changed how I build my own." },
  { name: "Aisha M.", role: "Web app developer", quote: "One-for-one is the whole trick. Nobody can farm it — you give a genuine review, you get one back. That's it." },
];

export const PRICING = [
  { name: "Free", price: "$0", period: "forever", listings: "5 product listings", highlight: false },
  { name: "Pro", price: "$7", period: "/month", listings: "Up to 10 product listings", highlight: true },
  { name: "Studio", price: "$19", period: "/month", listings: "Unlimited listings", highlight: false },
];
export const CATEGORIES = ["Chrome Extension", "Web App", "Mobile App", "SaaS Tool", "Desktop App", "Developer Tool"];

/* QA scale generator — deterministic synthetic products for regression runs.
   Activated in mock mode via localStorage 'peerreview-qa-products' = N. */
export const genProducts = (n) => Array.from({ length: n }, (_, i) => ({
  id: `qa-${i + 1}`,
  name: `${["Nova", "Echo", "Pulse", "Drift", "Forge", "Prism", "Quill", "Vault", "Baton", "Ledger"][i % 10]}${Math.floor(i / 10) ? " " + (Math.floor(i / 10) + 1) : ""}`,
  platform: PLATFORMS[i % PLATFORMS.length],
  category: CATEGORIES[i % CATEGORIES.length],
  url: `chromewebstore.google.com/detail/qa-product-${i + 1}`,
  reviews: (i * 7) % 23,
  pending: i % 3,
  verified: Math.max(0, ((i * 7) % 23) - (i % 3)),
  matching: i % 2 ? "open" : "category",
}));
