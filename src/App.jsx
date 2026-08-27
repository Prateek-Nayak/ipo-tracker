import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";

/* ---------------------------------------------------------
   THEME
   Ledger / stock-certificate inspired: paper surface, deep
   navy ink, brass-gold for pending, forest green for gains,
   brick red for losses.
---------------------------------------------------------- */
const COLORS = {
  bg: "#F7F5F0",
  surface: "#FFFFFF",
  border: "#E4DFD3",
  ink: "#1C2333",
  inkSoft: "#6B7280",
  navy: "#1F3A5F",
  navyDeep: "#152A44",
  gold: "#B08D57",
  goldSoft: "#F1E6D2",
  green: "#2F6F4E",
  greenSoft: "#E4F0E9",
  red: "#A13D3D",
  redSoft: "#F5E4E2",
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');`;

/* ---------------------------------------------------------
   INLINE SVG ICONS (no external icon dependency)
---------------------------------------------------------- */
const SvgIcon = ({ size = 18, color = "currentColor", strokeWidth = 2, children, style = {}, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
  >
    {children}
  </svg>
);

const Plus = (p) => <SvgIcon {...p}><path d="M5 12h14" /><path d="M12 5v14" /></SvgIcon>;
const X = (p) => <SvgIcon {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></SvgIcon>;
const Users = (p) => <SvgIcon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></SvgIcon>;
const Receipt = (p) => <SvgIcon {...p}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17.5v-11" /></SvgIcon>;
const LayoutDashboard = (p) => <SvgIcon {...p}><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></SvgIcon>;
const TrendingUp = (p) => <SvgIcon {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></SvgIcon>;
const TrendingDown = (p) => <SvgIcon {...p}><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></SvgIcon>;
const ArrowRightLeft = (p) => <SvgIcon {...p}><path d="m16 3 4 4-4 4" /><path d="M20 7H4" /><path d="m8 21-4-4 4-4" /><path d="M4 17h16" /></SvgIcon>;
const Pencil = (p) => <SvgIcon {...p}><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></SvgIcon>;
const Trash2 = (p) => <SvgIcon {...p}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></SvgIcon>;
const CheckCircle2 = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></SvgIcon>;
const Clock = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></SvgIcon>;
const XCircle = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></SvgIcon>;
const Landmark = (p) => <SvgIcon {...p}><line x1="3" x2="21" y1="22" y2="22" /><line x1="6" x2="6" y1="18" y2="11" /><line x1="10" x2="10" y1="18" y2="11" /><line x1="14" x2="14" y1="18" y2="11" /><line x1="18" x2="18" y1="18" y2="11" /><polygon points="12 2 20 7 4 7" /></SvgIcon>;
const Loader2 = (p) => <SvgIcon {...p}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></SvgIcon>;
const CloudIcon = (p) => <SvgIcon {...p}><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></SvgIcon>;
const CloudOff = (p) => <SvgIcon {...p}><path d="m2 2 20 20" /><path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193" /><path d="M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07" /></SvgIcon>;
const DownloadIcon = (p) => <SvgIcon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></SvgIcon>;
const LogOut = (p) => <SvgIcon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></SvgIcon>;

/* ---------------------------------------------------------
   FORMATTING HELPERS
---------------------------------------------------------- */
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const inr = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return isNaN(dt) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtTime = (d) => (d ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "");

const ALLOTMENT_STATUSES = ["Pending", "Allotted", "Partial", "Not Allotted"];
const STATUS_META = {
  Pending: { color: COLORS.gold, bg: COLORS.goldSoft, icon: Clock },
  Allotted: { color: COLORS.green, bg: COLORS.greenSoft, icon: CheckCircle2 },
  Partial: { color: COLORS.gold, bg: COLORS.goldSoft, icon: CheckCircle2 },
  "Not Allotted": { color: COLORS.red, bg: COLORS.redSoft, icon: XCircle },
};

const TABLES = ["accounts", "ipos", "transfers"];

/* ---------------------------------------------------------
   LOCAL STORAGE
   Keys are deliberately identical to the original single-file
   build ("ipo_ledger_*") so an existing install on the same
   origin keeps its data and uploads it on first sign-in.
---------------------------------------------------------- */
const STORAGE_PREFIX = "ipo_ledger_";

function loadTable(key) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function saveTable(key, data) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error("storage save failed", key, e);
  }
}
function loadLocalState() {
  return { accounts: loadTable("accounts"), ipos: loadTable("ipos"), transfers: loadTable("transfers") };
}
function isEmptyState(s) {
  return !s.accounts.length && !s.ipos.length && !s.transfers.length;
}

// Which account the data cached on this device belongs to. Absent means the
// data predates cloud sync (the original localStorage-only build), which is
// exactly the case we want to upload on first sign-in. A different id means
// someone else was signed in here, and their ledger must not be adopted.
const OWNER_KEY = STORAGE_PREFIX + "owner";
function localOwner() {
  try { return localStorage.getItem(OWNER_KEY); } catch { return null; }
}
function setLocalOwner(id) {
  try {
    if (id) localStorage.setItem(OWNER_KEY, id);
    else localStorage.removeItem(OWNER_KEY);
  } catch { /* ignore */ }
}

/* ---------------------------------------------------------
   SUPABASE CLOUD SYNC
   Talks to the Supabase auth + REST endpoints directly, so no
   extra client library is needed. The anon key is public by
   design; Row Level Security is what protects the data.
---------------------------------------------------------- */
const CLOUD = {
  url: (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, ""),
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
};

const cloudEnabled = () => !!(CLOUD.url && CLOUD.anonKey);

class AuthError extends Error {}

const SESSION_KEY = STORAGE_PREFIX + "session";

function readStoredSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    return s && s.access_token ? s : null;
  } catch {
    return null;
  }
}

let currentSession = readStoredSession();
const sessionListeners = new Set();

function setSession(session) {
  currentSession = session;
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error("session save failed", e);
  }
  sessionListeners.forEach((fn) => fn(session));
}

function normalizeSession(raw, fallbackUser) {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: raw.access_token,
    refresh_token: raw.refresh_token,
    user: raw.user || fallbackUser || null,
    expires_at: Number(raw.expires_at) || now + (Number(raw.expires_in) || 3600),
  };
}

