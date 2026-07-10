/* Cognito hosted-UI auth (code grant, no client secret) — LaunchPad pattern */

const domain = import.meta.env.VITE_COGNITO_DOMAIN;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

const TOKENS_KEY = "peerreview-tokens";

export const getTokens = () => {
  try { return JSON.parse(localStorage.getItem(TOKENS_KEY)) || null; }
  catch { return null; }
};

const saveTokens = (t) => localStorage.setItem(TOKENS_KEY, JSON.stringify({
  idToken: t.id_token,
  accessToken: t.access_token,
  refreshToken: t.refresh_token ?? getTokens()?.refreshToken,
  expiresAt: Date.now() + (t.expires_in ?? 3600) * 1000,
}));

export const isAuthed = () => {
  const t = getTokens();
  return !!t?.idToken && t.expiresAt > Date.now();
};

export const login = () => {
  const redirect = `${window.location.origin}/auth/callback`;
  window.location.href = `https://${domain}/oauth2/authorize?client_id=${clientId}` +
    `&response_type=code&scope=openid+email+profile&identity_provider=Google` +
    `&redirect_uri=${encodeURIComponent(redirect)}`;
};

export const logout = () => {
  localStorage.removeItem(TOKENS_KEY);
  window.location.href = `https://${domain}/logout?client_id=${clientId}` +
    `&logout_uri=${encodeURIComponent(window.location.origin)}`;
};

export const handleCallback = async (code) => {
  const res = await fetch(`https://${domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code,
      redirect_uri: `${window.location.origin}/auth/callback`,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed (${res.status})`);
  saveTokens(await res.json());
};

export const refreshTokens = async () => {
  const t = getTokens();
  if (!t?.refreshToken) return false;
  const res = await fetch(`https://${domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      refresh_token: t.refreshToken,
    }),
  });
  if (!res.ok) return false;
  saveTokens(await res.json());
  return true;
};

/* id token for API calls, refreshing when near expiry */
export const getIdToken = async () => {
  let t = getTokens();
  if (!t) return null;
  if (t.expiresAt - Date.now() < 60_000) {
    if (!(await refreshTokens())) return null;
    t = getTokens();
  }
  return t.idToken;
};
