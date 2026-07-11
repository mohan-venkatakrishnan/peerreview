/* Real API client — adapts backend responses into the exact shapes the pages
   already consume from mock.js, so pages don't care which mode is active. */
import { getIdToken, login } from "./auth";

const API = import.meta.env.VITE_API_URL;

const apiFetch = async (path, options = {}) => {
  const token = await getIdToken();
  if (!token) { login(); throw new Error("Not signed in"); }
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
      ...options.headers,
    },
  });
  if (res.status === 401) { login(); throw new Error("Your session expired — signing you back in…"); }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.message || FRIENDLY[res.status] || `Something went wrong (${res.status}) — try again.`), { code: body.code, status: res.status });
  return body;
};

/* Status codes become human sentences in ONE place (web-app-craft) */
const FRIENDLY = {
  400: "That didn't look right — check the fields and try again.",
  403: "Your plan doesn't allow that yet.",
  404: "We couldn't find that.",
  409: "That was already handled — refresh to see the latest.",
  429: "Too many requests — give it a few seconds.",
  500: "Something broke on our side — try again in a moment.",
  502: "The server hiccuped — try again in a moment.",
  503: "PeerReview is briefly unavailable — try again in a moment.",
};

const timeAgo = (iso) => {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} hours ago`;
  if (s < 1209600) return `${Math.round(s / 86400)} days ago`;
  return `${Math.round(s / 604800)} weeks ago`;
};

const daysLeft = (iso) => {
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  return d <= 0 ? "today" : `${d} day${d === 1 ? "" : "s"}`;
};

/* ---- me ---- */
export const getMe = () => apiFetch("/me");
export const updateMe = (patch) => apiFetch("/me", { method: "PUT", body: JSON.stringify(patch) });

/* ---- products (mock MY_PRODUCTS shape) ---- */
export const getProducts = async () => (await apiFetch("/products")).map(p => ({
  id: p.productId,
  name: p.name,
  platform: p.platform,
  category: p.category,
  url: p.url,
  description: p.description,
  reviews: p.receivedCount ?? 0,
  pending: p.poolStatus === "queued" ? 1 : 0,
  verified: p.receivedCount ?? 0,
  matching: p.matching ?? "category",
}));
export const saveProduct = (form) => apiFetch("/products", {
  method: "POST",
  body: JSON.stringify({ productId: form.id, name: form.name, url: form.url, category: form.category, description: form.desc ?? form.description, matching: form.matching }),
});
export const deleteProduct = (id) => apiFetch(`/products/${id}`, { method: "DELETE" });

/* ---- assignment (mock ASSIGNED shape + submission state) ---- */
export const getAssignment = async () => {
  const { current, product, history } = await apiFetch("/assignment");
  return {
    assigned: current && product ? {
      assignmentId: current.assignmentId,
      name: product.name,
      developer: "a fellow developer", // owner identity is intentionally not exposed pre-review
      devScore: null,
      category: product.category,
      platform: product.platform,
      description: product.description,
      url: product.url,
      assignedAgo: timeAgo(current.assignedAt),
      deadline: daysLeft(current.dueAt),
      state: current.state,
    } : null,
    submitted: !!history.find(h => h.state === "submitted"),
    history: history.map((h, i) => ({
      id: h.assignmentId ?? i,
      product: h.productName ?? "Product",
      developer: "",
      state: h.state === "skipped" || h.state === "expired" ? "pending" : h.state,
      time: timeAgo(h.submittedAt ?? h.assignedAt),
      rating: h.ownerRating ?? null,
    })),
  };
};
export const submitReview = (link, text) => apiFetch("/assignment/submit", { method: "POST", body: JSON.stringify({ link, text }) });
export const skipAssignment = () => apiFetch("/assignment/skip", { method: "POST" });

/* ---- incoming (mock INCOMING_REVIEWS shape) ---- */
export const getIncoming = async () => (await apiFetch("/incoming")).map(r => ({
  id: r.assignmentId,
  reviewer: r.reviewer.name,
  score: r.reviewer.trustScore,
  given: r.reviewer.given,
  productId: r.productId,
  product: "",
  excerpt: r.reviewText || "(no text pasted — read it at the link)",
  link: r.reviewLink,
  time: timeAgo(r.submittedAt),
  state: r.state,
  rating: r.ownerRating,
}));
export const verifyReview = (assignmentId, rating = 5) => apiFetch("/incoming/verify", { method: "POST", body: JSON.stringify({ assignmentId, rating }) });
export const flagReview = (assignmentId, reason = "") => apiFetch("/incoming/flag", { method: "POST", body: JSON.stringify({ assignmentId, reason }) });

/* ---- community ---- */
export const getMember = (id) => apiFetch(`/member/${id}`);
export const getLeaderboard = async () => {
  // public endpoint — no auth header needed
  const res = await fetch(`${API}/leaderboard`);
  const rows = await res.json();
  return rows.map(r => ({
    rank: r.rank,
    userId: r.userId,
    name: r.name,
    given: r.given,
    received: r.received,
    verified: r.verified,
    score: r.score,
    streak: 0,
    category: r.category,
    badges: r.badges,
  }));
};