async function gotrue(path, options = {}) {
  const r = await fetch(`${CLOUD.url}/auth/v1/${path}`, {
    ...options,
    headers: { apikey: CLOUD.anonKey, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const text = await r.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { /* non-JSON error body */ }
  if (!r.ok) {
    const err = new Error(data.error_description || data.msg || data.message || `Request failed (${r.status})`);
    err.status = r.status;
    throw err;
  }
  return data;
}

async function cloudSignUp(email, password) {
  return gotrue("signup", { method: "POST", body: JSON.stringify({ email, password }) });
}
async function cloudGetUser(accessToken) {
  return gotrue("user", { headers: { Authorization: `Bearer ${accessToken}` } });
}
async function cloudSignIn(email, password) {
  return gotrue("token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
}
async function cloudSignOut() {
  const s = currentSession;
  setSession(null);
  if (!s?.access_token) return;
  try {
    await gotrue("logout", { method: "POST", headers: { Authorization: `Bearer ${s.access_token}` } });
  } catch {
    // The local session is already cleared; a failed remote logout is not worth surfacing.
  }
}

// Supabase access tokens expire after about an hour. Refresh before use, and
// collapse concurrent refreshes into a single in-flight request.
let refreshInFlight = null;

async function getFreshSession() {
  const s = currentSession;
  if (!s?.access_token) throw new AuthError("Not signed in.");
  const now = Math.floor(Date.now() / 1000);
  if (s.expires_at - 60 > now) return s;
  if (!s.refresh_token) {
    setSession(null);
    throw new AuthError("Session expired. Please sign in again.");
  }
  if (!refreshInFlight) {
    refreshInFlight = gotrue("token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    })
      .then((data) => {
        const next = normalizeSession(data, s.user);
        setSession(next);
        return next;
      })
      .catch(() => {
        setSession(null);
        throw new AuthError("Session expired. Please sign in again.");
      })
      .finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

// Supabase sends the user back from a confirmation or recovery email with the
// session in the URL fragment (#access_token=...). Pick it up so the link lands
// straight in the ledger instead of on the sign-in screen.
function readAuthHash() {
  const hash = typeof window !== "undefined" ? window.location.hash || "" : "";
  if (!/(^|[#&])(access_token|error|error_description)=/.test(hash)) return null;
  return new URLSearchParams(hash.slice(1));
}

function clearAuthHash() {
  try {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  } catch {
    window.location.hash = "";
  }
}

async function rest(path, options = {}) {
  const session = await getFreshSession();
  const r = await fetch(`${CLOUD.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: CLOUD.anonKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  // Read the body once, as text. A write sent with `Prefer: return=minimal`
  // comes back 201 with an empty body, so never hand an empty string to JSON.parse.
  const text = await r.text();
  if (!r.ok) {
    if (r.status === 401) {
      setSession(null);
      throw new AuthError("Session expired. Please sign in again.");
    }
    throw new Error(`Cloud request failed (${r.status}): ${text.slice(0, 300)}`);
  }
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Cloud returned a response that could not be read: ${text.slice(0, 200)}`);
  }
}

async function cloudLoad() {
  const rows = await rest("user_data?select=kind,data");
  const out = { accounts: [], ipos: [], transfers: [] };
  (rows || []).forEach((row) => {
    if (TABLES.includes(row.kind) && Array.isArray(row.data)) out[row.kind] = row.data;
  });
  return out;
}

async function cloudSave(userId, state) {
  const rows = TABLES.map((kind) => ({
    user_id: userId,
    kind,
    data: state[kind] || [],
    updated_at: new Date().toISOString(),
  }));
  await rest("user_data?on_conflict=user_id,kind", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
}

/* ---------------------------------------------------------
   IMPORT / EXPORT
---------------------------------------------------------- */
function buildExport(state) {
  return JSON.stringify(
    { app: "ipo-ledger", version: 1, exportedAt: new Date().toISOString(), ...state },
    null,
    2
  );
}

function mergeById(current, incoming) {
  const byId = new Map(current.map((x) => [x.id, x]));
  incoming.forEach((x) => {
    if (x && x.id && !byId.has(x.id)) byId.set(x.id, x);
  });
  return Array.from(byId.values());
}

function mergeIpos(current, incoming) {
  const byId = new Map(current.map((x) => [x.id, x]));
  incoming.forEach((ipo) => {
    if (!ipo || !ipo.id) return;
    const existing = byId.get(ipo.id);
    if (!existing) {
      byId.set(ipo.id, ipo);
      return;
    }
    // Same IPO on both sides: keep the local record, add any applications it lacks.
    byId.set(ipo.id, {
      ...existing,
      applications: mergeById(existing.applications || [], ipo.applications || []),
    });
  });
  return Array.from(byId.values());
}

function parseImport(text) {
  const parsed = JSON.parse(text);
  const out = {};
  TABLES.forEach((k) => {
    if (!Array.isArray(parsed[k])) throw new Error(`Missing or invalid "${k}" list in the pasted data.`);
    out[k] = parsed[k];
  });
  return out;
}

/* ---------------------------------------------------------
   SMALL UI PRIMITIVES
---------------------------------------------------------- */
function Badge({ children, color, bg }) {
  return (
    <span
      style={{
        color, background: bg, fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
        padding: "3px 8px", borderRadius: 5, whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{
        display: "block", fontSize: 11, fontWeight: 600, color: COLORS.inkSoft,
        textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6,
        fontFamily: "Inter, sans-serif",
      }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "10px 12px",
  minHeight: 44, WebkitAppearance: "none",
  border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 16,
  fontFamily: "Inter, sans-serif", color: COLORS.ink, background: "#FDFCFA",
  outline: "none",
};

function Input(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
function Select(props) {
  return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}

function Sheet({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(28,35,51,0.45)", zIndex: 50,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.bg, width: "100%", maxWidth: 480,
          maxHeight: "92vh", overflowY: "auto", borderRadius: "18px 18px 0 0",
          padding: "18px 18px calc(28px + env(safe-area-inset-bottom))",
          boxShadow: "0 -8px 30px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{
            fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 20, color: COLORS.navyDeep, margin: 0,
          }}>{title}</h2>
          <button onClick={onClose} aria-label="Close" style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 20,
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}><X size={16} color={COLORS.inkSoft} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PrimaryButton({ children, onClick, danger, ghost, disabled, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", padding: "13px 16px", borderRadius: 10,
        border: ghost ? `1px solid ${COLORS.border}` : "none",
        background: ghost ? COLORS.surface : danger ? COLORS.red : COLORS.navy,
        color: ghost ? COLORS.ink : "#fff",
        fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15,
        cursor: disabled ? "default" : "pointer", marginTop: 6,
        opacity: disabled ? 0.6 : 1,
      }}
    >{children}</button>
  );
}

/* ---------------------------------------------------------
   APP
---------------------------------------------------------- */
export default function App() {
  const [session, setSessionState] = useState(currentSession);
  const [authMode, setAuthMode] = useState("login");
  const [linkBusy, setLinkBusy] = useState(() => cloudEnabled() && !!readAuthHash());
  const [linkNotice, setLinkNotice] = useState("");

  const [tab, setTab] = useState("dashboard");
  const [accounts, setAccounts] = useState([]);
  const [ipos, setIpos] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [lastSync, setLastSync] = useState(null);

  const [ipoSheet, setIpoSheet] = useState(null);           // { ipo }
  const [appSheet, setAppSheet] = useState(null);           // { ipoId, application }
  const [acctSheet, setAcctSheet] = useState(null);         // { account }
  const [transferSheet, setTransferSheet] = useState(null); // { transfer }
  const [ipoDetail, setIpoDetail] = useState(null);         // ipo id
  const [dataSheetOpen, setDataSheetOpen] = useState(false);

  const skipNextAutoSync = useRef(true);

  // Keep React in step with the module-level session, which the token refresh
  // logic and any 401 response can also change.
  useEffect(() => {
    const listener = (s) => setSessionState(s);
    sessionListeners.add(listener);
    return () => { sessionListeners.delete(listener); };
  }, []);

  // Complete a sign-in that arrived via an email link.
  useEffect(() => {
    if (!linkBusy) return;
    const params = readAuthHash();
    clearAuthHash();
    if (!params) { setLinkBusy(false); return; }

    const token = params.get("access_token");
    if (!token) {
      const err = params.get("error_description") || params.get("error");
      setLinkNotice((err || "That link is no longer valid.").replace(/\+/g, " "));
      setLinkBusy(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const user = await cloudGetUser(token);
        if (cancelled) return;
        setSession(normalizeSession({
          access_token: token,
          refresh_token: params.get("refresh_token"),
          expires_at: params.get("expires_at"),
          expires_in: params.get("expires_in"),
          user,
        }));
      } catch {
        if (!cancelled) setLinkNotice("That link could not be used. Please sign in below.");
      } finally {
        if (!cancelled) setLinkBusy(false);
      }
    })();

    return () => { cancelled = true; };
  }, [linkBusy]);

  const userId = session?.user?.id || null;

  /* ---------- initial load: local first, then cloud ---------- */
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    skipNextAutoSync.current = true;

    (async () => {
      const local = loadLocalState();
      const apply = (s) => {
        setAccounts(s.accounts); setIpos(s.ipos); setTransfers(s.transfers);
      };

      if (!cloudEnabled() || !userId) {
        apply(local);
        setLoaded(true);
        return;
      }

      const owner = localOwner();
      const localIsOurs = !owner || owner === userId;
      const empty = { accounts: [], ipos: [], transfers: [] };

      apply(localIsOurs ? local : empty); // show something immediately, then reconcile
      setSyncing(true);
      try {
        const remote = await cloudLoad();
        if (cancelled) return;

        const commit = (state) => {
          apply(state);
          TABLES.forEach((k) => saveTable(k, state[k]));
        };

        if (!localIsOurs) {
          // Someone else's ledger is cached here; do not adopt or upload it.
          commit(isEmptyState(remote) ? empty : remote);
        } else if (isEmptyState(remote)) {
          // First sign-in for this account: seed the cloud from what is on this
          // device. This is how data from the localStorage-only build arrives.
          if (!isEmptyState(local)) await cloudSave(userId, local);
        } else if (!owner && !isEmptyState(local)) {
          // This device still holds data from the pre-sync build, and the cloud
          // already has something. Merge rather than overwrite, so it does not
          // matter which device gets synced first and nothing is ever lost.
          const merged = {
            accounts: mergeById(remote.accounts, local.accounts),
            ipos: mergeIpos(remote.ipos, local.ipos),
            transfers: mergeById(remote.transfers, local.transfers),
          };
          commit(merged);
          if (TABLES.some((k) => merged[k].length !== remote[k].length)) {
            await cloudSave(userId, merged);
          }
        } else {
          commit(remote);
        }
        if (cancelled) return;
        setLocalOwner(userId);
        setSyncError(""); setLastSync(new Date());
      } catch (e) {
        if (!cancelled) {
          console.error("Cloud load failed", e);
          setSyncError(e.message || "Could not reach the cloud.");
        }
      } finally {
        if (!cancelled) { setSyncing(false); setLoaded(true); }
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  /* ---------- writes ---------- */
  const persistAccounts = useCallback((next) => { setAccounts(next); saveTable("accounts", next); }, []);
  const persistIpos = useCallback((next) => { setIpos(next); saveTable("ipos", next); }, []);
  const persistTransfers = useCallback((next) => { setTransfers(next); saveTable("transfers", next); }, []);

  const pushToCloud = useCallback(async () => {
    if (!cloudEnabled() || !userId) return;
    setSyncing(true);
    try {
      const state = { accounts, ipos, transfers };
      // Never let a device that has nothing wipe a cloud that has something.
      // Without this, opening the app somewhere new and hitting Sync now would
      // overwrite the real ledger with three empty arrays.
      if (isEmptyState(state)) {
        const remote = await cloudLoad();
        if (!isEmptyState(remote)) {
          setSyncError("This device is empty but your cloud ledger is not. Nothing was overwritten — reload to pull it down.");
          return;
        }
      }
      await cloudSave(userId, state);
      setSyncError("");
      setLastSync(new Date());
    } catch (e) {
      console.error("Cloud save failed", e);
      setSyncError(e.message || "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }, [userId, accounts, ipos, transfers]);

  // Push edits to Supabase, debounced so a burst of edits collapses into one write.
  useEffect(() => {
    if (!loaded || !cloudEnabled() || !userId) return;
    if (skipNextAutoSync.current) { skipNextAutoSync.current = false; return; }
    const t = setTimeout(() => { pushToCloud(); }, 1000);
    return () => clearTimeout(t);
  }, [accounts, ipos, transfers, loaded, userId, pushToCloud]);

  const replaceAll = useCallback((state) => {
    persistAccounts(state.accounts);
    persistIpos(state.ipos);
    persistTransfers(state.transfers);
  }, [persistAccounts, persistIpos, persistTransfers]);

  /* ---------- derived numbers ---------- */
  const stats = useMemo(() => {
    let invested = 0, realized = 0, unrealized = 0, pendingCount = 0, activeCount = 0;
    ipos.forEach((ipo) => {
      (ipo.applications || []).forEach((app) => {
        if (app.allotmentStatus === "Pending") pendingCount++;
        if (app.allotmentStatus !== "Not Allotted") activeCount++;
        const shares = Number(app.sharesAllotted) || 0;
        const price = Number(ipo.priceBand) || 0;
        if (app.allotmentStatus === "Allotted" || app.allotmentStatus === "Partial") {
          invested += shares * price;
          if (app.sold) {
            realized += shares * ((Number(app.sellPrice) || 0) - price);
          } else if (ipo.listingPrice) {
            unrealized += shares * ((Number(ipo.listingPrice) || 0) - price);
          }
        }
      });
    });
    return { invested, realized, unrealized, pendingCount, activeCount };
  }, [ipos]);

  /* ---------- gates ---------- */
  if (linkBusy) return <Splash text="Signing you in…" />;

  if (cloudEnabled() && !session) {
    return <AuthScreen mode={authMode} setMode={setAuthMode} notice={linkNotice} />;
  }

  if (!loaded) return <Splash text="Loading ledger…" />;

  return (
    <div style={{
      minHeight: "100dvh", background: COLORS.bg, fontFamily: "Inter, sans-serif",
      color: COLORS.ink, paddingBottom: "calc(78px + env(safe-area-inset-bottom))",
      maxWidth: 520, margin: "0 auto", position: "relative",
    }}>
      <style>{FONT_IMPORT}</style>

      <Header
        tab={tab}
        syncing={syncing}
        syncError={syncError}
        cloudOn={cloudEnabled()}
        onOpenData={() => setDataSheetOpen(true)}
        onAdd={() => {
          if (tab === "ipos") setIpoSheet({ ipo: null });
          else if (tab === "accounts") setAcctSheet({ account: null });
          else if (tab === "transfers") setTransferSheet({ transfer: null });
        }}
      />

      <div style={{ padding: "14px 14px 0" }}>
        {tab === "dashboard" && (
          <Dashboard stats={stats} ipos={ipos} accounts={accounts} onOpenIpo={(id) => setIpoDetail(id)} />
        )}
        {tab === "ipos" && (
          <IpoList
            ipos={ipos} accounts={accounts}
            onOpen={(id) => setIpoDetail(id)}
            onEdit={(ipo) => setIpoSheet({ ipo })}
            onDelete={(id) => persistIpos(ipos.filter((x) => x.id !== id))}
          />
        )}
        {tab === "accounts" && (
          <AccountList
            accounts={accounts} ipos={ipos}
            onEdit={(account) => setAcctSheet({ account })}
            onDelete={(id) => persistAccounts(accounts.filter((x) => x.id !== id))}
          />
        )}
        {tab === "transfers" && (
          <TransfersScreen
            transfers={transfers} accounts={accounts}
            onEdit={(transfer) => setTransferSheet({ transfer })}
            onDelete={(id) => persistTransfers(transfers.filter((x) => x.id !== id))}
          />
        )}
      </div>

      <BottomNav tab={tab} setTab={setTab} />

      {ipoDetail && (
        <IpoDetailSheet
          ipo={ipos.find((i) => i.id === ipoDetail)}
          accounts={accounts}
          onClose={() => setIpoDetail(null)}
          onEditIpo={(ipo) => { setIpoDetail(null); setIpoSheet({ ipo }); }}
          onAddApplication={(ipoId) => setAppSheet({ ipoId, application: null })}
          onEditApplication={(ipoId, application) => setAppSheet({ ipoId, application })}
          onDeleteApplication={(ipoId, appId) => {
            persistIpos(ipos.map((i) => (i.id === ipoId
              ? { ...i, applications: (i.applications || []).filter((a) => a.id !== appId) }
              : i)));
          }}
        />
      )}

      {ipoSheet && (
        <IpoFormSheet
          initial={ipoSheet.ipo}
          onClose={() => setIpoSheet(null)}
          onSave={(data) => {
            if (ipoSheet.ipo) {
              persistIpos(ipos.map((i) => (i.id === data.id ? { ...i, ...data } : i)));
            } else {
              persistIpos([{ ...data, id: uid(), applications: [] }, ...ipos]);
            }
            setIpoSheet(null);
          }}
        />
      )}

      {appSheet && (
        <ApplicationFormSheet
          initial={appSheet.application}
          accounts={accounts}
          onClose={() => setAppSheet(null)}
          onSave={(data) => {
            persistIpos(ipos.map((i) => {
              if (i.id !== appSheet.ipoId) return i;
              const apps = i.applications || [];
              if (appSheet.application) {
                return { ...i, applications: apps.map((a) => (a.id === data.id ? data : a)) };
              }
              return { ...i, applications: [...apps, { ...data, id: uid() }] };
            }));
            setAppSheet(null);
          }}
        />
      )}

      {acctSheet && (
        <AccountFormSheet
          initial={acctSheet.account}
          onClose={() => setAcctSheet(null)}
          onSave={(data) => {
            if (acctSheet.account) {
              persistAccounts(accounts.map((a) => (a.id === data.id ? data : a)));
            } else {
              persistAccounts([{ ...data, id: uid() }, ...accounts]);
            }
            setAcctSheet(null);
          }}
        />
      )}

      {transferSheet && (
        <TransferFormSheet
          initial={transferSheet.transfer}
          accounts={accounts}
          ipos={ipos}
          onClose={() => setTransferSheet(null)}
          onSave={(data) => {
            if (transferSheet.transfer) {
              persistTransfers(transfers.map((t) => (t.id === data.id ? data : t)));
            } else {
              persistTransfers([{ ...data, id: uid() }, ...transfers]);
            }
            setTransferSheet(null);
          }}
        />
      )}

      {dataSheetOpen && (
        <DataSheet
          state={{ accounts, ipos, transfers }}
          session={session}
          cloudOn={cloudEnabled()}
          syncing={syncing}
          syncError={syncError}
          lastSync={lastSync}
          onClose={() => setDataSheetOpen(false)}
          onSyncNow={pushToCloud}
          onReplaceAll={replaceAll}
          onSignOut={async () => { setDataSheetOpen(false); await cloudSignOut(); }}
        />
      )}
    </div>
  );
}

function Splash({ text }) {
  return (
    <div style={{
      minHeight: "100dvh", background: COLORS.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ fontFamily: "'Fraunces', serif", color: COLORS.navy, fontSize: 18 }}>{text}</div>
    </div>
  );
}

/* ---------------------------------------------------------
   CHROME
---------------------------------------------------------- */
function Header({ tab, onAdd, onOpenData, syncing, syncError, cloudOn }) {
  const titles = { dashboard: "The Ledger", ipos: "IPOs", accounts: "Accounts", transfers: "Transfers" };
  const showAdd = tab !== "dashboard";
  const statusColor = !cloudOn ? COLORS.inkSoft : syncError ? COLORS.red : COLORS.gold;
  const StatusIcon = !cloudOn ? CloudOff : syncing ? Loader2 : CloudIcon;
  return (
    <div style={{
      background: COLORS.navyDeep,
      padding: "calc(18px + env(safe-area-inset-top)) 14px 14px",
      position: "sticky", top: 0, zIndex: 10,
      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap",
      rowGap: 10, columnGap: 8, borderBottom: `3px double ${COLORS.gold}`,
    }}>
      <div style={{ minWidth: 0, flexShrink: 1 }}>
        <div style={{
          fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 21, color: "#fff",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{titles[tab]}</div>
        {tab === "dashboard" && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: COLORS.gold, marginTop: 2, letterSpacing: 0.5 }}>
            FAMILY IPO REGISTER
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: "auto" }}>
        <button
          onClick={onOpenData}
          aria-label="Sync and data"
          title={!cloudOn ? "Cloud sync is off" : syncError ? "Sync problem" : syncing ? "Syncing…" : "Synced"}
          style={{
            width: 36, height: 36, borderRadius: 18, border: `1px solid ${statusColor}`,
            background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          <StatusIcon size={17} color={statusColor} className={syncing ? "spin" : undefined} />
        </button>
        {showAdd && (
          <button onClick={onAdd} aria-label="Add" style={{
            width: 36, height: 36, borderRadius: 18, border: `1px solid ${COLORS.gold}`,
            background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}><Plus size={18} color={COLORS.gold} /></button>
        )}
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab }) {
  const items = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "ipos", label: "IPOs", icon: Receipt },
    { id: "transfers", label: "Transfers", icon: ArrowRightLeft },
    { id: "accounts", label: "Accounts", icon: Users },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 520, background: COLORS.navyDeep,
      display: "flex", justifyContent: "space-around",
      padding: "10px 6px calc(14px + env(safe-area-inset-bottom))",
      borderTop: `1px solid ${COLORS.navy}`, zIndex: 20,
    }}>
      {items.map(({ id, label, icon: Icon }) => {
        const active = tab === id;
        return (
          <button key={id} onClick={() => setTab(id)} style={{
            background: "none", border: "none", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 4, cursor: "pointer", color: active ? COLORS.gold : "#8592A6",
            padding: "4px 10px",
          }}>
            <Icon size={20} strokeWidth={active ? 2.4 : 1.8} color={active ? COLORS.gold : "#8592A6"} />
            <span style={{ fontSize: 10, fontFamily: "Inter, sans-serif", fontWeight: active ? 700 : 500 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------
   SCREENS
---------------------------------------------------------- */
function Dashboard({ stats, ipos, accounts, onOpenIpo }) {
  const recent = [...ipos].slice(0, 4);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <StatCard label="Capital Deployed" value={inr(stats.invested)} icon={Landmark} tone="navy" />
        <StatCard label="Realized Gain" value={inr(stats.realized)} icon={stats.realized >= 0 ? TrendingUp : TrendingDown} tone={stats.realized >= 0 ? "green" : "red"} />
        <StatCard label="Unrealized Gain" value={inr(stats.unrealized)} icon={stats.unrealized >= 0 ? TrendingUp : TrendingDown} tone={stats.unrealized >= 0 ? "green" : "red"} />
        <StatCard label="Pending Allotment" value={stats.pendingCount} icon={Clock} tone="gold" />
      </div>

      <SectionLabel>Recent Entries</SectionLabel>
      {ipos.length === 0 ? (
        <EmptyState text="No IPOs logged yet. Tap the IPOs tab to add your first application." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recent.map((ipo) => (
            <IpoCard key={ipo.id} ipo={ipo} accounts={accounts} onClick={() => onOpenIpo(ipo.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }) {
  const toneColor = { navy: COLORS.navy, green: COLORS.green, red: COLORS.red, gold: COLORS.gold }[tone];
  return (
    <div style={{
      background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12,
      padding: "14px 14px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: toneColor }} />
      <Icon size={16} color={toneColor} style={{ marginBottom: 8 }} />
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: COLORS.ink }}>{value}</div>
      <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15, color: COLORS.navyDeep,
      marginBottom: 10, display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ width: 14, height: 2, background: COLORS.gold, display: "inline-block" }} />
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{
      border: `1px dashed ${COLORS.border}`, borderRadius: 12, padding: "26px 18px",
      textAlign: "center", color: COLORS.inkSoft, fontSize: 13.5, background: COLORS.surface,
    }}>{text}</div>
  );
}

function IpoList({ ipos, accounts, onOpen, onEdit, onDelete }) {
  if (ipos.length === 0) return <EmptyState text="No IPOs yet. Tap + to add one." />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {ipos.map((ipo) => (
        <IpoCard key={ipo.id} ipo={ipo} accounts={accounts} onClick={() => onOpen(ipo.id)}
          onEdit={() => onEdit(ipo)} onDelete={() => onDelete(ipo.id)} showActions />
      ))}
    </div>
  );
}

function overallStatus(ipo) {
  const apps = ipo.applications || [];
  if (apps.length === 0) return "Pending";
  if (apps.every((a) => a.allotmentStatus === "Not Allotted")) return "Not Allotted";
  if (apps.some((a) => a.allotmentStatus === "Pending")) return "Pending";
  if (apps.some((a) => a.allotmentStatus === "Partial")) return "Partial";
  return "Allotted";
}

function IpoCard({ ipo, accounts, onClick, onEdit, onDelete, showActions }) {
  const status = overallStatus(ipo);
  const meta = STATUS_META[status] || STATUS_META.Pending;
  const apps = ipo.applications || [];
  const totalLots = apps.reduce((s, a) => s + (Number(a.lots) || 0), 0);
  const gainPct = ipo.listingPrice && ipo.priceBand
    ? (((Number(ipo.listingPrice) - Number(ipo.priceBand)) / Number(ipo.priceBand)) * 100)
    : null;

  return (
    <div style={{
      background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12,
      display: "flex", overflow: "hidden", cursor: "pointer",
    }} onClick={onClick}>
      <div style={{
        width: 8, background: meta.color, flexShrink: 0,
        backgroundImage: `repeating-linear-gradient(180deg, transparent 0 6px, ${COLORS.surface} 6px 8px)`,
      }} />
      <div style={{ padding: "12px 14px", flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 16.5, color: COLORS.navyDeep, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {ipo.company || "Untitled IPO"}
            </div>
            <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
              {ipo.category || "Mainboard"} · ₹{ipo.priceBand || "—"}/sh · {totalLots} lot{totalLots === 1 ? "" : "s"} · {apps.length} applic.
            </div>
          </div>
          <Badge color={meta.color} bg={meta.bg}>{status.toUpperCase()}</Badge>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
          {gainPct !== null && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
              color: gainPct >= 0 ? COLORS.green : COLORS.red,
              display: "flex", alignItems: "center", gap: 3,
            }}>
              {gainPct >= 0 ? <TrendingUp size={13} color={COLORS.green} /> : <TrendingDown size={13} color={COLORS.red} />}
              {gainPct.toFixed(1)}% listing
            </span>
          )}
          {apps.some((a) => a.sold) && <Badge color={COLORS.navy} bg="#EAEFF5">SOLD {apps.filter((a) => a.sold).length}/{apps.length}</Badge>}
        </div>
      </div>
      {showActions && (
        <div style={{ display: "flex", flexDirection: "column", borderLeft: `1px solid ${COLORS.border}` }}>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} aria-label="Edit IPO" style={iconBtnStyle}><Pencil size={14} color={COLORS.inkSoft} /></button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete this IPO entry?")) onDelete(); }} aria-label="Delete IPO" style={{ ...iconBtnStyle, borderTop: `1px solid ${COLORS.border}` }}><Trash2 size={14} color={COLORS.red} /></button>
        </div>
      )}
    </div>
  );
}

const iconBtnStyle = {
  border: "none", background: COLORS.surface, width: 44, flex: 1, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const roundIconBtn = {
  width: 36, height: 36, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.bg,
  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};

function IpoDetailSheet({ ipo, accounts, onClose, onEditIpo, onAddApplication, onEditApplication, onDeleteApplication }) {
  if (!ipo) return null;
  const apps = ipo.applications || [];
  return (
    <Sheet title={ipo.company} onClose={onClose}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <Badge color={COLORS.navy} bg="#EAEFF5">{ipo.category || "Mainboard"}</Badge>
        <Badge color={COLORS.inkSoft} bg="#EFEDE7">Price ₹{ipo.priceBand || "—"}</Badge>
        <Badge color={COLORS.inkSoft} bg="#EFEDE7">Lot {ipo.lotSize || "—"} sh</Badge>
        {ipo.listingPrice && (
          <Badge color={Number(ipo.listingPrice) >= Number(ipo.priceBand) ? COLORS.green : COLORS.red}
            bg={Number(ipo.listingPrice) >= Number(ipo.priceBand) ? COLORS.greenSoft : COLORS.redSoft}>
            Listed ₹{ipo.listingPrice}
          </Badge>
        )}
      </div>

      <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 6, display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
        <span>Applied: {fmtDate(ipo.applicationDate)}</span>
        {ipo.listingDate && <span>Listed: {fmtDate(ipo.listingDate)}</span>}
      </div>
      {ipo.remarks && (
        <div style={{ fontSize: 13, color: COLORS.ink, background: COLORS.goldSoft, borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>
          {ipo.remarks}
        </div>
      )}

      <button onClick={() => onEditIpo(ipo)} style={{
        fontSize: 12.5, color: COLORS.navy, background: "none", border: "none", padding: 0,
        marginBottom: 16, cursor: "pointer", fontWeight: 600, textDecoration: "underline",
      }}>Edit IPO details</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <SectionLabel>Applications ({apps.length})</SectionLabel>
        <button onClick={() => onAddApplication(ipo.id)} style={{
          display: "flex", alignItems: "center", gap: 4, background: COLORS.navy, color: "#fff",
          border: "none", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}><Plus size={13} color="#fff" /> Application</button>
      </div>

      {apps.length === 0 ? (
        <EmptyState text="No applications yet for this IPO." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {apps.map((app) => (
            <ApplicationRow key={app.id} app={app} ipo={ipo} accounts={accounts}
              onEdit={() => onEditApplication(ipo.id, app)}
              onDelete={() => { if (confirm("Delete this application?")) onDeleteApplication(ipo.id, app.id); }} />
          ))}
        </div>
      )}
    </Sheet>
  );
}

function ApplicationRow({ app, ipo, accounts, onEdit, onDelete }) {
  const meta = STATUS_META[app.allotmentStatus] || STATUS_META.Pending;
  const price = Number(ipo.priceBand) || 0;
  const shares = Number(app.sharesAllotted) || 0;
  let pnl = null;
  if (app.sold) pnl = shares * ((Number(app.sellPrice) || 0) - price);
  else if (ipo.listingPrice && (app.allotmentStatus === "Allotted" || app.allotmentStatus === "Partial")) {
    pnl = shares * ((Number(ipo.listingPrice) || 0) - price);
  }
  const accountName = accounts.find((a) => a.id === app.accountId)?.name;
  return (
    <div style={{
      background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 12px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.ink }}>
            {accountName || "Unknown account"}
          </div>
          {app.appliedFor && app.appliedFor !== accountName && (
            <div style={{ fontSize: 11.5, color: COLORS.inkSoft }}>on behalf of {app.appliedFor}</div>
          )}
        </div>
        <Badge color={meta.color} bg={meta.bg}>{app.allotmentStatus}</Badge>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
        <span style={{ color: COLORS.inkSoft }}>{app.lots || 0} lot(s) · {inr(app.amountBlocked)} blocked</span>
        {pnl !== null && (
          <span style={{ fontWeight: 700, color: pnl >= 0 ? COLORS.green : COLORS.red }}>
            {app.sold ? "P&L " : "Unreal. "}{inr(pnl)}
          </span>
        )}
      </div>
      {app.remarks && <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 6, fontStyle: "italic" }}>“{app.remarks}”</div>}
      <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
        <button onClick={onEdit} aria-label="Edit application" style={roundIconBtn}><Pencil size={13} color={COLORS.inkSoft} /></button>
        <button onClick={onDelete} aria-label="Delete application" style={roundIconBtn}><Trash2 size={13} color={COLORS.red} /></button>
      </div>
    </div>
  );
}

function AccountList({ accounts, ipos, onEdit, onDelete }) {
  if (accounts.length === 0) return <EmptyState text="No family accounts added yet. Tap + to add one." />;
  const appCount = (id) => ipos.reduce((s, ipo) => s + (ipo.applications || []).filter((a) => a.accountId === id).length, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {accounts.map((acc) => (
        <div key={acc.id} style={{
          background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12,
          padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15.5, color: COLORS.navyDeep }}>{acc.name}</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>
              {acc.relation || "Self"}{acc.bank ? ` · ${acc.bank}` : ""} · {appCount(acc.id)} application(s)
            </div>
            {acc.notes && <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2, fontStyle: "italic" }}>{acc.notes}</div>}
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={() => onEdit(acc)} aria-label="Edit account" style={roundIconBtn}><Pencil size={14} color={COLORS.inkSoft} /></button>
            <button onClick={() => { if (confirm("Delete this account?")) onDelete(acc.id); }} aria-label="Delete account" style={roundIconBtn}><Trash2 size={14} color={COLORS.red} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TransfersScreen({ transfers, accounts, onEdit, onDelete }) {
  const [view, setView] = useState("log");
  return (
    <div>
      <div style={{
        display: "flex", background: COLORS.surface, border: `1px solid ${COLORS.border}`,
        borderRadius: 10, padding: 3, marginBottom: 14,
      }}>
        {[["log", "Log"], ["reconcile", "Reconcile"]].map(([id, label]) => (
          <button key={id} onClick={() => setView(id)} style={{
            flex: 1, padding: "10px 0", border: "none", borderRadius: 8, cursor: "pointer",
            fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13,
            background: view === id ? COLORS.navy : "transparent",
            color: view === id ? "#fff" : COLORS.inkSoft,
          }}>{label}</button>
        ))}
      </div>
      {view === "log" ? (
        <TransferList transfers={transfers} accounts={accounts} onEdit={onEdit} onDelete={onDelete} />
      ) : (
        <ReconciliationView transfers={transfers} accounts={accounts} />
      )}
    </div>
  );
}

function ReconciliationView({ transfers, accounts }) {
  const name = (id) => accounts.find((a) => a.id === id)?.name || "Unknown";

  const perAccount = useMemo(() => {
    const map = {};
    accounts.forEach((a) => { map[a.id] = 0; });
    transfers.forEach((t) => {
      const amt = Number(t.amount) || 0;
      map[t.fromAccountId] = (map[t.fromAccountId] || 0) + amt;
      map[t.toAccountId] = (map[t.toAccountId] || 0) - amt;
    });
    return accounts.map((a) => ({ id: a.id, name: a.name, net: map[a.id] || 0 }))
      .filter((x) => x.net !== 0)
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [transfers, accounts]);

  const pairwise = useMemo(() => {
    const map = {};
    transfers.forEach((t) => {
      const amt = Number(t.amount) || 0;
      const [x, y] = [t.fromAccountId, t.toAccountId];
      if (!x || !y || x === y) return;
      const key = x < y ? `${x}|${y}` : `${y}|${x}`;
      const sign = x < y ? 1 : -1;
      map[key] = (map[key] || 0) + sign * amt;
    });
    return Object.entries(map)
      .map(([key, net]) => {
        const [a, b] = key.split("|");
        return { a, b, net };
      })
      .filter((p) => p.net !== 0);
  }, [transfers]);

  const allSettled = perAccount.length === 0;

  return (
    <div>
      <SectionLabel>Net Position</SectionLabel>
      {allSettled ? (
        <EmptyState text="Everything is settled — no outstanding balances between accounts." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {perAccount.map((p) => (
            <div key={p.id} style={{
              background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10,
              padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.ink }}>{p.name}</div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14,
                  color: p.net > 0 ? COLORS.green : COLORS.red,
                }}>{inr(Math.abs(p.net))}</div>
                <div style={{ fontSize: 10.5, color: COLORS.inkSoft }}>{p.net > 0 ? "is owed" : "owes others"}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pairwise.length > 0 && (
        <>
          <SectionLabel>Between Accounts</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pairwise.map((p, idx) => {
              const creditor = p.net > 0 ? p.a : p.b;
              const debtor = p.net > 0 ? p.b : p.a;
              return (
                <div key={idx} style={{
                  background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10,
                  padding: "10px 12px", fontSize: 13,
                }}>
                  <span style={{ fontWeight: 600, color: COLORS.ink }}>{name(debtor)}</span>
                  <span style={{ color: COLORS.inkSoft }}> owes </span>
                  <span style={{ fontWeight: 600, color: COLORS.ink }}>{name(creditor)}</span>
                  <span style={{
                    float: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: COLORS.gold,
                  }}>{inr(Math.abs(p.net))}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function TransferList({ transfers, accounts, onEdit, onDelete }) {
  if (transfers.length === 0) return <EmptyState text="No fund transfers logged yet. Tap + to record one." />;
  const name = (id) => accounts.find((a) => a.id === id)?.name || "Unknown";
  const sorted = [...transfers].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sorted.map((t) => (
        <div key={t.id} style={{
          background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "12px 14px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: COLORS.ink, minWidth: 0 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name(t.fromAccountId)}</span>
              <ArrowRightLeft size={13} color={COLORS.gold} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name(t.toAccountId)}</span>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: COLORS.navy, flexShrink: 0, marginLeft: 8 }}>{inr(t.amount)}</span>
          </div>
          <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4 }}>{fmtDate(t.date)}</div>
          {t.remarks && <div style={{ fontSize: 12.5, color: COLORS.ink, marginTop: 6, fontStyle: "italic" }}>“{t.remarks}”</div>}
          <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
            <button onClick={() => onEdit(t)} aria-label="Edit transfer" style={roundIconBtn}><Pencil size={14} color={COLORS.inkSoft} /></button>
            <button onClick={() => { if (confirm("Delete this transfer?")) onDelete(t.id); }} aria-label="Delete transfer" style={roundIconBtn}><Trash2 size={14} color={COLORS.red} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------
   FORM SHEETS
---------------------------------------------------------- */
function IpoFormSheet({ initial, onClose, onSave }) {
  const [f, setF] = useState(initial || {
    id: undefined, company: "", category: "Mainboard", applicationDate: "", priceBand: "",
    lotSize: "", listingDate: "", listingPrice: "", remarks: "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Sheet title={initial ? "Edit IPO" : "New IPO"} onClose={onClose}>
      <Field label="Company Name"><Input value={f.company} onChange={set("company")} placeholder="e.g. Vishal Mega Mart" /></Field>
      <Field label="Category">
        <Select value={f.category} onChange={set("category")}>
          <option>Mainboard</option><option>SME</option>
        </Select>
      </Field>
      <Field label="Application Date"><Input type="date" value={f.applicationDate} onChange={set("applicationDate")} /></Field>
      <Field label="Price per Share (₹)"><Input type="number" inputMode="numeric" value={f.priceBand} onChange={set("priceBand")} placeholder="e.g. 285" /></Field>
      <Field label="Lot Size (shares)"><Input type="number" inputMode="numeric" value={f.lotSize} onChange={set("lotSize")} placeholder="e.g. 52" /></Field>
      <Field label="Listing Date (optional)"><Input type="date" value={f.listingDate} onChange={set("listingDate")} /></Field>
      <Field label="Listing Price (optional, ₹)"><Input type="number" inputMode="numeric" value={f.listingPrice} onChange={set("listingPrice")} placeholder="e.g. 340" /></Field>
      <Field label="Remarks">
        <textarea value={f.remarks} onChange={set("remarks")} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Any notes about this IPO" />
      </Field>
      <PrimaryButton onClick={() => { if (!f.company) return alert("Company name is required"); onSave({ ...f, id: f.id || uid() }); }}>
        {initial ? "Save Changes" : "Add IPO"}
      </PrimaryButton>
    </Sheet>
  );
}

function ApplicationFormSheet({ initial, accounts, onClose, onSave }) {
  const [f, setF] = useState(initial || {
    id: undefined, accountId: accounts[0]?.id || "", appliedFor: "", lots: "1", amountBlocked: "",
    allotmentStatus: "Pending", sharesAllotted: "", sold: false, sellPrice: "", sellDate: "", remarks: "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setBool = (k) => (e) => setF({ ...f, [k]: e.target.checked });

  return (
    <Sheet title={initial ? "Edit Application" : "New Application"} onClose={onClose}>
      <Field label="Applied From Account">
        <Select value={f.accountId} onChange={set("accountId")}>
          {accounts.length === 0 && <option value="">Add an account first</option>}
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
      </Field>
      <Field label="Applied For (beneficiary name)">
        <Input value={f.appliedFor} onChange={set("appliedFor")} placeholder="Leave blank if same as account holder" />
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Lots"><Input type="number" inputMode="numeric" value={f.lots} onChange={set("lots")} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Amount Blocked (₹)"><Input type="number" inputMode="numeric" value={f.amountBlocked} onChange={set("amountBlocked")} /></Field></div>
      </div>
      <Field label="Allotment Status">
        <Select value={f.allotmentStatus} onChange={set("allotmentStatus")}>
          {ALLOTMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </Select>
      </Field>
      {(f.allotmentStatus === "Allotted" || f.allotmentStatus === "Partial") && (
        <Field label="Shares Allotted"><Input type="number" inputMode="numeric" value={f.sharesAllotted} onChange={set("sharesAllotted")} /></Field>
      )}
      <Field label="Sold?">
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, minHeight: 44 }}>
          <input type="checkbox" checked={!!f.sold} onChange={setBool("sold")} style={{ width: 18, height: 18 }} /> Shares have been sold
        </label>
      </Field>
      {f.sold && (
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><Field label="Sell Price (₹)"><Input type="number" inputMode="numeric" value={f.sellPrice} onChange={set("sellPrice")} /></Field></div>
          <div style={{ flex: 1 }}><Field label="Sell Date"><Input type="date" value={f.sellDate} onChange={set("sellDate")} /></Field></div>
        </div>
      )}
      <Field label="Remarks">
        <textarea value={f.remarks} onChange={set("remarks")} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="e.g. Funds sent by dad, to be returned after listing" />
      </Field>
      <PrimaryButton onClick={() => { if (!f.accountId) return alert("Select an account"); onSave({ ...f, id: f.id || uid() }); }}>
        {initial ? "Save Changes" : "Add Application"}
      </PrimaryButton>
    </Sheet>
  );
}

function AccountFormSheet({ initial, onClose, onSave }) {
  const [f, setF] = useState(initial || { id: undefined, name: "", relation: "", bank: "", notes: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Sheet title={initial ? "Edit Account" : "New Account"} onClose={onClose}>
      <Field label="Name"><Input value={f.name} onChange={set("name")} placeholder="e.g. Mom, Dad, Priya Aunty" /></Field>
      <Field label="Relation"><Input value={f.relation} onChange={set("relation")} placeholder="e.g. Mother, Self, Brother-in-law" /></Field>
      <Field label="Bank / Broker (optional)"><Input value={f.bank} onChange={set("bank")} placeholder="e.g. HDFC / Zerodha" /></Field>
      <Field label="Notes"><textarea value={f.notes} onChange={set("notes")} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></Field>
      <PrimaryButton onClick={() => { if (!f.name) return alert("Name is required"); onSave({ ...f, id: f.id || uid() }); }}>
        {initial ? "Save Changes" : "Add Account"}
      </PrimaryButton>
    </Sheet>
  );
}

function TransferFormSheet({ initial, accounts, ipos, onClose, onSave }) {
  const [f, setF] = useState(initial || {
    id: undefined, fromAccountId: accounts[0]?.id || "", toAccountId: accounts[1]?.id || accounts[0]?.id || "",
    amount: "", date: new Date().toISOString().slice(0, 10), relatedIpoId: "", remarks: "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Sheet title={initial ? "Edit Transfer" : "New Transfer"} onClose={onClose}>
      <Field label="From Account">
        <Select value={f.fromAccountId} onChange={set("fromAccountId")}>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
      </Field>
      <Field label="To Account">
        <Select value={f.toAccountId} onChange={set("toAccountId")}>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Amount (₹)"><Input type="number" inputMode="numeric" value={f.amount} onChange={set("amount")} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Date"><Input type="date" value={f.date} onChange={set("date")} /></Field></div>
      </div>
      <Field label="Related IPO (optional)">
        <Select value={f.relatedIpoId} onChange={set("relatedIpoId")}>
          <option value="">— None —</option>
          {ipos.map((i) => <option key={i.id} value={i.id}>{i.company}</option>)}
        </Select>
      </Field>
      <Field label="Remarks">
        <textarea value={f.remarks} onChange={set("remarks")} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="e.g. Sent for application, to be returned" />
      </Field>
      <PrimaryButton onClick={() => { if (!f.fromAccountId || !f.toAccountId) return alert("Select both accounts"); onSave({ ...f, id: f.id || uid() }); }}>
        {initial ? "Save Changes" : "Add Transfer"}
      </PrimaryButton>
    </Sheet>
  );
}

/* ---------------------------------------------------------
   SYNC & DATA
---------------------------------------------------------- */
function DataSheet({ state, session, cloudOn, syncing, syncError, lastSync, onClose, onSyncNow, onReplaceAll, onSignOut }) {
  const [importText, setImportText] = useState("");
  const [notice, setNotice] = useState("");
  const [showImport, setShowImport] = useState(false);

  const counts = `${state.accounts.length} accounts · ${state.ipos.length} IPOs · ${state.transfers.length} transfers`;

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(buildExport(state));
      setNotice("Copied to clipboard.");
    } catch {
      setNotice("Clipboard blocked — use Download instead.");
    }
  };

  const downloadExport = () => {
    const blob = new Blob([buildExport(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ipo-ledger-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setNotice("Backup downloaded.");
  };

  const runImport = (mode) => {
    let incoming;
    try {
      incoming = parseImport(importText);
    } catch (e) {
      setNotice(e.message || "That does not look like a ledger backup.");
      return;
    }
    if (mode === "replace") {
      if (!confirm("Replace everything currently in this ledger with the pasted data?")) return;
      onReplaceAll(incoming);
    } else {
      onReplaceAll({
        accounts: mergeById(state.accounts, incoming.accounts),
        ipos: mergeIpos(state.ipos, incoming.ipos),
        transfers: mergeById(state.transfers, incoming.transfers),
      });
    }
    setImportText("");
    setShowImport(false);
    setNotice(mode === "replace" ? "Ledger replaced." : "Entries merged in.");
  };

  return (
    <Sheet title="Sync & Data" onClose={onClose}>
      <div style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12,
        padding: "12px 14px", marginBottom: 14,
      }}>
        {cloudOn ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{session?.user?.email || "Signed in"}</div>
            <div style={{ fontSize: 12, color: syncError ? COLORS.red : COLORS.inkSoft, marginTop: 4 }}>
              {syncError
                ? syncError
                : syncing
                  ? "Syncing…"
                  : lastSync
                    ? `Synced at ${fmtTime(lastSync)}`
                    : "Waiting for first sync"}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>Cloud sync is off</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>
              Data is stored on this device only. Set the Supabase environment variables to enable sync.
            </div>
          </>
        )}
        <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>{counts}</div>
      </div>

      {cloudOn && (
        <PrimaryButton onClick={onSyncNow} disabled={syncing}>
          {syncing ? "Syncing…" : "Sync now"}
        </PrimaryButton>
      )}

      <div style={{ height: 18 }} />
      <SectionLabel>Backup</SectionLabel>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><PrimaryButton ghost onClick={copyExport}>Copy JSON</PrimaryButton></div>
        <div style={{ flex: 1 }}>
          <PrimaryButton ghost onClick={downloadExport}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <DownloadIcon size={14} color={COLORS.ink} /> Download
            </span>
          </PrimaryButton>
        </div>
      </div>

      <div style={{ height: 12 }} />
      {!showImport ? (
        <PrimaryButton ghost onClick={() => setShowImport(true)}>Restore from a backup…</PrimaryButton>
      ) : (
        <>
          <Field label="Paste backup JSON">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              placeholder='{ "accounts": [...], "ipos": [...], "transfers": [...] }'
              style={{ ...inputStyle, resize: "vertical", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
            />
          </Field>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <PrimaryButton ghost onClick={() => runImport("merge")} disabled={!importText.trim()}>Merge in</PrimaryButton>
            </div>
            <div style={{ flex: 1 }}>
              <PrimaryButton danger onClick={() => runImport("replace")} disabled={!importText.trim()}>Replace all</PrimaryButton>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 8 }}>
            Merge keeps everything already here and only adds entries it does not have.
          </div>
        </>
      )}

      {notice && (
        <div style={{
          background: COLORS.goldSoft, color: COLORS.ink, borderRadius: 10,
          padding: "10px 12px", marginTop: 14, fontSize: 12.5,
        }}>{notice}</div>
      )}

      {cloudOn && (
        <>
          <div style={{ height: 22 }} />
          <PrimaryButton ghost onClick={onSignOut}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <LogOut size={14} color={COLORS.ink} /> Sign out
            </span>
          </PrimaryButton>
        </>
      )}
    </Sheet>
  );
}

/* ---------------------------------------------------------
   AUTH
---------------------------------------------------------- */
function AuthScreen({ mode, setMode, notice }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(notice || "");
  const [info, setInfo] = useState("");

  const submit = async () => {
    setError(""); setInfo("");
    const trimmed = email.trim();
    if (!trimmed || !password) return setError("Enter your email and password.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setBusy(true);
    try {
      const data = mode === "signup"
        ? await cloudSignUp(trimmed, password)
        : await cloudSignIn(trimmed, password);

      if (!data.access_token) {
        // Sign-up with email confirmation enabled returns a user but no session.
        setMode("login");
        setInfo("Account created. Confirm your email if asked, then sign in.");
        return;
      }
      setSession(normalizeSession(data));
    } catch (e) {
      setError(e.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: "100dvh", background: COLORS.bg, display: "grid", placeItems: "center",
      padding: 20, fontFamily: "Inter, sans-serif",
    }}>
      <style>{FONT_IMPORT}</style>
      <div style={{
        width: "100%", maxWidth: 420, background: COLORS.surface, borderRadius: 18,
        padding: 24, boxShadow: "0 12px 40px rgba(0,0,0,.10)", border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: COLORS.navyDeep }}>
          The Ledger
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: COLORS.gold,
          letterSpacing: 0.5, marginTop: 2, marginBottom: 20,
        }}>FAMILY IPO REGISTER</div>

        <div style={{ color: COLORS.inkSoft, fontSize: 13.5, marginBottom: 20 }}>
          Sign in to sync your IPOs, applications, accounts and transfers across devices.
        </div>

        <Field label="Email">
          <Input type="email" autoComplete="email" inputMode="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <Input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
        </Field>

        {error && (
          <div style={{ background: COLORS.redSoft, color: COLORS.red, borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 13 }}>{error}</div>
        )}
        {info && (
          <div style={{ background: COLORS.greenSoft, color: COLORS.green, borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 13 }}>{info}</div>
        )}

        <PrimaryButton onClick={submit} disabled={busy}>
          {busy ? "Please wait…" : mode === "signup" ? "Create Account" : "Sign In"}
        </PrimaryButton>
        <button
          onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setInfo(""); }}
          style={{
            width: "100%", border: 0, background: "transparent", marginTop: 12, padding: 12,
            color: COLORS.navy, fontWeight: 600, fontSize: 13.5, cursor: "pointer",
          }}
        >
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}
