/* ============ MOCK DATA ============ */
/* Future: swap this module for an API layer. */

export const MY_PRODUCTS = [
  { id: 1, name: "CommentIQ", platform: "Chrome Web Store", category: "Chrome Extension", url: "chromewebstore.google.com/detail/commentiq", reviews: 8, pending: 2, verified: 6 },
  { id: 2, name: "SnapDiff", platform: "Product Hunt", category: "Developer Tool", url: "producthunt.com/posts/snapdiff", reviews: 5, pending: 1, verified: 4 },
  { id: 3, name: "InboxPilot", platform: "Firefox Add-ons", category: "Web App", url: "addons.mozilla.org/en-US/firefox/addon/inboxpilot", reviews: 2, pending: 2, verified: 0 },
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
  { rank: 4, name: "You (Mohan)", given: 12, received: 8, verified: 10, score: 4.6, streak: 4, isYou: true, category: "Chrome Extension", badges: ["seal", "bolt"] },
  { rank: 5, name: "Dev R.", given: 24, received: 22, verified: 20, score: 4.6, streak: 3, category: "Mobile App", badges: ["gem"] },
  { rank: 6, name: "Lena S.", given: 19, received: 18, verified: 17, score: 4.5, streak: 6, category: "Web App", badges: ["shield"] },
  { rank: 7, name: "Jake T.", given: 15, received: 14, verified: 12, score: 4.4, streak: 2, category: "Chrome Extension", badges: ["seal"] },
];

/* Badge definitions — earned achievements */
export const BADGE_DEFS = {
  crown: { name: "Top Reviewer", desc: "Ranked #1 in a monthly leaderboard" },
  flame: { name: "On Fire", desc: "8+ week review streak" },
  shield: { name: "Trusted", desc: "95%+ of reviews verified" },
  bolt: { name: "Fast Turnaround", desc: "Reviews within 24h of assignment" },
  gem: { name: "Deep Diver", desc: "Consistently detailed, high-trust reviews" },
  seal: { name: "Founding Member", desc: "Joined in the first launch cohort" },
};

export const PLATFORMS = ["Chrome Web Store", "Firefox Add-ons", "Edge Add-ons", "Product Hunt", "Google Play Store", "Apple App Store"];

/* Listing-URL patterns per platform — client-side mirror of the backend's */
export const PLATFORM_PATTERNS = [
  { name: "Chrome Web Store", re: /^(https:\/\/)?chromewebstore\.google\.com\/detail\/[\w-]+/i },
  { name: "Firefox Add-ons", re: /^(https:\/\/)?addons\.mozilla\.org\/.*firefox\/addon\/[\w.-]+/i },
  { name: "Edge Add-ons", re: /^(https:\/\/)?microsoftedge\.microsoft\.com\/addons\/detail\/[\w-]+/i },
  { name: "Product Hunt", re: /^(https:\/\/)?(www\.)?producthunt\.com\/(products|posts)\/[\w-]+/i },
  { name: "Google Play Store", re: /^(https:\/\/)?play\.google\.com\/store\/apps\/details\?id=[\w.]+/i },
  { name: "Apple App Store", re: /^(https:\/\/)?apps\.apple\.com\/[a-z]{2}\/app\/[\w-]+\/id\d+/i },
];
export const detectPlatform = (url) => PLATFORM_PATTERNS.find(p => p.re.test(String(url ?? "").trim()))?.name ?? null;

/* Landing page content */
export const LANDING_STATS = [
  { value: "312", label: "Reviews exchanged" },
  { value: "94%", label: "Verified by owners" },
  { value: "87", label: "Developers in the pool" },
  { value: "6", label: "Supported platforms" },
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
