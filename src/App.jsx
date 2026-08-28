import React, { useState, useEffect, useMemo, useCallback, useRef, useContext } from "react";
import { createPortal } from "react-dom";

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
const AlertTriangle = (p) => <SvgIcon {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></SvgIcon>;
const ChevronRight = (p) => <SvgIcon {...p}><path d="m9 18 6-6-6-6" /></SvgIcon>;
const Sparkles = (p) => <SvgIcon {...p}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></SvgIcon>;
const Search = (p) => <SvgIcon {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></SvgIcon>;
const Layers = (p) => <SvgIcon {...p}><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" /><path d="m22 12.18-9.17 4.16a2 2 0 0 1-1.66 0L2 12.18" /><path d="m22 17.18-9.17 4.16a2 2 0 0 1-1.66 0L2 17.18" /></SvgIcon>;
const ClipboardCheck = (p) => <SvgIcon {...p}><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" /></SvgIcon>;

/* ---------------------------------------------------------
   FORMATTING HELPERS
---------------------------------------------------------- */
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const inr = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

/* Not every field can be filled in. NSE never publishes lot size and omits the
   price band for some SME issues, so imported IPOs arrive incomplete. Treating
   a blank as zero turns "we don't know" into a confident ₹0, which is worse
   than saying nothing — so unknown values render as an em dash instead. */
const isBlank = (v) => v === "" || v == null || !Number.isFinite(Number(v));
const inrOrDash = (v) => (isBlank(v) ? "—" : inr(v));

/* The same normalisation the price API uses, so a company matches across
   sources: "Lumino Industries Limited" here, "LUMINO INDUSTRIES LTD" there. */
function nameKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(limited|ltd|private|pvt|india|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* What shares still held are worth. Today's traded price when we have one,
   otherwise the listing price. Valuing a holding at its listing price forever
   is how a position that listed at 372 and now trades at 251 keeps reporting
   a gain it no longer has. */
function valuationPrice(ipo) {
  const cur = Number(ipo?.currentPrice);
  if (Number.isFinite(cur) && cur > 0) return cur;
  const listed = Number(ipo?.listingPrice);
  return Number.isFinite(listed) && listed > 0 ? listed : null;
}
const isMarkedToMarket = (ipo) => Number(ipo?.currentPrice) > 0;

/* Today's date on the Indian market calendar. Every date in this app — bidding
   windows, listing days — is an IST date, while toISOString() gives the UTC one.
   Those disagree from 18:30 IST until midnight, which is exactly when someone
   checks the day's listings, and made an issue listing today read as tomorrow.
   Pinned to Asia/Kolkata rather than the device clock so it stays right abroad. */
function todayISO() {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  } catch {
    // en-CA already yields YYYY-MM-DD; this is only for engines without tz data.
    return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  }
}
// A listing date in the future is a scheduled date, not a past event. Saying
// "Listed" about a share that has not listed yet is simply wrong.
const hasListed = (ipo) => !!ipo?.listingDate && ipo.listingDate <= todayISO();

/* Declared here rather than beside the other storage helpers because the
   holiday cache below needs it, and a const used before its declaration is
   undefined at that point - which quietly wrote the calendar to a key called
   "undefinedholidays". */
const STORAGE_PREFIX = "ipo_ledger_";

// The four screens, in nav order. Named here so a remembered tab can be checked
// against them before it is trusted.
const TABS = ["dashboard", "ipos", "transfers", "accounts"];

/* NSE's holiday calendars, kept module-wide because every date calculation
   needs them. Both are required, and which one applies depends on the event:
   allotment is settled by the clearing corporation, listing happens on the
   exchange floor, and the two calendars differ. In 2026 they differ on four
   days — 26 August most instructively, a clearing holiday that was an ordinary
   trading day. Gaja Alternative closed on the 21st and listed on it; Augmont
   closed on the 25th and had its allotment pushed from the 26th to the 27th,
   and its listing out to the 31st. */
const HOLIDAY_KEY = STORAGE_PREFIX + "holidays";
let tradingHolidays = new Set();
let clearingHolidays = new Set();
const holidayListeners = new Set();

function setHolidays(trading, clearing, fetchedAt) {
  tradingHolidays = new Set(trading);
  clearingHolidays = new Set(clearing);
  try {
    localStorage.setItem(HOLIDAY_KEY, JSON.stringify({ fetchedAt, trading, clearing }));
  } catch { /* a cache miss only costs one request */ }
  holidayListeners.forEach((fn) => fn());
}

(function loadCachedHolidays() {
  try {
    const c = JSON.parse(localStorage.getItem(HOLIDAY_KEY) || "null");
    if (!c) return;
    // An older cache holds one list, which was the trading calendar.
    const trading = Array.isArray(c.trading) ? c.trading : (Array.isArray(c.dates) ? c.dates : []);
    tradingHolidays = new Set(trading);
    clearingHolidays = new Set(Array.isArray(c.clearing) ? c.clearing : trading);
  } catch { /* start empty */ }
})();

/* Calendar arithmetic on a plain date, skipping weekends and whichever set of
   holidays applies to the event being counted. */
function addDays(iso, n, holidays) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return "";
  const d = new Date(iso + "T00:00:00Z");
  const step = n >= 0 ? 1 : -1;
  let left = Math.abs(n);
  let guard = 0;
  while (left > 0 && guard++ < 400) {
    d.setUTCDate(d.getUTCDate() + step);
    const wd = d.getUTCDay();
    const iso2 = d.toISOString().slice(0, 10);
    if (wd !== 0 && wd !== 6 && !holidays.has(iso2)) left--;
  }
  return d.toISOString().slice(0, 10);
}

const addTradingDays = (iso, n) => addDays(iso, n, tradingHolidays);
const addClearingDays = (iso, n) => addDays(iso, n, clearingHolidays);

/* The day the basis of allotment is settled — the day there is something to
   record. No exchange feed publishes it, so unless it has been entered by hand
   it is worked out from SEBI's T+3 timetable: bidding closes on T, allotment
   follows on the next working day. That step belongs to the clearing calendar,
   which is why Augmont, closing on 25 August 2026, was allotted on the 27th and
   not the 26th. A derived date is an expectation and is labelled as one. */
function allotmentDateOf(ipo) {
  if (ipo?.allotmentDate) return { date: ipo.allotmentDate, exact: true };
  if (ipo?.closeDate) return { date: addClearingDays(ipo.closeDate, 1), exact: false };
  if (ipo?.listingDate) return { date: addClearingDays(addTradingDays(ipo.listingDate, -1), -1), exact: false };
  return { date: "", exact: false };
}

/* Shares reach the demat account the working day after allotment — a clearing
   step, like the allotment itself. */
function creditDateOf(ipo) {
  const allot = allotmentDateOf(ipo);
  if (!allot.date) return { date: "", exact: false };
  return { date: addClearingDays(allot.date, 1), exact: allot.exact && !!ipo?.allotmentDate };
}

/* Listing is one trading day after the credit — the first step that happens on
   the exchange floor rather than in the clearing house.

   Counting the whole timetable on a single calendar cannot fit the record.
   Tempsens closed on 24 August 2026 and listed on the 28th: allotment on the
   25th, but the 26th was closed for clearing, so the credit slipped to the 27th
   and the listing to the 28th. Purely on the trading calendar that comes out a
   day early; purely on the clearing calendar Gaja comes out a day late. Walking
   the real chain — clearing, clearing, trading — reproduces all 22 issues with
   both dates on record. It stays an inference until the exchange confirms it. */
function listingDateOf(ipo) {
  if (ipo?.listingDate) return { date: ipo.listingDate, exact: true };
  const credit = creditDateOf(ipo);
  if (credit.date) return { date: addTradingDays(credit.date, 1), exact: false };
  return { date: "", exact: false };
}

/* An expected date has done its job once every application carries a recorded
   result — there is nothing left to wait for, so the ledger stops predicting. */
function allotmentSettled(ipo) {
  const apps = ipo?.applications || [];
  return apps.length > 0 && apps.every((a) => (a.allotmentStatus || "Pending") !== "Pending");
}

/* Applications still sitting at Pending after the allotment should have been
   settled. This is the ledger's real to-do list. */
function awaitingAllotmentEntry(ipo) {
  const apps = ipo?.applications || [];
  if (!apps.some((a) => (a.allotmentStatus || "Pending") === "Pending")) return false;
  const { date } = allotmentDateOf(ipo);
  return !!date && date <= todayISO();
}

/* Where an issue is in its life, worked out from its own dates rather than from
   which feed it arrived in. An issue that closed yesterday is closed, however
   the exchange still files it. */
function issueStage(x) {
  const today = todayISO();
  const listed = x?.listingDate || x?.listedOn || "";
  const open = x?.openDate || "";
  const close = x?.closeDate || "";

  if (listed && listed < today) return { label: "LISTED", color: COLORS.navy, bg: "#EAEFF5" };
  if (listed && listed === today) return { label: "LISTS TODAY", color: COLORS.green, bg: COLORS.greenSoft };

  /* Allotment day sits between the close and the listing, and on the day itself
     it is the nearer event — so it outranks a listing still days away. */
  const allot = allotmentDateOf(x);
  if (allot.date && allot.date === today) {
    return {
      label: allot.exact ? "ALLOTMENT TODAY" : "ALLOTMENT LIKELY TODAY",
      color: COLORS.gold, bg: COLORS.goldSoft,
    };
  }

  if (listed && listed > today) return { label: "LISTS " + fmtDate(listed).toUpperCase().slice(0, 6), color: COLORS.navy, bg: "#EAEFF5" };

  /* With no listing date on record, T+3 from the close says when to expect one.
     Never treated as proof it has listed — only as what is coming. */
  const expected = listingDateOf(x);
  // Strictly past: on the closing day itself the close is the immediate event,
  // and saying when it might list instead would bury the deadline.
  if (!listed && expected.date && close && close < today) {
    if (expected.date === today) return { label: "LISTS LIKELY TODAY", color: COLORS.green, bg: COLORS.greenSoft };
    if (expected.date > today) return { label: "LISTS ~" + fmtDate(expected.date).toUpperCase().slice(0, 6), color: COLORS.navy, bg: "#EAEFF5" };
    return { label: "LISTING DUE", color: COLORS.gold, bg: COLORS.goldSoft };
  }

  if (allot.date && allot.date > today && close && close < today) {
    return { label: "ALLOTMENT " + fmtDate(allot.date).toUpperCase().slice(0, 6), color: COLORS.gold, bg: COLORS.goldSoft };
  }
  if (close && close < today) return { label: "CLOSED", color: COLORS.inkSoft, bg: "#EFEDE7" };
  if (close && close === today) return { label: "CLOSES TODAY", color: COLORS.red, bg: COLORS.redSoft };
  if (open && open <= today) return { label: "OPEN NOW", color: COLORS.green, bg: COLORS.greenSoft };
  if (open && open > today) return { label: "UPCOMING", color: COLORS.gold, bg: COLORS.goldSoft };
  return null;
}
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

/* "trash" is a table like the others so it syncs, exports and merges without
   special handling. Nothing is ever removed from the ledger outright: a delete
   moves the record here, where it keeps its own copy of everything it had. */
const TABLES = ["accounts", "ipos", "transfers", "trash"];

// The three that hold the ledger proper. Trash is deliberately excluded: a
// device holding only deleted records is still an empty ledger, and must not
// be pushed over a populated cloud.
const LEDGER_TABLES = ["accounts", "ipos", "transfers"];

/* ---------------------------------------------------------
   LOCAL STORAGE
   Keys are deliberately identical to the original single-file
   build ("ipo_ledger_*") so an existing install on the same
   origin keeps its data and uploads it on first sign-in.
---------------------------------------------------------- */

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
  return {
    accounts: loadTable("accounts"),
    ipos: loadTable("ipos"),
    transfers: loadTable("transfers"),
    trash: loadTable("trash"),
  };
}
function isEmptyState(s) {
  return LEDGER_TABLES.every((k) => !(s[k] || []).length);
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
  const out = { accounts: [], ipos: [], transfers: [], trash: [] };
  (rows || []).forEach((row) => {
    if (TABLES.includes(row.kind) && Array.isArray(row.data)) out[row.kind] = row.data;
  });
  return out;
}

/* The cloud table was created before deleted records were kept, and its `kind`
   column only accepts the original three. Widening it is one statement
   (migrate-trash.sql), but until that is run the whole sync would fail on the
   fourth — taking the ledger down with it over the one table that matters
   least. So a rejection on `kind` falls back to the three, and says so. */
let trashSyncBlocked = false;
const isKindRejection = (e) => /user_data_kind_check|violates check constraint/i.test(e?.message || "");

async function cloudSave(userId, state) {
  const send = async (kinds) => {
    const rows = kinds.map((kind) => ({
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
  };

  if (trashSyncBlocked) return send(LEDGER_TABLES);

  try {
    await send(TABLES);
    trashSyncBlocked = false;
  } catch (e) {
    if (!isKindRejection(e)) throw e;
    trashSyncBlocked = true;
    await send(LEDGER_TABLES);
  }
}

// Whether deleted records are being left out, so the UI can say why.
const trashSyncIsBlocked = () => trashSyncBlocked;

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
  LEDGER_TABLES.forEach((k) => {
    if (!Array.isArray(parsed[k])) throw new Error(`Missing or invalid "${k}" list in the pasted data.`);
    out[k] = parsed[k];
  });
  // Backups taken before deleted records were kept simply have none.
  out.trash = Array.isArray(parsed.trash) ? parsed.trash : [];
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

/* Lets a sheet's confirming action live outside the scrolling list. */
const SheetFooterSlot = React.createContext(null);

function Sheet({ title, onClose, children }) {
  /* The panel is a column: a title that stays put, a body that scrolls, and a
     footer slot below both. The footer used to sit inside the scroll area,
     stuck to its bottom edge, which left rows sliding underneath it. */
  const [footerEl, setFooterEl] = useState(null);
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(28,35,51,0.45)", zIndex: 50,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.bg, width: "100%", maxWidth: 480,
          maxHeight: "92vh", borderRadius: "18px 18px 0 0",
          display: "flex", flexDirection: "column", minHeight: 0,
          boxShadow: "0 -8px 30px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 18px 16px", flexShrink: 0,
        }}>
          <h2 style={{
            fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 20, color: COLORS.navyDeep, margin: 0,
          }}>{title}</h2>
          <button onClick={onClose} aria-label="Close" style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 20,
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}><X size={16} color={COLORS.inkSoft} /></button>
        </div>
        <div style={{
          flex: "1 1 auto", overflowY: "auto", minHeight: 0,
          WebkitOverflowScrolling: "touch",
          padding: "0 18px calc(28px + env(safe-area-inset-bottom))",
        }}>
          <SheetFooterSlot.Provider value={footerEl}>{children}</SheetFooterSlot.Provider>
        </div>
        {/* Empty and invisible until a StickyFooter fills it. */}
        <div ref={setFooterEl} style={{ flexShrink: 0 }} />
      </div>
    </div>
  );
}

