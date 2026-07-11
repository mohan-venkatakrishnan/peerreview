import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ACCOUNTS, MY_PRODUCTS, ASSIGNED, INCOMING_REVIEWS, REVIEW_HISTORY, LEADERBOARD_FULL, genProducts } from "./data/mock";
import * as api from "./data/api";
import { isAuthed, login, logout as authLogout } from "./data/auth";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  /* ---------- UI state (both modes) ---------- */
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState("");
  const [stampAnimating, setStampAnimating] = useState(null);
  const [reviewLinkPasted, setReviewLinkPasted] = useState("");
  const [productForm, setProductForm] = useState({ name: "", platform: "", url: "", category: "", desc: "", matching: "category" });

  /* ---------- mock-mode interaction state ---------- */
  const [mockVerified, setMockVerified] = useState([]);
  const [mockFlagged, setMockFlagged] = useState([]);
  const [mockSubmitted, setMockSubmitted] = useState(false);
  const [privacy, setPrivacyState] = useState({ showName: false, showEmail: false, showPhoto: false });
  const [plan, setPlanState] = useState(() => localStorage.getItem("peerreview-plan") || "free");
  const [account, setAccountState] = useState(() => {
    try { return JSON.parse(localStorage.getItem("peerreview-account")) || { ...ACCOUNTS[0], avatar: null }; }
    catch { return { ...ACCOUNTS[0], avatar: null }; }
  });

  /* ---------- real-mode data ---------- */
  const [me, setMe] = useState(null);
  const [realProducts, setRealProducts] = useState([]);
  const [realAssigned, setRealAssigned] = useState(null);
  const [realSubmitted, setRealSubmitted] = useState(false);
  const [realIncoming, setRealIncoming] = useState([]);
  const [realHistory, setRealHistory] = useState([]);
  const [leaderboardRows, setLeaderboardRows] = useState(USE_MOCK ? LEADERBOARD_FULL : []);
  const [loading, setLoading] = useState(!USE_MOCK);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null); // background writes: banner, never a full-screen takeover
  const [saveStatus, setSaveStatus] = useState(null); // 'saving' | 'saved' — settings feedback chip
  const savedTimer = useRef(null);
  const markSaved = () => {
    setSaveStatus("saved");
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaveStatus(null), 2200);
  };

  const SAMPLE_LB = LEADERBOARD_FULL.map(r => ({ ...r, sample: true }));

  // Version counter guarding every fetch-then-set (web-app-craft: a slow
  // response landing after a local edit must never wipe the edit).
  const meVersion = useRef(0);
  const pendingMePatch = useRef(null);
  const mePatchTimer = useRef(null);

  const loadData = async () => {
    if (USE_MOCK) return;
    // The leaderboard endpoint is public — load it signed-out too. Empty pool
    // pre-launch shows the sample cohort (labelled in the table).
    api.getLeaderboard()
      .then(lb => setLeaderboardRows(lb.length ? lb : SAMPLE_LB))
      .catch(() => setLeaderboardRows(SAMPLE_LB));
    if (!isAuthed()) { setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    const version = meVersion.current;
    try {
      const [meData, products, assignment, incoming] = await Promise.all([
        api.getMe(), api.getProducts(), api.getAssignment(), api.getIncoming(),
      ]);
      // a local edit happened while this was in flight — its response wins
      if (meVersion.current === version) setMe(meData);
      setRealProducts(products);
      setRealAssigned(assignment.assigned);
      setRealSubmitted(assignment.submitted);
      setRealHistory(assignment.history);
      setRealIncoming(incoming);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  /* ---------- unified surface ---------- */
  // QA affordance (mock only): localStorage 'peerreview-qa-products' = N
  const qaCount = USE_MOCK ? Number(localStorage.getItem("peerreview-qa-products")) || 0 : 0;
  const products = USE_MOCK ? (qaCount ? genProducts(qaCount) : MY_PRODUCTS) : realProducts;
  const incoming = USE_MOCK
    ? INCOMING_REVIEWS.map(r => ({
        ...r,
        state: mockVerified.includes(r.id) ? "verified" : mockFlagged.includes(r.id) ? "flagged" : "pending",
      }))
    : realIncoming;
  const assigned = USE_MOCK ? (mockSubmitted ? null : ASSIGNED) : realAssigned;
  const reviewSubmitted = USE_MOCK ? mockSubmitted : (realSubmitted && !realAssigned);
  const history = USE_MOCK ? REVIEW_HISTORY : realHistory;

  const unifiedAccount = USE_MOCK ? account : (me ? {
    id: me.userId, name: me.name, email: me.email,
    plan: me.plan, score: me.trustScore, avatar: account.avatar, // avatar stays local
  } : { name: "…", email: "", plan: "free", score: 0, avatar: null });

  const stats = USE_MOCK
    ? { given: 12, received: 8, verified: 10, trust: 4.6, rank: 4, credits: 1 }
    : {
        given: me?.given ?? 0, received: me?.received ?? 0,
        verified: me?.verifiedGiven ?? 0, trust: me?.trustScore ?? 0,
        rank: leaderboardRows.find(r => r.userId === me?.userId)?.rank ?? null,
        credits: me?.creditBalance ?? 0,
      };

  /* ---------- actions ---------- */
  const verifyReview = async (id, rating = 5) => {
    setStampAnimating(id);
    if (USE_MOCK) {
      setTimeout(() => { setMockVerified(v => [...v, id]); setStampAnimating(null); }, 500);
      return;
    }
    try { await api.verifyReview(id, rating); await loadData(); }
    finally { setStampAnimating(null); }
  };

  const flagReview = async (id, reason) => {
    if (USE_MOCK) { setMockFlagged(f => [...f, id]); return; }
    await api.flagReview(id, reason);
    await loadData();
  };

  const submitReview = async (link, text) => {
    if (USE_MOCK) { setMockSubmitted(true); return; }
    await api.submitReview(link, text);
    await loadData();
  };

  const skipAssignment = async () => {
    if (USE_MOCK) return;
    await api.skipAssignment();
    await loadData();
  };

  const saveProduct = async (form) => {
    if (USE_MOCK) return { ok: true };
    const saved = await api.saveProduct(form);
    await loadData();
    return saved;
  };

  /* Server profile writes: optimistic local set immediately, PUT debounced
     (a name typed letter-by-letter is one request, not twelve), and the
     response is discarded if a newer local write happened meanwhile. */
  const flushMePatch = async () => {
    const patch = pendingMePatch.current;
    pendingMePatch.current = null;
    if (!patch) return;
    meVersion.current += 1;
    const version = meVersion.current;
    try {
      const server = await api.updateMe(patch);
      if (meVersion.current === version) setMe(server);
      setSaveError(null);
      markSaved();
    } catch (e) {
      setSaveError(e.message);
    }
  };

  const queueMePatch = (server) => {
    setSaveStatus("saving");
    meVersion.current += 1; // local write wins over any in-flight response
    setMe(m => (m ? { ...m, ...server } : m));
    pendingMePatch.current = { ...(pendingMePatch.current ?? {}), ...server };
    clearTimeout(mePatchTimer.current);
    mePatchTimer.current = setTimeout(flushMePatch, 600);
  };

  const updateProfile = (patch) => {
    if (USE_MOCK) {
      const next = { ...account, ...patch };
      setAccountState(next);
      localStorage.setItem("peerreview-account", JSON.stringify(next));
      markSaved();
      return;
    }
    if (patch.avatar !== undefined) { // avatar is browser-local in both modes for now
      const next = { ...account, avatar: patch.avatar };
      setAccountState(next);
      localStorage.setItem("peerreview-account", JSON.stringify(next));
    }
    const server = {};
    if (patch.name !== undefined) server.name = patch.name;
    if (patch.matching !== undefined) server.matching = patch.matching;
    if (Object.keys(server).length) queueMePatch(server);
  };

  const setPrivacy = (updater) => {
    const next = typeof updater === "function" ? updater(USE_MOCK ? privacy : (me?.privacy ?? privacy)) : updater;
    if (USE_MOCK) { setPrivacyState(next); markSaved(); return; }
    queueMePatch({ privacy: next });
  };

  const setMatching = (matching) => {
    setProductForm(f => ({ ...f, matching }));
    if (!USE_MOCK) queueMePatch({ matching });
  };

  const switchAccount = (id) => {
    if (!USE_MOCK) { login(); return; } // real mode: re-run Google sign-in
    const acc = ACCOUNTS.find(a => a.id === id);
    if (!acc) return;
    const next = { ...acc, avatar: null };
    setAccountState(next);
    localStorage.setItem("peerreview-account", JSON.stringify(next));
    setPlanState(acc.plan);
    localStorage.setItem("peerreview-plan", acc.plan);
  };

  const signOut = () => {
    if (USE_MOCK) return;
    authLogout();
  };

  const setPlan = (p) => { setPlanState(p); localStorage.setItem("peerreview-plan", p); };

  return (
    <AppStateContext.Provider value={{
      useMock: USE_MOCK,
      loading, loadError, loadData,
      saveError, clearSaveError: () => setSaveError(null),
      saveStatus,
      resetProductForm: () => setProductForm({ name: "", platform: "", url: "", category: "", desc: "", matching: productForm.matching }),
      // data
      account: unifiedAccount, me, stats,
      badges: USE_MOCK ? ["seal", "box", "quill", "stack", "bolt", "shield"] : (me?.badges ?? []),
      products, assigned, incoming, history, reviewSubmitted,
      leaderboard: leaderboardRows,
      privacy: USE_MOCK ? privacy : (me?.privacy ?? privacy),
      plan: USE_MOCK ? plan : (me?.plan ?? "free"),
      matching: USE_MOCK ? productForm.matching : (me?.matching ?? "category"),
      // derived (kept for existing pages)
      verifiedIds: incoming.filter(r => r.state === "verified").map(r => r.id),
      flaggedIds: incoming.filter(r => r.state === "flagged").map(r => r.id),
      stampAnimating,
      // actions
      verifyReview, flagReview, submitReview, skipAssignment, saveProduct,
      updateProfile, setPrivacy, setMatching, switchAccount, signOut, setPlan,
      // ui state
      reviewLinkPasted, setReviewLinkPasted,
      productForm, setProductForm,
      spotlightOpen, setSpotlightOpen,
      spotlightQuery, setSpotlightQuery,
    }}>
      {children}
    </AppStateContext.Provider>
  );
}

export const useAppState = () => useContext(AppStateContext);
