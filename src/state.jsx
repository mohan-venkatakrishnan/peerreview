import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ACCOUNTS, MY_PRODUCTS, REVIEW_POOL, INCOMING_REVIEWS, REVIEW_HISTORY, LEADERBOARD_FULL, genProducts } from "./data/mock";
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
  const [mockReviewed, setMockReviewed] = useState([]); // productIds reviewed this session
  const [privacy, setPrivacyState] = useState({ showName: false, showEmail: false, showPhoto: false });
  const [plan, setPlanState] = useState(() => localStorage.getItem("peerreview-plan") || "free");
  const [account, setAccountState] = useState(() => {
    try { return JSON.parse(localStorage.getItem("peerreview-account")) || { ...ACCOUNTS[0], avatar: null }; }
    catch { return { ...ACCOUNTS[0], avatar: null }; }
  });

  /* ---------- real-mode data ---------- */
  const [me, setMe] = useState(null);
  const [realProducts, setRealProducts] = useState([]);
  const [realPool, setRealPool] = useState([]);
  const [realSkipped, setRealSkipped] = useState([]);
  const [mockSkipped, setMockSkipped] = useState([]); // productIds parked (mock)

  // Optimistic overlay (real mode). Every list read from an eventually-consistent
  // GSI, so a refetch right after a write can still return the pre-write state
  // and momentarily undo an optimistic change (the "card flashes back" bug). We
  // keep server data raw in real*, layer these overlays on top when deriving the
  // UI lists, and prune each overlay entry only once the server agrees — so the
  // change is stable from click until confirmed, with no flicker.
  const [opt, setOpt] = useState({ poolHide: {}, poolShow: {}, skipHide: {}, skipShow: {}, incoming: {} });
  const omit = (obj, k) => { const { [k]: _drop, ...rest } = obj; return rest; };
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


  // Version counter guarding every fetch-then-set (web-app-craft: a slow
  // response landing after a local edit must never wipe the edit).
  const meVersion = useRef(0);
  const pendingMePatch = useRef(null);
  const mePatchTimer = useRef(null);

  // silent=true for background refreshes (poll / tab focus): update data in
  // place with no loading takeover and no error screen — the initial load is
  // the only one that shows the spinner.
  const loadData = async (silent = false) => {
    if (USE_MOCK) return;
    // Live never shows sample rows — real leaderboard or an honest empty state.
    api.getLeaderboard()
      .then(lb => setLeaderboardRows(lb))
      .catch(() => setLeaderboardRows([]));
    if (!isAuthed()) { setLoading(false); return; }
    if (!silent) { setLoading(true); setLoadError(null); }
    const version = meVersion.current;
    try {
      const [meData, products, assignment, incoming] = await Promise.all([
        api.getMe(), api.getProducts(), api.getAssignment(), api.getIncoming(),
      ]);
      // a local edit happened while this was in flight — its response wins
      if (meVersion.current === version) setMe(meData);
      setRealProducts(products);
      setRealPool(assignment.pool);
      setRealSkipped(assignment.skipped ?? []);
      setRealSubmitted(assignment.submitted);
      setRealHistory(assignment.history);
      setRealIncoming(incoming);
      // Drop overlay entries the server now confirms; keep the rest so a still-
      // stale read can't flash the old state back.
      const poolIds = new Set(assignment.pool.map(p => p.productId));
      const skipIds = new Set((assignment.skipped ?? []).map(p => p.productId));
      const incState = Object.fromEntries(incoming.map(r => [r.id, r.state]));
      const prune = (o, keep) => Object.fromEntries(Object.entries(o).filter(([k, v]) => keep(k, v)));
      setOpt(o => ({
        poolHide: prune(o.poolHide, id => poolIds.has(id)),   // still hiding? only while server still lists it
        poolShow: prune(o.poolShow, id => !poolIds.has(id)),  // still injecting? only until server lists it
        skipHide: prune(o.skipHide, id => skipIds.has(id)),
        skipShow: prune(o.skipShow, id => !skipIds.has(id)),
        incoming: prune(o.incoming, (id, st) => incState[id] !== st), // override until server agrees
      }));
      if (!silent) setLoadError(null);
    } catch (e) {
      if (!silent) setLoadError(e.message); // background failures keep stale data, no takeover
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (USE_MOCK) return;
    // Keep the queue/incoming fresh without a manual reload: poll every 30s,
    // and refetch the moment the tab regains focus.
    const iv = setInterval(() => { if (isAuthed()) loadData(true); }, 30000);
    const onFocus = () => { if (document.visibilityState === 'visible' && isAuthed()) loadData(true); };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onFocus); window.removeEventListener('focus', onFocus); };
  }, []);

  /* ---------- unified surface ---------- */
  // QA affordance (mock only): localStorage 'peerreview-qa-products' = N
  const qaCount = USE_MOCK ? Number(localStorage.getItem("peerreview-qa-products")) || 0 : 0;
  const products = USE_MOCK ? (qaCount ? genProducts(qaCount) : MY_PRODUCTS) : realProducts;
  const dedupById = (arr) => { const seen = new Set(); return arr.filter(p => !seen.has(p.productId) && seen.add(p.productId)); };
  const incoming = USE_MOCK
    ? INCOMING_REVIEWS.map(r => ({
        ...r,
        state: mockVerified.includes(r.id) ? "verified" : mockFlagged.includes(r.id) ? "flagged" : "pending",
      }))
    : realIncoming.map(r => (opt.incoming[r.id] ? { ...r, state: opt.incoming[r.id] } : r));
  // the open pool of products this member can review right now, split from the
  // ones they've parked in "Not interested" — overlay applied so optimistic
  // moves stay put until the server confirms them
  const reviewablePool = USE_MOCK
    ? REVIEW_POOL.filter(p => !mockReviewed.includes(p.productId) && !mockSkipped.includes(p.productId))
    : dedupById([...Object.values(opt.poolShow), ...realPool]).filter(p => !opt.poolHide[p.productId]);
  const skippedPool = USE_MOCK
    ? REVIEW_POOL.filter(p => mockSkipped.includes(p.productId) && !mockReviewed.includes(p.productId))
    : dedupById([...Object.values(opt.skipShow), ...realSkipped]).filter(p => !opt.skipHide[p.productId]);
  const reviewSubmitted = USE_MOCK ? mockReviewed.length > 0 : realSubmitted;
  const history = USE_MOCK ? REVIEW_HISTORY : realHistory;

  const unifiedAccount = USE_MOCK ? account : (me ? {
    id: me.userId, name: me.name, email: me.email,
    plan: me.plan, score: me.trustScore, avatar: me.avatarData ?? null, // stored on the account, gated by privacy
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
    // Optimistic overlay: force this card to 'verified' until the server (read
    // from an eventually-consistent GSI) reports the same, so it neither needs
    // a reload nor flashes back to 'submitted'.
    setOpt(o => ({ ...o, incoming: { ...o.incoming, [id]: "verified" } }));
    try { await api.verifyReview(id, rating); }
    catch (e) { setSaveError(e.message); setOpt(o => ({ ...o, incoming: omit(o.incoming, id) })); } // revert
    finally { setStampAnimating(null); }
    loadData(true);
  };

  const flagReview = async (id, reason) => {
    if (USE_MOCK) { setMockFlagged(f => [...f, id]); return; }
    setOpt(o => ({ ...o, incoming: { ...o.incoming, [id]: "flagged" } }));
    try { await api.flagReview(id, reason); }
    catch (e) { setSaveError(e.message); setOpt(o => ({ ...o, incoming: omit(o.incoming, id) })); }
    loadData(true);
  };

  const submitReview = async (productId, ownerId, link, text) => {
    if (USE_MOCK) { setMockReviewed(r => [...r, productId]); return; }
    // Overlay: hide from both lists until the server confirms; can't be
    // submitted twice while in flight and won't flash back on the next refetch.
    setOpt(o => ({ ...o, poolHide: { ...o.poolHide, [productId]: true }, skipHide: { ...o.skipHide, [productId]: true }, poolShow: omit(o.poolShow, productId), skipShow: omit(o.skipShow, productId) }));
    try { await api.submitReview(productId, ownerId, link, text); }
    catch (e) { setOpt(o => ({ ...o, poolHide: omit(o.poolHide, productId) })); throw e; } // let the card surface the error + restore
    loadData(true);
  };

  // "Not interested": park a product (hides it from the queue, dings Trust
  // Score) or move it back. Overlay keeps the move stable until confirmed.
  const skipProduct = async (product) => {
    const id = product.productId;
    if (USE_MOCK) { setMockSkipped(s => [...s, id]); return; }
    setOpt(o => ({ ...o, poolHide: { ...o.poolHide, [id]: true }, skipShow: { ...o.skipShow, [id]: product }, poolShow: omit(o.poolShow, id), skipHide: omit(o.skipHide, id) }));
    try { await api.skipProduct(id, false); } finally { loadData(true); }
  };
  const unskipProduct = async (product) => {
    const id = product.productId;
    if (USE_MOCK) { setMockSkipped(s => s.filter(x => x !== id)); return; }
    setOpt(o => ({ ...o, skipHide: { ...o.skipHide, [id]: true }, poolShow: { ...o.poolShow, [id]: product }, skipShow: omit(o.skipShow, id), poolHide: omit(o.poolHide, id) }));
    try { await api.skipProduct(id, true); } finally { loadData(true); }
  };

  const saveProduct = async (form) => {
    if (USE_MOCK) return { ok: true };
    const saved = await api.saveProduct(form);
    await loadData(true);
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
    const server = {};
    if (patch.name !== undefined) server.name = patch.name;
    if (patch.avatar !== undefined) server.avatarData = patch.avatar; // stored server-side, masked per privacy
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
      products, reviewablePool, skippedPool, incoming, history, reviewSubmitted,
      leaderboard: leaderboardRows,
      privacy: USE_MOCK ? privacy : (me?.privacy ?? privacy),
      plan: USE_MOCK ? plan : (me?.plan ?? "free"),
      matching: USE_MOCK ? productForm.matching : (me?.matching ?? "category"),
      // derived (kept for existing pages)
      verifiedIds: incoming.filter(r => r.state === "verified").map(r => r.id),
      flaggedIds: incoming.filter(r => r.state === "flagged").map(r => r.id),
      stampAnimating,
      // actions
      verifyReview, flagReview, submitReview, skipProduct, unskipProduct, saveProduct,
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