/* Keeps the confirming action in reach. These sheets can run to a couple of
   hundred rows, and a button after the last one means scrolling the whole list
   to press it. Rendered into the sheet's footer slot, below the scrolling body
   rather than floating over its last rows. */
function StickyFooter({ children }) {
  const slot = useContext(SheetFooterSlot);
  const bar = (
    <div style={{
      background: COLORS.bg,
      padding: "10px 18px calc(16px + env(safe-area-inset-bottom))",
      borderTop: `1px solid ${COLORS.border}`,
    }}>
      {children}
    </div>
  );
  // Outside a Sheet there is nowhere to hoist it to, so it stays in place.
  return slot ? createPortal(bar, slot) : bar;
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

  /* Which tab you were on survives a reload. The app is a single screen with no
     routing, so without this every refresh — and every return from the home
     screen on a phone, where the PWA is reloaded rather than resumed — dropped
     you back on Overview with the list you were reading two taps away. */
  const [tab, setTab] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + "tab");
      return TABS.includes(saved) ? saved : "dashboard";
    } catch {
      return "dashboard";
    }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_PREFIX + "tab", tab); } catch { /* not worth failing over */ }
  }, [tab]);

  /* The four screens share one scroll position, because they are one document.
     Reading to the bottom of the IPOs and then tapping Transfers landed you at
     the bottom of the transfers — a list you had never scrolled. Each screen
     now starts where a screen should. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo(0, 0);
  }, [tab]);
  const [accounts, setAccounts] = useState([]);
  const [ipos, setIpos] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [trash, setTrash] = useState([]);
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
  const [bulkApplyFor, setBulkApplyFor] = useState(null);   // ipo id
  const [bulkStatusFor, setBulkStatusFor] = useState(null); // ipo id
  const [liveOpen, setLiveOpen] = useState(false);
  const [pricing, setPricing] = useState(false);
  const [priceInfo, setPriceInfo] = useState({ asOf: "", matched: 0, total: 0, error: "" });

  const skipNextAutoSync = useRef(true);
  const pricedOnce = useRef(false);
  const [, bumpHolidays] = useState(0);

  /* The holiday calendar changes about once a year, so it is cached and only
     refetched when a day old. Every date shown is computed from it, hence the
     re-render once it lands. */
  useEffect(() => {
    const listener = () => bumpHolidays((n) => n + 1);
    holidayListeners.add(listener);

    let cancelled = false;
    (async () => {
      try {
        const cached = JSON.parse(localStorage.getItem(HOLIDAY_KEY) || "null");
        const age = cached?.fetchedAt ? Date.now() - Date.parse(cached.fetchedAt) : Infinity;
        // A cache without a clearing list predates the two-calendar split.
        if (cached?.trading?.length && cached?.clearing && age < 24 * 3600 * 1000) return;

        const res = await fetch("/api/holidays");
        if (!res.ok) return;
        const data = JSON.parse(await res.text());
        if (cancelled || data.error) return;
        const days = (list) => (Array.isArray(list) ? list.map((h) => h.date) : null);
        const trading = days(data.trading) || days(data.holidays);
        if (!trading) return;
        setHolidays(trading, days(data.clearing) || trading, data.fetchedAt || new Date().toISOString());
      } catch {
        // Weekend-only arithmetic is a reasonable fallback.
      }
    })();

    return () => { cancelled = true; holidayListeners.delete(listener); };
  }, []);

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
        // A backup taken before deleted records were kept simply has none.
        setTrash(s.trash || []);
      };

      if (!cloudEnabled() || !userId) {
        apply(local);
        setLoaded(true);
        return;
      }

      const owner = localOwner();
      const localIsOurs = !owner || owner === userId;
      const empty = { accounts: [], ipos: [], transfers: [], trash: [] };

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
            trash: mergeById(remote.trash || [], local.trash || []),
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

  /* Android's back gesture closed the whole app from anywhere, because a single
     screen with no routing has no history to go back through. Back now peels
     off one layer at a time — the sheet on top, then any sheet under it, then
     back to Overview — and only leaves once there is nothing left to close.

     The handler reads through a ref so the listener can be registered once and
     still see current state; re-registering on every state change would drop
     the buffered history entry. */
  const backLayers = { appSheet, bulkApplyFor, bulkStatusFor, ipoSheet, acctSheet,
    transferSheet, liveOpen, dataSheetOpen, ipoDetail, tab };

  /* A sheet covers the screen but the page behind it still scrolls, so dragging
     anywhere outside the panel moved the list underneath and you came back to
     somewhere else entirely. Held still while a sheet is open. */
  const sheetIsOpen = Object.entries(backLayers).some(([k, v]) => k !== "tab" && !!v);
  useEffect(() => {
    if (typeof document === "undefined" || !document.body) return;
    if (!sheetIsOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [sheetIsOpen]);
  const backRef = useRef(backLayers);
  backRef.current = backLayers;

  const closeTopLayer = useCallback(() => {
    const v = backRef.current;
    // Innermost first: a bulk sheet sits on top of the IPO detail behind it.
    if (v.appSheet) { setAppSheet(null); return true; }
    // These replace the IPO's detail rather than sitting over it, so closing
    // one puts that detail back — the same as saving from it does.
    if (v.bulkApplyFor) { setBulkApplyFor(null); setIpoDetail(v.bulkApplyFor); return true; }
    if (v.bulkStatusFor) { setBulkStatusFor(null); setIpoDetail(v.bulkStatusFor); return true; }
    if (v.ipoSheet) { setIpoSheet(null); return true; }
    if (v.acctSheet) { setAcctSheet(null); return true; }
    if (v.transferSheet) { setTransferSheet(null); return true; }
    if (v.liveOpen) { setLiveOpen(false); return true; }
    if (v.dataSheetOpen) { setDataSheetOpen(false); return true; }
    if (v.ipoDetail) { setIpoDetail(null); return true; }
    if (v.tab !== "dashboard") { setTab("dashboard"); return true; }
    return false;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.history) return;
    // One buffered entry to absorb the first back press.
    window.history.replaceState({ ledger: "root" }, "");
    window.history.pushState({ ledger: "layer" }, "");

    const onPop = () => {
      if (closeTopLayer()) {
        // Something closed, so put the buffer back for the next press.
        window.history.pushState({ ledger: "layer" }, "");
      } else {
        // Nothing left: let the press do what it would have done anyway.
        window.history.back();
      }
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [closeTopLayer]);

  /* ---------- writes ---------- */
  const persistAccounts = useCallback((next) => { setAccounts(next); saveTable("accounts", next); }, []);
  const persistIpos = useCallback((next) => { setIpos(next); saveTable("ipos", next); }, []);
  const persistTransfers = useCallback((next) => { setTransfers(next); saveTable("transfers", next); }, []);
  const persistTrash = useCallback((next) => { setTrash(next); saveTable("trash", next); }, []);

  /* Deleting puts the whole record here, not in the bin. Restoring it later has
     to work without anything else on the device, so the entry carries its own
     copy — and, for an application, the IPO it belonged to. */
  const discard = useCallback((kind, payload, label, parentId) => {
    persistTrash([
      { id: uid(), kind, label, parentId: parentId || "", deletedAt: new Date().toISOString(), payload },
      ...trash,
    ]);
  }, [trash, persistTrash]);

  const pushToCloud = useCallback(async () => {
    if (!cloudEnabled() || !userId) return;
    setSyncing(true);
    try {
      const state = { accounts, ipos, transfers, trash };
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
  }, [userId, accounts, ipos, transfers, trash]);

  /* Push edits to Supabase, debounced so a burst of edits collapses into one
     write. Trash counts as an edit like any other: today every deletion also
     changes one of the three ledger tables, so leaving it out happened to work,
     but a restore that only moved something back would have gone unsynced. */
  useEffect(() => {
    if (!loaded || !cloudEnabled() || !userId) return;
    if (skipNextAutoSync.current) { skipNextAutoSync.current = false; return; }
    const t = setTimeout(() => { pushToCloud(); }, 1000);
    return () => clearTimeout(t);
  }, [accounts, ipos, transfers, trash, loaded, userId, pushToCloud]);

  /* Pull listing and current market prices from BSE and apply them to every
     IPO we can match by name. The current price is always refreshed; the
     listing price and date are only filled in when blank, so anything typed
     in by hand is never overwritten. */
  const refreshPricesFrom = useCallback(async (list, opts = {}) => {
    if (!list.length) return { matched: 0, updated: 0 };
    setPricing(true);
    try {
      /* Ask BSE back as far as this ledger actually reaches. Without this the
         window defaults to the last year or so, and anything older simply
         never matches. */
      const years = list
        .map((i) => parseInt(String(i.listingDate || i.applicationDate || i.openDate || "").slice(0, 4), 10))
        .filter((y) => Number.isFinite(y) && y >= 2010);
      const from = years.length ? Math.min(...years) : new Date().getFullYear() - 1;

      /* Naming a company asks the server to go and fetch its lot size and its
         day-one opening price — a request each, and neither ever changes once
         known. Prices come back for every listing regardless of who is named,
         so the only names worth sending are those still missing something: a
         settled ledger names none, and the whole refresh is one request.

         Capped as well, since the names travel in the query string and a ledger
         holding a year of listings would build a URL long enough to be refused.
         The rounds below work through anything left over. */
      const incomplete = (list) =>
        list.filter((i) =>
          !i.lotSize || !i.closeDate || !i.openDate || isBlank(i.priceBand) ||
          (hasListed(i) && isBlank(i.listingPrice)));
      const asking = incomplete(list);
      const keys = asking
        .map((i) => i.company)
        .filter(Boolean)
        .slice(0, 40)
        .join("|");
      /* Pressing the button is a request for the price right now, so it takes a
         key nothing else will share. The automatic refresh takes one that
         rotates every thirty seconds: reloading twice in a moment costs BSE a
         single fetch, and a reload after that is genuinely current.

         Sending no key at all was the mistake. The response is edge-cached, and
         it carries the time it was taken — so a reload was answered from the
         cache, showed a price minutes old, and stamped it with the minutes-old
         timestamp, which reads exactly like a refresh that never happened. */
      const bust = opts.silent
        ? `&at=${Math.floor(Date.now() / 30000)}`
        : `&at=${Date.now()}`;
      const res = await fetch(`/api/listings?from=${from}${bust}&keys=${encodeURIComponent(keys)}`);
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch { /* handled next */ }
      if (!res.ok || data.error) throw new Error(data.error || `Request failed (${res.status})`);

      const byKey = new Map();
      (data.listings || []).forEach((l) => { if (l.key) byKey.set(l.key, l); });

      const asOf = data.fetchedAt || new Date().toISOString();
      const listingsLoaded = data.listingsKnown !== false;
      let matched = 0;
      let updated = 0;
      let reblocked = 0;

      const next = list.map((ipo) => {
        const hit = byKey.get(nameKey(ipo.company));
        if (!hit) return ipo;
        matched++;
        /* BSE is authoritative here, so its values replace what is on record
           rather than only filling gaps. */
        const patch = { priceAsOf: asOf };
        if (hit.currentPrice != null) patch.currentPrice = String(hit.currentPrice);
        /* The listing price is the opening print on debut day. The close can be
           far from it — Innovision opened at 466 and closed at 372.8 the same
           day — so the close is only a fallback when the open is unavailable. */
        /* There is no closing price until the day has closed. On listing day
           BSE simply has not filled it in, and treating that as a figure priced
           the share at nothing on the one day everyone is watching it. Until
           the day is over the share has an opening print and a last trade, and
           that is all it has. */
        /* Only when BSE positively says it listed today. A row with no listing
           date at all says nothing about the day, and must be left to the
           has-it-listed check further down rather than wiped here. */
        const listingToday = !!hit.listedOn && hit.listedOn >= todayISO();
        const listingClose = listingToday ? null : hit.listingClose;

        if (hit.listingOpen != null) {
          patch.listingPrice = String(hit.listingOpen);
          patch.listingPriceSource = "bse-open";
        } else if (listingClose != null) {
          patch.listingPrice = String(listingClose);
          patch.listingPriceSource = "bse-close";
        } else if (listingToday) {
          // Listed today with nothing settled yet: leave no stale figure behind.
          patch.listingPrice = "";
          patch.listingPriceSource = "";
        }
        if (listingClose != null) patch.listingClosePrice = String(listingClose);
        else if (listingToday) patch.listingClosePrice = "";
        /* An issue BSE knows about but has no listing row for has not listed
           yet, and that absence is itself information — otherwise a wrong
           listing date entered long ago can never be cleared, because there is
           nothing to overwrite it with. Only trusted when the listings dataset
           actually loaded; a failed fetch must not wipe every listing date. */
        if (hit.listedOn) {
          patch.listingDate = hit.listedOn;
        } else if (listingsLoaded) {
          /* BSE's listings feed records completed listings only, so an issue
             missing from it has not listed yet. Prices therefore cannot exist
             for it, whatever is on record. */
          patch.listingPrice = "";
          patch.listingPriceSource = "";
          patch.listingClosePrice = "";
          patch.currentPrice = "";
          /* The date is different: one in the future is a scheduled listing BSE
             has no row for yet, and clearing it would throw away the most useful
             thing known about the issue. Only a date in the past contradicts the
             exchange having no record, so only that is cleared. */
          if (ipo.listingDate && ipo.listingDate < todayISO()) patch.listingDate = "";
        }
        if (hit.openDate) patch.openDate = hit.openDate;
        if (hit.closeDate) {
          patch.closeDate = hit.closeDate;
          // The last day to bid is the day an application had to be in by.
          patch.applicationDate = hit.closeDate;
        }
        // The top of the band: what a cut-off application is priced at.
        if (hit.priceMax != null) patch.priceBand = String(hit.priceMax);
        if (hit.lotSize != null) patch.lotSize = String(hit.lotSize);

        const merged = { ...ipo, ...patch };

        /* Recompute what each application actually blocked. Old records carry a
           round placeholder rather than lots x lot size x price. */
        const lot = Number(merged.lotSize);
        const band = Number(merged.priceBand);
        if (lot > 0 && band > 0) {
          merged.applications = (merged.applications || []).map((a) => {
            const want = String((Number(a.lots) || 0) * lot * band);
            if (want === "0" || a.amountBlocked === want) return a;
            reblocked++;
            return { ...a, amountBlocked: want };
          });
        }

        const changed =
          Object.keys(patch).some((k) => String(ipo[k] ?? "") !== String(patch[k])) ||
          merged.applications !== ipo.applications;
        if (changed) updated++;
        return changed ? merged : ipo;
      });

      if (updated) persistIpos(next);
      /* Counts are cumulative across rounds: a later pass that recalculates
         nothing must not erase what an earlier one reported. */
      const totalReblocked = (opts.reblockedSoFar || 0) + reblocked;
      setPriceInfo({ asOf, matched, total: list.length, reblocked: totalReblocked, error: "" });

      /* Recovering an issue that has aged out of BSE's window feed costs about
         a dozen requests, so the server only does a handful per call. Go round
         again while that is still making progress, rather than making you press
         refresh once per batch. Bounded, and it stops the moment a pass fills
         nothing in — which is also what happens when BSE simply has no more. */
      const before = incomplete(list).length;
      const after = incomplete(next).length;
      if (after > 0 && after < before && (opts.round || 0) < 4) {
        // The next pass reads the list it just wrote, not React's stale copy.
        return refreshPricesFrom(next, {
          ...opts,
          round: (opts.round || 0) + 1,
          reblockedSoFar: totalReblocked,
        });
      }

      return { matched, updated, reblocked: totalReblocked };
    } catch (e) {
      console.error("Price refresh failed", e);
      setPriceInfo((p) => ({ ...p, error: e.message || "Could not update prices" }));
      if (!opts.silent) throw e;
      return { matched: 0, updated: 0 };
    } finally {
      setPricing(false);
    }
  }, [persistIpos]);

  // The entry point everything else uses: start from what React is holding.
  const refreshPrices = useCallback(
    (opts = {}) => refreshPricesFrom(ipos, opts),
    [ipos, refreshPricesFrom]
  );

  // Refresh once per session when there is something whose value can move.
  useEffect(() => {
    if (!loaded || pricedOnce.current) return;
    // Worth doing whenever anything could be filled in: a live holding to
    // value, or simply a date or listing price still missing.
    const worthFetching = ipos.some((i) =>
      (i.applications || []).some((a) =>
        !a.sold && (a.allotmentStatus === "Allotted" || a.allotmentStatus === "Partial")) ||
      !i.listingDate || !i.openDate || !i.closeDate || isBlank(i.listingPrice));
    if (!worthFetching) return;
    pricedOnce.current = true;
    refreshPrices({ silent: true });
  }, [loaded, ipos, refreshPrices]);

  /* The figure on the cards is the last traded price, so it goes stale simply
     by being looked at later. Coming back to the app is the moment that shows,
     and it is also the only moment worth spending a request on — a tab sitting
     in the background needs nothing. Refetched when what is on screen is more
     than a few minutes old and the market could have moved since. */
  const priceAsOfRef = useRef("");
  priceAsOfRef.current = priceInfo.asOf;
  const refreshRef = useRef(refreshPrices);
  refreshRef.current = refreshPrices;

  useEffect(() => {
    if (!loaded || typeof document === "undefined") return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const asOf = priceAsOfRef.current;
      if (!asOf) return;
      const age = Date.now() - Date.parse(asOf);
      if (Number.isFinite(age) && age > 3 * 60 * 1000) refreshRef.current({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [loaded]);

  const replaceAll = useCallback((state) => {
    persistAccounts(state.accounts);
    persistIpos(state.ipos);
    persistTransfers(state.transfers);
    persistTrash(state.trash || []);
  }, [persistAccounts, persistIpos, persistTransfers, persistTrash]);

  /* Putting a record back. An application needs its IPO to still be there; if
     that went too, the IPO has to come back first — so say so rather than drop
     the application into nothing. */
  const restore = useCallback((entryId) => {
    const entry = trash.find((t) => t.id === entryId);
    if (!entry) return;
    const rest = trash.filter((t) => t.id !== entryId);
    const put = (list, item) => (list.some((x) => x.id === item.id) ? list : [item, ...list]);

    if (entry.kind === "account") persistAccounts(put(accounts, entry.payload));
    else if (entry.kind === "ipo") persistIpos(put(ipos, entry.payload));
    else if (entry.kind === "transfer") persistTransfers(put(transfers, entry.payload));
    else if (entry.kind === "application") {
      const owner = ipos.find((i) => i.id === entry.parentId);
      if (!owner) {
        alert("That IPO was deleted too. Restore it first, then restore this application.");
        return;
      }
      persistIpos(ipos.map((i) =>
        i.id !== owner.id ? i : { ...i, applications: put(i.applications || [], entry.payload) }
      ));
    }
    persistTrash(rest);
  }, [trash, accounts, ipos, transfers, persistAccounts, persistIpos, persistTransfers, persistTrash]);

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
          } else {
            const mark = valuationPrice(ipo);
            if (mark) unrealized += shares * (mark - price);
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
        onFetchLive={() => setLiveOpen(true)}
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
            onDelete={(id) => {
              const gone = ipos.find((x) => x.id === id);
              if (!gone) return;
              discard("ipo", gone, gone.company || "Untitled IPO");
              persistIpos(ipos.filter((x) => x.id !== id));
            }}
          />
        )}
        {tab === "accounts" && (
          <AccountList
            transfers={transfers}
            accounts={accounts} ipos={ipos}
            onEdit={(account) => setAcctSheet({ account })}
            onDelete={(id) => {
              const gone = accounts.find((x) => x.id === id);
              if (!gone) return;
              discard("account", gone, gone.name || "Unnamed account");
              persistAccounts(accounts.filter((x) => x.id !== id));
            }}
          />
        )}
        {tab === "transfers" && (
          <TransfersScreen
            transfers={transfers} accounts={accounts} ipos={ipos}
            onEdit={(transfer) => setTransferSheet({ transfer })}
            onDelete={(id) => {
              const gone = transfers.find((x) => x.id === id);
              if (!gone) return;
              const who = (aid) => accounts.find((a) => a.id === aid)?.name || "Unknown";
              discard("transfer", gone, `${inr(gone.amount)} · ${who(gone.fromAccountId)} to ${who(gone.toAccountId)}`);
              persistTransfers(transfers.filter((x) => x.id !== id));
            }}
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
          onBulkApply={(ipoId) => { setIpoDetail(null); setBulkApplyFor(ipoId); }}
          onBulkStatus={(ipoId) => { setIpoDetail(null); setBulkStatusFor(ipoId); }}
          onEditApplication={(ipoId, application) => setAppSheet({ ipoId, application })}
          onDeleteApplication={(ipoId, appId) => {
            const owner = ipos.find((i) => i.id === ipoId);
            const gone = (owner?.applications || []).find((a) => a.id === appId);
            if (!gone) return;
            const who = accounts.find((a) => a.id === gone.accountId)?.name || "Unknown account";
            discard("application", gone, `${who} · ${owner.company || "an IPO"}`, ipoId);
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
              const merged = { ...ipoSheet.ipo, ...data };
              // Applications added before the price and lot size were known were
              // saved with a blank amount. Now that we can work it out, offer to.
              const fillable = fillableApplications(merged);
              const applications = fillable.length && confirm(
                `Work out the blocked amount for ${fillable.length} application` +
                `${fillable.length === 1 ? "" : "s"} that had none, from this price and lot size?`
              )
                ? (merged.applications || []).map((a) =>
                    isBlank(a.amountBlocked) && blockedFor(merged, a.lots) > 0
                      ? { ...a, amountBlocked: String(blockedFor(merged, a.lots)) }
                      : a)
                : merged.applications;
              persistIpos(ipos.map((i) => (i.id === data.id ? { ...merged, applications } : i)));
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
          ipo={ipos.find((i) => i.id === appSheet.ipoId)}
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

      {bulkApplyFor && (
        <BulkApplySheet
          ipo={ipos.find((i) => i.id === bulkApplyFor)}
          accounts={accounts}
          onClose={() => { setBulkApplyFor(null); setIpoDetail(bulkApplyFor); }}
          onSave={(newApps) => {
            persistIpos(ipos.map((i) => (i.id === bulkApplyFor
              ? { ...i, applications: [...(i.applications || []), ...newApps] }
              : i)));
            setBulkApplyFor(null);
            setIpoDetail(bulkApplyFor);
          }}
        />
      )}

      {bulkStatusFor && (
        <BulkStatusSheet
          ipo={ipos.find((i) => i.id === bulkStatusFor)}
          accounts={accounts}
          onClose={() => { setBulkStatusFor(null); setIpoDetail(bulkStatusFor); }}
          onSave={(draft) => {
            persistIpos(ipos.map((i) => (i.id === bulkStatusFor
              ? {
                  ...i,
                  applications: (i.applications || []).map((a) =>
                    draft[a.id] ? { ...a, ...draft[a.id] } : a),
                }
              : i)));
            setBulkStatusFor(null);
            setIpoDetail(bulkStatusFor);
          }}
        />
      )}

      {liveOpen && (
        <LiveIposSheet
          existing={ipos}
          onClose={() => setLiveOpen(false)}
          onImport={(rows) => {
            persistIpos([...rows, ...ipos]);
            setLiveOpen(false);
            setTab("ipos");
          }}
        />
      )}

      {acctSheet && (
        <AccountFormSheet
          initial={acctSheet.account}
          accounts={accounts}
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
          state={{ accounts, ipos, transfers, trash }}
          onRestore={restore}
          session={session}
          cloudOn={cloudEnabled()}
          syncing={syncing}
          syncError={syncError}
          lastSync={lastSync}
          onClose={() => setDataSheetOpen(false)}
          onSyncNow={pushToCloud}
          pricing={pricing}
          priceInfo={priceInfo}
          onRefreshPrices={refreshPrices}
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
function Header({ tab, onAdd, onOpenData, onFetchLive, syncing, syncError, cloudOn }) {
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
        {tab === "ipos" && (
          <button onClick={onFetchLive} aria-label="Add IPOs from the exchanges" style={{
            display: "flex", alignItems: "center", gap: 5, height: 36, padding: "0 10px",
            borderRadius: 18, border: `1px solid ${COLORS.gold}`, background: "transparent",
            cursor: "pointer", flexShrink: 0,
          }}>
            <Sparkles size={14} color={COLORS.gold} />
            <span style={{ color: COLORS.gold, fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>Add from exchange</span>
          </button>
        )}
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
  const recent = [...ipos]
    .sort((a, b) => (b.applicationDate || b.openDate || "").localeCompare(a.applicationDate || a.openDate || ""))
    .slice(0, 4);
  // Figures below are derived from price and lot size; say so when some are absent
  // rather than quietly reporting a total that leaves money out.
  const incomplete = ipos.filter((i) => (i.applications || []).length && missingIpoFields(i).length);
  const marked = ipos.some((i) => isMarkedToMarket(i));

  /* The ledger already works out when each thing happens; this is simply the
     part of it that concerns today. Without it the dates are only ever found by
     opening an IPO, which is the wrong way round — the point of knowing the
     allotment date is to be told on the day. */
  const today = todayISO();
  const todo = useMemo(() => {
    const closing = [];
    const allotting = [];
    const listing = [];
    ipos.forEach((i) => {
      if (i.closeDate && i.closeDate === today) closing.push(i);
      if (awaitingAllotmentEntry(i)) allotting.push(i);
      const lists = i.listingDate || listingDateOf(i).date;
      if (lists && lists === today) listing.push(i);
    });
    return { closing, allotting, listing };
  }, [ipos, today]);

  const lines = [
    todo.closing.length && {
      key: "closing",
      text: `${todo.closing.length === 1 ? "1 issue closes" : todo.closing.length + " issues close"} today`,
      detail: todo.closing.map((i) => i.company).join(", "),
      tone: COLORS.gold,
    },
    todo.allotting.length && {
      key: "allotting",
      text: `${todo.allotting.length} allotment${todo.allotting.length === 1 ? "" : "s"} to record`,
      detail: todo.allotting.map((i) => i.company).join(", "),
      tone: COLORS.gold,
    },
    todo.listing.length && {
      key: "listing",
      text: `${todo.listing.length === 1 ? "1 issue lists" : todo.listing.length + " issues list"} today`,
      detail: todo.listing.map((i) => i.company).join(", "),
      tone: COLORS.green,
    },
  ].filter(Boolean);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <StatCard label="Capital Deployed" value={inr(stats.invested)} icon={Landmark} tone="navy" />
        <StatCard label="Realized Gain" value={inr(stats.realized)} icon={stats.realized >= 0 ? TrendingUp : TrendingDown} tone={stats.realized >= 0 ? "green" : "red"} />
        <StatCard label={marked ? "Unrealized (at today's price)" : "Unrealized (at listing)"} value={inr(stats.unrealized)} icon={stats.unrealized >= 0 ? TrendingUp : TrendingDown} tone={stats.unrealized >= 0 ? "green" : "red"} />
        <StatCard label="Pending Allotment" value={stats.pendingCount} icon={Clock} tone="gold" />
      </div>

      {incomplete.length > 0 && (
        <div style={{
          background: COLORS.goldSoft, borderRadius: 10, padding: "9px 12px", marginBottom: 16,
          fontSize: 12, color: COLORS.ink, display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <AlertTriangle size={14} color={COLORS.gold} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            {incomplete.length} IPO{incomplete.length === 1 ? "" : "s"} with applications
            {incomplete.length === 1 ? " is" : " are"} missing a price or lot size, so the figures
            above leave {incomplete.length === 1 ? "it" : "them"} out. The IPOs tab has a
            “Needs details” filter.
          </span>
        </div>
      )}

      {lines.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <SectionLabel>Today</SectionLabel>
          {/* Each issue is its own row. Naming three and opening whichever came
              first is worse than not being tappable at all. */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lines.map((l) => (
              <div key={l.key} style={{
                background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                borderLeft: `3px solid ${l.tone}`, borderRadius: 10, overflow: "hidden",
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: COLORS.ink, padding: "10px 12px 6px",
                  fontFamily: "Inter, sans-serif",
                }}>{l.text}</div>
                {todo[l.key].map((i, n) => (
                  <button
                    key={i.id}
                    onClick={() => onOpenIpo(i.id)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                      textAlign: "left", width: "100%", cursor: "pointer", background: "transparent",
                      border: 0, borderTop: n === 0 ? "none" : `1px solid ${COLORS.border}`,
                      padding: "8px 12px", fontFamily: "Inter, sans-serif",
                      fontSize: 12.5, color: COLORS.inkSoft,
                    }}
                  >
                    <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{i.company || "Untitled IPO"}</span>
                    <ChevronRight size={14} color={COLORS.inkSoft} style={{ flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

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

const chipBase = {
  border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.inkSoft,
  borderRadius: 999, padding: "7px 12px", fontSize: 12, fontWeight: 600,
  fontFamily: "Inter, sans-serif", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
};
const chipOn = { background: COLORS.navy, border: `1px solid ${COLORS.navy}`, color: "#fff" };

const selectStyle = {
  ...inputStyle, width: "auto", minWidth: 0, minHeight: 36, padding: "6px 8px",
  fontSize: 12, fontWeight: 600,
};


/* Boards are not mutually exclusive — you may want one, or both. Turning the
   last one off would ask for nothing at all, so the last one on cannot be
   turned off; it is the only state the control refuses. */
function BoardToggles({ options, selected, onToggle }) {
  return (
    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
      {options.map((b) => {
        const on = selected.includes(b.id);
        const last = on && selected.length === 1;
        return (
          <button
            key={b.id}
            onClick={() => onToggle(b.id)}
            aria-pressed={on}
            aria-label={`${b.label}${on ? " (showing)" : ""}`}
            title={last ? "At least one board has to be shown" : b.label}
            style={{
              border: `1px solid ${on ? COLORS.navy : COLORS.border}`,
              background: on ? COLORS.navy : COLORS.surface,
              color: on ? "#fff" : COLORS.inkSoft,
              borderRadius: 999, padding: "7px 11px", minHeight: 36,
              fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600,
              whiteSpace: "nowrap", cursor: last ? "default" : "pointer",
              opacity: last ? 0.92 : 1,
            }}
          >
            {b.label}{b.count != null ? ` ${b.count}` : ""}
          </button>
        );
      })}
    </div>
  );
}

/* Only worth a control when it can actually narrow anything: with every issue
   on one board the choice is between everything and nothing. */
function boardIsWorthAsking(boards) {
  if (!boards) return false;
  return boards.filter((b) => b.count > 0).length > 1;
}

/* `boards` is a second, independent dimension. Which board an issue is on says
   nothing about how the application went, so folding it into the status chips
   would make "pending, mainboard only" unaskable. */
function ListControls({ search, setSearch, placeholder, filters, filter, setFilter, sorts, sort, setSort, boards, board, toggleBoard }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {/* The board sits beside the search rather than under it: two toggles are
          narrow, the search box has width to spare, and it keeps the controls
          below to a single row. */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <div style={{ position: "relative", flex: "1 1 0", minWidth: 0 }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", display: "flex", pointerEvents: "none" }}>
            <Search size={15} color={COLORS.inkSoft} />
          </span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            style={{ paddingLeft: 34 }}
          />
        </div>
        {boardIsWorthAsking(boards) && (
          <BoardToggles options={boards} selected={board} onToggle={toggleBoard} />
        )}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter"
          style={{ ...selectStyle, flex: "1 1 0" }}
        >
          {filters.map((f) => (
            <option key={f.id} value={f.id}>{f.label}{f.count != null ? ` ${f.count}` : ""}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort order"
          style={{ ...selectStyle, flex: "1 1 0" }}
        >
          {sorts.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
    </div>
  );
}

function IpoList({ ipos, accounts, onOpen, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  /* Which boards are showing. Mainboard is what this ledger is mostly made of,
     so that is where it opens; both can be on at once, and never neither. */
  const [board, setBoard] = useState(["Mainboard"]);
  const toggleBoard = (id) =>
    setBoard((cur) =>
      cur.includes(id)
        ? (cur.length === 1 ? cur : cur.filter((b) => b !== id))   // never nothing
        : [...cur, id]
    );
  const [sort, setSort] = useState("recent");

  /* Status counts follow the board in view, so a chip never promises rows the
     board filter is about to hide. The board counts stay whole. */
  const onBoard = useMemo(
    () => ipos.filter((i) => board.includes(boardOf(i))),
    [ipos, board]
  );

  const counts = useMemo(() => {
    const c = { all: onBoard.length, pending: 0, allotted: 0, rejected: 0, incomplete: 0 };
    onBoard.forEach((i) => {
      const b = ipoBucket(i);
      if (c[b] != null) c[b]++;
      if (missingIpoFields(i).length) c.incomplete++;
    });
    return c;
  }, [onBoard]);

  const boardCounts = useMemo(() => {
    const c = { Mainboard: 0, SME: 0 };
    ipos.forEach((i) => { c[boardOf(i)]++; });
    return c;
  }, [ipos]);

  /* An SME-only ledger would open on an empty screen, so the default gives way
     to whatever is actually there. */
  useEffect(() => {
    if (!ipos.length) return;
    if (board.some((b) => boardCounts[b] > 0)) return;
    const present = Object.keys(boardCounts).filter((k) => boardCounts[k] > 0);
    if (present.length) setBoard(present);
  }, [board, ipos.length, boardCounts]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const dateKey = (i) => i.applicationDate || i.openDate || i.closeDate || "";
    const cmp = {
      recent: (a, b) => dateKey(b).localeCompare(dateKey(a)),
      oldest: (a, b) => dateKey(a).localeCompare(dateKey(b)),
      company: (a, b) => (a.company || "").localeCompare(b.company || ""),
      allotted: (a, b) => allotmentTally(b).won - allotmentTally(a).won,
      pending: (a, b) => allotmentTally(b).pending - allotmentTally(a).pending,
    }[sort];

    return onBoard
      .filter((i) => {
        if (q && !`${i.company || ""} ${i.symbol || ""}`.toLowerCase().includes(q)) return false;
        if (filter === "all") return true;
        if (filter === "incomplete") return missingIpoFields(i).length > 0;
        return ipoBucket(i) === filter;
      })
      .sort(cmp);
  }, [onBoard, search, filter, sort]);

  if (ipos.length === 0) return <EmptyState text="No IPOs yet. Tap + to add one." />;

  return (
    <div>
      <ListControls
        search={search} setSearch={setSearch} placeholder="Search company or symbol"
        filter={filter} setFilter={setFilter}
        filters={[
          { id: "all", label: "All", count: counts.all },
          { id: "pending", label: "Pending", count: counts.pending },
          { id: "allotted", label: "Allotted", count: counts.allotted },
          { id: "rejected", label: "Missed", count: counts.rejected },
          { id: "incomplete", label: "Needs details", count: counts.incomplete },
        ]}
        boards={[
          { id: "Mainboard", label: "Mainboard", count: boardCounts.Mainboard },
          { id: "SME", label: "SME", count: boardCounts.SME },
        ]}
        board={board} toggleBoard={toggleBoard}
        sort={sort} setSort={setSort}
        sorts={[
          { id: "recent", label: "Newest" },
          { id: "oldest", label: "Oldest" },
          { id: "company", label: "A–Z" },
          { id: "allotted", label: "Most allotted" },
          { id: "pending", label: "Most pending" },
        ]}
      />
      {shown.length === 0 ? (
        <EmptyState text="No IPOs match that search or filter." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {shown.map((ipo) => (
            <IpoCard key={ipo.id} ipo={ipo} accounts={accounts} onClick={() => onOpen(ipo.id)}
              onEdit={() => onEdit(ipo)} onDelete={() => onDelete(ipo.id)} showActions />
          ))}
        </div>
      )}
    </div>
  );
}

/* Allotment happens per application, not per IPO. Count the outcomes instead of
   collapsing eleven different results into one misleading word. */
function allotmentTally(ipo) {
  const apps = ipo.applications || [];
  const t = { total: apps.length, allotted: 0, partial: 0, pending: 0, rejected: 0 };
  apps.forEach((a) => {
    if (a.allotmentStatus === "Allotted") t.allotted++;
    else if (a.allotmentStatus === "Partial") t.partial++;
    else if (a.allotmentStatus === "Not Allotted") t.rejected++;
    else t.pending++;
  });
  t.won = t.allotted + t.partial;
  t.decided = t.total - t.pending;
  return t;
}

/* What this IPO still needs before any money figure derived from it can be
   trusted. Both are required to work out how much a lot costs. */
function missingIpoFields(ipo) {
  const out = [];
  if (!(Number(ipo.priceBand) > 0)) out.push("price");
  if (!(Number(ipo.lotSize) > 0)) out.push("lot size");
  return out;
}

// Applications whose blocked amount could be filled in now that the IPO is complete.
function fillableApplications(ipo) {
  return (ipo.applications || []).filter(
    (a) => isBlank(a.amountBlocked) && blockedFor(ipo, a.lots) > 0
  );
}

/* Which board an issue is on. BSE labels the small-company platforms in several
   ways, and the ledger has only ever offered two choices, so anything that is
   not recognisably SME is treated as mainboard — the same assumption the rest
   of the app makes when the field is blank. */
function boardOf(ipo) {
  return /\bsme\b|emerge|\bbse\s*ss?me\b/i.test(String(ipo?.category || "")) ? "SME" : "Mainboard";
}

// Coarse bucket, used only for filtering the list.
function ipoBucket(ipo) {
  const t = allotmentTally(ipo);
  if (!t.total) return "none";
  if (t.pending) return "pending";
  if (t.won) return "allotted";
  return "rejected";
}

const panOf = (account) => (account?.pan || "").trim().toUpperCase();

/* One PAN may submit only one application per IPO — a duplicate gets every
   application under that PAN rejected, not just the extra one. Worth catching. */
function panConflicts(ipo, accounts) {
  const byPan = new Map();
  (ipo.applications || []).forEach((app) => {
    const acc = accounts.find((a) => a.id === app.accountId);
    const pan = panOf(acc);
    if (!pan) return;
    if (!byPan.has(pan)) byPan.set(pan, []);
    byPan.get(pan).push(acc.name);
  });
  return [...byPan.entries()].filter(([, names]) => names.length > 1);
}

// PANs already committed to this IPO, for warning before another is added.
function pansUsedIn(ipo, accounts) {
  const used = new Set();
  (ipo.applications || []).forEach((app) => {
    const pan = panOf(accounts.find((a) => a.id === app.accountId));
    if (pan) used.add(pan);
  });
  return used;
}

const blockedFor = (ipo, lots) =>
  (Number(lots) || 0) * (Number(ipo?.lotSize) || 0) * (Number(ipo?.priceBand) || 0);

function AllotmentBar({ tally }) {
  if (!tally.total) return null;
  const seg = (n, color) =>
    n > 0 ? <div key={color} style={{ flex: n, background: color }} /> : null;
  return (
    <div style={{
      display: "flex", height: 5, borderRadius: 3, overflow: "hidden",
      background: COLORS.border, marginTop: 8,
    }}>
      {seg(tally.won, COLORS.green)}
      {seg(tally.pending, COLORS.gold)}
      {seg(tally.rejected, COLORS.red)}
    </div>
  );
}

function AllotmentCounts({ tally }) {
  if (!tally.total) {
    return <span style={{ fontSize: 11.5, color: COLORS.inkSoft }}>No applications yet</span>;
  }
  return (
    <div style={{
      display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline",
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5,
    }}>
      <span style={{ color: tally.won ? COLORS.green : COLORS.inkSoft, fontWeight: 700 }}>
        {tally.won}/{tally.total} allotted
      </span>
      {/* Rejections are not spelled out: with the tally and what is still
          pending, they are simply the rest, and "0/8 allotted · 8 rejected"
          says one thing twice. The bar above still shows them in red. */}
      {tally.pending > 0 && <span style={{ color: COLORS.gold }}>{tally.pending} pending</span>}
    </div>
  );
}

function IpoCard({ ipo, accounts, onClick, onEdit, onDelete, showActions }) {
  const tally = allotmentTally(ipo);
  const apps = ipo.applications || [];
  const totalLots = apps.reduce((s, a) => s + (Number(a.lots) || 0), 0);
  const mark = valuationPrice(ipo);
  const gainPct = mark && Number(ipo.priceBand) > 0
    ? (((mark - Number(ipo.priceBand)) / Number(ipo.priceBand)) * 100)
    : null;
  const conflicts = panConflicts(ipo, accounts);
  const missing = missingIpoFields(ipo);
  const stage = issueStage(ipo);
  // Spine colour reflects where the IPO is overall, without claiming an outcome.
  const spine = tally.pending ? COLORS.gold : tally.won ? COLORS.green : tally.total ? COLORS.red : COLORS.border;

  return (
    <div style={{
      background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12,
      display: "flex", overflow: "hidden", cursor: "pointer",
    }} onClick={onClick}>
      <div style={{
        width: 8, backgroundColor: spine, flexShrink: 0,
        backgroundImage: `repeating-linear-gradient(180deg, transparent 0 6px, ${COLORS.surface} 6px 8px)`,
      }} />
      <div style={{ padding: "12px 14px", flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 16.5, color: COLORS.navyDeep, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {ipo.company || "Untitled IPO"}
            </div>
            {/* Held to one line: it is a summary, and a summary that wraps has
                stopped being one. Trimmed to earn the room rather than shrunk
                until it fits — "applic." said nothing "apps" does not. */}
            <div style={{
              fontSize: 11, color: COLORS.inkSoft, marginTop: 2, fontFamily: "'JetBrains Mono', monospace",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {ipo.category || "Mainboard"} · ₹{ipo.priceBand || "—"}/sh · {totalLots} lot{totalLots === 1 ? "" : "s"} · {apps.length} app{apps.length === 1 ? "" : "s"}
            </div>
            <div style={{ marginTop: 5, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {stage && <Badge color={stage.color} bg={stage.bg}>{stage.label}</Badge>}
              {awaitingAllotmentEntry(ipo) && (
                <Badge color={COLORS.red} bg={COLORS.redSoft}>RECORD ALLOTMENT</Badge>
              )}
              {missing.length > 0 && (
                <Badge color={COLORS.gold} bg={COLORS.goldSoft}>NEEDS {missing.join(" & ").toUpperCase()}</Badge>
              )}
            </div>
          </div>
          {conflicts.length > 0 && (
            <span title="The same PAN is used more than once on this IPO">
              <AlertTriangle size={16} color={COLORS.red} />
            </span>
          )}
        </div>

        {/* The gain shares the tally's line rather than taking one below the
            bar. Both are one short figure, and the row had width going spare. */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <AllotmentCounts tally={tally} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {apps.some((a) => a.sold) && <Badge color={COLORS.navy} bg="#EAEFF5">SOLD {apps.filter((a) => a.sold).length}/{tally}</Badge>}
              {gainPct !== null && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
                  color: gainPct >= 0 ? COLORS.green : COLORS.red,
                  display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap",
                }}>
                  {gainPct >= 0 ? <TrendingUp size={13} color={COLORS.green} /> : <TrendingDown size={13} color={COLORS.red} />}
                  {gainPct.toFixed(1)}% {isMarkedToMarket(ipo) ? "now" : "listing"}
                </span>
              )}
            </div>
          </div>
          <AllotmentBar tally={tally} />
        </div>
      </div>
      {showActions && (
        <div style={{ display: "flex", flexDirection: "column", borderLeft: `1px solid ${COLORS.border}` }}>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} aria-label="Edit IPO" style={iconBtnStyle}><Pencil size={14} color={COLORS.inkSoft} /></button>
          <button onClick={(e) => {
            e.stopPropagation();
            // An IPO owns its applications, so deleting it deletes them too.
            const n = apps.length;
            const msg = n
              ? `Delete ${ipo.company || "this IPO"} and its ${n} application${n === 1 ? "" : "s"}?`
                + " It is kept, and can be put back from Sync & Data."
              : `Delete ${ipo.company || "this IPO entry"}? It can be put back from Sync & Data.`;
            if (confirm(msg)) onDelete();
          }} aria-label="Delete IPO" style={{ ...iconBtnStyle, borderTop: `1px solid ${COLORS.border}` }}><Trash2 size={14} color={COLORS.red} /></button>
        </div>
      )}
    </div>
  );
}

const iconBtnStyle = {
  border: "none", background: COLORS.surface, width: 44, flex: 1, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};

/* The list rows are two lines tall, so a 36px control would set their height
   rather than fit inside it. */
const smallIconBtn = {
  width: 30, height: 30, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.bg,
  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
};

const roundIconBtn = {
  width: 36, height: 36, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.bg,
  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};

function IpoDetailSheet({ ipo, accounts, onClose, onEditIpo, onAddApplication, onBulkApply, onBulkStatus, onEditApplication, onDeleteApplication }) {
  if (!ipo) return null;
  const apps = ipo.applications || [];
  const tally = allotmentTally(ipo);
  const conflicts = panConflicts(ipo, accounts);
  return (
    <Sheet title={ipo.company} onClose={onClose}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <Badge color={COLORS.navy} bg="#EAEFF5">{ipo.category || "Mainboard"}</Badge>
        <Badge color={COLORS.inkSoft} bg="#EFEDE7">Price ₹{ipo.priceBand || "—"}</Badge>
        <Badge color={COLORS.inkSoft} bg="#EFEDE7">Lot {ipo.lotSize || "—"} sh</Badge>
        {Number(ipo.listingPrice) > 0 && hasListed(ipo) && (
          <Badge color={COLORS.inkSoft} bg="#EFEDE7">{ipo.listingPriceSource === "bse-close" ? "Listing close" : "Listed"} ₹{ipo.listingPrice}</Badge>
        )}
        {hasListed(ipo) && Number(ipo.listingClosePrice) > 0 && ipo.listingPriceSource === "bse-open"
          && ipo.listingClosePrice !== ipo.listingPrice && (
          <Badge color={COLORS.inkSoft} bg="#EFEDE7">closed ₹{ipo.listingClosePrice}</Badge>
        )}
        {isMarkedToMarket(ipo) && (
          <Badge color={Number(ipo.currentPrice) >= Number(ipo.priceBand) ? COLORS.green : COLORS.red}
            bg={Number(ipo.currentPrice) >= Number(ipo.priceBand) ? COLORS.greenSoft : COLORS.redSoft}>
            Now ₹{ipo.currentPrice}
          </Badge>
        )}
      </div>

      <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 6, display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
        {ipo.openDate && <span>Opens {fmtDate(ipo.openDate)}</span>}
        {ipo.closeDate
          ? <span>Closes {fmtDate(ipo.closeDate)}</span>
          : ipo.applicationDate && <span>Applied {fmtDate(ipo.applicationDate)}</span>}
        {!hasListed(ipo) && !allotmentSettled(ipo) && allotmentDateOf(ipo).date && (
          <span>
            Allotment {fmtDate(allotmentDateOf(ipo).date)}
            {allotmentDateOf(ipo).exact ? "" : " (expected)"}
          </span>
        )}
        {ipo.listingDate
          ? <span>{hasListed(ipo) ? "Listed" : "Lists"} {fmtDate(ipo.listingDate)}</span>
          : listingDateOf(ipo).date && <span>Lists {fmtDate(listingDateOf(ipo).date)} (expected)</span>}
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

      {conflicts.length > 0 && (
        <div style={{
          background: COLORS.redSoft, color: COLORS.red, borderRadius: 10,
          padding: "10px 12px", marginBottom: 14, fontSize: 12.5, display: "flex", gap: 8,
        }}>
          <AlertTriangle size={15} color={COLORS.red} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Duplicate PAN on this IPO.</strong>
            {conflicts.map(([pan, names]) => (
              <div key={pan} style={{ marginTop: 3, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5 }}>
                {pan} — {names.join(", ")}
              </div>
            ))}
            <div style={{ marginTop: 4 }}>
              One PAN may submit only one application per IPO. A duplicate normally gets every
              application under that PAN rejected, not just the extra one.
            </div>
          </div>
        </div>
      )}

      {apps.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <AllotmentCounts tally={tally} />
          <AllotmentBar tally={tally} />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => onBulkApply(ipo.id)} style={{
          flex: "1 1 46%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: COLORS.navy, color: "#fff", border: "none", borderRadius: 10,
          padding: "11px 10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
        }}><Layers size={14} color="#fff" /> Apply in bulk</button>
        <button onClick={() => onBulkStatus(ipo.id)} disabled={!apps.length} style={{
          flex: "1 1 46%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: COLORS.surface, color: apps.length ? COLORS.ink : COLORS.inkSoft,
          border: `1px solid ${COLORS.border}`, borderRadius: 10,
          padding: "11px 10px", fontSize: 12.5, fontWeight: 600,
          cursor: apps.length ? "pointer" : "default", opacity: apps.length ? 1 : 0.6,
        }}><ClipboardCheck size={14} color={apps.length ? COLORS.ink : COLORS.inkSoft} /> Record allotment</button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <SectionLabel>Applications ({apps.length})</SectionLabel>
        <button onClick={() => onAddApplication(ipo.id)} style={{
          display: "flex", alignItems: "center", gap: 4, background: "transparent", color: COLORS.navy,
          border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}><Plus size={13} color={COLORS.navy} /> Add one</button>
      </div>

      {apps.length === 0 ? (
        <EmptyState text="No applications yet for this IPO. Use “Apply in bulk” to add several at once." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {apps.map((app) => (
            <ApplicationRow key={app.id} app={app} ipo={ipo} accounts={accounts}
              onEdit={() => onEditApplication(ipo.id, app)}
              onDelete={() => { if (confirm("Delete this application? It can be put back from Sync & Data.")) onDeleteApplication(ipo.id, app.id); }} />
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
  else if (app.allotmentStatus === "Allotted" || app.allotmentStatus === "Partial") {
    const mark = valuationPrice(ipo);
    if (mark) pnl = shares * (mark - price);
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
        <span style={{ color: COLORS.inkSoft }}>{app.lots || 0} lot(s) · {inrOrDash(app.amountBlocked)} blocked</span>
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

function AccountList({ accounts, ipos, transfers = [], onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("name");

  const stats = useMemo(() => {
    const m = {};
    accounts.forEach((a) => { m[a.id] = { applied: 0, won: 0 }; });
    ipos.forEach((ipo) => {
      (ipo.applications || []).forEach((app) => {
        const s = m[app.accountId];
        if (!s) return;
        s.applied++;
        if (app.allotmentStatus === "Allotted" || app.allotmentStatus === "Partial") s.won++;
      });
    });
    return m;
  }, [accounts, ipos]);

  // A PAN entered on two accounts is itself a mistake worth surfacing.
  const dupPans = useMemo(() => {
    const seen = new Map();
    accounts.forEach((a) => {
      const p = panOf(a);
      if (!p) return;
      seen.set(p, (seen.get(p) || 0) + 1);
    });
    return new Set([...seen].filter(([, n]) => n > 1).map(([p]) => p));
  }, [accounts]);

  const missingPan = accounts.filter((a) => !panOf(a)).length;

  /* Deleting an account does not delete what it applied for. Those applications
     stay on their IPOs, still counted in every total, but with nobody's name
     against them — so say so first rather than let the ledger quietly acquire
     rows belonging to "Unknown account". */
  const confirmAccountDelete = (acc) => {
    const apps = ipos.reduce(
      (n, i) => n + (i.applications || []).filter((a) => a.accountId === acc.id).length, 0
    );
    const moves = transfers.filter(
      (t) => t.fromAccountId === acc.id || t.toAccountId === acc.id
    ).length;
    if (!apps && !moves) {
      return confirm(`Delete ${acc.name || "this account"}? You can put it back from Sync & Data.`);
    }
    const bits = [];
    if (apps) bits.push(`${apps} application${apps === 1 ? "" : "s"}`);
    if (moves) bits.push(`${moves} transfer${moves === 1 ? "" : "s"}`);
    return confirm(
      `${acc.name || "This account"} has ${bits.join(" and ")} on record.\n\n` +
      "Those stay in the ledger but will have no holder against them. " +
      "The account itself is kept and can be put back from Sync & Data.\n\nDelete it?"
    );
  };

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cmp = {
      name: (a, b) => (a.name || "").localeCompare(b.name || ""),
      applied: (a, b) => (stats[b.id]?.applied || 0) - (stats[a.id]?.applied || 0),
      won: (a, b) => (stats[b.id]?.won || 0) - (stats[a.id]?.won || 0),
    }[sort];

    return accounts
      .filter((a) => {
        if (q && !`${a.name || ""} ${a.relation || ""} ${a.bank || ""} ${a.pan || ""}`.toLowerCase().includes(q)) return false;
        if (filter === "nopan") return !panOf(a);
        if (filter === "dup") return dupPans.has(panOf(a));
        return true;
      })
      .sort(cmp);
  }, [accounts, search, filter, sort, stats, dupPans]);

  if (accounts.length === 0) return <EmptyState text="No family accounts added yet. Tap + to add one." />;

  return (
    <div>
      <ListControls
        search={search} setSearch={setSearch} placeholder="Search name, relation, bank or PAN"
        filter={filter} setFilter={setFilter}
        filters={[
          { id: "all", label: "All", count: accounts.length },
          { id: "nopan", label: "No PAN", count: missingPan },
          ...(dupPans.size ? [{ id: "dup", label: "Duplicate PAN", count: dupPans.size }] : []),
        ]}
        sort={sort} setSort={setSort}
        sorts={[
          { id: "name", label: "Name" },
          { id: "applied", label: "Most applied" },
          { id: "won", label: "Most allotted" },
        ]}
      />
      {shown.length === 0 ? (
        <EmptyState text="No accounts match that search or filter." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {shown.map((acc) => {
            const s = stats[acc.id] || { applied: 0, won: 0 };
            const pan = panOf(acc);
            const isDup = pan && dupPans.has(pan);
            return (
              <div key={acc.id} style={{
                background: COLORS.surface, border: `1px solid ${isDup ? COLORS.red : COLORS.border}`,
                borderRadius: 12, padding: "12px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15.5, color: COLORS.navyDeep }}>{acc.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>
                    {acc.relation || "Self"}{acc.bank ? ` · ${acc.bank}` : ""}
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 11, marginTop: 4,
                    display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
                  }}>
                    <span style={{ color: COLORS.inkSoft }}>{s.applied} applied</span>
                    <span style={{ color: s.won ? COLORS.green : COLORS.inkSoft }}>{s.won} allotted</span>
                    {pan
                      ? <span style={{ color: isDup ? COLORS.red : COLORS.inkSoft }}>{pan}{isDup ? " · duplicate" : ""}</span>
                      : <span style={{ color: COLORS.gold }}>no PAN</span>}
                  </div>
                  {acc.notes && <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4, fontStyle: "italic" }}>{acc.notes}</div>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => onEdit(acc)} aria-label="Edit account" style={roundIconBtn}><Pencil size={14} color={COLORS.inkSoft} /></button>
                  <button onClick={() => { if (confirmAccountDelete(acc)) onDelete(acc.id); }} aria-label="Delete account" style={roundIconBtn}><Trash2 size={14} color={COLORS.red} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TransfersScreen({ transfers, accounts, ipos = [], onEdit, onDelete }) {
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
        <TransferList transfers={transfers} accounts={accounts} ipos={ipos} onEdit={onEdit} onDelete={onDelete} />
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

function TransferList({ transfers, accounts, ipos = [], onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");

  const name = (id) => accounts.find((a) => a.id === id)?.name || "Unknown";
  const ipoName = (id) => ipos.find((i) => i.id === id)?.company || "";

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cmp = {
      recent: (a, b) => (b.date || "").localeCompare(a.date || ""),
      oldest: (a, b) => (a.date || "").localeCompare(b.date || ""),
      largest: (a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0),
      smallest: (a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0),
    }[sort];

    return transfers
      .filter((t) => {
        if (q) {
          const hay = `${name(t.fromAccountId)} ${name(t.toAccountId)} ${t.remarks || ""} ${ipoName(t.relatedIpoId)}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (filter === "linked") return !!t.relatedIpoId;
        if (filter === "unlinked") return !t.relatedIpoId;
        if (filter.startsWith("acct:")) {
          const id = filter.slice(5);
          return t.fromAccountId === id || t.toAccountId === id;
        }
        return true;
      })
      .sort(cmp);
  }, [transfers, accounts, ipos, search, filter, sort]);

  if (transfers.length === 0) return <EmptyState text="No fund transfers logged yet. Tap + to record one." />;

  const linked = transfers.filter((t) => t.relatedIpoId).length;

  return (
    <div>
      <ListControls
        search={search} setSearch={setSearch} placeholder="Search account, IPO or remark"
        filter={filter} setFilter={setFilter}
        filters={[
          { id: "all", label: "All", count: transfers.length },
          { id: "linked", label: "For an IPO", count: linked },
          { id: "unlinked", label: "Unlinked", count: transfers.length - linked },
          ...accounts.slice(0, 6).map((a) => ({ id: `acct:${a.id}`, label: a.name })),
        ]}
        sort={sort} setSort={setSort}
        sorts={[
          { id: "recent", label: "Newest" },
          { id: "oldest", label: "Oldest" },
          { id: "largest", label: "Largest" },
          { id: "smallest", label: "Smallest" },
        ]}
      />
      {shown.length === 0 ? <EmptyState text="No transfers match that search or filter." /> : (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {shown.map((t) => (
        /* Two rows, not four: the buttons had a line to themselves and the note
           another, so a transfer stood four rows tall for one fact anyone
           scans for. The amount sits beside the names, the buttons beside the
           date, and the note keeps to a single line — cut where it runs out,
           since the whole of it is in the edit sheet and a card is for finding
           the transfer rather than reading it. */
        <div key={t.id} style={{
          background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12,
          padding: "10px 12px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: COLORS.ink, minWidth: 0 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name(t.fromAccountId)}</span>
              <ArrowRightLeft size={13} color={COLORS.gold} style={{ flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name(t.toAccountId)}</span>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: COLORS.navy, flexShrink: 0 }}>{inrOrDash(t.amount)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <div
              title={t.remarks || ""}
              style={{
                flex: 1, minWidth: 0, fontSize: 11.5, color: COLORS.inkSoft,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {fmtDate(t.date)}
              {t.remarks ? <span style={{ fontStyle: "italic" }}> · “{t.remarks}”</span> : null}
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => onEdit(t)} aria-label="Edit transfer" style={smallIconBtn}><Pencil size={13} color={COLORS.inkSoft} /></button>
              <button onClick={() => { if (confirm("Delete this transfer? It can be put back from Sync & Data.")) onDelete(t.id); }} aria-label="Delete transfer" style={smallIconBtn}><Trash2 size={13} color={COLORS.red} /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
      )}
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
  const [editDates, setEditDates] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Sheet title={initial ? "Edit IPO" : "New IPO"} onClose={onClose}>
      <Field label="Company Name"><Input value={f.company} onChange={set("company")} placeholder="e.g. Vishal Mega Mart" /></Field>
      <Field label="Category">
        <Select value={f.category} onChange={set("category")}>
          <option>Mainboard</option><option>SME</option>
        </Select>
      </Field>
      <Field label="Price per Share (₹)"><Input type="number" inputMode="numeric" value={f.priceBand} onChange={set("priceBand")} placeholder="e.g. 285" /></Field>
      <Field label="Lot Size (shares)"><Input type="number" inputMode="numeric" value={f.lotSize} onChange={set("lotSize")} placeholder="e.g. 52" /></Field>

      {/* Dates come from BSE and are shown rather than typed — every one was a
          duplicate of something the exchange already publishes. But BSE has no
          record of some issues, and then a wrong date can only be corrected by
          hand, so the inputs are a click away rather than gone. */}
      {!editDates ? (
        <div style={{
          background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10,
          padding: "10px 12px", marginBottom: 14, fontSize: 12, color: COLORS.inkSoft,
          fontFamily: "'JetBrains Mono', monospace", display: "flex", flexDirection: "column", gap: 3,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, color: COLORS.ink, fontSize: 11 }}>
              {f.openDate || f.closeDate || f.listingDate ? "DATES" : "NO DATES YET"}
            </span>
            <button
              type="button"
              onClick={() => setEditDates(true)}
              style={{ background: "none", border: 0, padding: 0, color: COLORS.navy, fontWeight: 600, fontSize: 11.5, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
            >Edit</button>
          </div>
          {f.openDate && <span>Opens {fmtDate(f.openDate)}</span>}
          {f.closeDate && <span>Closes {fmtDate(f.closeDate)} — last day to apply</span>}
          {!hasListed(f) && !allotmentSettled(f) && allotmentDateOf(f).date && (
            <span>
              Allotment {fmtDate(allotmentDateOf(f).date)}
              {allotmentDateOf(f).exact ? "" : " (expected)"}
            </span>
          )}
          {f.listingDate
            ? <span>{hasListed(f) ? "Listed" : "Lists"} {fmtDate(f.listingDate)}</span>
            : listingDateOf(f).date && <span>Lists {fmtDate(listingDateOf(f).date)} (expected)</span>}
          {!(f.openDate || f.closeDate || f.listingDate) && (
            <span style={{ fontFamily: "Inter, sans-serif" }}>
              BSE has none for this issue. Refreshing prices fills them in when it does.
            </span>
          )}
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 10 }}>
            A refresh overwrites these whenever BSE has its own value.
          </div>
          <Field label="Opens"><Input type="date" value={f.openDate || ""} onChange={set("openDate")} /></Field>
          <Field label="Closes — last day to apply"><Input type="date" value={f.closeDate || ""} onChange={set("closeDate")} /></Field>
          <Field label="Allotment date"><Input type="date" value={f.allotmentDate || ""} onChange={set("allotmentDate")} /></Field>
          <Field label="Listing date"><Input type="date" value={f.listingDate || ""} onChange={set("listingDate")} /></Field>
        </>
      )}
      <Field label={f.listingPriceSource === "bse-open" ? "Listing Price — day-one open (from BSE, ₹)" : f.listingPriceSource === "bse-close" ? "Listing Day Close (from BSE, ₹)" : "Listing Price (optional, ₹)"}>
        <Input
          type="number" inputMode="numeric" value={f.listingPrice}
          // Typing over it makes it yours, so it is no longer BSE's close.
          onChange={(e) => setF({ ...f, listingPrice: e.target.value, listingPriceSource: "" })}
          placeholder="e.g. 340"
        />
      </Field>
      <Field label="Remarks">
        <textarea value={f.remarks} onChange={set("remarks")} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Any notes about this IPO" />
      </Field>
      <PrimaryButton onClick={() => { if (!f.company) return alert("Company name is required"); onSave({ ...f, id: f.id || uid() }); }}>
        {initial ? "Save Changes" : "Add IPO"}
      </PrimaryButton>
    </Sheet>
  );
}

function ApplicationFormSheet({ initial, ipo, accounts, onClose, onSave }) {
  const [f, setF] = useState(initial || {
    id: undefined, accountId: accounts[0]?.id || "", appliedFor: "", lots: "1", amountBlocked: "",
    allotmentStatus: "Pending", sharesAllotted: "", sold: false, sellPrice: "", sellDate: "", remarks: "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setBool = (k) => (e) => setF({ ...f, [k]: e.target.checked });

  /* A full allotment is the whole application: lots x lot size. Left blank it
     silently values the holding at nothing — no shares, no capital deployed, no
     gain — so it is filled in the moment the status says allotted, exactly as
     the bulk sheet does. Still editable, for the odd partial. */
  const setStatus = (e) => {
    const allotmentStatus = e.target.value;
    const lot = Number(ipo?.lotSize) || 0;
    const next = { ...f, allotmentStatus };
    if (allotmentStatus === "Allotted" && lot > 0) {
      next.sharesAllotted = String(lot * (Number(f.lots) || 1));
    } else if (allotmentStatus === "Not Allotted" || allotmentStatus === "Pending") {
      next.sharesAllotted = "";
    }
    setF(next);
  };

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
        <Select value={f.allotmentStatus} onChange={setStatus}>
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

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

function AccountFormSheet({ initial, accounts = [], onClose, onSave }) {
  const [f, setF] = useState(initial || { id: undefined, name: "", relation: "", bank: "", pan: "", notes: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const pan = (f.pan || "").trim().toUpperCase();
  const panShapeBad = pan.length > 0 && !PAN_RE.test(pan);
  const panTakenBy = pan && !panShapeBad
    ? accounts.find((a) => a.id !== f.id && panOf(a) === pan)
    : null;

  return (
    <Sheet title={initial ? "Edit Account" : "New Account"} onClose={onClose}>
      <Field label="Name"><Input value={f.name} onChange={set("name")} placeholder="e.g. Mom, Dad, Priya Aunty" /></Field>
      <Field label="Relation"><Input value={f.relation} onChange={set("relation")} placeholder="e.g. Mother, Self, Brother-in-law" /></Field>
      <Field label="Bank / Broker (optional)"><Input value={f.bank} onChange={set("bank")} placeholder="e.g. HDFC / Zerodha" /></Field>
      <Field label="PAN">
        <Input
          value={f.pan || ""}
          onChange={(e) => setF({ ...f, pan: e.target.value.toUpperCase() })}
          placeholder="ABCDE1234F"
          maxLength={10}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}
        />
      </Field>
      {panShapeBad && (
        <div style={{ background: COLORS.goldSoft, color: COLORS.ink, borderRadius: 8, padding: "8px 10px", marginTop: -6, marginBottom: 12, fontSize: 12 }}>
          That does not look like a PAN (five letters, four digits, one letter). Saving anyway is fine — it is only used to catch duplicate applications.
        </div>
      )}
      {panTakenBy && (
        <div style={{ background: COLORS.redSoft, color: COLORS.red, borderRadius: 8, padding: "8px 10px", marginTop: -6, marginBottom: 12, fontSize: 12 }}>
          <strong>{panTakenBy.name}</strong> already uses this PAN. Two accounts on one PAN still count as one applicant.
        </div>
      )}
      <Field label="Notes"><textarea value={f.notes} onChange={set("notes")} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></Field>
      <PrimaryButton onClick={() => {
        if (!f.name) return alert("Name is required");
        onSave({ ...f, pan, id: f.id || uid() });
      }}>
        {initial ? "Save Changes" : "Add Account"}
      </PrimaryButton>
    </Sheet>
  );
}

function TransferFormSheet({ initial, accounts, ipos, onClose, onSave }) {
  const [f, setF] = useState(initial || {
    id: undefined, fromAccountId: accounts[0]?.id || "", toAccountId: accounts[1]?.id || accounts[0]?.id || "",
    amount: "", date: todayISO(), relatedIpoId: "", remarks: "",
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

const TRASH_KINDS = {
  ipo: "IPO",
  account: "Account",
  transfer: "Transfer",
  application: "Application",
};

/* How old the figure on screen is, in the terms someone would ask it in. */
function priceAge(asOf) {
  const t = Date.parse(asOf || "");
  if (!Number.isFinite(t)) return "time unknown";
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins <= 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const at = fmtTime(new Date(t));
  const hrs = Math.round(mins / 60);
  return hrs < 12 ? `${hrs} hr ago (${at})` : `as of ${at}`;
}

function DataSheet({ state, session, cloudOn, syncing, syncError, lastSync, onClose, onSyncNow, onReplaceAll, onRestore, onSignOut, pricing, priceInfo, onRefreshPrices }) {
  const [importText, setImportText] = useState("");
  const [notice, setNotice] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  const counts = `${state.accounts.length} accounts · ${state.ipos.length} IPOs · ${state.transfers.length} transfers`
    + ((state.trash || []).length ? ` · ${state.trash.length} deleted` : "");

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
    a.download = `ipo-ledger-${todayISO()}.json`;
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
      <SectionLabel>Market prices</SectionLabel>
      <div style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12,
        padding: "12px 14px", marginBottom: 8, fontSize: 12,
        color: priceInfo?.error ? COLORS.red : COLORS.inkSoft,
      }}>
        {priceInfo?.error
          ? priceInfo.error
          : priceInfo?.asOf
            ? `${priceInfo.matched} of ${priceInfo.total} IPOs matched on BSE`
              + `${priceInfo.reblocked ? ` · ${priceInfo.reblocked} blocked amounts recalculated` : ""}`
              // Say which price it is. "Now" on a card is the last trade, which
              // outside market hours is simply where the day closed.
              + ` · last traded price, ${priceAge(priceInfo.asOf)}`
            : "Not updated yet. Unrealised gains use the listing price until you do."}
      </div>
      <PrimaryButton ghost onClick={() => onRefreshPrices().catch(() => {})} disabled={pricing}>
        {pricing ? "Fetching from BSE…" : "Update market prices"}
      </PrimaryButton>

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

      {/* Deleted records are kept, not removed, so this is the way back. */}
      <SectionLabel>Deleted ({(state.trash || []).length})</SectionLabel>
      {cloudOn && trashSyncIsBlocked() && (
        <div style={{
          background: COLORS.goldSoft, borderRadius: 10, padding: "9px 12px", marginBottom: 10,
          fontSize: 12, color: COLORS.ink, display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <AlertTriangle size={14} color={COLORS.gold} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Deleted records are kept on this device but are not syncing yet — the cloud table
            was created before they existed. Run <strong>migrate-trash.sql</strong> once in the
            Supabase SQL editor and they will sync like everything else. The rest of the ledger
            is syncing normally.
          </span>
        </div>
      )}
      {(state.trash || []).length === 0 ? (
        <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 12 }}>
          Nothing deleted. When you do delete something it is kept here, and can be put back.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 8 }}>
            Kept in full, and included in every backup and sync.
          </div>
          {!showTrash ? (
            <PrimaryButton ghost onClick={() => setShowTrash(true)}>
              Show {(state.trash || []).length} deleted item{(state.trash || []).length === 1 ? "" : "s"}
            </PrimaryButton>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {(state.trash || []).map((t) => (
                <div key={t.id} style={{
                  background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10,
                  padding: "10px 12px", display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, overflowWrap: "anywhere" }}>
                      {t.label || "Untitled"}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>
                      {TRASH_KINDS[t.kind] || t.kind}
                      {t.deletedAt ? ` · ${fmtDate(String(t.deletedAt).slice(0, 10))}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => onRestore(t.id)}
                    style={{ ...chipBase, padding: "6px 10px", flexShrink: 0 }}
                  >Restore</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

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

/* ---------------------------------------------------------
   BULK OPERATIONS
   Applying one IPO across a dozen family accounts, and then
   recording a dozen allotment results, are the two jobs that
   are painful one form at a time.
---------------------------------------------------------- */
function BulkApplySheet({ ipo, accounts, onClose, onSave }) {
  const alreadyApplied = useMemo(
    () => new Set((ipo.applications || []).map((a) => a.accountId)),
    [ipo]
  );
  const usedPans = useMemo(() => pansUsedIn(ipo, accounts), [ipo, accounts]);

  const available = accounts.filter((a) => !alreadyApplied.has(a.id));
  const [picked, setPicked] = useState({});
  const [lots, setLots] = useState({});

  const lotsFor = (id) => lots[id] ?? "1";
  const chosen = available.filter((a) => picked[a.id]);

  // A PAN clashes if another chosen account shares it, or it is already on the IPO.
  const panClash = (acct) => {
    const p = panOf(acct);
    if (!p) return null;
    if (usedPans.has(p)) return "already applied on this IPO";
    const twin = chosen.find((o) => o.id !== acct.id && panOf(o) === p);
    return twin ? `same PAN as ${twin.name}` : null;
  };

  const totalBlocked = chosen.reduce((s, a) => s + blockedFor(ipo, lotsFor(a.id)), 0);
  const clashes = chosen.map((a) => [a, panClash(a)]).filter(([, c]) => c);
  const lotSizeKnown = Number(ipo.lotSize) > 0 && Number(ipo.priceBand) > 0;

  const toggle = (id) => setPicked((p) => ({ ...p, [id]: !p[id] }));
  const selectAll = () => {
    const next = {};
    available.forEach((a) => { next[a.id] = true; });
    setPicked(next);
  };

  const submit = () => {
    if (!chosen.length) return;
    if (clashes.length && !confirm(
      clashes.length + " of the selected accounts share a PAN with another application on this IPO. " +
      "Duplicate PANs normally get every application rejected. Add them anyway?"
    )) return;
    onSave(chosen.map((a) => ({
      id: uid(),
      accountId: a.id,
      appliedFor: "",
      lots: String(lotsFor(a.id)),
      amountBlocked: String(blockedFor(ipo, lotsFor(a.id)) || ""),
      allotmentStatus: "Pending",
      sharesAllotted: "",
      sold: false,
      sellPrice: "",
      sellDate: "",
      remarks: "",
    })));
  };

  return (
    <Sheet title="Apply across accounts" onClose={onClose}>
      <div style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12,
        padding: "10px 12px", marginBottom: 14,
      }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15, color: COLORS.navyDeep }}>{ipo.company}</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: COLORS.inkSoft, marginTop: 3 }}>
          ₹{ipo.priceBand || "—"}/sh · lot {ipo.lotSize || "—"} sh
          {lotSizeKnown ? ` · ₹${(Number(ipo.lotSize) * Number(ipo.priceBand)).toLocaleString("en-IN")} per lot` : ""}
        </div>
      </div>

      {!lotSizeKnown && (
        <div style={{ background: COLORS.goldSoft, borderRadius: 8, padding: "8px 10px", marginBottom: 12, fontSize: 12, display: "flex", gap: 8 }}>
          <AlertTriangle size={14} color={COLORS.gold} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Set this IPO's price and lot size to have the blocked amount worked out for you.</span>
        </div>
      )}

      {available.length === 0 ? (
        <EmptyState text="Every account already has an application on this IPO." />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <SectionLabel>Accounts ({chosen.length}/{available.length})</SectionLabel>
            <div style={{ display: "flex", gap: 6 }}>
              {chosen.length < available.length && (
                <button onClick={selectAll} style={{ ...chipBase, padding: "6px 10px" }}>Select all</button>
              )}
              {chosen.length > 0 && (
                <button onClick={() => setPicked({})} style={{ ...chipBase, padding: "6px 10px" }}>Clear</button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {available.map((a) => {
              const on = !!picked[a.id];
              const clash = on ? panClash(a) : null;
              return (
                <div key={a.id} style={{
                  background: COLORS.surface,
                  border: `1px solid ${clash ? COLORS.red : COLORS.border}`,
                  borderRadius: 10, padding: "10px 12px",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <input
                    type="checkbox" checked={on} onChange={() => toggle(a.id)}
                    aria-label={`Apply from ${a.name}`}
                    style={{ width: 18, height: 18, flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }} onClick={() => toggle(a.id)}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.ink }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: clash ? COLORS.red : COLORS.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
                      {clash ? clash : (panOf(a) || "no PAN on file")}
                    </div>
                  </div>
                  {on && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <input
                        type="number" min="1" inputMode="numeric"
                        value={lotsFor(a.id)}
                        onChange={(e) => setLots((l) => ({ ...l, [a.id]: e.target.value }))}
                        aria-label={`Lots for ${a.name}`}
                        style={{ ...inputStyle, width: 62, minHeight: 38, padding: "6px 8px", textAlign: "center" }}
                      />
                      <span style={{ fontSize: 10.5, color: COLORS.inkSoft, width: 58, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>
                        {blockedFor(ipo, lotsFor(a.id)) ? inr(blockedFor(ipo, lotsFor(a.id))) : "—"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {clashes.length > 0 && (
            <div style={{ background: COLORS.redSoft, color: COLORS.red, borderRadius: 10, padding: "10px 12px", marginBottom: 12, fontSize: 12.5 }}>
              <strong>{clashes.length} duplicate PAN{clashes.length === 1 ? "" : "s"}.</strong> One PAN may submit only
              one application per IPO — a duplicate normally gets every application under it rejected, not just the extra one.
            </div>
          )}

          {chosen.length > 0 && totalBlocked > 0 && (
            <div style={{
              background: COLORS.goldSoft, borderRadius: 10, padding: "10px 12px", marginBottom: 4,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13, display: "flex", justifyContent: "space-between",
            }}>
              <span>{chosen.length} application{chosen.length === 1 ? "" : "s"}</span>
              <strong>{inr(totalBlocked)} blocked</strong>
            </div>
          )}

          <StickyFooter>
            <PrimaryButton onClick={submit} disabled={!chosen.length}>
              {chosen.length ? `Add ${chosen.length} application${chosen.length === 1 ? "" : "s"}` : "Select accounts"}
            </PrimaryButton>
          </StickyFooter>
        </>
      )}
    </Sheet>
  );
}

function BulkStatusSheet({ ipo, accounts, onClose, onSave }) {
  const apps = ipo.applications || [];
  const [draft, setDraft] = useState(() => {
    const d = {};
    apps.forEach((a) => {
      d[a.id] = { allotmentStatus: a.allotmentStatus || "Pending", sharesAllotted: a.sharesAllotted || "" };
    });
    return d;
  });

  const nameOf = (id) => accounts.find((a) => a.id === id)?.name || "Unknown account";
  const fullLot = Number(ipo.lotSize) || 0;

  const sharesFor = (app, status, current) => {
    if (status === "Allotted" && fullLot) return String(fullLot * (Number(app.lots) || 1));
    if (status === "Not Allotted" || status === "Pending") return "";
    return current;
  };

  const setAll = (status) => {
    setDraft((d) => {
      const next = { ...d };
      apps.forEach((a) => {
        next[a.id] = { allotmentStatus: status, sharesAllotted: sharesFor(a, status, d[a.id].sharesAllotted) };
      });
      return next;
    });
  };

  const setOne = (app, status) => {
    setDraft((d) => ({
      ...d,
      [app.id]: { allotmentStatus: status, sharesAllotted: sharesFor(app, status, d[app.id].sharesAllotted) },
    }));
  };

  const counts = Object.values(draft).reduce((c, v) => {
    const k = v.allotmentStatus === "Not Allotted" ? "rejected"
      : v.allotmentStatus === "Pending" ? "pending" : "won";
    c[k] = (c[k] || 0) + 1;
    return c;
  }, {});

  return (
    <Sheet title="Record allotment" onClose={onClose}>
      <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15, color: COLORS.navyDeep, marginBottom: 4 }}>
        {ipo.company}
      </div>
      <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 14 }}>
        {apps.length} application{apps.length === 1 ? "" : "s"}. Set them all at once, then correct the exceptions.
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {ALLOTMENT_STATUSES.map((s) => (
          <button key={s} onClick={() => setAll(s)} style={{ ...chipBase }}>All → {s}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {apps.map((app) => {
          const d = draft[app.id];
          const meta = STATUS_META[d.allotmentStatus] || STATUS_META.Pending;
          const needsShares = d.allotmentStatus === "Allotted" || d.allotmentStatus === "Partial";
          return (
            <div key={app.id} style={{
              background: COLORS.surface, border: `1px solid ${COLORS.border}`,
              borderLeft: `3px solid ${meta.color}`, borderRadius: 10, padding: "10px 12px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.ink }}>{nameOf(app.accountId)}</div>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
                    {app.lots || 0} lot(s) · {inrOrDash(app.amountBlocked)}
                  </div>
                </div>
                <Select
                  value={d.allotmentStatus}
                  onChange={(e) => setOne(app, e.target.value)}
                  aria-label={`Status for ${nameOf(app.accountId)}`}
                  style={{ width: "auto", minHeight: 38, padding: "6px 8px", fontSize: 12.5, flexShrink: 0 }}
                >
                  {ALLOTMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </Select>
              </div>
              {needsShares && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: COLORS.inkSoft }}>Shares allotted</span>
                  <input
                    type="number" inputMode="numeric" value={d.sharesAllotted}
                    onChange={(e) => setDraft((x) => ({ ...x, [app.id]: { ...x[app.id], sharesAllotted: e.target.value } }))}
                    aria-label={`Shares for ${nameOf(app.accountId)}`}
                    style={{ ...inputStyle, width: 100, minHeight: 38, padding: "6px 8px" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        background: COLORS.goldSoft, borderRadius: 10, padding: "10px 12px", marginBottom: 4,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5,
      }}>
        {counts.won || 0} allotted · {counts.pending || 0} pending · {counts.rejected || 0} rejected
      </div>

      <StickyFooter>
        <PrimaryButton onClick={() => onSave(draft)}>Save all {apps.length}</PrimaryButton>
      </StickyFooter>
    </Sheet>
  );
}

/* ---------------------------------------------------------
   LIVE IPOs (NSE, via /api/ipos)
---------------------------------------------------------- */
const normaliseName = (s) =>
  String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(limited|ltd|private|pvt|india|the)\b/g, " ")
    .replace(/\s+/g, " ").trim();

/* Two ways in: the issues open or coming up, and everything that listed in a
   given year. The second exists because a ledger started late would otherwise
   have to be typed out by hand, an IPO at a time. */
function LiveIposSheet({ existing, onClose, onImport }) {
  const thisYear = new Date().getFullYear();
  const [mode, setMode] = useState("current");           // "current" | "year"
  const [year, setYear] = useState(thisYear);
  const [state, setState] = useState({ status: "loading", rows: [], error: "", fetchedAt: "", note: "" });
  const [picked, setPicked] = useState({});
  const [search, setSearch] = useState("");
  const [board, setBoard] = useState(["Mainboard"]);
  const [importing, setImporting] = useState(false);
  const toggleBoard = (id) =>
    setBoard((cur) =>
      cur.includes(id)
        ? (cur.length === 1 ? cur : cur.filter((b) => b !== id))
        : [...cur, id]
    );

  const known = useMemo(() => {
    const s = new Set();
    existing.forEach((i) => {
      if (i.symbol) s.add(String(i.symbol).toUpperCase());
      if (i.company) s.add(normaliseName(i.company));
    });
    return s;
  }, [existing]);

  const isKnown = (r) =>
    (r.symbol && known.has(String(r.symbol).toUpperCase())) || known.has(normaliseName(r.company));

  useEffect(() => {
    let cancelled = false;
    /* Rows are dropped, not kept: they belong to the view being left, and
       anything reading them meanwhile — the board counts, for one — would be
       judging the new list by the old one's contents. */
    setState((s) => ({ ...s, status: "loading", error: "", rows: [] }));
    setPicked({});
    setBoard(["Mainboard"]);

    (async () => {
      try {
        const url = mode === "current" ? "/api/ipos" : `/api/listings?from=${year}`;
        const res = await fetch(url);
        const text = await res.text();
        let data = {};
        try { data = JSON.parse(text); } catch { /* handled below */ }
        if (cancelled) return;
        if (!res.ok || data.error) {
          setState({ status: "error", rows: [], error: data.error || `Request failed (${res.status})`, fetchedAt: "", note: "" });
          return;
        }

        let rows;
        let note = "";
        if (mode === "current") {
          rows = (data.ipos || []).map((r) => ({ ...r, listedOn: "" }));
          note = "Issues and subscription from NSE; lot size and the retail book from BSE.";
        } else {
          /* Only the chosen year, since the feed is cumulative from it. Judged
             on the listing date, or the close date for an issue that has closed
             but not yet listed — those belong to neither the open-and-upcoming
             view nor a list of what has listed, and would be invisible. */
          rows = (data.listings || [])
            .filter((r) => (r.listedOn || r.closeDate || "").slice(0, 4) === String(year))
            .map((r) => ({
              // BSE's short name is the ticker, and the only symbol on offer here.
              symbol: r.shortName || "",
              company: r.company,
              category: r.category || "",
              priceMin: r.priceMin != null ? r.priceMin : null,
              /* The issue price for something that has listed; for one that has
                 only closed there is no issue price yet, so the top of the band
                 stands in — otherwise the price arrives empty. */
              priceMax: r.issuePrice != null ? r.issuePrice : r.priceMax,
              openDate: r.openDate || "",
              closeDate: r.closeDate || "",
              listedOn: r.listedOn || "",
              listingOpen: r.listingOpen,
              listingClose: r.listingClose,
              currentPrice: r.currentPrice,
              lotSize: r.lotSize,
              subscription: null,
              categories: null,
            }));
          note = data.categoryKnown === false
            ? "Listed in " + year + ", from BSE. Mainboard/SME could not be determined this time."
            : "Everything from " + year + ", from BSE — listed, and closed awaiting listing. Lot size and listing price are fetched for what you select.";
        }

        if (mode === "current") {
          /* What is open comes first, then what is coming, then anything that
             has already closed — the order you would work down if you were
             deciding what to apply for. Within each, the nearest deadline
             leads: the issue closing soonest, then the one opening soonest. */
          const today = todayISO();
          const rank = (r) => {
            if (!r.openDate && !r.closeDate) return 3;
            if (r.openDate && r.openDate > today) return 1;      // not open yet
            if (r.closeDate && r.closeDate < today) return 2;    // already closed
            return 0;                                            // taking bids
          };
          rows.sort((a, b) => {
            const ra = rank(a);
            const rb = rank(b);
            if (ra !== rb) return ra - rb;
            if (ra === 0) return (a.closeDate || "").localeCompare(b.closeDate || "");
            if (ra === 1) return (a.openDate || "").localeCompare(b.openDate || "");
            return (b.closeDate || "").localeCompare(a.closeDate || "");
          });
        } else {
          rows.sort((a, b) => (b.listedOn || b.closeDate || "").localeCompare(a.listedOn || a.closeDate || ""));
        }
        setState({ status: "done", rows, error: "", fetchedAt: data.fetchedAt || "", note });

        // Pre-tick only what is genuinely new, and only for the current view —
        // ticking a whole year by default would be a trap.
        if (mode === "current") {
          const pre = {};
          rows.forEach((r) => { if (!isKnown(r)) pre[r.company] = true; });
          setPicked(pre);
        }
      } catch (e) {
        if (!cancelled) setState({ status: "error", rows: [], error: e.message || "Could not reach the server", fetchedAt: "", note: "" });
      }
    })();

    return () => { cancelled = true; };
  }, [mode, year]);

  /* BSE does not always say which board a listing was on. Guessing mainboard
     here would quietly hide SME issues behind a filter that looks precise, so
     an unlabelled row gets its own bucket rather than a default. */
  const boardOfRow = (r) => (r.category ? boardOf(r) : "unknown");

  const boardCounts = useMemo(() => {
    const c = { Mainboard: 0, SME: 0, unknown: 0 };
    state.rows.forEach((r) => { c[boardOfRow(r)]++; });
    return c;
  }, [state.rows]);

  /* The list opens on Mainboard, but a year BSE left unlabelled — or a week of
     nothing but SME issues — would then open on an empty screen. */
  useEffect(() => {
    // Only once the list has actually arrived; a half-loaded view is not
    // evidence that a board is empty.
    if (state.status !== "done" || !state.rows.length) return;
    if (board.some((b) => boardCounts[b] > 0)) return;
    const present = Object.keys(boardCounts).filter((k) => boardCounts[k] > 0);
    if (present.length) setBoard(present);
  }, [board, state.status, state.rows.length, boardCounts]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.rows.filter((r) => {
      if (!board.includes(boardOfRow(r))) return false;
      return !q || `${r.company} ${r.symbol || ""}`.toLowerCase().includes(q);
    });
  }, [state.rows, search, board]);

  const chosen = state.rows.filter((r) => picked[r.company]);
  const newVisible = visible.filter((r) => !isKnown(r));
  const allNewPicked = newVisible.length > 0 && newVisible.every((r) => picked[r.company]);

  /* Selecting covers what is on screen and not already in the ledger; clearing
     covers everything, including rows a search has since filtered away — which
     is the point of it, since those are the ones easiest to forget. */
  const selectAllNew = () => {
    setPicked((p) => {
      const next = { ...p };
      newVisible.forEach((r) => { next[r.company] = true; });
      return next;
    });
  };

  const clearAll = () => setPicked({});

  /* Lot size and the day-one open are fetched per company, so the year listing
     comes back without them. Ask for just the selected ones before importing —
     otherwise every import from a year arrives with no lot size, and a blocked
     amount cannot be worked out. */
  const enrichChosen = async (rows) => {
    if (mode !== "year" || !rows.length) return rows;
    try {
      const keys = rows.map((r) => r.company).filter(Boolean).join("|");
      const res = await fetch(`/api/listings?from=${year}&keys=${encodeURIComponent(keys)}`);
      if (!res.ok) return rows;
      const data = JSON.parse(await res.text());
      const byKey = new Map((data.listings || []).map((l) => [l.key, l]));
      return rows.map((r) => {
        const hit = byKey.get(normaliseName(r.company));
        if (!hit) return r;
        return {
          ...r,
          lotSize: hit.lotSize != null ? hit.lotSize : r.lotSize,
          listingOpen: hit.listingOpen != null ? hit.listingOpen : r.listingOpen,
          listingClose: hit.listingClose != null ? hit.listingClose : r.listingClose,
        };
      });
    } catch {
      return rows; // an import without lot sizes still beats no import
    }
  };

  const doImport = async () => {
    setImporting(true);
    let rows;
    try {
      rows = await enrichChosen(chosen);
    } finally {
      setImporting(false);
    }
    onImport(rows.map((r) => ({
      id: uid(),
      symbol: r.symbol || "",
      company: r.company,
      category: r.category || "Mainboard",
      applicationDate: r.closeDate || "",
      priceBand: r.priceMax != null ? String(r.priceMax) : "",
      lotSize: r.lotSize != null ? String(r.lotSize) : "",
      openDate: r.openDate || "",
      closeDate: r.closeDate || "",
      listingDate: r.listedOn || "",
      // Same rule as a refresh: no closing price until the day has closed.
      ...(() => {
        const listingToday = !!r.listedOn && r.listedOn >= todayISO();
        const close = listingToday ? null : r.listingClose;
        return {
          listingPrice: r.listingOpen != null ? String(r.listingOpen)
            : close != null ? String(close) : "",
          listingPriceSource: r.listingOpen != null ? "bse-open" : close != null ? "bse-close" : "",
          listingClosePrice: close != null ? String(close) : "",
        };
      })(),
      currentPrice: r.currentPrice != null ? String(r.currentPrice) : "",
      priceAsOf: r.currentPrice != null ? new Date().toISOString() : "",
      remarks: "",
      applications: [],
    })));
  };

  const years = [thisYear, thisYear - 1, thisYear - 2];

  return (
    <Sheet title={mode === "current" ? "Open & upcoming IPOs" : `IPOs of ${year}`} onClose={onClose}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => setMode("current")} style={{ ...chipBase, ...(mode === "current" ? chipOn : null) }}>
          Open &amp; upcoming
        </button>
        {years.map((y) => (
          <button
            key={y}
            onClick={() => { setMode("year"); setYear(y); }}
            style={{ ...chipBase, ...(mode === "year" && year === y ? chipOn : null) }}
          >
            {y}
          </button>
        ))}
      </div>

      {state.status === "loading" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 0", gap: 10 }}>
          <Loader2 size={26} color={COLORS.navy} className="spin" />
          <div style={{ color: COLORS.inkSoft, fontSize: 13 }}>
            {mode === "current" ? "Asking the exchanges…" : `Fetching ${year} listings…`}
          </div>
        </div>
      )}

      {state.status === "error" && (
        <div>
          <EmptyState text={`Could not load. ${state.error}`} />
          <PrimaryButton ghost onClick={onClose}>Close</PrimaryButton>
        </div>
      )}

      {state.status === "done" && (
        <>
          <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 12 }}>
            {state.note}{state.fetchedAt ? ` ${fmtTime(new Date(state.fetchedAt))}.` : ""}
          </div>

          {state.rows.length > 8 && (
            <div style={{ position: "relative", marginBottom: 10 }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", display: "flex", pointerEvents: "none" }}>
                <Search size={15} color={COLORS.inkSoft} />
              </span>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company" style={{ paddingLeft: 34 }} />
            </div>
          )}

          {[boardCounts.Mainboard, boardCounts.SME, boardCounts.unknown].filter(Boolean).length > 1 && (
            <div style={{ display: "flex", marginBottom: 10, overflowX: "auto", paddingBottom: 2 }}>
              <BoardToggles
                selected={board}
                onToggle={toggleBoard}
                options={[
                  { id: "Mainboard", label: "Mainboard", count: boardCounts.Mainboard },
                  { id: "SME", label: "SME", count: boardCounts.SME },
                  // Only worth offering when BSE actually left some rows unlabelled.
                  ...(boardCounts.unknown ? [{ id: "unknown", label: "Unlabelled", count: boardCounts.unknown }] : []),
                ]}
              />
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: COLORS.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
              {visible.length} shown · {chosen.length} selected
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {newVisible.length > 0 && !allNewPicked && (
                <button onClick={selectAllNew} style={{ ...chipBase, padding: "6px 10px" }}>
                  Select {newVisible.length} new
                </button>
              )}
              {chosen.length > 0 && (
                <button onClick={clearAll} style={{ ...chipBase, padding: "6px 10px" }}>
                  Clear {chosen.length}
                </button>
              )}
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState text={board.length > 1 ? "Nothing matches that search." : "Nothing on that board matches."} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {visible.map((r) => {
                const already = isKnown(r);
                const on = !!picked[r.company];
                const stage = issueStage(r);
                const gain = r.currentPrice != null && r.priceMax
                  ? ((r.currentPrice - r.priceMax) / r.priceMax) * 100
                  : null;
                return (
                  <label key={r.company} style={{
                    display: "flex", gap: 10, alignItems: "flex-start", background: COLORS.surface,
                    border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 12px",
                    opacity: already ? 0.55 : 1,
                  }}>
                    <input
                      type="checkbox" checked={on}
                      onChange={() => setPicked((p) => ({ ...p, [r.company]: !p[r.company] }))}
                      style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "flex-start" }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: COLORS.ink }}>{r.company}</span>
                        {r.category && <Badge color={COLORS.navy} bg="#EAEFF5">{r.category}</Badge>}
                      </div>

                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: COLORS.inkSoft, marginTop: 4 }}>
                        {r.priceMin != null && r.priceMax != null
                          ? `₹${r.priceMin}–${r.priceMax}`
                          : r.priceMax != null ? `₹${r.priceMax}` : "price not published"}
                        {r.lotSize ? ` · lot ${r.lotSize}` : ""}
                        {r.listedOn
                          ? ` · listed ${fmtDate(r.listedOn)}`
                          : r.closeDate ? ` · ${r.openDate || "—"} → ${r.closeDate}` : ""}
                      </div>

                      {(r.listingOpen != null || r.currentPrice != null) && (
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: COLORS.inkSoft, marginTop: 3 }}>
                          {r.listingOpen != null ? `listed ₹${r.listingOpen}` : ""}
                          {r.currentPrice != null ? `${r.listingOpen != null ? " · " : ""}now ₹${r.currentPrice}` : ""}
                          {gain != null && (
                            <span style={{ color: gain >= 0 ? COLORS.green : COLORS.red, fontWeight: 700 }}>
                              {"  "}{gain >= 0 ? "+" : ""}{gain.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      )}

                      <div style={{ marginTop: 5, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {stage && <Badge color={stage.color} bg={stage.bg}>{stage.label}</Badge>}
                        {r.subscription != null && (
                          <Badge
                            color={r.subscription >= 1 ? COLORS.green : COLORS.gold}
                            bg={r.subscription >= 1 ? COLORS.greenSoft : COLORS.goldSoft}
                          >
                            {r.subscription.toFixed(2)}× subscribed
                          </Badge>
                        )}
                        {r.categories && r.categories.retail != null && (
                          <Badge color={COLORS.navy} bg="#EAEFF5">retail {r.categories.retail.toFixed(1)}×</Badge>
                        )}
                        {already && <span style={{ fontSize: 11, color: COLORS.gold }}>already in your ledger</span>}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <StickyFooter>
            <PrimaryButton onClick={doImport} disabled={!chosen.length || importing}>
              {importing
                ? "Fetching lot sizes…"
                : chosen.length
                  ? `Import ${chosen.length} IPO${chosen.length === 1 ? "" : "s"}`
                  : "Select IPOs to import"}
            </PrimaryButton>
          </StickyFooter>
        </>
      )}
    </Sheet>
  );
}

