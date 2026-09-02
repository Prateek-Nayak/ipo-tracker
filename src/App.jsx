import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef, useContext } from "react";
import { createPortal } from "react-dom";

/* ---------------------------------------------------------
   THEME
   Ledger / stock-certificate inspired: paper surface, deep
   navy ink, brass-gold for pending, forest green for gains,
   brick red for losses.
---------------------------------------------------------- */
const COLORS_LIGHT = {
  bg: "#F7F5F0",
  surface: "#FFFFFF",
  border: "#D4CFC3",
  ink: "#1C2333",
  inkSoft: "#3D4654",
  navy: "#1F3A5F",
  navyDeep: "#152A44",
  gold: "#B08D57",
  goldSoft: "#F7F0E3",
  green: "#266e43",
  greenSoft: "#E4F0E9",
  red: "#A13D3D",
  redSoft: "#F5E4E2",
  /* Headings are the deep navy on paper, but that same colour is the header's
     background - so it needs a name of its own, or a dark theme has to choose
     between an invisible heading and a washed-out header. */
  heading: "#152A44",
  // What a button you press is made of, and the text that sits on it.
  action: "#1F3A5F",
  onAction: "#FFFFFF",
  // What you type into, a shade off the surface it sits on.
  field: "#FDFCFA",
  // The quiet blue a neutral badge sits on.
  chip: "#EAEFF5",
};

/* The same ledger after dark, not a different app: warm paper becomes warm
   ink, and the brass, forest and brick keep their jobs. The greys are tinted
   towards the navy rather than neutral - a flat #121212 under warm accents is
   what makes a dark theme look like a bug report. Surfaces lift as they come
   forward (bg < surface < border) so a card still reads as a card, and the
   accents are lightened to hold contrast against them rather than reused from
   the light palette, where they were chosen to sit on white. */
const COLORS_DARK = {
  /* Near-neutral, very slightly warm. An earlier pass tinted these towards the
     navy and the whole app read as blue-grey - the accents carry the colour,
     the surfaces should not compete with them. */
  bg: "#000000",
  surface: "#0d0d0d",
  border: "#2C2F37",
  ink: "#fbfbfb",
  inkSoft: "#9A9CA4",
  // The header keeps its weight by going darker than the page, as it does in
  // daylight by going deeper than the paper.
  navy: "#7BA7D9",
  navyDeep: "#101216",
  gold: "#D6A96A",
  goldSoft: "#33291A",
  green: "#6FBF8F",
  greenSoft: "#182A22",
  red: "#E0736B",
  redSoft: "#2E1C1C",
  heading: "#F5F3EE",
  action: "#634e30",
  onAction: "#ffffff",
  field: "#131417",
  chip: "#262A33",
};

const THEME_KEY = "ipo_ledger_theme";

function storedTheme() {
  try { return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light"; } catch { return "light"; }
}

/* One object, mutated in place, that every style in the app reads. Reassigning
   it would leave the styles built at module load pointing at the old palette,
   which is why changing theme used to need a reload. */
let themeName = storedTheme();
const COLORS = { ...(themeName === "dark" ? COLORS_DARK : COLORS_LIGHT) };
const themeListeners = new Set();
const isDark = () => themeName === "dark";

function applyTheme(next) {
  themeName = next === "dark" ? "dark" : "light";
  Object.assign(COLORS, themeName === "dark" ? COLORS_DARK : COLORS_LIGHT);
  buildStyles();
  buildStatusMeta();
  paintDocument();
  try { localStorage.setItem(THEME_KEY, themeName); } catch { /* it still applies for this session */ }
  themeListeners.forEach((fn) => fn());
}

/* Declared here, above the call that fills them. A `let` cannot be assigned
   before its own declaration has run, so leaving these beside the components
   that use them meant buildStyles() threw on load and nothing rendered at all. */
let inputStyle, selectStyle, chipBase, chipOn, iconBtnStyle, smallIconBtn, roundIconBtn;

/* Styles that quote the palette have to be rebuilt when it changes. They are
   module bindings rather than fixed objects, so every component picks up the
   new one on its next render without any of them being touched. */
function buildStyles() {
  inputStyle = {
    width: "100%", boxSizing: "border-box", padding: "10px 12px",
    minHeight: 44, WebkitAppearance: "none",
    border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14,
    fontFamily: "Inter, sans-serif", color: COLORS.ink, background: COLORS.field,
    outline: "none",
  };
  selectStyle = {
    ...inputStyle, width: "auto", minWidth: 0, minHeight: 36, padding: "6px 8px",
    fontSize: 12, fontWeight: 600,
  };
  chipBase = {
    border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.inkSoft,
    borderRadius: 999, padding: "7px 12px", fontSize: 12, fontWeight: 600,
    fontFamily: "Inter, sans-serif", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
    touchAction: "manipulation",
  };
  // Reads on both: white on deep navy in daylight, dark on pale blue after it.
  chipOn = { background: COLORS.action, border: `1px solid ${COLORS.action}`, color: COLORS.onAction };
  iconBtnStyle = {
    border: "none", background: COLORS.surface, width: 44, flex: 1, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", touchAction: "manipulation",
  };
  smallIconBtn = {
    width: 30, height: 30, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.bg,
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
    touchAction: "manipulation",
  };
  roundIconBtn = {
    width: 36, height: 36, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.bg,
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", touchAction: "manipulation",
  };
}
buildStyles();
paintDocument();

/* The page behind React, which is painted before any of it runs and shows
   through wherever the app does not reach. */
function paintDocument() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (root) root.style.background = COLORS.bg;
  if (document.body) {
    document.body.style.background = COLORS.bg;
    document.body.style.colorScheme = themeName;
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", COLORS.navyDeep);
}

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
const Check = (p) => <SvgIcon {...p}><path d="M20 6 9 17l-5-5" /></SvgIcon>;
const SlidersHorizontal = (p) => <SvgIcon {...p}><line x1="21" x2="14" y1="4" y2="4" /><line x1="10" x2="3" y1="4" y2="4" /><line x1="21" x2="12" y1="12" y2="12" /><line x1="8" x2="3" y1="12" y2="12" /><line x1="21" x2="16" y1="20" y2="20" /><line x1="12" x2="3" y1="20" y2="20" /><line x1="14" x2="14" y1="2" y2="6" /><line x1="8" x2="8" y1="10" y2="14" /><line x1="16" x2="16" y1="18" y2="22" /></SvgIcon>;
const CheckCircle2 = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></SvgIcon>;
const Clock = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></SvgIcon>;
const XCircle = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></SvgIcon>;
const Landmark = (p) => <SvgIcon {...p}><line x1="3" x2="21" y1="22" y2="22" /><line x1="6" x2="6" y1="18" y2="11" /><line x1="10" x2="10" y1="18" y2="11" /><line x1="14" x2="14" y1="18" y2="11" /><line x1="18" x2="18" y1="18" y2="11" /><polygon points="12 2 20 7 4 7" /></SvgIcon>;
const Loader2 = (p) => <SvgIcon {...p}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></SvgIcon>;
const RefreshCw = (p) => <SvgIcon {...p}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></SvgIcon>;
const CloudIcon = (p) => <SvgIcon {...p}><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></SvgIcon>;
const CloudOff = (p) => <SvgIcon {...p}><path d="m2 2 20 20" /><path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193" /><path d="M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07" /></SvgIcon>;
const DownloadIcon = (p) => <SvgIcon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></SvgIcon>;
const LogOut = (p) => <SvgIcon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></SvgIcon>;
const AlertTriangle = (p) => <SvgIcon {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></SvgIcon>;
const ChevronRight = (p) => <SvgIcon {...p}><path d="m9 18 6-6-6-6" /></SvgIcon>;
const Sparkles = (p) => <SvgIcon {...p}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></SvgIcon>;
const Moon = (p) => <SvgIcon {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></SvgIcon>;
const Sun = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></SvgIcon>;
const Search = (p) => <SvgIcon {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></SvgIcon>;
const Layers = (p) => <SvgIcon {...p}><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" /><path d="m22 12.18-9.17 4.16a2 2 0 0 1-1.66 0L2 12.18" /><path d="m22 17.18-9.17 4.16a2 2 0 0 1-1.66 0L2 17.18" /></SvgIcon>;
const ClipboardCheck = (p) => <SvgIcon {...p}><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" /></SvgIcon>;
const Settings = (p) => (
  <SvgIcon {...p}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </SvgIcon>
);

/* ---------------------------------------------------------
   FORMATTING HELPERS
---------------------------------------------------------- */
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const inr = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

/* Not every field can be filled in. NSE never publishes lot size and omits the
   price band for some SME issues, so imported IPOs arrive incomplete. Treating
   a blank as zero turns "we don't know" into a confident ₹0, which is worse
   than saying nothing - so unknown values render as an em dash instead. */
const isBlank = (v) => v === "" || v == null || !Number.isFinite(Number(v));
const inrOrDash = (v) => (isBlank(v) ? "--" : inr(v));

/* Lakhs and crores where the room is fixed. A stat card is half a phone wide
   and clips what it cannot fit without saying so, which around a crore turns a
   figure into a different, smaller, wrong-looking one. The exact number is kept
   on the element's title. */
const inrShort = (n) => {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  if (abs < 1e5) return inr(v);
  const [div, unit, dp] = abs >= 1e7 ? [1e7, "Cr", 2] : [1e5, "L", 1];
  return "₹" + (v / div).toFixed(dp).replace(/.0+$/, "") + unit;
};
const trimFields = (obj) => { const out = { ...obj }; for (const k in out) { if (typeof out[k] === "string") out[k] = out[k].trimEnd(); } return out; };

/* What a person types has no length limit, and a note long enough - or one
   unbroken run of characters with nowhere to wrap - used to carry on straight
   past the edge of the card holding it. Every place text is shown now takes one
   of these three.

   On a card the text is cut, because a card is for finding a record rather than
   reading it and the whole of it is one tap away in the sheet the card opens: a
   line or two and an ellipsis says there is more without the card growing to
   fit. In a sheet, which is where it is read, it wraps instead - but breaks
   mid-word rather than leaving the box. */
const ellipsisText = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
// Newlines in a note are kept: it is a note, and it was typed with them.
const wrapText = { overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "pre-wrap" };

function isNonTradingDay(iso) {
  if (!iso) return false;
  const d = new Date(iso + "T00:00:00");
  const day = d.getDay();
  if (day === 0 || day === 6) return "Weekend";
  if (tradingHolidays.has(iso)) return "Trading holiday";
  if (clearingHolidays.has(iso)) return "Clearing holiday";
  return false;
}

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

/* Today's date on the Indian market calendar. Every date in this app - bidding
   windows, listing days - is an IST date, while toISOString() gives the UTC one.
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

// Stamped in at build time by vite.config.js; MMDD.HHMM, IST.
const BUILD_ID = typeof __BUILD_ID__ === "string" ? __BUILD_ID__ : "dev";

// The four screens, in nav order. Named here so a remembered tab can be checked
// against them before it is trusted.
const TABS = ["dashboard", "ipos", "transfers", "accounts"];

/* Everything back has to peel off before it is allowed to leave, in the order
   it comes off. Each layer that is on screen owns one history entry, so the
   count below and the number of entries pushed are the same number and can be
   compared directly. Being off Overview counts as a layer too - back from a
   tab returns to Overview before it returns to the home screen. */
const BACK_LAYERS = [
  "confirmOpen", "appSheet", "bulkApplyFor", "bulkStatusFor", "allotmentFor", "ipoSheet", "acctSheet",
  "acctDetail", "holdingDetail", "transferSheet", "liveOpen", "dataSheetOpen", "ipoDetail",
];
const layerDepth = (v) =>
  BACK_LAYERS.reduce((n, k) => n + (v[k] ? 1 : 0), 0) + (v.transient || 0)
  + (v.tab !== "dashboard" ? 1 : 0);

/* An overlay that belongs to a screen rather than to the app - a popover, a
   picker - keeps its own state, which back could not see. So back looked past
   it and closed whatever was underneath: on a list that meant going back to
   Overview, which unmounted the screen and took the popover down with it. It
   looked as though back had closed the popover, when it had really spent the
   entry belonging to the tab - and the next press, finding nothing left to
   close, left the app. Anything of that kind registers itself here and is
   closed in its turn like every other layer. */
const transientLayers = new Set();
const transientListeners = new Set();
const announceTransient = () => transientListeners.forEach((fn) => fn());
function useBackLayer(open, close) {
  // Held in a ref so a new closure every render does not re-register the layer.
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    const entry = () => closeRef.current();
    transientLayers.add(entry);
    announceTransient();
    return () => { transientLayers.delete(entry); announceTransient(); };
  }, [open]);
}

// Anything that counts as the first sign of a person, for the history entries.
const ARM_EVENTS = ["touchstart", "pointerdown", "mousedown", "keydown"];

// Anyone who has asked for less movement gets the screen change without the slide.
const prefersReducedMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* NSE's holiday calendars, kept module-wide because every date calculation
   needs them. Both are required, and which one applies depends on the event:
   allotment is settled by the clearing corporation, listing happens on the
   exchange floor, and the two calendars differ. In 2026 they differ on four
   days - 26 August most instructively, a clearing holiday that was an ordinary
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

/* The day the basis of allotment is settled - the day there is something to
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

/* Shares reach the demat account the working day after allotment - a clearing
   step, like the allotment itself. */
function creditDateOf(ipo) {
  const allot = allotmentDateOf(ipo);
  if (!allot.date) return { date: "", exact: false };
  return { date: addClearingDays(allot.date, 1), exact: allot.exact && !!ipo?.allotmentDate };
}

/* Listing is one trading day after the credit - the first step that happens on
   the exchange floor rather than in the clearing house.

   Counting the whole timetable on a single calendar cannot fit the record.
   Tempsens closed on 24 August 2026 and listed on the 28th: allotment on the
   25th, but the 26th was closed for clearing, so the credit slipped to the 27th
   and the listing to the 28th. Purely on the trading calendar that comes out a
   day early; purely on the clearing calendar Gaja comes out a day late. Walking
   the real chain - clearing, clearing, trading - reproduces all 22 issues with
   both dates on record. It stays an inference until the exchange confirms it. */
function listingDateOf(ipo) {
  if (ipo?.listingDate) return { date: ipo.listingDate, exact: true };
  const credit = creditDateOf(ipo);
  if (credit.date) return { date: addTradingDays(credit.date, 1), exact: false };
  return { date: "", exact: false };
}

/* An expected date has done its job once every application carries a recorded
   result - there is nothing left to wait for, so the ledger stops predicting. */
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
  if (!date) return false;
  // Show starting from the day after allotment, not on allotment day itself
  // (results typically arrive late on allotment day).
  const dayAfter = addClearingDays(date, 1);
  return dayAfter <= todayISO();
}

/* Where an issue is in its life, worked out from its own dates rather than from
   which feed it arrived in. An issue that closed yesterday is closed, however
   the exchange still files it. */
function issueStage(x) {
  const today = todayISO();
  const now = new Date();
  const listed = x?.listingDate || x?.listedOn || "";
  const open = x?.openDate || "";
  const close = x?.closeDate || "";
  const isPast5pm = now.getHours() >= 17;

  // PRIORITY 1: Already listed
  if (listed && listed < today) return { label: "LISTED", color: COLORS.navy, bg: "#EAEFF5" };
  if (listed && listed === today) {
    const hasLtp = Number(x?.currentPrice) > 0;
    return hasLtp
      ? { label: "LISTED TODAY", color: COLORS.green, bg: COLORS.greenSoft }
      : { label: "LISTS TODAY", color: COLORS.green, bg: COLORS.greenSoft };
  }

  // PRIORITY 2: Open/closing (IPO is accepting applications)
  if (close && close === today) {
    return isPast5pm
      ? { label: "CLOSED TODAY", color: COLORS.inkSoft, bg: "#EFEDE7" }
      : { label: "CLOSES TODAY", color: COLORS.red, bg: COLORS.redSoft };
  }
  if (open && open <= today && close && close > today) {
    const daysLeft = Math.ceil((new Date(close + "T00:00:00") - new Date(today + "T00:00:00")) / 86400000);
    return daysLeft === 1
      ? { label: "CLOSES TOMORROW", color: COLORS.gold, bg: COLORS.goldSoft }
      : { label: "CLOSES " + fmtDate(close).toUpperCase().slice(0, 6), color: COLORS.gold, bg: COLORS.goldSoft };
  }
  if (open && open === today) return { label: "OPEN NOW", color: COLORS.green, bg: COLORS.greenSoft };

  // PRIORITY 3: Upcoming (not yet open)
  if (open && open > today && (!close || close >= today)) {
    return { label: "OPENS " + fmtDate(open).toUpperCase().slice(0, 6), color: COLORS.gold, bg: COLORS.goldSoft };
  }

  // PRIORITY 4: Closed, awaiting allotment/listing
  const allot = allotmentDateOf(x);
  if (close && close < today) {
    if (allot.date && allot.date === today) {
      return { label: "ALLOTMENT TODAY", color: COLORS.gold, bg: COLORS.goldSoft };
    }
    if (allot.date && allot.date > today && (!listed || allot.date <= listed)) {
      return { label: "ALLOTMENT " + fmtDate(allot.date).toUpperCase().slice(0, 6), color: COLORS.gold, bg: COLORS.goldSoft };
    }
    if (listed && listed > today) {
      return { label: "LISTS " + fmtDate(listed).toUpperCase().slice(0, 6), color: COLORS.navy, bg: "#EAEFF5" };
    }
    const expected = listingDateOf(x);
    if (expected.date) {
      if (expected.date === today) return { label: "LISTS TODAY", color: COLORS.green, bg: COLORS.greenSoft };
      if (expected.date > today) return { label: "LISTS ~" + fmtDate(expected.date).toUpperCase().slice(0, 6), color: COLORS.navy, bg: "#EAEFF5" };
      return { label: "LISTING DUE", color: COLORS.gold, bg: COLORS.goldSoft };
    }
    return { label: "CLOSED", color: COLORS.inkSoft, bg: "#EFEDE7" };
  }

  return null;
}
const fmtDate = (d) => {
  if (!d) return "--";
  const dt = new Date(d + "T00:00:00");
  return isNaN(dt) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtTime = (d) => (d ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "");

/* Day and month only, for a row that has to fit its whole line across a phone.
   An open-to-close pair written out in full - 2026-08-31 -> 2026-09-02 - took
   more width than there was and wrapped, and the fix is not a smaller font on
   a line that is already 11px. The year comes back whenever it is not this
   one, so an older listing is still unambiguous. */
/* Written out rather than left to toLocaleDateString, which gives "Sept" for
   September under en-IN and three letters for every other month. In a monospace
   column that one extra character shifts the arrow out of line on every
   September row, and it varies by platform besides. */
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDayMon = (d) => {
  if (!d) return "--";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt)) return d;
  const year = dt.getFullYear() === new Date().getFullYear()
    ? "" : " " + String(dt.getFullYear()).slice(2);
  return String(dt.getDate()).padStart(2, "0") + " " + MONTHS_SHORT[dt.getMonth()] + year;
};

const ALLOTMENT_STATUSES = ["Pending", "Allotted", "Partial", "Not Allotted"];
let STATUS_META = {};
function buildStatusMeta() {
  STATUS_META = {
    Pending:        { color: COLORS.gold,  bg: COLORS.goldSoft,  icon: Clock },
    Allotted:       { color: COLORS.green, bg: COLORS.greenSoft, icon: CheckCircle2 },
    Partial:        { color: COLORS.gold,  bg: COLORS.goldSoft,  icon: CheckCircle2 },
    "Not Allotted": { color: COLORS.red,   bg: COLORS.redSoft,   icon: XCircle },
  };
}
// The icons it quotes (Clock, CheckCircle2, XCircle) and its own `let`
// binding both have to have actually run first — this is the earliest point
// in the file where that's true. applyTheme() rebuilds it again later for
// the same reason it rebuilds buildStyles(): both quote the live palette.
buildStatusMeta();

/* "trash" is a table like the others so it syncs, exports and merges without
   special handling. Nothing is ever removed from the ledger outright: a delete
   moves the record here, where it keeps its own copy of everything it had. */
const TABLES = ["accounts", "ipos", "transfers", "trash"];

// The three that hold the ledger proper. Trash is deliberately excluded: a
// device holding only deleted records is still an empty ledger, and must not
// be pushed over a populated cloud.
const LEDGER_TABLES = ["accounts", "ipos", "transfers"];

/* A transfer made on somebody's behalf is two hops rather than one. Rishabh
   pays Dadasaheb for Prateek: what Rishabh owed Prateek is squared off by that
   much, and Dadasaheb takes on the same debt to Prateek in his place. Prateek's
   own position does not move, which is what passing money along means - he is
   owed the same amount before and after, only by somebody else.

   That falls out of splitting it in two - sender to bearer, bearer to receiver -
   and it settles both readings of the arrangement with no choice to make. Where
   the sender already owed the bearer, the first hop clears the debt and the
   sender ends up square. Where he did not, the same hop says the bearer now owes
   the sender, which is exactly right: he was out of pocket for someone else.

   Written as one hop, crediting the bearer and leaving the sender out of it,
   only the first of those came out right - and only while the sender's own debt
   was missing from the ledger. Once it was recorded the same money was counted
   twice, and the sender was left still owing what he had just paid off. */
const transferLegs = (t) => {
  const via = t.onBehalfOfId;
  return via && via !== t.fromAccountId && via !== t.toAccountId
    ? [[t.fromAccountId, via], [via, t.toAccountId]]
    : [[t.fromAccountId, t.toAccountId]];
};

// The three accounts a transfer can touch, for anything that asks "is this
// account involved" rather than "what does this account owe".
const touchesAccount = (t, id) =>
  t.fromAccountId === id || t.toAccountId === id || t.onBehalfOfId === id;

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
async function cloudResetPassword(email) {
  return gotrue("recover", { method: "POST", body: JSON.stringify({ email }) });
}
async function cloudUpdatePassword(accessToken, password) {
  return gotrue("user", { method: "PUT", headers: { Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ password }) });
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
   fourth - taking the ledger down with it over the one table that matters
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


/* ---------------------------------------------------------
   SMALL UI PRIMITIVES
---------------------------------------------------------- */
/* A badge is a label, not a highlight. It carries its colour in the text and a
   hairline, on a background barely off the card - a filled block of colour on
   every row is what made a list of IPOs read as a colour chart. */
function Badge({ children, color, bg, strong }) {
  const dark = isDark();
  const emphasis = strong && !dark;
  /* In light mode every badge gets its tinted fill so the colour reads as
     clearly as the allotment bar it sits beside. In dark mode the soft fills
     are too close to the surface to help, so badges stay transparent. */
  const fill = dark ? "transparent" : (bg || "transparent");
  return (
    <span
      style={{
        color, background: fill,
        border: `1px solid ${color}`,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 8, fontWeight: emphasis ? 700 : 650, letterSpacing: 0.3,
        padding: "2px 7px", borderRadius: 5, whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Field({ label, children, error }) {
  return (
    <div style={{ display: "block", marginBottom: 14 }}>
      <div style={{
        display: "block", fontSize: 11, fontWeight: 600, color: error ? COLORS.red : COLORS.inkSoft,
        textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6,
        fontFamily: "Inter, sans-serif",
      }}>{label}</div>
      {children}
      {error && <span style={{ display: "block", fontSize: 11, color: COLORS.red, marginTop: 4, fontFamily: "Inter, sans-serif" }}>{error}</span>}
    </div>
  );
}


function Input(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
function Select(props) {
  return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}

/* ---------------------------------------------------------
   CONFIRM MODAL
   Replaces browser confirm() and alert() with a styled modal.
   Usage: const confirm = useConfirm();
          const ok = await confirm("Delete this?", { danger: true });
---------------------------------------------------------- */
const ConfirmContext = React.createContext(null);

function ConfirmModal({ state, onResolve }) {
  if (!state) return null;
  const { message, danger, confirmLabel, cancelLabel } = state;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(24, 27, 32, 0.55)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      animation: "sheetFadeIn 150ms ease-out",
    }} onClick={() => onResolve(false)}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: COLORS.bg, borderRadius: 14, padding: "20px 18px", width: "100%", maxWidth: 320,
        boxShadow: "0 12px 40px rgba(0,0,0,0.3)", fontFamily: "Inter, sans-serif",
      }}>
        <div style={{ fontSize: 14, color: COLORS.ink, lineHeight: 1.5, marginBottom: 18 }}>
          {message}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => onResolve(false)} style={{
            padding: "9px 16px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
            background: COLORS.surface, color: COLORS.ink, fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "Inter, sans-serif",
          }}>{cancelLabel || "Cancel"}</button>
          <button onClick={() => onResolve(true)} style={{
            padding: "9px 16px", borderRadius: 8, border: "none",
            background: danger ? COLORS.red : COLORS.action, color: "#fff",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
          }}>{confirmLabel || (danger ? "Delete" : "OK")}</button>
        </div>
      </div>
    </div>
  );
}

/* The confirm modal is mounted above the app and never re-renders it, so the
   back handler cannot find it in state the way it finds every other layer. It
   announces itself instead: the ref is how it is dismissed, the listeners are
   how the app learns it is on screen and counts it as one more layer. */
const confirmDismissRef = { current: null };
const confirmListeners = new Set();

function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolveRef = useRef(null);
  const dismissRef = useRef(null);
  const show = useCallback((message, opts = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ message, ...opts });
    });
  }, []);
  const onResolve = useCallback((result) => {
    setState(null);
    /* Announced here rather than left to the effect below. When back dismisses
       this, the app has to see it gone in the same batch of work: a render that
       still counts the modal is a render one layer deeper than the truth, and
       the history is made to match by pushing an entry - from inside the
       popstate handler, which is the one place a push must never happen.
       Chrome marks the entry such a push came from as one to skip, so the next
       back steps over it and leaves the app. Sheets never had the problem;
       their state is the app's own and falls in the same batch already. */
    confirmDismissRef.current = null;
    confirmListeners.forEach((fn) => fn());
    if (resolveRef.current) { resolveRef.current(result); resolveRef.current = null; }
  }, []);
  // Expose dismiss for back button handling
  dismissRef.current = state ? () => onResolve(false) : null;
  useEffect(() => {
    confirmDismissRef.current = dismissRef.current;
    confirmListeners.forEach((fn) => fn());
  }, [state]);
  return (
    <ConfirmContext.Provider value={show}>
      {children}
      <ConfirmModal state={state} onResolve={onResolve} />
    </ConfirmContext.Provider>
  );
}

function useConfirm() { return useContext(ConfirmContext); }

/* Lets a sheet's confirming action live outside the scrolling list. */
const SheetFooterSlot = React.createContext(null);

function Sheet({ title, onClose, children }) {
  const [footerEl, setFooterEl] = useState(null);
  const bodyRef = useRef(null);
  const touch = useRef({ active: false, startY: 0, lastY: 0 });
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);

  const animateClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => { window.scrollTo(0, window.scrollY); onClose(); }, 180);
  }, [closing, onClose]);

  const onTouchStart = (e) => {
    if (closing) return;
    const body = bodyRef.current;
    if (!body || body.scrollTop > 0) return;
    const y = e.touches[0].clientY;
    touch.current = { active: true, startY: y, lastY: y, committed: false };
  };
  const onTouchMove = (e) => {
    const t = touch.current;
    if (!t.active || closing) return;
    const body = bodyRef.current;
    if (body && body.scrollTop > 0) { t.active = false; setDragging(false); setDragY(0); return; }
    const y = e.touches[0].clientY;
    t.lastY = y;
    const delta = y - t.startY;
    if (delta <= 0) { setDragging(false); setDragY(0); return; }
    if (!t.committed && delta < 8) return;
    t.committed = true;
    setDragging(true);
    setDragY(Math.min(delta, 400));
    if (e.cancelable) e.preventDefault();
  };
  const onTouchEnd = () => {
    const t = touch.current;
    if (!t.active) return;
    const delta = t.lastY - t.startY;
    touch.current.active = false;
    if (t.committed && delta > 80 && bodyRef.current && bodyRef.current.scrollTop === 0) {
      setDragging(false);
      animateClose();
    } else {
      setDragging(false);
      setDragY(0);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(24, 27, 32, 0.45)", zIndex: 50,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      animation: closing ? "sheetFadeOut 180ms ease-in forwards" : "none",
    }} onClick={animateClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        style={{
          background: COLORS.bg, width: "100%", maxWidth: 480,
          /* dvh, not vh, like the rest of the app: vh is the viewport with the
             browser's own chrome ignored, so a tall sheet ran its last inch -
             and its save button - underneath the address bar. */
          maxHeight: "92dvh", borderRadius: "18px 18px 0 0",
          display: "flex", flexDirection: "column", minHeight: 0,
          boxShadow: "0 -8px 30px rgba(0,0,0,0.2)",
          transform: closing ? "translateY(100%)" : dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? "none" : "transform 200ms ease-out",
          animation: closing ? "none" : "sheetSlideUp 280ms ease-out",
        }}
      >
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 18px 16px", flexShrink: 0,
        }}>
          <h2 title={typeof title === "string" ? title : undefined} style={{
            fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 20, color: COLORS.heading, margin: 0,
            minWidth: 0, ...ellipsisText,
          }}>{title}</h2> 
          {title && title == "Sync & Data" ? <div style={{
          display: "flex", 
        }}><button
              onClick={() => applyTheme(isDark() ? "light" : "dark")}
              aria-label={isDark() ? "Switch to light theme" : "Switch to dark theme"}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                borderRadius: 999, padding: "8px 14px", marginRight: 10, cursor: "pointer",
                fontFamily: "Inter, sans-serif", fontSize: 12.5, fontWeight: 600, color: COLORS.ink, height: 36, 
              }} 
            >
              {isDark() ? <Sun size={16} color={COLORS.gold} /> : <Moon size={16} color={COLORS.navy} />}
              {/* {isDark() ? "Light" : "Dark"} */}
            </button>  
          <button onClick={animateClose} aria-label="Close" style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 20,
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}><X size={16} color={COLORS.inkSoft} /></button></div> : <button onClick={animateClose} aria-label="Close" style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 20,
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}><X size={16} color={COLORS.inkSoft} /></button>}
        </div>
        <div
          ref={bodyRef}
          style={{
            flex: "1 1 auto", overflowY: "auto", minHeight: 0,
            WebkitOverflowScrolling: "touch",
            padding: "0 18px calc(28px + env(safe-area-inset-bottom))",
          }}
        >
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
        background: ghost ? COLORS.surface : danger ? COLORS.red : COLORS.action,
        color: ghost ? COLORS.ink : COLORS.onAction,
        fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15,
        cursor: disabled ? "default" : "pointer", marginTop: 6,
        opacity: disabled ? 0.6 : 1, touchAction: "manipulation",
      }}
    >{children}</button>
  );
}

/* ---------------------------------------------------------
   APP
---------------------------------------------------------- */
export default function App() {
  return (
    <ConfirmProvider>
      <AppInner />
    </ConfirmProvider>
  );
}

function AppInner() {
  const confirm = useConfirm();
  const [session, setSessionState] = useState(currentSession);
  const [authMode, setAuthMode] = useState("login");
  const [linkBusy, setLinkBusy] = useState(() => cloudEnabled() && !!readAuthHash());
  const [linkNotice, setLinkNotice] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");

  /* Which tab you were on survives a reload. The app is a single screen with no
     routing, so without this every refresh - and every return from the home
     screen on a phone, where the PWA is reloaded rather than resumed - dropped
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
     the bottom of the transfers - a list you had never scrolled. Each screen
     now starts where a screen should. */
  useEffect(() => {
    const el = pageRefs.current[tab];
    if (el) el.scrollTop = 0;
  }, [tab]);
  const [accounts, setAccounts] = useState([]);
  const [ipos, setIpos] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [trash, setTrash] = useState([]);
  const [loaded, setLoaded] = useState(false);
  /* Drawn and settled are different moments now. The ledger is drawn from the
     copy on this device straight away; it is settled once the cloud has been
     heard from. Anything that writes to the ledger has to wait for settled, or
     it races the reconcile and loses - a price refresh that finished first had
     its results overwritten by the cloud copy landing after it. */
  const [reconciled, setReconciled] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [lastSync, setLastSync] = useState(null);

  /* A subtle offline flag. The cached ledger still works, but the user should
     know that prices and sync are paused. Updates on the same online/offline
     events the reconnect logic already listens for. */
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);

  const [ipoSheet, setIpoSheet] = useState(null);           // { ipo }
  const [appSheet, setAppSheet] = useState(null);           // { ipoId, application }
  const [acctSheet, setAcctSheet] = useState(null);         // { account }
  const [transferSheet, setTransferSheet] = useState(null); // { transfer }
  const [ipoDetail, setIpoDetail] = useState(null);         // ipo id
  const [acctDetail, setAcctDetail] = useState(null);       // account id
  const [holdingDetail, setHoldingDetail] = useState(null); // ipo id (for holding view)
  const [dataSheetOpen, setDataSheetOpen] = useState(false);
  const [bulkApplyFor, setBulkApplyFor] = useState(null);   // ipo id
  const [bulkStatusFor, setBulkStatusFor] = useState(null); // ipo id
  const [allotmentFor, setAllotmentFor] = useState(null);   // ipo id
  const [liveOpen, setLiveOpen] = useState(false);

  /* The confirm modal is not this component's to own - it is mounted above it -
     but back has to treat it as the topmost layer, so it is mirrored here. */
  const [confirmOpen, setConfirmOpen] = useState(false);
  useEffect(() => {
    const listener = () => setConfirmOpen(!!confirmDismissRef.current);
    confirmListeners.add(listener);
    listener();
    return () => { confirmListeners.delete(listener); };
  }, []);

  // And the same for the popovers the screens own - see useBackLayer.
  const [transient, setTransient] = useState(0);
  useEffect(() => {
    const listener = () => setTransient(transientLayers.size);
    transientListeners.add(listener);
    listener();
    return () => { transientListeners.delete(listener); };
  }, []);

  const [pricing, setPricing] = useState(false);
  const [priceInfo, setPriceInfo] = useState({ asOf: "", matched: 0, total: 0, error: "" });

  const skipNextAutoSync = useRef(true);
  const pricedOnce = useRef(false);
  const swipeNav = useRef(null);
  const pagerRef = useRef(null);
  const pageRefs = useRef({});
  const swipeDx = useRef(0);
  const swipeMs = useRef(0);
  const pullRef = useRef(null);
  const pullY = useRef(0);
  const pullMs = useRef(0);
  const settling = useRef(false);
  const settleTimer = useRef(null);
  const [swipeDir, setSwipeDir] = useState(0);
  const [, bumpHolidays] = useState(0);

  // The palette is mutated in place, so a theme change needs a nudge to redraw.
  const [, bumpTheme] = useState(0);
  useEffect(() => {
    const listener = () => bumpTheme((n) => n + 1);
    themeListeners.add(listener);
    return () => { themeListeners.delete(listener); };
  }, []);

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
    const listener = (s) => { setSessionState(s); if (!s) { setLinkNotice(""); setRecoveryToken(""); } };
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
    const type = params.get("type");
    if (!token) {
      const err = params.get("error_description") || params.get("error");
      setLinkNotice((err || "That link is no longer valid.").replace(/\+/g, " "));
      setLinkBusy(false);
      return;
    }

    // Password recovery: don't auto-sign-in, show the reset form instead
    if (type === "recovery") {
      setRecoveryToken(token);
      setAuthMode("login");
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
    setReconciled(false);
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
        setReconciled(true);
        return;
      }

      const owner = localOwner();
      const localIsOurs = owner === userId;
      const empty = { accounts: [], ipos: [], transfers: [], trash: [] };

      apply(localIsOurs ? local : empty);

      /* Show the ledger the moment there is one worth showing. The copy on this
         device is the same ledger the cloud holds, so waiting for the round trip
         before drawing anything meant staring at "Loading ledger..." for as long
         as Supabase took - several seconds - with the answer already in hand.

         Only when this device holds nothing, or holds somebody else's, is there
         genuinely nothing to draw, and only then is the wait real. */
      if (localIsOurs && !isEmptyState(local)) setLoaded(true);
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
        if (!cancelled) { setSyncing(false); setLoaded(true); setReconciled(true); }
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  /* Android's back gesture closed the whole app from anywhere, because a single
     screen with no routing has no history to go back through. Back now peels
     off one layer at a time - the sheet on top, then any sheet under it, then
     back to Overview - and only leaves once there is nothing left to close.

     The handler reads through a ref so the listener can be registered once and
     still see current state; re-registering on every state change would drop
     the history bookkeeping below. */
  const backLayers = { confirmOpen, transient, appSheet, bulkApplyFor, bulkStatusFor, allotmentFor, ipoSheet,
    acctSheet, transferSheet, liveOpen, dataSheetOpen, ipoDetail, acctDetail, holdingDetail, tab };

  /* A sheet covers the screen but the page behind it still scrolls, so dragging
     anywhere outside the panel moved the list underneath and you came back to
     somewhere else entirely. Held still while a sheet is open. */
  /* A popover is not one of these: it covers a corner, not the screen, and it
     should not stop the page being swiped or pulled. Swiping away simply takes
     it with the screen it belongs to. */
  const sheetIsOpen = Object.entries(backLayers)
    .some(([k, v]) => k !== "tab" && k !== "transient" && !!v);
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
    const clear = (key, setter, val) => { setter(val !== undefined ? val : null); backRef.current = { ...backRef.current, [key]: val !== undefined ? val : null }; return true; };
    if (confirmDismissRef.current) { confirmDismissRef.current(); backRef.current = { ...backRef.current, confirmOpen: false }; return true; }
    if (transientLayers.size) {
      // The last to open is the one on top, and the one back is for.
      const top = [...transientLayers].pop();
      transientLayers.delete(top);
      top();
      // At once, for the reason the confirm modal does it: see onResolve.
      announceTransient();
      backRef.current = { ...backRef.current, transient: transientLayers.size };
      return true;
    }
    if (v.appSheet) return clear("appSheet", setAppSheet);
    if (v.bulkApplyFor) return clear("bulkApplyFor", setBulkApplyFor);
    if (v.bulkStatusFor) return clear("bulkStatusFor", setBulkStatusFor);
    if (v.allotmentFor) return clear("allotmentFor", setAllotmentFor);
    if (v.ipoSheet) return clear("ipoSheet", setIpoSheet);
    if (v.acctSheet) return clear("acctSheet", setAcctSheet);
    if (v.acctDetail) return clear("acctDetail", setAcctDetail);
    if (v.holdingDetail) return clear("holdingDetail", setHoldingDetail);
    if (v.transferSheet) return clear("transferSheet", setTransferSheet);
    if (v.liveOpen) return clear("liveOpen", setLiveOpen, false);
    if (v.dataSheetOpen) return clear("dataSheetOpen", setDataSheetOpen, false);
    if (v.ipoDetail) return clear("ipoDetail", setIpoDetail);
    if (v.tab !== "dashboard") { setTab("dashboard"); backRef.current = { ...backRef.current, tab: "dashboard" }; return true; }
    return false;
  }, []);

  /* An entry per open layer, pushed as the layer opens and popped as it closes,
     with the depth it stands for written into the entry. Back then lands on an
     entry that says how much should still be on screen, and anything above that
     is closed - which is self-correcting, so a stack that ever drifts out of
     step is put right by the next press rather than staying wrong.

     Entries are never pushed from inside the popstate handler. Chrome treats a
     history entry created without a user gesture as one to skip past, and a
     back press is not a gesture on the page: the old code pushed a replacement
     entry from the handler, which worked for the first back and then took the
     second one straight out of the app - two panels deep, one back closed the
     top panel and the next closed the app. */
  const depth = layerDepth(backLayers);
  const histDepth = useRef(0);
  const histMoving = useRef(false);
  const popTurn = useRef(false);
  const popTurnTimer = useRef(null);
  const [histPops, setHistPops] = useState(0);

  /* The same rule applies at startup: the tab you were last on is restored
     before anyone has touched anything, and an entry pushed for it then would
     be skipped over. Nothing is pushed until the first touch or key, and every
     way a browser might report one is watched - if this never arms, back walks
     straight out of the first panel that is opened. */
  const [histArmed, setHistArmed] = useState(false);
  useEffect(() => {
    if (histArmed || typeof window === "undefined" || !window.history) return;
    window.history.replaceState({ ...(window.history.state || {}), ledger: 0 }, "");
    const arm = () => setHistArmed(true);
    ARM_EVENTS.forEach((type) => window.addEventListener(type, arm, { capture: true, once: true }));
    return () => ARM_EVENTS.forEach((type) => window.removeEventListener(type, arm, true));
  }, [histArmed]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.history) return;
    if (!histArmed || histMoving.current) return;
    if (depth > histDepth.current) {
      /* Never while a back press is still being answered, whatever the layers
         say. A push from there is the one Chrome punishes, and a layer that is
         slow to report itself closed would otherwise ask for exactly that.
         It is only ever deferred - the tick below asks again. */
      if (popTurn.current) return;
      for (let n = histDepth.current + 1; n <= depth; n++) window.history.pushState({ ledger: n }, "");
      histDepth.current = depth;
    } else if (depth < histDepth.current) {
      // Closed by tapping rather than by back: give the entries back.
      const steps = histDepth.current - depth;
      histDepth.current = depth;
      histMoving.current = true;
      window.history.go(-steps);
    }
  }, [depth, histArmed, histPops]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPop = (e) => {
      histMoving.current = false;
      const landed = e.state && typeof e.state.ledger === "number" ? e.state.ledger : 0;
      histDepth.current = landed;
      popTurn.current = true;
      for (let guard = BACK_LAYERS.length + 2; layerDepth(backRef.current) > landed && guard > 0; guard--) {
        if (!closeTopLayer()) break;
      }
      setHistPops((n) => n + 1);
      /* Once everything React does in answer to this press has landed, which is
         inside this task, the stack is looked at again with a free hand. */
      clearTimeout(popTurnTimer.current);
      popTurnTimer.current = setTimeout(() => {
        popTurn.current = false;
        setHistPops((n) => n + 1);
      }, 0);
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      clearTimeout(popTurnTimer.current);
    };
  }, [closeTopLayer]);

  /* ---------- writes ---------- */
  const persistAccounts = useCallback((next) => { setAccounts(next); saveTable("accounts", next); }, []);
  const persistIpos = useCallback((next) => { setIpos(next); saveTable("ipos", next); }, []);
  const persistTransfers = useCallback((next) => { setTransfers(next); saveTable("transfers", next); }, []);
  const persistTrash = useCallback((next) => { setTrash(next); saveTable("trash", next); }, []);

  /* Deleting puts the whole record here, not in the bin. Restoring it later has
     to work without anything else on the device, so the entry carries its own
     copy - and, for an application, the IPO it belonged to. */
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
      // But if trash has entries, the user intentionally deleted their data.
      if (isEmptyState(state) && !(trash || []).length) {
        const remote = await cloudLoad();
        if (!isEmptyState(remote)) {
          setSyncError("This device is empty but your cloud ledger is not. Nothing was overwritten - reload to pull it down.");
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
         day-one opening price - a request each, and neither ever changes once
         known. Prices come back for every listing regardless of who is named,
         so the only names worth sending are those still missing something: a
         settled ledger names none, and the whole refresh is one request.

         Capped as well, since the names travel in the query string and a ledger
         holding a year of listings would build a URL long enough to be refused.
         The rounds below work through anything left over. */
      const incomplete = (list) =>
        list.filter((i) =>
          !i.lotSize || !i.closeDate || !i.openDate || isBlank(i.priceBand) ||
          (!i.allotmentDate && i.closeDate) ||
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
         it carries the time it was taken - so a reload was answered from the
         cache, showed a price minutes old, and stamped it with the minutes-old
         timestamp, which reads exactly like a refresh that never happened. */
      const bust = opts.silent
        ? `&at=${Math.floor(Date.now() / 30000)}`
        : `&at=${Date.now()}`;
      // Send ISINs from listed IPOs in ledger that have an ISIN, so the API can fetch their LTP
      const extraIsins = list.filter((i) => i.isin && hasListed(i)).map((i) => i.isin).join(",");
      const isinsParam = extraIsins ? `&isins=${encodeURIComponent(extraIsins)}` : "";
      const res = await fetch(`/api/listings?from=${from}${bust}&keys=${encodeURIComponent(keys)}${isinsParam}`);
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
        // If no name match, check if we got an extra LTP for this IPO's ISIN
        if (!hit) {
          const extraPrice = ipo.isin && data.extraLtp ? data.extraLtp[ipo.isin] : null;
          if (extraPrice != null) {
            matched++;
            updated++;
            return { ...ipo, currentPrice: String(extraPrice), priceAsOf: asOf };
          }
          return ipo;
        }
        matched++;
        /* BSE is authoritative here, so its values replace what is on record
           rather than only filling gaps. */
        const patch = { priceAsOf: asOf };
        if (hit.currentPrice != null) patch.currentPrice = String(hit.currentPrice);
        /* The listing price is the opening print on debut day. The close can be
           far from it - Innovision opened at 466 and closed at 372.8 the same
           day - so the close is only a fallback when the open is unavailable. */
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
           yet, and that absence is itself information - otherwise a wrong
           listing date entered long ago can never be cleared, because there is
           nothing to overwrite it with. Only trusted when the listings dataset
           actually loaded; a failed fetch must not wipe every listing date. */
        if (hit.listedOn) {
          patch.listingDate = hit.listedOn;
        } else if (listingsLoaded && !ipo.listingDate) {
          // Only clear prices when the exchange has no listing record AND
          // the local record doesn't have a listing date either.
          // If the local record has a listing date, keep existing prices.
          patch.listingPrice = "";
          patch.listingPriceSource = "";
          patch.listingClosePrice = "";
          patch.currentPrice = "";
          if (ipo.listingDate && ipo.listingDate < todayISO()) patch.listingDate = "";
        }
        if (hit.openDate) patch.openDate = hit.openDate;
        if (hit.closeDate) {
          patch.closeDate = hit.closeDate;
          patch.applicationDate = hit.closeDate;
        }
        if (hit.allotmentDate) patch.allotmentDate = hit.allotmentDate;
        // The top of the band: what a cut-off application is priced at.
        if (hit.priceMax != null) patch.priceBand = String(hit.priceMax);
        if (hit.priceMin != null) patch.priceBandLow = String(hit.priceMin);
        if (hit.lotSize != null) patch.lotSize = String(hit.lotSize);
        if (hit.isin) patch.isin = hit.isin;
        if (hit.shortName || hit.symbol) patch.symbol = hit.shortName || hit.symbol;

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
         nothing in - which is also what happens when BSE simply has no more. */
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

  /* Refresh once per session when there is something whose value can move.
     It runs after the ledger is on screen, never before it: a slow price feed
     delays a number, and must never delay the page. */
  useEffect(() => {
    if (!reconciled || pricedOnce.current) return;
    // Worth doing whenever anything could be filled in: a live holding to
    // value, or simply a date or listing price still missing.
    const worthFetching = ipos.some((i) =>
      (i.applications || []).some((a) =>
        !a.sold && (a.allotmentStatus === "Allotted" || a.allotmentStatus === "Partial")) ||
      !i.listingDate || !i.openDate || !i.closeDate || isBlank(i.listingPrice));
    if (!worthFetching) return;
    pricedOnce.current = true;
    refreshPrices({ silent: true });
  }, [reconciled, ipos, refreshPrices]);

  /* Fill in missing allotment/listing dates for open/upcoming IPOs from the
     ipos API. The listings API only has listed+closed ones, so active IPOs
     imported before the fix need this one-time enrichment. */
  const enrichedDatesOnce = useRef(false);
  useEffect(() => {
    if (!reconciled || enrichedDatesOnce.current) return;
    const needDates = ipos.filter((i) =>
      i.closeDate && !hasListed(i) && (!i.allotmentDate || !i.listingDate || !i.registrar));
    if (!needDates.length) return;
    enrichedDatesOnce.current = true;
    (async () => {
      try {
        const res = await fetch("/api/ipos");
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data.ipos)) return;
        const byName = new Map(data.ipos.map((r) => [nameKey(r.company), r]));
        let changed = false;
        const next = ipos.map((ipo) => {
          if (ipo.allotmentDate && ipo.listingDate) return ipo;
          if (hasListed(ipo)) return ipo;
          const hit = byName.get(nameKey(ipo.company));
          if (!hit) return ipo;
          const patch = {};
          if (!ipo.allotmentDate && hit.allotmentDate) patch.allotmentDate = hit.allotmentDate;
          if (!ipo.listingDate && hit.listingDate) patch.listingDate = hit.listingDate;
          // Issues imported before the registrar was kept have none on record.
          if (!ipo.registrar && hit.registrar) patch.registrar = hit.registrar;
          if (!Object.keys(patch).length) return ipo;
          changed = true;
          return { ...ipo, ...patch };
        });
        if (changed) persistIpos(next);
      } catch { /* not worth failing over */ }
    })();
  }, [reconciled, ipos, persistIpos]);

  /* The figure on the cards is the last traded price, so it goes stale simply
     by being looked at later. Coming back to the app is the moment that shows,
     and it is also the only moment worth spending a request on - a tab sitting
     in the background needs nothing. */
  const priceAsOfRef = useRef("");
  priceAsOfRef.current = priceInfo.asOf;
  const refreshRef = useRef(refreshPrices);
  refreshRef.current = refreshPrices;

  useEffect(() => {
    if (!reconciled || typeof document === "undefined") return;
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
  }, [reconciled]);

  /* Sync now sends what is here and then takes what is there, so a change made
     on another device arrives without waiting for a reload - which is what the
     old handler achieved by reloading the page out from under you. */
  const syncNow = useCallback(async () => {
    await pushToCloud();
    if (!cloudEnabled() || !userId) return;
    try {
      const remote = await cloudLoad();
      if (isEmptyState(remote)) return;
      setAccounts(remote.accounts); setIpos(remote.ipos);
      setTransfers(remote.transfers); setTrash(remote.trash || []);
      TABLES.forEach((k) => saveTable(k, remote[k] || []));
      // Already in step with the cloud; no need to push it straight back.
      skipNextAutoSync.current = true;
      setLastSync(new Date());
      setSyncError("");
      // Handed back so a caller can go on with these rather than React's copy
      // from the render before, which is a beat behind until this commits.
      return remote.ipos;
    } catch (e) {
      setSyncError(e.message || "Could not reach the cloud.");
    }
    return null;
  }, [pushToCloud, userId]);
  const syncNowRef = useRef(syncNow);
  syncNowRef.current = syncNow;

  /* Everything the ledger shows, brought up to date in one go. There is no
     per-screen refresh to write: the four screens are one set of records seen
     four ways, so the cloud round trip and the price feed between them cover
     the lot - what other devices have changed, allotments, transfers, and
     today's valuations. Whichever screen the pull happens on, all four are
     current when it finishes. */
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const iposRef = useRef(ipos);
  iposRef.current = ipos;

  /* An issue appears on its registrar's status page only once the basis of
     allotment is done, which is the moment the answer exists. So rather than
     asking after each issue in turn, both indexes are fetched at once and
     matched against whatever is still Pending here - one request, and the
     Overview can then say which ones are ready to be checked. */
  const [published, setPublished] = useState([]);
  const watchRef = useRef({ at: 0, busy: false });

  const checkPublished = useCallback(async (list) => {
    const waiting = (list || []).filter(awaitingAllotmentEntry);
    if (!waiting.length) { setPublished([]); return; }
    if (watchRef.current.busy || Date.now() - watchRef.current.at < 5 * 60 * 1000) return;
    watchRef.current.busy = true;
    try {
      const res = await fetch("/api/allotment?index=1");
      if (!res.ok) return;
      const idx = await res.json();
      const names = [...(idx.kfintech || []), ...(idx.mufg || [])].map(nameKey);
      const listed = (a) => names.some((n) => n === a || (n.length > 6 && a.length > 6 && (n.includes(a) || a.includes(n))));
      setPublished(waiting.filter((i) => listed(nameKey(i.company))).map((i) => i.id));
      watchRef.current.at = Date.now();
    } catch {
      /* No answer means no news, which is the same as the quiet case. */
    } finally {
      watchRef.current.busy = false;
    }
  }, []);

  useEffect(() => { if (reconciled) checkPublished(ipos); }, [reconciled, ipos, checkPublished]);

  const refreshAll = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    const startedAt = Date.now();
    try {
      const fresh = await syncNowRef.current();
      await refreshPricesFrom(fresh || iposRef.current, { silent: true });
      watchRef.current.at = 0;
      await checkPublished(fresh || iposRef.current);
    } catch {
      /* Both halves report for themselves - the cloud through the sync status
         in the header, prices through the panel that shows them. */
    } finally {
      /* Held a moment even when the answer comes back instantly, because a
         spinner that vanishes on the same frame reads as a gesture that did
         nothing rather than a refresh that found nothing to change. */
      const left = 500 - (Date.now() - startedAt);
      if (left > 0) await new Promise((r) => setTimeout(r, left));
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }, [refreshPricesFrom, checkPublished]);

  /* When the browser regains connectivity, reconcile and refresh in the
     background - no reload, and no need to notice the app looks stale and
     do it yourself. The cached ledger stays on screen throughout; this only
     ever adds fresher data on top of it, and a failed request here leaves
     what is already showing untouched. */
  const reconnectBusyRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let settleTimer = null;
    const handleOnline = () => {
      // Several tabs/interfaces can each fire "online" within the same
      // moment; only one reconnect pass should ever be in flight.
      if (reconnectBusyRef.current || !reconciled) return;
      reconnectBusyRef.current = true;
      clearTimeout(settleTimer);
      // The event fires the instant an interface reappears, not once it can
      // actually reach anything - give it a beat before spending a request.
      settleTimer = setTimeout(async () => {
        try {
          if (cloudEnabled() && userId) await syncNowRef.current();
          await refreshRef.current({ silent: true });
        } catch {
          // A failed reconnect attempt is not worth surfacing; the next
          // online event, or the visibility-based refresh above, will retry.
        } finally {
          reconnectBusyRef.current = false;
        }
      }, 700);
    };
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
      clearTimeout(settleTimer);
    };
  }, [reconciled, userId]);

  /* Track the browser's online/offline state so we can show a subtle indicator. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);



  /* ---------- derived numbers ---------- */
  const stats = useMemo(() => {
    let invested = 0, realized = 0, unrealized = 0, pendingCount = 0, activeCount = 0, missingLtp = 0;
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
            else if (hasListed(ipo) && shares > 0) missingLtp++;
          }
        }
      });
    });
    return { invested, realized, unrealized, pendingCount, activeCount, missingLtp };
  }, [ipos]);

  /* ---------- page swipe ---------- */
  /* Swiping between the four screens used to snap from one to the next. They
     sit side by side now: the screen you are on follows your finger, the one
     you are heading for comes in beside it, and on release the pair settles
     onto whichever is more than a third of the way across - the way a phone's
     home screen moves. Only the neighbour you are dragging towards is mounted,
     so a swipe never costs more than two screens.

     The drag is painted straight onto the two nodes instead of going through
     state, because re-rendering this component on every touchmove drops frames
     on a long list. Neither property is set from the style prop, so React never
     overwrites what is written here. */
  /* A flick counts for as much as a long drag. A phone's home screen does not
     make you carry the page a third of the way across - a short, quick push is
     enough, and the page then keeps the speed you gave it. Anything moving
     faster than this many pixels per millisecond is read as a flick. */
  const FLICK_SPEED = 0.28;
  const FLICK_MIN_PX = 24;
  const reducedMotion = prefersReducedMotion();

  /* How far down the indicator comes: far enough to be a decision, not so far
     that it is a haul. It parks a little short of the trigger while the work
     is going on, the way a phone's own does. */
  const PULL_TRIGGER = 64;
  const PULL_MAX = 96;
  const PULL_PARK = 52;

  /* Speed over the tail of the drag rather than the whole of it: a finger that
     wandered, stopped, and then flicked should be judged on the flick. */
  const swipeSpeed = (s) => {
    const last = s.samples[s.samples.length - 1];
    const first = s.samples.find((p) => last.t - p.t <= 120) || s.samples[0];
    const dt = last.t - first.t;
    return dt > 0 ? (last.x - first.x) / dt : 0;
  };

  const paintPages = () => {
    const here = TABS.indexOf(tab);
    TABS.forEach((id, i) => {
      const el = pageRefs.current[id];
      if (!el) return;
      el.style.transition = swipeMs.current
        ? `transform ${swipeMs.current}ms cubic-bezier(0.22, 0.61, 0.36, 1)`
        : "none";
      el.style.transform = `translate3d(calc(${(i - here) * 100}% + ${swipeDx.current}px), 0, 0)`;
    });
  };
  /* Over the screens rather than pushing them down, so nothing below it
     reflows while it is being held. */
  const paintPull = () => {
    const el = pullRef.current;
    if (!el) return;
    const y = pullY.current;
    el.style.transition = pullMs.current
      ? `transform ${pullMs.current}ms ease-out, opacity ${pullMs.current}ms ease-out`
      : "none";
    el.style.transform = `translate3d(-50%, ${y - 46}px, 0) rotate(${Math.round(y * 2.2)}deg)`;
    el.style.opacity = String(Math.min(1, y / PULL_TRIGGER));
  };

  /* After every render, so a neighbour that has just mounted is put in its
     place in the same frame rather than flashing over the screen you are on. */
  useLayoutEffect(() => { paintPages(); paintPull(); });

  // Down to where it waits when the work starts, back up when it is done.
  useEffect(() => {
    pullMs.current = reducedMotion ? 0 : 240;
    pullY.current = refreshing ? PULL_PARK : 0;
    paintPull();
  }, [refreshing]);
  useEffect(() => () => clearTimeout(settleTimer.current), []);

  /* dir 0 slides back to the screen you started on. */
  const settleSwipe = (dir, width, speed = 0) => {
    /* However far is left to go, taken at roughly the speed the finger was
       already going, so a flick lands quickly and a slow drag eases into
       place instead of every swipe taking the same quarter of a second. */
    const remaining = dir ? Math.max(width - Math.abs(swipeDx.current), 0) : Math.abs(swipeDx.current);
    const ms = reducedMotion ? 0
      : Math.round(Math.min(300, Math.max(130, remaining / Math.max(Math.abs(speed), 1.1))));
    settling.current = true;
    swipeMs.current = ms;
    swipeDx.current = dir ? -dir * width : 0;
    paintPages();
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      /* The screen that has slid into place keeps its node - the pages are
         keyed by tab - so changing which tab is active under it leaves it
         sitting exactly where the animation left it, at an offset of nothing. */
      settling.current = false;
      swipeMs.current = 0;
      swipeDx.current = 0;
      setSwipeDir(0);
      if (dir) setTab((t) => TABS[TABS.indexOf(t) + dir] || t);
    }, ms + 30);
  };

  const onSwipeStart = (e) => {
    if (sheetIsOpen || settling.current || e.touches.length > 1) return;
    const box = pagerRef.current && pagerRef.current.getBoundingClientRect();
    swipeNav.current = {
      x: e.touches[0].clientX, y: e.touches[0].clientY,
      axis: null, dx: 0, dir: 0, width: (box && box.width) || window.innerWidth,
      samples: [{ x: e.touches[0].clientX, t: Date.now() }], pull: 0,
    };
  };

  const onSwipeMove = (e) => {
    const s = swipeNav.current;
    if (!s || sheetIsOpen) return;
    /* A second finger means a pinch, now that the page can be zoomed into.
       Whatever it is, it is not a page turn. */
    if (e.touches.length > 1) { swipeNav.current = null; pullY.current = 0; pullMs.current = 0; paintPull(); return; }
    const dx = e.touches[0].clientX - s.x;
    const dy = e.touches[0].clientY - s.y;
    if (!s.axis) {
      /* The first decisive movement decides the axis and it is not revisited,
         so a slightly slanted scroll cannot drag the page sideways halfway
         down a list, and a slanted swipe cannot scroll it. */
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
      if (Math.abs(dx) > Math.abs(dy) * 1.2) s.axis = "x";
      else {
        /* Downwards, from a screen already at its top, is the refresh; every
           other vertical movement belongs to the scroller and is left alone. */
        const top = pageRefs.current[tab];
        if (dy > 0 && !refreshing && top && top.scrollTop <= 0) s.axis = "pull";
        else { swipeNav.current = null; return; }
      }
    }
    if (s.axis === "pull") {
      // Half of what the finger does, so it never feels like it is falling out.
      s.pull = Math.min(PULL_MAX, Math.max(0, dy) * 0.5);
      pullY.current = s.pull;
      pullMs.current = 0;
      paintPull();
      return;
    }
    const dir = dx < 0 ? 1 : -1;
    const room = !!TABS[TABS.indexOf(tab) + dir];
    // Past the first and last screens there is nowhere to go, so the drag resists.
    s.dx = room ? dx : dx * 0.25;
    s.samples.push({ x: e.touches[0].clientX, t: Date.now() });
    if (s.samples.length > 8) s.samples.shift();
    swipeDx.current = s.dx;
    swipeMs.current = 0;
    if (s.dir !== (room ? dir : 0)) { s.dir = room ? dir : 0; setSwipeDir(s.dir); }
    paintPages();
  };

  const onSwipeEnd = () => {
    const s = swipeNav.current;
    swipeNav.current = null;
    if (!s) return;
    if (s.axis === "pull") {
      pullMs.current = reducedMotion ? 0 : 240;
      if (s.pull >= PULL_TRIGGER) { pullY.current = PULL_PARK; paintPull(); refreshAll(); }
      else { pullY.current = 0; paintPull(); }
      return;
    }
    if (s.axis !== "x") return;
    const speed = swipeSpeed(s);
    const thrown = speed !== 0 && Math.sign(speed) === Math.sign(s.dx);
    /* A flick settles it either way - thrown forward the page goes, pulled
       back it stays - and only a drag slow enough to have no throw left in it
       falls back on how far across it got. */
    const commit = Math.abs(speed) > FLICK_SPEED
      ? thrown && Math.abs(s.dx) > FLICK_MIN_PX
      : Math.abs(s.dx) > s.width * 0.3;
    settleSwipe(s.dir && commit ? s.dir : 0, s.width, speed);
  };

  /* ---------- gates ---------- */
  if (linkBusy) return <LedgerSkeleton text="SIGNING YOU IN" tab={tab} />;

  if (cloudEnabled() && !session) {
    return <AuthScreen mode={authMode} setMode={setAuthMode} notice={linkNotice} recoveryToken={recoveryToken} />;
  }

  if (!loaded) return <LedgerSkeleton text="LOADING YOUR LEDGER" tab={tab} />;

  return (
    <div style={{
      height: "100dvh", background: COLORS.bg, fontFamily: "Inter, sans-serif",
      color: COLORS.ink, maxWidth: 520, margin: "0 auto", position: "relative",
      display: "flex", flexDirection: "column",
    }}>
      <style>{FONT_IMPORT}</style>

      <Header
        tab={tab}
        syncing={syncing}
        pricing={pricing}
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

      {isOffline && (
        <div style={{
          background: COLORS.goldSoft, display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, padding: "6px 14px", fontSize: 11.5, fontWeight: 600, color: COLORS.ink,
          fontFamily: "Inter, sans-serif", flexShrink: 0,
        }}>
          <CloudOff size={13} color={COLORS.gold} />
          <span>You're offline - showing cached data</span>
        </div>
      )}

      <div
        ref={pagerRef}
        onTouchStart={onSwipeStart}
        onTouchMove={onSwipeMove}
        onTouchEnd={onSwipeEnd}
        onTouchCancel={onSwipeEnd}
        style={{
          position: "relative", flex: "1 1 auto", minHeight: 0,
          overflow: "hidden", overscrollBehaviorX: "contain",
        }}>
        {/* Neither transform nor opacity is set from here: both are written
            straight onto the node as the finger moves, and React would
            overwrite them on its next render if it thought it owned them. */}
        <div ref={pullRef} aria-hidden="true" style={{
          position: "absolute", top: 10, left: "50%", zIndex: 6, pointerEvents: "none",
          width: 34, height: 34, borderRadius: 17,
          background: COLORS.surface, border: `1px solid ${COLORS.border}`,
          boxShadow: "0 3px 10px rgba(0,0,0,0.14)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {refreshing
            ? <Loader2 size={16} color={COLORS.gold} className="spin" />
            : <RefreshCw size={16} color={COLORS.gold} />}
        </div>
        {TABS.map((id, i) => {
          // The screen you are on, plus the one you are swiping towards.
          if (id !== tab && i !== TABS.indexOf(tab) + swipeDir) return null;
          return (
            <div
              key={id}
              ref={(el) => { if (el) pageRefs.current[id] = el; else delete pageRefs.current[id]; }}
              className="ledger-scroll"
              style={{
                position: "absolute", inset: 0, overflowY: "auto", padding: "14px 14px 14px",
                /* Contained, so pulling past the top is the ledger's own
                   refresh rather than the browser's - which reloaded the whole
                   app, and did it by accident as often as on purpose. */
                WebkitOverflowScrolling: "touch", overscrollBehaviorY: "contain",
                // Vertical scrolling stays the browser's; sideways is ours.
                touchAction: "pan-y", willChange: "transform",
              }}>
              {id === "dashboard" && (
                <Dashboard stats={stats} ipos={ipos} accounts={accounts} published={published} onOpenIpo={(x) => setIpoDetail(x)} onOpenHolding={(x) => setHoldingDetail(x)} />
              )}
              {id === "ipos" && (
                <IpoList ipos={ipos} accounts={accounts} onOpen={(x) => setIpoDetail(x)} />
              )}
              {id === "accounts" && (
                <AccountList transfers={transfers} accounts={accounts} ipos={ipos} onOpen={(x) => setAcctDetail(x)} />
              )}
              {id === "transfers" && (
                <TransfersScreen transfers={transfers} accounts={accounts} ipos={ipos}
                  onEdit={(transfer) => setTransferSheet({ transfer })}
                  onDelete={(x) => {
                    const gone = transfers.find((t) => t.id === x);
                    if (!gone) return;
                    const who = (aid) => accounts.find((a) => a.id === aid)?.name || "Unknown";
                    discard("transfer", gone, `${inr(gone.amount)} · ${who(gone.fromAccountId)} to ${who(gone.toAccountId)}`);
                    persistTransfers(transfers.filter((t) => t.id !== x));
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <BottomNav
        tab={tab}
        setTab={setTab}
        /* Tapping the screen you are already on takes you back to the top of
           it, which is the one thing a bottom bar is expected to do and the
           only way back up a long list without scrolling all of it. */
        onReselect={() => {
          const el = pageRefs.current[tab];
          if (!el) return;
          if (el.scrollTo) el.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
          else el.scrollTop = 0;
        }}
      />

      {ipoDetail && (
        <IpoDetailSheet
          ipo={ipos.find((i) => i.id === ipoDetail)}
          accounts={accounts}
          onClose={() => setIpoDetail(null)}
          onDeleteIpo={(id) => { const gone=ipos.find((x)=>x.id===id); if(!gone)return; discard("ipo",gone,gone.company||"Untitled IPO"); persistIpos(ipos.filter((x)=>x.id!==id)); setIpoDetail(null); }}
          onEditIpo={() => { setIpoSheet({ ipo: ipos.find((i) => i.id === ipoDetail) }); }}
          onSaveNote={(id,noteValue)=>{ persistIpos(ipos.map((i)=>i.id===id?{...i,remarks:(noteValue||"").trimEnd()}:i)); }}
          onBulkApply={(ipoId) => { setBulkApplyFor(ipoId); }}
          onBulkStatus={(ipoId) => { setBulkStatusFor(ipoId); }}
          onCheckAllotment={(ipoId) => { setAllotmentFor(ipoId); }}
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
          onSave={async (data) => {
            if (ipoSheet.ipo) {
              const merged = { ...ipoSheet.ipo, ...data };
              const fillable = fillableApplications(merged);
              const shouldFill = fillable.length && await confirm(
                `Work out the blocked amount for ${fillable.length} application${fillable.length === 1 ? "" : "s"} from this price and lot size?`,
                { confirmLabel: "Yes, fill in" }
              );
              const applications = shouldFill
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
          onClose={() => { setBulkApplyFor(null); backRef.current = { ...backRef.current, bulkApplyFor: null }; }}
          onSave={(newApps) => {
            persistIpos(ipos.map((i) => (i.id === bulkApplyFor
              ? { ...i, applications: [...(i.applications || []), ...newApps] }
              : i)));
            setBulkApplyFor(null);
          }}
        />
      )}

      {bulkStatusFor && (
        <BulkStatusSheet
          ipo={ipos.find((i) => i.id === bulkStatusFor)}
          accounts={accounts}
          onClose={() => { setBulkStatusFor(null); backRef.current = { ...backRef.current, bulkStatusFor: null }; }}
          onSave={(draft) => {
            persistIpos(ipos.map((i) => (i.id === bulkStatusFor
              ? {
                  ...i,
                  applications: (i.applications || []).map((a) =>
                    draft[a.id] ? { ...a, ...draft[a.id] } : a),
                }
              : i)));
            setBulkStatusFor(null);
          }}
        />
      )}

      {allotmentFor && (
        <AllotmentSheet
          ipo={ipos.find((i) => i.id === allotmentFor)}
          accounts={accounts}
          onClose={() => { setAllotmentFor(null); backRef.current = { ...backRef.current, allotmentFor: null }; }}
          onApply={(results) => {
            /* Written per account, and only where the registrar actually
               answered - an account it could not reach is left exactly as it
               was rather than being recorded as rejected. The share count is
               the registrar's; the status follows from it, with Partial kept
               for the case where some of what was applied for came through. */
            const byAccount = {};
            results.forEach((r) => { if (r.accountId) byAccount[r.accountId] = r; });
            persistIpos(ipos.map((i) => (i.id === allotmentFor
              ? {
                  ...i,
                  applications: (i.applications || []).map((a) => {
                    const hit = byAccount[a.accountId];
                    if (!hit) return a;
                    const status = hit.allotted <= 0 ? "Not Allotted"
                      : hit.appliedQty > 0 && hit.allotted < hit.appliedQty ? "Partial"
                      : "Allotted";
                    return {
                      ...a,
                      sharesAllotted: hit.allotted > 0 ? String(hit.allotted) : "",
                      allotmentStatus: status,
                    };
                  }),
                }
              : i)));
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

      {holdingDetail && (
        <HoldingDetailSheet
          ipo={ipos.find((i) => i.id === holdingDetail)}
          accounts={accounts}
          onClose={() => setHoldingDetail(null)}
        />
      )}

      {acctDetail && (
        <AccountDetailSheet
          account={accounts.find((a) => a.id === acctDetail)}
          ipos={ipos}
          transfers={transfers}
          accounts={accounts}
          onClose={() => setAcctDetail(null)}
          onEdit={() => { setAcctSheet({ account: accounts.find((a) => a.id === acctDetail) }); }}
          onDelete={(id) => {
            const gone = accounts.find((x) => x.id === id);
            if (!gone) return;
            discard("account", gone, gone.name || "Unnamed account");
            const goneName = accounts.find((x) => x.id === id)?.name || "";
            if (goneName) {
              persistIpos(ipos.map((i) => {
                const apps = i.applications || [];
                if (!apps.some((a) => a.accountId === id && !a.accountName)) return i;
                return { ...i, applications: apps.map((a) => (a.accountId === id && !a.accountName ? { ...a, accountName: goneName } : a)) };
              }));
            }
            persistAccounts(accounts.filter((x) => x.id !== id));
            setAcctDetail(null);
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
          onDelete={(id) => {
            const gone = transfers.find((x) => x.id === id);
            if (!gone) return;
            const who = (aid) => accounts.find((a) => a.id === aid)?.name || "Unknown";
            discard("transfer", gone, `${inr(gone.amount)} · ${who(gone.fromAccountId)} to ${who(gone.toAccountId)}`);
            persistTransfers(transfers.filter((x) => x.id !== id));
          }}
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
          session={session}
          cloudOn={cloudEnabled()}
          syncing={syncing}
          syncError={syncError}
          lastSync={lastSync}
          onClose={() => setDataSheetOpen(false)}
          onSyncNow={syncNow}
          pricing={pricing}
          priceInfo={priceInfo}
          onRefreshPrices={refreshPrices}
          onSignOut={async () => {
            setDataSheetOpen(false);
            await cloudSignOut();
            // Batch all clearing into one update, skip the resulting auto-sync
            skipNextAutoSync.current = true;
            TABLES.forEach((k) => saveTable(k, []));
            try { localStorage.removeItem(STORAGE_PREFIX + "owner"); } catch {}
            // Don't clear React state — cloudSignOut sets userId to null which
            // triggers the initial load effect to re-run with empty local data.
            // Clearing state here races with auto-sync.
          }}
        />
      )}
    </div>
  );
}


/* A block standing in for something not here yet. Breathing rather than
   sliding: a shimmer sweeping across a phone is a lot of movement to look at
   for something that is only going to be replaced. */
function Bone({ w = "100%", h = 12, r = 6, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r, background: COLORS.border,
      animation: "ledgerPulse 1.4s ease-in-out infinite", ...style,
    }} />
  );
}

/* The first load on a new device has nothing cached to draw, and a blank page
   for the length of a network round trip reads as a broken app. This is the
   same furniture the ledger has, in the shape of the screen you are about to
   land on - so what arrives fills a layout that was already there instead of
   replacing a white one. */
function LedgerSkeleton({ text, tab = "dashboard" }) {
  const titles = {
    dashboard: "Overview", ipos: "IPOs", transfers: "Transfers", accounts: "Accounts",
  };
  const items = [
    { id: "dashboard", label: "Overview" }, { id: "ipos", label: "IPOs" },
    { id: "transfers", label: "Transfers" }, { id: "accounts", label: "Accounts" },
  ];
  // Overview leads with figures; the other three lead with a search and filters.
  const isDashboard = tab === "dashboard";
  // A transfer is a two-line row; an IPO or an account is a card with a bar.
  const rowsOnly = tab === "transfers";

  return (
    <div style={{
      minHeight: "100dvh", background: COLORS.bg, fontFamily: "Inter, sans-serif",
      maxWidth: 520, margin: "0 auto", position: "relative",
      paddingBottom: "calc(78px + env(safe-area-inset-bottom))",
    }}>
      <style>{FONT_IMPORT}</style>
      <style>{`@keyframes ledgerPulse { 0%,100% { opacity: .45 } 50% { opacity: .85 } }`}</style>

      <div style={{
        background: COLORS.navyDeep,
        padding: "calc(18px + env(safe-area-inset-top)) 14px 14px",
        borderBottom: `3px double ${COLORS.gold}`,
      }}>
        {/* Title only, the same as the real header, or the two would differ in
            height and the ledger would jump into place as it arrived. What is
            being waited for is said below instead. */}
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 21, color: "#fff", minHeight: 36, display: "flex", alignItems: "center" }}>
          {titles[tab] || "Overview"}
        </div>
      </div>

      <div style={{ padding: 14 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: COLORS.gold,
          letterSpacing: 0.5, marginBottom: 14,
        }}>{text}</div>
        {isDashboard ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{
                  background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                  borderRadius: 12, padding: "14px 12px",
                }}>
                  <Bone w={18} h={18} r={5} />
                  <Bone w="72%" h={20} style={{ marginTop: 10 }} />
                  <Bone w="52%" h={10} style={{ marginTop: 8 }} />
                </div>
              ))}
            </div>
            <Bone w={110} h={11} style={{ marginBottom: 10 }} />
          </>
        ) : (
          <>
            <Bone h={44} r={8} style={{ marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <Bone h={36} r={8} />
              <Bone h={36} r={8} />
            </div>
          </>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{
              background: COLORS.surface, border: `1px solid ${COLORS.border}`,
              borderRadius: 12, display: "flex", overflow: "hidden",
            }}>
              {!rowsOnly && <div style={{ width: 8, background: COLORS.border, flexShrink: 0 }} />}
              <div style={{ padding: rowsOnly ? "10px 12px" : "12px 14px", flex: 1 }}>
                <Bone w="62%" h={15} />
                <Bone w="80%" h={10} style={{ marginTop: 7 }} />
                {!rowsOnly && <Bone w={72} h={16} r={8} style={{ marginTop: 9 }} />}
                {!rowsOnly && <Bone h={5} r={3} style={{ marginTop: 10 }} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 520, background: COLORS.navyDeep,
        display: "flex", justifyContent: "space-around",
        padding: "10px 6px calc(14px + env(safe-area-inset-bottom))",
        borderTop: `1px solid ${COLORS.navy}`,
      }}>
        {items.map(({ id, label }) => {
          const active = id === tab;
          return (
            <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 10px" }}>
              <div style={{
                width: 20, height: 20, borderRadius: 5,
                background: active ? COLORS.gold : COLORS.navy, opacity: active ? 0.8 : 0.35,
              }} />
              <span style={{ fontSize: 10, color: active ? COLORS.gold : "#8592A6", fontWeight: active ? 700 : 500 }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   CHROME
---------------------------------------------------------- */
function Header({ tab, onAdd, onOpenData, onFetchLive, syncing, pricing, syncError, cloudOn }) {
  /* The same word the bottom nav uses, on every screen. The app's own name is
     on the home screen icon and in the manifest, which is where a name belongs;
     spending a line of the header on it made Overview taller than the other
     three, and the extra height showed as a jolt when the screens slid. */
  const titles = { dashboard: "Overview", ipos: "IPOs", accounts: "Accounts", transfers: "Transfers" };
  const showAdd = tab !== "dashboard";
  const statusColor = !cloudOn ? COLORS.inkSoft : syncError ? COLORS.red : COLORS.gold;
  /* Fetching prices is work the same as syncing is, and it is the only sign
     that a pull to refresh is still going once the indicator has gone up. */
  const busy = syncing || pricing;
  const StatusIcon = busy ? Loader2 : !cloudOn ? CloudOff : Settings;
  return (
    <div style={{
      background: COLORS.navyDeep,
      padding: "calc(18px + env(safe-area-inset-top)) 14px 14px",
      position: "relative", zIndex: 10, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap",
      rowGap: 10, columnGap: 8, borderBottom: `3px double ${COLORS.gold}`,
    }}>
      <div style={{ minWidth: 0, flexShrink: 1 }}>
        {/* Keyed by tab so the node is replaced when the screen changes, which
            replays the fade. Everything below the header slides; a title that
            simply cut from one word to the next was the one thing that did not. */}
        <div key={tab} className="ledger-title" style={{
          fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 21, color: "#fff",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{titles[tab]}</div>
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
        {/* Add comes first and sync last, so the one button that is on every
            screen keeps the same corner. With them the other way round, sync
            slid sideways whenever Overview dropped the add button. */}
        {showAdd && (
          <button onClick={onAdd} aria-label="Add" style={{
            width: 36, height: 36, borderRadius: 18, border: `1px solid ${COLORS.gold}`,
            background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}><Plus size={18} color={COLORS.gold} /></button>
        )}
        <button
          onClick={onOpenData}
          aria-label="Sync and data"
          title={syncing ? "Syncing..." : pricing ? "Updating prices..." : !cloudOn ? "Cloud sync is off" : syncError ? "Sync problem" : "Synced"}
          style={{
            width: 36, height: 36, borderRadius: 18, border: `1px solid ${statusColor}`,
            background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          <StatusIcon size={17} color={statusColor} className={busy ? "spin" : undefined} />
        </button>
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab, onReselect }) {
  const items = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "ipos", label: "IPOs", icon: Receipt },
    { id: "transfers", label: "Transfers", icon: ArrowRightLeft },
    { id: "accounts", label: "Accounts", icon: Users },
  ];
  return (
    <div style={{
      position: "relative", flexShrink: 0,
      width: "100%", maxWidth: 520, background: COLORS.navyDeep,
      display: "flex", justifyContent: "space-around",
      padding: "10px 6px calc(14px + env(safe-area-inset-bottom))",
      borderTop: `1px solid ${COLORS.navy}`, zIndex: 20,
    }}>
      {items.map(({ id, label, icon: Icon }) => {
        const active = tab === id;
        return (
          <button key={id} aria-current={active ? "page" : undefined} onClick={() => (active ? onReselect && onReselect() : setTab(id))} style={{
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
function Dashboard({ stats, ipos, accounts, published = [], onOpenIpo, onOpenHolding }) {
  const holding = ipos.filter((ipo) =>
    (ipo.applications || []).some((a) =>
      (a.allotmentStatus === "Allotted" || a.allotmentStatus === "Partial") && !a.sold
    )
  ).sort((a, b) => (b.listingDate || b.closeDate || b.applicationDate || "").localeCompare(a.listingDate || a.closeDate || a.applicationDate || ""));
  // Figures below are derived from price and lot size; say so when some are absent
  // rather than quietly reporting a total that leaves money out.
  const incomplete = ipos.filter((i) => (i.applications || []).length && missingIpoFields(i).length);
  const marked = ipos.some((i) => isMarkedToMarket(i));

  /* The ledger already works out when each thing happens; this is simply the
     part of it that concerns today. Without it the dates are only ever found by
     opening an IPO, which is the wrong way round - the point of knowing the
     allotment date is to be told on the day. */
  const today = todayISO();
  const todo = useMemo(() => {
    const closing = [];
    const allotting = [];
    const listing = [];
    const ready = ipos.filter((i) => published.includes(i.id));
    ipos.forEach((i) => {
      if (i.closeDate && i.closeDate === today) closing.push(i);
      if (awaitingAllotmentEntry(i)) allotting.push(i);
      const lists = i.listingDate || listingDateOf(i).date;
      if (lists && lists === today) listing.push(i);
    });
    return { closing, allotting, listing, ready };
  }, [ipos, today, published]);

  const lines = [
    /* First, because it is the only one of these that has just become true and
       can be acted on immediately - the registrar has the answer now. */
    todo.ready.length && {
      key: "ready",
      text: `Allotment is out for ${todo.ready.length === 1 ? "1 issue" : todo.ready.length + " issues"}`,
      detail: todo.ready.map((i) => i.company).join(", "),
      tone: COLORS.green,
    },
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
        <StatCard label="Capital Deployed" value={inrShort(stats.invested)} full={inr(stats.invested)} icon={Landmark} tone="navy" />
        <StatCard label="Realized Gain" value={inrShort(stats.realized)} full={inr(stats.realized)} icon={stats.realized >= 0 ? TrendingUp : TrendingDown} tone={stats.realized >= 0 ? "green" : "red"} />
        <StatCard label={marked ? "Unrealized (at today's price)" : "Unrealized (at listing)"} value={inrShort(stats.unrealized)} full={inr(stats.unrealized)} icon={stats.unrealized >= 0 ? TrendingUp : TrendingDown} tone={stats.unrealized >= 0 ? "green" : "red"} warning={stats.missingLtp > 0 ? `${stats.missingLtp} listed holding${stats.missingLtp === 1 ? "" : "s"} without a current price -- refresh to update` : ""} />
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
            "Needs details" filter.
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

      <SectionLabel>Currently Holding</SectionLabel>
      {holding.length === 0 ? (
        <EmptyState text={ipos.length === 0 ? "No IPOs logged yet. Tap the IPOs tab to add your first application." : "No active holdings."} icon={Receipt} subtitle={ipos.length === 0 ? "Your family IPO register starts here." : ""} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {holding.map((ipo) => {
            const entryPrice = Number(ipo.priceBand) || 0;
            const currentPrice = Number(ipo.currentPrice) || Number(ipo.listingPrice) || 0;
            const lotSize = Number(ipo.lotSize) || 1;
            const totalLots = (ipo.applications || []).reduce((s, a) =>
              (a.allotmentStatus === "Allotted" || a.allotmentStatus === "Partial") && !a.sold
                ? s + (Math.round((Number(a.sharesAllotted) || 0) / lotSize) || 1) : s, 0);
            const totalShares = (ipo.applications || []).reduce((s, a) =>
              (a.allotmentStatus === "Allotted" || a.allotmentStatus === "Partial") && !a.sold
                ? s + (Number(a.sharesAllotted) || 0) : s, 0);
            const investedValue = totalShares * entryPrice;
            const currentValue = currentPrice > 0 ? totalShares * currentPrice : 0;
            const pnl = currentPrice > 0 ? currentValue - investedValue : 0;
            const pnlPct = investedValue > 0 && currentPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : null;
            const isUp = pnl >= 0;
            return (
              <div key={ipo.id} onClick={() => onOpenHolding(ipo.id)} style={{
                background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10,
                padding: "10px 12px", cursor: "pointer",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 14, color: COLORS.heading, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ipo.company}
                  </div>
                  {currentPrice > 0 ? (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: isUp ? COLORS.green : COLORS.red, flexShrink: 0 }}>
                      {isUp ? "+" : ""}{inr(pnl)}
                    </span>
                  ) : (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: COLORS.inkSoft, flexShrink: 0 }}>
                      {inr(investedValue)}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: COLORS.inkSoft }}>
                  <span>₹{entryPrice} {currentPrice > 0 ? `→ ₹${currentPrice}` : ""} · {totalLots} lot{totalLots === 1 ? "" : "s"}</span>
                  {pnlPct !== null && (
                    <span style={{ color: isUp ? COLORS.green : COLORS.red, fontWeight: 600 }}>
                      {isUp ? "+" : ""}{pnlPct.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, full, icon: Icon, tone, warning }) {
  const toneColor = { navy: COLORS.navy, green: COLORS.green, red: COLORS.red, gold: COLORS.gold }[tone];
  return (
    <div style={{
      background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12,
      padding: "14px 14px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: toneColor }} />
      <Icon size={16} color={toneColor} style={{ marginBottom: 8 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span title={full || undefined} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: COLORS.ink, whiteSpace: "nowrap" }}>{value}</span>
        {warning && <span title={warning} style={{ cursor: "help", fontSize: 14 }}>&#9888;</span>}
      </div>
      <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15, color: COLORS.heading,
      marginBottom: 10, display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ width: 14, height: 2, background: COLORS.gold, display: "inline-block" }} />
      {children}
    </div>
  );
}

function EmptyState({ text, icon: Icon, subtitle }) {
  return (
    <div style={{
      border: `1px dashed ${COLORS.border}`, borderRadius: 12, padding: "30px 18px",
      textAlign: "center", color: COLORS.inkSoft, fontSize: 13.5, background: COLORS.surface,
    }}>
      {Icon && (
        <div style={{ marginBottom: 10, opacity: 0.5 }}>
          <Icon size={28} color={COLORS.inkSoft} />
        </div>
      )}
      <div>{text}</div>
      {subtitle && (
        <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 6, opacity: 0.7 }}>{subtitle}</div>
      )}
    </div>
  );
}

/* One cell in the 2x2 date grid on the IPO detail sheet. Label and value are
   always in the same place, so the eye doesn't have to re-find each date
   depending on which ones exist. */
function DateCell({ label, value }) {
  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 600, color: COLORS.inkSoft,
        textTransform: "uppercase", letterSpacing: 0.5,
        fontFamily: "Inter, sans-serif", marginBottom: 2,
      }}>{label}</div>
      <div style={{
        fontSize: 13, fontWeight: 500, color: COLORS.ink,
        fontFamily: "'JetBrains Mono', monospace",
      }}>{value}</div>
    </div>
  );
}




/* Boards are not mutually exclusive - you may want one, or both. Turning the
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
              border: `1px solid ${on ? COLORS.action : COLORS.border}`,
              background: on ? COLORS.action : COLORS.surface,
              color: on ? COLORS.onAction : COLORS.inkSoft,
              borderRadius: 999, padding: "7px 11px", minHeight: 24,
              fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, 
              whiteSpace: "nowrap", cursor: last ? "default" : "pointer",
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
/* Filtering and sorting live behind one control beside the search rather than
   two selects taking a row of their own. A list is mostly read, not filtered,
   so the row that is always there is the one you always use - and the panel
   has room to let you pick several filters at once, which a select never did. */
function ListControls({ search, setSearch, placeholder, filters, filter, setFilter, sorts, sort, setSort, boards, board, toggleBoard }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  // Back closes this before it closes anything underneath it.
  useBackLayer(open, () => setOpen(false));

  // Clicking away closes it, as a panel like this should.
  useEffect(() => {
    if (!open) return;
    const away = (e) => {
      if (panelRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const chosen = Array.isArray(filter) ? filter : [];
  const sortLabel = (sorts.find((x) => x.id === sort) || {}).label || "";
  // "All" is the absence of a filter, so it is not something narrowing you to.
  const narrowed = chosen.length;
  const hasFilters = Array.isArray(filters) && filters.length > 0;

  const toggleFilter = (id) => {
    if (!setFilter) return;
    setFilter(chosen.includes(id) ? chosen.filter((f) => f !== id) : [...chosen, id]);
  };

  return (
    <div style={{ marginBottom: 12, position: "relative" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: boardIsWorthAsking(boards) ? 8 : 0 }}>
        <div style={{ position: "relative", flex: "1 1 0", minWidth: 0 }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", display: "flex", pointerEvents: "none" }}>
            <Search size={15} color={COLORS.inkSoft} />
          </span>
          <Input
            type="search"
            /* So the phone offers a search key that closes the keyboard, and
               does not try to autocorrect or capitalise a company name. */
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            style={{ paddingLeft: 34, paddingRight: search ? 34 : 12 }}
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search" style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", padding: 4, cursor: "pointer", display: "flex",
            }}><X size={14} color={COLORS.inkSoft} /></button>
          )}
        </div>

        <button
          ref={buttonRef}
          onClick={() => setOpen((v) => !v)}
          aria-label="Filter and sort"
          aria-expanded={open}
          style={{
            position: "relative", width: 44, height: 44, flexShrink: 0,
            borderRadius: 8, cursor: "pointer",
            border: `1px solid ${narrowed || open ? COLORS.navy : COLORS.border}`,
            background: narrowed ? COLORS.navy : COLORS.field,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <SlidersHorizontal size={17} color={narrowed ? COLORS.surface : COLORS.inkSoft} />
          {narrowed > 0 && (
            <span style={{
              position: "absolute", top: -5, right: -5, minWidth: 17, height: 17, borderRadius: 9,
              background: COLORS.gold, color: COLORS.navyDeep, fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'JetBrains Mono', monospace", padding: "0 4px",
            }}>{narrowed}</span>
          )}
        </button>
      </div>

      {boardIsWorthAsking(boards) && (
        <BoardToggles options={boards} selected={board} onToggle={toggleBoard} />
      )}

      {open && (
        <div
          ref={panelRef}
          style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 30,
            width: "min(300px, 100%)", background: COLORS.surface,
            border: `1px solid ${COLORS.border}`, borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.28)", padding: 12,
          }}
        >
          {hasFilters && (<>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <SectionLabel>Show</SectionLabel>
            {narrowed > 0 && (
              <button
                onClick={() => setFilter([])}
                style={{ ...chipBase, padding: "4px 9px", fontSize: 11 }}
              >Clear</button>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {filters.map((f) => {
              const on = chosen.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggleFilter(f.id)}
                  aria-pressed={on}
                  style={{ ...chipBase, padding: "6px 10px", ...(on ? chipOn : null) }}
                >
                  {f.label}{f.count != null ? ` ${f.count}` : ""}
                </button>
              );
            })}
          </div>
          </>)}

          <SectionLabel>Order</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 6 }}>
            {sorts.map((o) => {
              const on = o.id === sort;
              return (
                <button
                  key={o.id}
                  onClick={() => { setSort(o.id); setOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", textAlign: "left", cursor: "pointer",
                    background: "transparent", border: 0, padding: "8px 6px", borderRadius: 6,
                    fontFamily: "Inter, sans-serif", fontSize: 13,
                    color: on ? COLORS.ink : COLORS.inkSoft, fontWeight: on ? 700 : 500,
                  }}
                >
                  {o.label}
                  {on && <Check size={14} color={COLORS.navy} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function IpoList({ ipos, accounts, onOpen }) {
  const [search, setSearch] = useState("");
  /* No filters chosen means everything, so there is no "All" to select - an
     empty selection is what All meant. Several may be on at once. */
  const [filter, setFilter] = useState([]);
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
    const c = { all: onBoard.length, pending: 0, allotted: 0, rejected: 0, incomplete: 0, listed: 0, open: 0 };
    const today = todayISO();
    onBoard.forEach((i) => {
      const b = ipoBucket(i);
      if (c[b] != null) c[b]++;
      if (missingIpoFields(i).length) c.incomplete++;
      if (hasListed(i)) c.listed++;
      const openD = i.openDate || "";
      const closeD = i.closeDate || "";
      if (openD && openD <= today && (!closeD || closeD >= today)) c.open++;
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
        if (!filter.length) return true;
        // Any of the chosen filters, not all of them: they name kinds, not tests.
        return filter.some((f) => {
          if (f === "incomplete") return missingIpoFields(i).length > 0;
          if (f === "listed") return hasListed(i);
          if (f === "open") {
            const today = todayISO();
            const openD = i.openDate || "";
            const closeD = i.closeDate || "";
            return openD && openD <= today && (!closeD || closeD >= today);
          }
          return ipoBucket(i) === f;
        });
      })
      .sort(cmp);
  }, [onBoard, search, filter, sort]);

  if (ipos.length === 0) return <EmptyState text="No IPOs yet. Use 'Add from exchange' above to sync IPOs." icon={Receipt} subtitle="Track applications, allotments and returns across your family." />;

  return (
    <div>
      <ListControls
        search={search} setSearch={setSearch} placeholder="Search company or symbol"
        filter={filter} setFilter={setFilter}
        filters={[
          ...(counts.open ? [{ id: "open", label: "Open now", count: counts.open }] : []),
          { id: "pending", label: "Pending", count: counts.pending },
          { id: "allotted", label: "Allotted", count: counts.allotted },
          { id: "rejected", label: "Not allotted", count: counts.rejected },
          { id: "listed", label: "Listed", count: counts.listed },
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
          { id: "company", label: "A-Z" },
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
              />
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
   not recognisably SME is treated as mainboard - the same assumption the rest
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

/* Deleting an account deliberately leaves its applications on their IPOs - the
   money was applied and the totals still count it - but the name went with the
   account, and every one of those rows then read "Unknown". The name is copied
   onto the applications as the account goes, so they can still say whose they
   were. Anything from before this keeps saying Unknown, which is the truth
   about it. */
const accountLabel = (accounts, app) => {
  const live = accounts.find((a) => a.id === app?.accountId);
  if (live) return live.name || "Unnamed account";
  return app?.accountName ? app.accountName + " (deleted)" : "Unknown account";
};

/* Worth offering only once the registrar could plausibly have an answer. They
   publish on the evening of allotment day, so the day itself is the earliest
   there is any point asking - and before that the sheet could only ever say
   it was not listed, which reads as a fault rather than as "too early". */
function allotmentCheckable(ipo) {
  if (!(ipo?.applications || []).length) return false;
  const { date } = allotmentDateOf(ipo);
  return !!date && date <= todayISO();
}

/* Registrars write themselves out at full legal length. The short name is what
   anyone actually calls them, and it is what the allotment check reports back,
   so the two agree. An unrecognised one is shown as it came. */
const REGISTRAR_NAMES = [
  [/kfin/i, "KFintech"], [/mufg|link\s*intime|mpms/i, "MUFG Intime"],
  [/bigshare/i, "Bigshare"], [/cameo/i, "Cameo"], [/skyline/i, "Skyline"],
  [/maashitla/i, "Maashitla"], [/purva/i, "Purva Sharegistry"],
  [/integrated/i, "Integrated Registry"], [/\bmas\b/i, "MAS Services"],
];
const registrarLabel = (name) => {
  const hit = REGISTRAR_NAMES.find(([re]) => re.test(String(name || "")));
  return hit ? hit[1] : String(name || "");
};
// The two that answer without a captcha - see api/allotment.js.
const registrarReachable = (name) => /kfin|mufg|link\s*intime|mpms/i.test(String(name || ""));

/* One PAN may submit only one application per IPO - a duplicate gets every
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
      display: "flex", height: 3, borderRadius: 3, overflow: "hidden",
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
          pending, they are simply the rest, and "0/8 allotted * 8 rejected"
          says one thing twice. The bar above still shows them in red. */}
      {tally.pending > 0 && <span style={{ color: COLORS.gold }}>{tally.pending} pending</span>}
    </div>
  );
}

function IpoCard({ ipo, accounts, onClick }) {
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
  const priceStale = ipo.priceAsOf && hasListed(ipo) && (Date.now() - Date.parse(ipo.priceAsOf)) > 24 * 3600 * 1000;
  // Spine colour reflects where the IPO is overall, without claiming an outcome.
  const spine = tally.pending ? COLORS.gold : tally.won ? COLORS.green : tally.total ? COLORS.red : COLORS.border;

  return (
    <div style={{
      background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12,
      display: "flex", overflow: "hidden", cursor: "pointer",
    }} onClick={onClick}>
      {/* The narrow rule the stat cards use. An 8px striped band down every card
          turned a list into a colour chart; the state is still there, quietly. */}
      <div style={{ width: 4, backgroundColor: spine, flexShrink: 0, opacity: 1 }} />
      <div style={{ padding: "12px 14px", flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15.5, color: COLORS.heading, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {ipo.company || "Untitled IPO"}
            </div>
            {/* Held to one line: it is a summary, and a summary that wraps has
                stopped being one. Trimmed to earn the room rather than shrunk
                until it fits - "applic." said nothing "apps" does not. */}
            <div style={{
              fontSize: 11, color: COLORS.inkSoft, marginTop: 2, fontFamily: "'JetBrains Mono', monospace",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {ipo.category || "Mainboard"} · {ipo.priceBandLow ? `₹${ipo.priceBandLow}-₹${ipo.priceBand}` : `₹${ipo.priceBand || "--"}`} · {totalLots} lot{totalLots === 1 ? "" : "s"} · {apps.length} app{apps.length === 1 ? "" : "s"}
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
              {apps.some((a) => a.sold) && <Badge color={COLORS.navy} bg={COLORS.chip}>SOLD {apps.filter((a) => a.sold).length}/{tally.allotted}</Badge>}
              {gainPct !== null && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
                  color: gainPct >= 0 ? COLORS.green : COLORS.red,
                  display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap",
                }}>
                  {gainPct >= 0 ? <TrendingUp size={13} color={COLORS.green} /> : <TrendingDown size={13} color={COLORS.red} />}
                  {gainPct.toFixed(1)}% {isMarkedToMarket(ipo) ? "now" : "listing"}
                  {priceStale && <span title="Price is over a day old" style={{ opacity: 0.6 }}> !</span>}
                </span>
              )}
            </div>
          </div>
          <AllotmentBar tally={tally} tone={spine} />
        </div>
      </div>
    </div>
  );
}


/* The list rows are two lines tall, so a 36px control would set their height
   rather than fit inside it. */


function IpoDetailSheet({ ipo, accounts, onClose, onDeleteIpo, onEditIpo, onSaveNote, onAddApplication, onBulkApply, onBulkStatus, onCheckAllotment, onEditApplication, onDeleteApplication }) {
  const confirm = useConfirm();
  if (!ipo) return null;
  const apps = ipo.applications || [];
  const tally = allotmentTally(ipo);
  const conflicts = panConflicts(ipo, accounts);
  const [note, setNote] = useState(() => ipo.remarks || "");
  // The baseline is the last-saved value, so "changed" always means changed
  // from what is actually on record - not just "touched since the sheet
  // opened", which used to leave Save enabled even when nothing was edited.
  const [savedNote, setSavedNote] = useState(() => ipo.remarks || "");
  useEffect(() => { setNote(ipo.remarks || ""); setSavedNote(ipo.remarks || ""); }, [ipo.id, ipo.remarks]);
  const noteDirty = note !== savedNote;
  const saveNote = () => { onSaveNote(ipo.id, note); setSavedNote(note); };

  const allot = allotmentDateOf(ipo);
  const allotValue = allot.date
    ? `${fmtDate(allot.date)}${allot.exact ? "" : " (expected)"}`
    : "--";
  const listExpected = listingDateOf(ipo);
  const listValue = ipo.listingDate
    ? fmtDate(ipo.listingDate)
    : (listExpected.date ? `${fmtDate(listExpected.date)} (expected)` : "--");
  const closeValue = ipo.closeDate
    ? fmtDate(ipo.closeDate)
    : (ipo.applicationDate ? `${fmtDate(ipo.applicationDate)} (applied)` : "--");

  return (
    <Sheet title={ipo.company} onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
          <Badge color={COLORS.navy} bg={COLORS.chip}>{ipo.category || "Mainboard"}</Badge>
          <Badge color={COLORS.inkSoft} bg="#EFEDE7">{ipo.priceBandLow ? `₹${ipo.priceBandLow}-₹${ipo.priceBand}` : `Price ₹${ipo.priceBand || "--"}`}</Badge>
          <Badge color={COLORS.inkSoft} bg="#EFEDE7">Lot {ipo.lotSize || "--"}</Badge>
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
        <button onClick={onEditIpo} aria-label="Edit IPO" style={{ ...roundIconBtn, display: (ipo.fromExchange || ipo.upstoxId || ipo.isin || ipo.symbol) ? "none" : "flex" }}>
          <Pencil size={14} color={COLORS.inkSoft} />
        </button>
      </div>

      {/* A fixed 2x2 matrix rather than a row that wraps: Open/Close and
          Allotment/Listing keep the same position every time, so the eye
          doesn't have to re-find each date depending on which ones exist. */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 14, rowGap: 8, marginBottom: 16,
      }}>
        <DateCell label="Open" value={ipo.openDate ? fmtDate(ipo.openDate) : "--"} />
        <DateCell label="Close" value={closeValue} />
        <DateCell label="Allotment" value={allotValue} />
        <DateCell label="Listing" value={listValue} />
      </div>
      {ipo.registrar && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10,
          marginBottom: 16, fontFamily: "Inter, sans-serif",
        }}>
          <span style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, flexShrink: 0 }}>Registrar</span>
          <span title={ipo.registrar} style={{ fontSize: 12.5, color: COLORS.ink, fontWeight: 600, minWidth: 0, textAlign: "right", ...ellipsisText }}>{registrarLabel(ipo.registrar)}</span>
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel>Note</SectionLabel>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Add a personal note about this IPO" aria-label="IPO note" style={{ ...inputStyle, resize: "vertical", marginTop: 6 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 6 }}>
          <button
            onClick={saveNote}
            disabled={!noteDirty}
            style={{
              ...chipBase, padding: "6px 10px", color: COLORS.navy, fontWeight: 700,
              opacity: noteDirty ? 1 : 0.5, cursor: noteDirty ? "pointer" : "default",
            }}
          >Save note</button>
        </div>
      </div>

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
                {pan} - {names.join(", ")}
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
          <AllotmentBar tally={tally} tone={tally.pending ? COLORS.gold : tally.won ? COLORS.green : COLORS.red} />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => onBulkApply(ipo.id)} style={{
          flex: "1 1 46%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: COLORS.action, color: COLORS.onAction, border: "none", borderRadius: 10,
          padding: "11px 10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
        }}><Layers size={14} color={COLORS.onAction} /> Apply IPO</button>
        <button onClick={() => onBulkStatus(ipo.id)} disabled={!apps.length} style={{
          flex: "1 1 46%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: COLORS.surface, color: apps.length ? COLORS.ink : COLORS.inkSoft,
          border: `1px solid ${COLORS.border}`, borderRadius: 10,
          padding: "11px 10px", fontSize: 12.5, fontWeight: 600,
          cursor: apps.length ? "pointer" : "default", opacity: apps.length ? 1 : 0.6,
        }}><ClipboardCheck size={14} color={apps.length ? COLORS.ink : COLORS.inkSoft} /> Record allotment</button>
        {/* The registrar knows the answer; there is no reason to type it in.
            Shown only once there is something to apply for and a day on which
            an answer could exist - see allotmentCheckable. */}
        {allotmentCheckable(ipo) && (
          <button onClick={() => onCheckAllotment(ipo.id)} style={{
            flex: 1, minHeight: 44, borderRadius: 10, border: `1px solid ${COLORS.gold}`,
            background: COLORS.goldSoft, color: COLORS.ink, fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "Inter, sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}><Sparkles size={14} color={COLORS.gold} /> Check allotment</button>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <SectionLabel>Applications ({apps.length})</SectionLabel>
      </div>

      {apps.length === 0 ? (
        <EmptyState text="No applications yet for this IPO. Use 'Apply IPO' to add one or more at once." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {apps.map((app) => (
            <ApplicationRow key={app.id} app={app} ipo={ipo} accounts={accounts}
              onEdit={() => onEditApplication(ipo.id, app)}
              onDelete={async () => { if (await confirm(`Delete ${accounts.find((a) => a.id === app.accountId)?.name || "this"}'s application?`, { danger: true })) onDeleteApplication(ipo.id, app.id); }} />
          ))}
        </div>
      )}
      <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${COLORS.border}` }}>
        <SectionLabel>IPO actions</SectionLabel>
        <button onClick={async () => { const n=apps.length; const msg=n ? `Delete ${ipo.company || "this IPO"} and its ${n} application${n===1?"":"s"}? This cannot be undone.` : `Delete ${ipo.company || "this IPO entry"}? This cannot be undone.`; if(await confirm(msg, { danger: true })) onDeleteIpo(ipo.id); }} style={{ width: "100%", marginTop: 6, minHeight: 44, borderRadius: 10, border: `1px solid ${COLORS.red}`, background: COLORS.redSoft, color: COLORS.red, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Delete IPO</button>
      </div>
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
  const liveAccount = accounts.find((a) => a.id === app.accountId);
  const accountName = liveAccount?.name;
  const strongStatus = app.allotmentStatus === "Allotted" || app.allotmentStatus === "Not Allotted";
  return (
    <div style={{
      background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "9px 10px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div title={accountLabel(accounts, app)} style={{
            fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14,
            color: liveAccount ? COLORS.ink : COLORS.inkSoft, ...ellipsisText,
          }}>{accountLabel(accounts, app)}</div>
          {app.appliedFor && app.appliedFor !== accountName && (
            <div style={{ fontSize: 11.5, color: COLORS.inkSoft, fontFamily: "Inter, sans-serif" }}>on behalf of {app.appliedFor}</div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <Badge color={meta.color} bg={meta.bg} strong={strongStatus}>{app.allotmentStatus}</Badge>
          <button onClick={onEdit} aria-label="Edit application" style={smallIconBtn}><Pencil size={13} color={COLORS.inkSoft} /></button>
          <button onClick={onDelete} aria-label="Delete application" style={smallIconBtn}><Trash2 size={13} color={COLORS.red} /></button>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
        <span style={{ color: COLORS.inkSoft }}>{app.lots || 0} lot(s) {inrOrDash(app.amountBlocked) !== "--" ? `* ${inrOrDash(app.amountBlocked)} blocked` : ""}</span>
        {pnl !== null && (
          <span style={{ fontWeight: 700, color: pnl >= 0 ? COLORS.green : COLORS.red }}>
            {app.sold ? "P&L " : "Unreal. "}{inr(pnl)}
          </span>
        )}
      </div>
      {app.remarks && <div title={app.remarks} style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4, fontFamily: "Inter, sans-serif", fontStyle: "italic", ...ellipsisText }}>"{app.remarks}"</div>}
    </div>
  );
}

function AccountList({ accounts, ipos, transfers = [], onOpen }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState([]);
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
     against them - so say so first rather than let the ledger quietly acquire
     rows belonging to "Unknown account". */
  const confirmAccountDelete = (acc) => {
    const apps = ipos.reduce(
      (n, i) => n + (i.applications || []).filter((a) => a.accountId === acc.id).length, 0
    );
    const moves = transfers.filter((t) => touchesAccount(t, acc.id)).length;
    if (!apps && !moves) {
      return confirm(`Delete ${acc.name || "this account"}?`);
    }
    const bits = [];
    if (apps) bits.push(`${apps} application${apps === 1 ? "" : "s"}`);
    if (moves) bits.push(`${moves} transfer${moves === 1 ? "" : "s"}`);
    return confirm(
      `${acc.name || "This account"} has ${bits.join(" and ")} on record.\n\n` +
      "Those stay in the ledger but will have no holder against them.\n\nDelete it?"
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
        if (!filter.length) return true;
        return filter.some((f) =>
          f === "nopan" ? !panOf(a) : f === "dup" ? dupPans.has(panOf(a)) : true);
      })
      .sort(cmp);
  }, [accounts, search, filter, sort, stats, dupPans]);

  if (accounts.length === 0) return <EmptyState text="No family accounts added yet. Tap + to add one." icon={Users} subtitle="Add demat accounts for each family member." />;

  return (
    <div>
      <ListControls
        search={search} setSearch={setSearch} placeholder="Search name, relation, bank or PAN"
        filter={filter} setFilter={setFilter}
        filters={[
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
              <div key={acc.id} onClick={() => onOpen(acc.id)} style={{
                background: COLORS.surface, border: `1px solid ${isDup ? COLORS.red : COLORS.border}`,
                borderRadius: 12, padding: "12px 14px", cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15.5, color: COLORS.heading, ...ellipsisText }}>{acc.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2, ...ellipsisText }}>
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
                  {acc.notes && <div title={acc.notes} style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4, fontStyle: "italic", ...ellipsisText }}>{acc.notes}</div>}
                </div>
                <ChevronRight size={14} color={COLORS.inkSoft} style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HoldingDetailSheet({ ipo, accounts, onClose }) {
  if (!ipo) return null;
  const entryPrice = Number(ipo.priceBand) || 0;
  const currentPrice = Number(ipo.currentPrice) || Number(ipo.listingPrice) || 0;
  const lotSize = Number(ipo.lotSize) || 1;
  const holdingApps = (ipo.applications || []).filter((a) =>
    (a.allotmentStatus === "Allotted" || a.allotmentStatus === "Partial") && !a.sold);
  const totalShares = holdingApps.reduce((s, a) => s + (Number(a.sharesAllotted) || 0), 0);
  const totalLots = holdingApps.reduce((s, a) => s + (Math.round((Number(a.sharesAllotted) || 0) / lotSize) || 1), 0);
  const investedValue = totalShares * entryPrice;
  const currentValue = currentPrice > 0 ? totalShares * currentPrice : 0;
  const pnl = currentPrice > 0 ? currentValue - investedValue : 0;
  const pnlPct = investedValue > 0 && currentPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : null;
  const isUp = pnl >= 0;

  return (
    <Sheet title={ipo.company} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: COLORS.ink }}>₹{entryPrice}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: "Inter, sans-serif" }}>Entry Price</div>
        </div>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: currentPrice > 0 ? COLORS.ink : COLORS.inkSoft }}>{currentPrice > 0 ? `₹${currentPrice}` : "--"}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: "Inter, sans-serif" }}>Current Price</div>
        </div>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: COLORS.ink }}>{inr(investedValue)}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: "Inter, sans-serif" }}>Invested</div>
        </div>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: currentPrice > 0 ? (isUp ? COLORS.green : COLORS.red) : COLORS.inkSoft }}>
            {currentPrice > 0 ? `${isUp ? "+" : ""}${inr(pnl)}` : "--"}
          </div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: "Inter, sans-serif" }}>
            P&L{pnlPct !== null ? ` (${isUp ? "+" : ""}${pnlPct.toFixed(1)}%)` : ""}
          </div>
        </div>
      </div>

      <div style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10,
        padding: "10px 12px", marginBottom: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
        display: "flex", justifyContent: "space-between", color: COLORS.inkSoft,
      }}>
        <span>{totalLots} lot{totalLots === 1 ? "" : "s"} · {totalShares} shares</span>
        {currentPrice > 0 && <span style={{ color: COLORS.ink, fontWeight: 700 }}>{inr(currentValue)}</span>}
      </div>

      <SectionLabel>Holding Accounts ({holdingApps.length})</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {holdingApps.map((app) => {
          const accountName = accountLabel(accounts, app);
          const shares = Number(app.sharesAllotted) || 0;
          const lots = Math.round(shares / lotSize) || 1;
          const appPnl = currentPrice > 0 ? shares * (currentPrice - entryPrice) : 0;
          return (
            <div key={app.id} style={{
              background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "9px 10px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13.5, color: COLORS.ink }}>{accountName}</span>
                {currentPrice > 0 && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: appPnl >= 0 ? COLORS.green : COLORS.red }}>
                    {appPnl >= 0 ? "+" : ""}{inr(appPnl)}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: COLORS.inkSoft, marginTop: 3 }}>
                {lots} lot{lots === 1 ? "" : "s"} · {inr(shares * entryPrice)} invested
              </div>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

function AccountDetailSheet({ account, ipos, transfers, accounts, onClose, onEdit, onDelete }) {
  const confirm = useConfirm();
  if (!account) return null;
  const apps = useMemo(() => {
    const list = [];
    ipos.forEach((ipo) => {
      (ipo.applications || []).forEach((app) => {
        if (app.accountId === account.id) list.push({ ...app, ipo });
      });
    });
    return list.sort((a, b) => (b.ipo.applicationDate || b.ipo.openDate || "").localeCompare(a.ipo.applicationDate || a.ipo.openDate || ""));
  }, [account.id, ipos]);

  const totals = useMemo(() => {
    let applied = 0, allotted = 0, invested = 0, realized = 0, unrealized = 0;
    apps.forEach((app) => {
      applied++;
      const price = Number(app.ipo.priceBand) || 0;
      const shares = Number(app.sharesAllotted) || 0;
      if (app.allotmentStatus === "Allotted" || app.allotmentStatus === "Partial") {
        allotted++;
        invested += shares * price;
        if (app.sold) {
          realized += shares * ((Number(app.sellPrice) || 0) - price);
        } else {
          const mark = valuationPrice(app.ipo);
          if (mark) unrealized += shares * (mark - price);
        }
      }
    });
    return { applied, allotted, invested, realized, unrealized };
  }, [apps]);

  const acctTransfers = useMemo(() =>
    transfers.filter((t) => touchesAccount(t, account.id))
      .sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    [account.id, transfers]
  );

  const pan = panOf(account);

  return (
    <Sheet title={account.name} onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Badge color={COLORS.navy} bg={COLORS.chip}>{account.relation || "Self"}</Badge>
          {account.bank && <Badge color={COLORS.inkSoft} bg="#EFEDE7">{account.bank}</Badge>}
          {pan ? <Badge color={COLORS.inkSoft} bg="#EFEDE7">{pan}</Badge> : <Badge color={COLORS.gold} bg={COLORS.goldSoft}>No PAN</Badge>}
        </div>
        <button onClick={onEdit} aria-label="Edit account" style={roundIconBtn}>
          <Pencil size={14} color={COLORS.inkSoft} />
        </button>
      </div>
      {account.notes && (
        <div style={{ fontSize: 12.5, color: COLORS.inkSoft, fontFamily: "Inter, sans-serif", fontStyle: "italic", marginBottom: 14, ...wrapText }}>
          "{account.notes}"
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: COLORS.ink }}>{totals.applied}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: "Inter, sans-serif" }}>Applied</div>
        </div>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: totals.allotted ? COLORS.green : COLORS.ink }}>{totals.allotted}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: "Inter, sans-serif" }}>Allotted</div>
        </div>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: COLORS.ink }}>{inr(totals.invested)}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: "Inter, sans-serif" }}>Invested</div>
        </div>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: (totals.realized + totals.unrealized) >= 0 ? COLORS.green : COLORS.red }}>{inr(totals.realized + totals.unrealized)}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: "Inter, sans-serif" }}>Total P&L</div>
        </div>
      </div>
      <SectionLabel>IPO Applications ({apps.length})</SectionLabel>
      {apps.length === 0 ? (
        <div style={{ marginBottom: 14 }}><EmptyState text="No applications from this account yet." /></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {apps.map((app) => {
            const meta = STATUS_META[app.allotmentStatus] || STATUS_META.Pending;
            const strongStatus = app.allotmentStatus === "Allotted" || app.allotmentStatus === "Not Allotted";
            const price = Number(app.ipo.priceBand) || 0;
            const shares = Number(app.sharesAllotted) || 0;
            let pnl = null;
            if (app.sold) pnl = shares * ((Number(app.sellPrice) || 0) - price);
            else if ((app.allotmentStatus === "Allotted" || app.allotmentStatus === "Partial") && shares) {
              const mark = valuationPrice(app.ipo);
              if (mark) pnl = shares * (mark - price);
            }
            return (
              <div key={app.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "9px 10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13.5, color: COLORS.ink, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {app.ipo.company || "Untitled IPO"}
                  </div>
                  <Badge color={meta.color} bg={meta.bg} strong={strongStatus}>{app.allotmentStatus}</Badge>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5 }}>
                  <span style={{ color: COLORS.inkSoft }}>{app.lots || 0} lot(s){app.sold ? " · Sold" : ""}</span>
                  {pnl !== null && (
                    <span style={{ fontWeight: 700, color: pnl >= 0 ? COLORS.green : COLORS.red }}>
                      {app.sold ? "P&L " : "Unreal. "}{inr(pnl)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {acctTransfers.length > 0 && (
        <>
          <SectionLabel>Fund Transfers ({acctTransfers.length})</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {acctTransfers.map((t) => {
              const nameOf = (id) => accounts.find((a) => a.id === id)?.name || "Unknown";
              const from = nameOf(t.fromAccountId);
              const to = nameOf(t.toAccountId);
/* Three ways an account can appear on a transfer, and the
                 middle one is worth nothing to it either way. Whoever paid is
                 out of pocket and whoever received it owes; the one it was done
                 for is owed the same amount afterwards as before, only by
                 somebody else, so it shows without a sign. */
              const via = nameOf(t.onBehalfOfId);
              const payer = t.fromAccountId === account.id;
              const receiver = t.toAccountId === account.id;
              const bearer = !payer && !receiver && t.onBehalfOfId === account.id;
              const heading = bearer ? `${from} -> ${to}` : payer ? `To ${to}` : `From ${from}`;
              const behalf = !t.onBehalfOfId ? ""
                : bearer ? "on your behalf, settling between them"
                : payer ? `counts against ${via}`
                : `owed to ${via}`;
              return (
                <div key={t.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "8px 10px", fontFamily: "Inter, sans-serif", fontSize: 12.5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ color: COLORS.ink, fontWeight: 600 }}>{heading}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, flexShrink: 0, color: bearer ? COLORS.inkSoft : payer ? COLORS.red : COLORS.green }}>{bearer ? "" : payer ? "-" : "+"}{inrOrDash(t.amount)}</span>
                  </div>
                  <div title={t.remarks || undefined} style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2, ...ellipsisText }}>
                    {fmtDate(t.date)}
                    {behalf ? <span style={{ color: COLORS.gold, fontWeight: 600 }}> · {behalf}</span> : null}
                    {t.remarks ? ` · ${t.remarks}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${COLORS.border}` }}>
        <SectionLabel>Account actions</SectionLabel>
        <button onClick={async () => { const n = apps.length; const msg = n ? `Delete ${account.name || "this account"}? This cannot be undone.` : `Delete ${account.name || "this account"}? This cannot be undone.`; if (await confirm(msg, { danger: true })) onDelete(account.id); }} style={{ width: "100%", marginTop: 6, minHeight: 44, borderRadius: 10, border: `1px solid ${COLORS.red}`, background: COLORS.redSoft, color: COLORS.red, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Delete Account</button>
      </div>
    </Sheet>
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
            color: view === id ? COLORS.surface : COLORS.inkSoft,
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
      transferLegs(t).forEach(([x, y]) => {
        map[x] = (map[x] || 0) + amt;
        map[y] = (map[y] || 0) - amt;
      });
    });
    return accounts.map((a) => ({ id: a.id, name: a.name, net: map[a.id] || 0 }))
      .filter((x) => x.net !== 0)
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [transfers, accounts]);

  const pairwise = useMemo(() => {
    const map = {};
    transfers.forEach((t) => {
      const amt = Number(t.amount) || 0;
      transferLegs(t).forEach(([x, y]) => {
        if (!x || !y || x === y) return;
        const key = x < y ? `${x}|${y}` : `${y}|${x}`;
        const sign = x < y ? 1 : -1;
        map[key] = (map[key] || 0) + sign * amt;
      });
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
        <EmptyState text="Everything is settled - no outstanding balances between accounts." />
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
          const hay = `${name(t.fromAccountId)} ${name(t.toAccountId)} ${t.onBehalfOfId ? name(t.onBehalfOfId) : ""} ${t.remarks || ""} ${ipoName(t.relatedIpoId)} ${(t.relatedIpoIds || []).map(ipoName).join(" ")}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort(cmp);
  }, [transfers, accounts, ipos, search, sort]);

  if (transfers.length === 0) return <EmptyState text="No fund transfers logged yet. Tap + to record one." icon={ArrowRightLeft} subtitle="Track money moved between accounts for IPO applications." />;

  return (
    <div>
      <ListControls
        search={search} setSearch={setSearch} placeholder="Search account, IPO or remark"
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
           date, and the note keeps to a single line - cut where it runs out,
           since the whole of it is in the edit sheet and a card is for finding
           the transfer rather than reading it. */
        <div key={t.id} onClick={() => onEdit(t)} style={{
          background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12,
          padding: "10px 12px", cursor: "pointer",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: COLORS.heading, fontFamily: "'Fraunces', serif", minWidth: 0 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name(t.fromAccountId)}</span>
              <ArrowRightLeft size={13} color={COLORS.gold} style={{ flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name(t.toAccountId)}</span>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: COLORS.ink, flexShrink: 0 }}>{inrOrDash(t.amount)}</span>
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
              {/* Who the money was really for. Kept off the headline, which
                  stays the movement you would find on a bank statement. */}
              {t.onBehalfOfId ? <span style={{ color: COLORS.gold, fontWeight: 600 }}> · for {name(t.onBehalfOfId)}</span> : null}
              {t.remarks ? <span style={{ fontStyle: "italic" }}> · "{t.remarks}"</span> : null}
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
    priceBandLow: "", lotSize: "", listingDate: "", listingPrice: "", remarks: "",
  });
  const [errors, setErrors] = useState({});

  /* Instant validation: runs on every keystroke, clears errors as the user
     fixes them, and shows new ones immediately. The submit handler repeats
     the same checks as a fallback for edge cases (paste, autofill). */
  const validate = (field, value, all) => {
    const v = value; const a = all;
    switch (field) {
      case "company": return !v.trim() ? "Required" : "";
      case "priceBand": {
        if (v === "") return "";
        if (Number(v) <= 0) return "Must be greater than 0";
        if (a.priceBandLow && Number(a.priceBandLow) >= Number(v)) return "Must be greater than low price";
        return "";
      }
      case "priceBandLow": {
        if (v === "") return "";
        if (Number(v) <= 0) return "Must be greater than 0";
        if (a.priceBand && Number(v) >= Number(a.priceBand)) return "Must be less than cutoff price";
        return "";
      }
      case "lotSize": {
        if (v === "") return "";
        if (Number(v) <= 0) return "Must be greater than 0";
        if (!Number.isInteger(Number(v))) return "Must be a whole number";
        return "";
      }
      case "listingPrice": {
        if (v === "") return "";
        if (Number(v) <= 0) return "Must be greater than 0";
        return "";
      }
      default: return "";
    }
  };

  const change = (k) => (e) => {
    const v = e.target.value;
    const next = { ...f, [k]: v };
    setF(next);
    const err = validate(k, v, next);
    // For price fields, cross-validate the counterpart too
    const cross = {};
    if (k === "priceBandLow" && next.priceBand) cross.priceBand = validate("priceBand", next.priceBand, next);
    if (k === "priceBand" && next.priceBandLow) cross.priceBandLow = validate("priceBandLow", next.priceBandLow, next);
    setErrors((prev) => ({ ...prev, [k]: err, ...cross }));
  };

  return (
    <Sheet title={initial ? "Edit IPO" : "New IPO"} onClose={onClose}>
      {!initial && (
        <div style={{
          background: COLORS.goldSoft, display: "flex", alignItems: "flex-start",
          gap: 8, padding: "10px 12px", borderRadius: 10, marginBottom: 14,
          fontSize: 12, color: COLORS.ink, fontFamily: "Inter, sans-serif",
        }}>
          <AlertTriangle size={14} color={COLORS.gold} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Market prices can only sync for IPOs added from the exchange. Use <strong>Add from exchange</strong> in the IPO list header when possible.</span>
        </div>
      )}
      <Field label="Company Name" error={errors.company}><Input value={f.company} onChange={change("company")} placeholder="e.g. Vishal Mega Mart" /></Field>
      <Field label="Category">
        <Select value={f.category} onChange={change("category")}>
          <option>Mainboard</option><option>SME</option>
        </Select>
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Price Band Low (₹)" error={errors.priceBandLow}><Input type="number" inputMode="numeric" value={f.priceBandLow || ""} onChange={change("priceBandLow")} placeholder="e.g. 270" /></Field></div>
        <div style={{ flex: 1 }}><Field label="Cutoff Price (₹)" error={errors.priceBand}><Input type="number" inputMode="numeric" value={f.priceBand} onChange={change("priceBand")} placeholder="e.g. 285" /></Field></div>
      </div>
      <Field label="Lot Size (shares)" error={errors.lotSize}><Input type="number" inputMode="numeric" value={f.lotSize} onChange={change("lotSize")} placeholder="e.g. 52" /></Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <Field label="Open Date" error={errors.openDate}><Input type="date" value={f.openDate || ""} onChange={(e) => {
          const v = e.target.value;
          const bad = v ? isNonTradingDay(v) : false;
          const next = { ...f, openDate: v };
          setF(next);
          const dateErr = bad || "";
          const closeErr = (!bad && v && f.closeDate && f.closeDate < v) ? "Must be on or after open date" : (errors.closeDate === "Must be on or after open date" ? "" : errors.closeDate || "");
          setErrors((prev) => ({ ...prev, openDate: dateErr, closeDate: closeErr }));
        }} /></Field>
        <Field label="Close Date" error={errors.closeDate}><Input type="date" value={f.closeDate || ""} onChange={(e) => {
          const close = e.target.value;
          const bad = close ? isNonTradingDay(close) : false;
          if (bad) { setErrors((prev) => ({ ...prev, closeDate: bad })); setF({ ...f, closeDate: close }); return; }
          const next = { ...f, closeDate: close, applicationDate: close };
          if (close) {
            next.allotmentDate = addClearingDays(close, 1);
            const credit = addClearingDays(next.allotmentDate, 1);
            next.listingDate = addTradingDays(credit, 1);
          } else {
            next.allotmentDate = "";
            next.listingDate = "";
          }
          setF(next);
          const closeErr = (f.openDate && close && close < f.openDate) ? "Must be on or after open date" : "";
          setErrors((prev) => ({ ...prev, closeDate: closeErr }));
        }} /></Field>
        <Field label="Allotment (auto)"><Input type="date" value={f.closeDate ? addClearingDays(f.closeDate, 1) : ""} disabled style={{ background: COLORS.bg, color: COLORS.inkSoft }} /></Field>
        <Field label="Listing (auto)"><Input type="date" value={f.closeDate ? addTradingDays(addClearingDays(addClearingDays(f.closeDate, 1), 1), 1) : ""} disabled style={{ background: COLORS.bg, color: COLORS.inkSoft }} /></Field>
      </div>
      <Field label={f.listingPriceSource === "bse-open" ? "Listing Price - day-one open (from exchange, ₹)" : f.listingPriceSource === "bse-close" ? "Listing Day Close (from exchange, ₹)" : "Listing Price (optional, ₹)"} error={errors.listingPrice}>
        <Input
          type="number" inputMode="numeric" value={f.listingPrice}
          onChange={(e) => { const v = e.target.value; setF({ ...f, listingPrice: v, listingPriceSource: "" }); setErrors((prev) => ({ ...prev, listingPrice: validate("listingPrice", v, f) })); }}
          placeholder="e.g. 340"
        />
      </Field>
      <Field label="Remarks">
        <textarea value={f.remarks} onChange={change("remarks")} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Any notes about this IPO" />
      </Field>
      <PrimaryButton onClick={() => {
        const e = {};
        if (!f.company.trim()) e.company = "Required";
        if (!f.priceBand || Number(f.priceBand) <= 0) e.priceBand = "Must be greater than 0";
        if (f.priceBandLow && Number(f.priceBandLow) <= 0) e.priceBandLow = "Must be greater than 0";
        if (f.priceBandLow && f.priceBand && Number(f.priceBandLow) >= Number(f.priceBand)) e.priceBandLow = "Must be less than cutoff price";
        if (!f.lotSize || Number(f.lotSize) <= 0) e.lotSize = "Must be greater than 0";
        if (f.lotSize && !Number.isInteger(Number(f.lotSize))) e.lotSize = "Must be a whole number";
        if (!f.openDate) e.openDate = "Required";
        else { const bad = isNonTradingDay(f.openDate); if (bad) e.openDate = bad; }
        if (!f.closeDate) e.closeDate = "Required";
        else {
          const bad = isNonTradingDay(f.closeDate); if (bad) e.closeDate = bad;
          if (!bad && f.openDate && f.closeDate < f.openDate) e.closeDate = "Must be on or after open date";
        }
        if (f.listingPrice && Number(f.listingPrice) <= 0) e.listingPrice = "Must be greater than 0";
        if (Object.keys(e).length) return setErrors(e);
        onSave(trimFields({ ...f, id: f.id || uid() }));
      }}>
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
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); if (errors[k]) setErrors((prev) => ({ ...prev, [k]: "" })); };
  const setBool = (k) => (e) => setF({ ...f, [k]: e.target.checked });
  const lotSize = Number(ipo?.lotSize) || 0;

  /* A full allotment is the whole application: lots x lot size. Left blank it
     silently values the holding at nothing - no shares, no capital deployed, no
     gain - so it is filled in the moment the status says allotted, exactly as
     the bulk sheet does. Still editable, for the odd partial. */
  const setStatus = (e) => {
    const allotmentStatus = e.target.value;
    const next = { ...f, allotmentStatus };
    if (allotmentStatus === "Allotted" && lotSize > 0) {
      next.sharesAllotted = String(lotSize * (Number(f.lots) || 1));
    } else if (allotmentStatus === "Not Allotted" || allotmentStatus === "Pending") {
      next.sharesAllotted = "";
    }
    setF(next);
  };

  /* The user only ever tells the ledger how many lots were allotted; the
     share count is arithmetic (lots x lot size), not something to type in
     and get wrong. Read back from sharesAllotted so an existing record still
     shows the right lot count even though only shares were ever stored. */
  const lotsAllottedValue = f.sharesAllotted && lotSize
    ? String(Math.round(Number(f.sharesAllotted) / lotSize))
    : "";
  const setLotsAllotted = (e) => {
    const lots = e.target.value;
    const shares = lotSize && lots !== "" ? String(lotSize * (Number(lots) || 0)) : "";
    setF({ ...f, sharesAllotted: shares });
  };

  return (
    <Sheet title={initial ? "Edit Application" : "New Application"} onClose={onClose}>
      <Field label="Applied From Account" error={errors.accountId}>
        <Select value={f.accountId} onChange={set("accountId")}>
          {accounts.length === 0 && <option value="">Add an account first</option>}
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
      </Field>
      <Field label="Applied For (beneficiary name)">
        <Input value={f.appliedFor} onChange={set("appliedFor")} placeholder="Leave blank if same as account holder" />
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Lots" error={errors.lots}><Input type="number" inputMode="numeric" value={f.lots} onChange={(e) => {
          const lots = e.target.value;
          const next = { ...f, lots };
          if (lotSize > 0 && Number(ipo?.priceBand) > 0) next.amountBlocked = String((Number(lots) || 0) * lotSize * Number(ipo.priceBand));
          setF(next);
          const err = lots === "" ? "" : Number(lots) <= 0 ? "Must be at least 1" : !Number.isInteger(Number(lots)) ? "Must be a whole number" : "";
          setErrors((prev) => ({ ...prev, lots: err }));
        }} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Amount Blocked (₹)">
          <div style={{ ...inputStyle, background: COLORS.bg, color: COLORS.inkSoft, display: "flex", alignItems: "center" }}>
            {f.amountBlocked ? inr(f.amountBlocked) : "--"}
          </div>
        </Field></div>
      </div>
      <Field label="Allotment Status">
        <Select value={f.allotmentStatus} onChange={setStatus}>
          {ALLOTMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </Select>
      </Field>
      {(f.allotmentStatus === "Allotted" || f.allotmentStatus === "Partial") && (
        <Field label="Lots Allotted">
          <Input
            type="number" inputMode="numeric" min="0" value={lotsAllottedValue} onChange={setLotsAllotted}
            placeholder={lotSize ? "" : "Set the IPO's lot size to compute shares"}
          />
        </Field>
      )}
      <Field label="Sold?">
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, minHeight: 44 }}>
          <input type="checkbox" checked={!!f.sold} onChange={setBool("sold")} style={{ width: 18, height: 18 }} /> Shares have been sold
        </label>
      </Field>
      {f.sold && (
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><Field label="Sell Price (₹)" error={errors.sellPrice}><Input type="number" inputMode="numeric" value={f.sellPrice} onChange={(e) => {
            const v = e.target.value; setF({ ...f, sellPrice: v });
            setErrors((prev) => ({ ...prev, sellPrice: v && Number(v) <= 0 ? "Must be greater than 0" : "" }));
          }} /></Field></div>
          <div style={{ flex: 1 }}><Field label="Sell Date"><Input type="date" value={f.sellDate} onChange={set("sellDate")} /></Field></div>
        </div>
      )}
      <Field label="Remarks">
        <textarea value={f.remarks} onChange={set("remarks")} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="e.g. Funds sent by dad, to be returned after listing" />
      </Field>
      <PrimaryButton onClick={() => {
        const e = {};
        if (!f.accountId) e.accountId = "Select an account";
        if (!f.lots || Number(f.lots) <= 0) e.lots = "Must be at least 1";
        if (f.sold && f.sellPrice && Number(f.sellPrice) <= 0) e.sellPrice = "Must be greater than 0";
        if (Object.keys(e).length) return setErrors(e);
        onSave(trimFields({ ...f, id: f.id || uid() }));
      }}>
        {initial ? "Save Changes" : "Add Application"}
      </PrimaryButton>
    </Sheet>
  );
}

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

function AccountFormSheet({ initial, accounts = [], onClose, onSave }) {
  const [f, setF] = useState(initial || { id: undefined, name: "", relation: "", bank: "", pan: "", notes: "" });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); if (errors[k]) setErrors((prev) => ({ ...prev, [k]: "" })); };

  const pan = (f.pan || "").trim().toUpperCase();
  const panShapeBad = pan.length > 0 && !PAN_RE.test(pan);
  const panTakenBy = pan && !panShapeBad
    ? accounts.find((a) => a.id !== f.id && panOf(a) === pan)
    : null;

  return (
    <Sheet title={initial ? "Edit Account" : "New Account"} onClose={onClose}>
      <Field label="Name" error={errors.name}><Input value={f.name} onChange={set("name")} placeholder="e.g. Mom, Dad, Priya Aunty" /></Field>
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
          That does not look like a PAN (five letters, four digits, one letter). Saving anyway is fine - it is only used to catch duplicate applications.
        </div>
      )}
      {panTakenBy && (
        <div style={{ background: COLORS.redSoft, color: COLORS.red, borderRadius: 8, padding: "8px 10px", marginTop: -6, marginBottom: 12, fontSize: 12 }}>
          <strong>{panTakenBy.name}</strong> already uses this PAN. Two accounts on one PAN still count as one applicant.
        </div>
      )}
      <Field label="Notes"><textarea value={f.notes} onChange={set("notes")} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></Field>
      <PrimaryButton onClick={() => {
        if (!f.name) return setErrors({ name: "Name is required" });
        onSave(trimFields({ ...f, pan, id: f.id || uid() }));
      }}>
        {initial ? "Save Changes" : "Add Account"}
      </PrimaryButton>
    </Sheet>
  );
}

function TransferFormSheet({ initial, accounts, ipos, onClose, onSave, onDelete }) {
  const confirm = useConfirm();
  // Backward compat: relatedIpoId (string) → relatedIpoIds (array)
  const initIds = initial?.relatedIpoIds
    ? initial.relatedIpoIds
    : initial?.relatedIpoId ? [initial.relatedIpoId] : [];
  const [f, setF] = useState({
    ...(initial || {
      id: undefined, fromAccountId: accounts[0]?.id || "", toAccountId: accounts[1]?.id || accounts[0]?.id || "",
      amount: "", date: todayISO(), remarks: "", onBehalfOfId: "",
    }),
    onBehalfOfId: initial?.onBehalfOfId || "",
    relatedIpoIds: initIds,
  });
  const change = (k) => (e) => {
    const v = e.target.value;
    const next = { ...f, [k]: v };
    /* Neither end of a transfer can also be the one it was made for - a hop to
       itself is no hop - so picking either drops the name rather than leaving
       the field pointing at a choice it no longer offers. */
    if ((k === "fromAccountId" || k === "toAccountId") && v === next.onBehalfOfId) next.onBehalfOfId = "";
    setF(next);
    const errs = {};
    if (k === "fromAccountId" || k === "toAccountId") {
      const from = k === "fromAccountId" ? v : f.fromAccountId;
      const to = k === "toAccountId" ? v : f.toAccountId;
      errs.toAccountId = (from && to && from === to) ? "Must differ from source" : "";
      if (k === "fromAccountId") errs.fromAccountId = "";
    }
    if (k === "amount") errs.amount = (v && Number(v) <= 0) ? "Must be greater than 0" : "";
    if (k === "date") errs.date = "";
    setErrors((prev) => ({ ...prev, ...errs }));
  };
  const [errors, setErrors] = useState({});
  const [ipoSearch, setIpoSearch] = useState("");

  const ipoMatches = useMemo(() => {
    const q = ipoSearch.trim().toLowerCase();
    const selected = new Set(f.relatedIpoIds);
    const pool = ipos.filter((i) => !selected.has(i.id));
    if (!q) {
      // Show only currently open IPOs by default
      const today = todayISO();
      return pool.filter((i) => {
        const open = i.openDate || "";
        const close = i.closeDate || "";
        return open && open <= today && close && close >= today;
      }).slice(0, 6);
    }
    return pool.filter((i) => (i.company || "").toLowerCase().includes(q)).slice(0, 6);
  }, [ipoSearch, ipos, f.relatedIpoIds]);

  const addIpo = (id) => { setF((prev) => ({ ...prev, relatedIpoIds: [...prev.relatedIpoIds, id] })); setIpoSearch(""); };
  const removeIpo = (id) => { setF((prev) => ({ ...prev, relatedIpoIds: prev.relatedIpoIds.filter((x) => x !== id) })); };
  const ipoNameOf = (id) => ipos.find((i) => i.id === id)?.company || "Unknown IPO";
  const name = (id) => accounts.find((a) => a.id === id)?.name || "";
  // Just the first name in the chain below: three full names do not fit a line,
  // and within one family the first name is the whole of what distinguishes them.
  const firstName = (id) => name(id).trim().split(/s+/)[0] || "";

  return (
    <Sheet title={initial ? "Edit Transfer" : "New Transfer"} onClose={onClose}>
      <Field label="From Account">
        <Select value={f.fromAccountId} onChange={change("fromAccountId")}>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
      </Field>
      <Field label="To Account" error={errors.toAccountId}>
        <Select value={f.toAccountId} onChange={change("toAccountId")}>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
      </Field>
      {/* Whose money it really was. Left blank - which is every transfer that
          was ever recorded before this existed - the sender keeps the claim. */}
      <Field label="On Behalf Of (optional)">
        <Select value={f.onBehalfOfId} onChange={change("onBehalfOfId")}>
          <option value="">Nobody - {name(f.fromAccountId) || "the sender"} is owed this</option>
          {accounts.filter((a) => a.id !== f.fromAccountId && a.id !== f.toAccountId).map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </Select>
        {f.onBehalfOfId && f.onBehalfOfId !== f.fromAccountId && f.onBehalfOfId !== f.toAccountId && (
          <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 6, fontFamily: "Inter, sans-serif" }}>
            Counts as {firstName(f.fromAccountId)} → <strong style={{ color: COLORS.ink }}>{firstName(f.onBehalfOfId)}</strong> → {firstName(f.toAccountId)}
          </div>
        )}
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Amount (₹)" error={errors.amount}><Input type="number" inputMode="numeric" value={f.amount} onChange={change("amount")} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Date" error={errors.date}><Input type="date" value={f.date} onChange={change("date")} /></Field></div>
      </div>
      <Field label="Related IPOs (optional)">
        {f.relatedIpoIds.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
            {f.relatedIpoIds.map((id) => (
              <span key={id} onClick={() => removeIpo(id)} style={{
                background: COLORS.chip, color: COLORS.navy, border: `1px solid ${COLORS.border}`,
                borderRadius: 999, padding: "3px 8px", fontSize: 11, fontWeight: 600,
                fontFamily: "Inter, sans-serif", cursor: "pointer", display: "inline-flex",
                alignItems: "center", gap: 4, maxWidth: "100%",
              }}><span style={{ ...ellipsisText, minWidth: 0 }}>{ipoNameOf(id)}</span> <X size={10} color={COLORS.inkSoft} style={{ flexShrink: 0 }} /></span>
            ))}
          </div>
        )}
        <div style={{ position: "relative" }}>
          <Input
            value={ipoSearch}
            onChange={(e) => setIpoSearch(e.target.value)}
            placeholder="Search IPO to link..."
            style={{ paddingRight: ipoSearch ? 34 : 12 }}
          />
          {ipoSearch && (
            <button onClick={() => setIpoSearch("")} aria-label="Clear" style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", padding: 4, cursor: "pointer", display: "flex",
            }}><X size={14} color={COLORS.inkSoft} /></button>
          )}
        </div>
        {ipoMatches.length > 0 && (
          <div style={{
            border: `1px solid ${COLORS.border}`, borderRadius: 8, marginTop: 4,
            background: COLORS.surface, maxHeight: 160, overflowY: "auto",
          }}>
            {ipoMatches.map((i) => (
                <button key={i.id} onClick={() => addIpo(i.id)} style={{
                  display: "block", width: "100%", textAlign: "left", padding: "8px 12px",
                  background: "transparent", border: "none", borderBottom: `1px solid ${COLORS.border}`,
                  fontSize: 13, color: COLORS.ink, fontFamily: "Inter, sans-serif", cursor: "pointer",
                }}>{i.company}</button>
              ))}
          </div>
        )}
        {ipoSearch && ipoMatches.length === 0 && (
          <div style={{ padding: "10px 12px", fontSize: 12, color: COLORS.inkSoft, fontFamily: "Inter, sans-serif" }}>No matching IPOs</div>
        )}
      </Field>
      <Field label="Remarks">
        <textarea value={f.remarks} onChange={change("remarks")} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="e.g. Sent for application, to be returned" />
      </Field>
      <PrimaryButton onClick={() => {
        const e = {};
        if (!f.fromAccountId || !f.toAccountId) e.fromAccountId = "Select both accounts";
        else if (f.fromAccountId === f.toAccountId) e.toAccountId = "Must differ from source";
        if (!f.amount || Number(f.amount) <= 0) e.amount = "Must be greater than 0";
        if (!f.date) e.date = "Required";
        if (Object.keys(e).length) return setErrors(e);
        // Naming either end is the same as naming nobody; store it as nobody.
        const onBehalfOfId =
          (f.onBehalfOfId === f.fromAccountId || f.onBehalfOfId === f.toAccountId) ? "" : f.onBehalfOfId;
        onSave(trimFields({ ...f, onBehalfOfId, relatedIpoId: f.relatedIpoIds[0] || "", id: f.id || uid() }));
      }}>
        {initial ? "Save Changes" : "Add Transfer"}
      </PrimaryButton>
      {initial && onDelete && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.border}` }}>
          <button onClick={async () => { if (await confirm("Delete this transfer? This cannot be undone.", { danger: true })) { onDelete(f.id); onClose(); } }} style={{
            width: "100%", minHeight: 44, borderRadius: 10, border: `1px solid ${COLORS.red}`,
            background: COLORS.redSoft, color: COLORS.red, fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "Inter, sans-serif",
          }}>Delete Transfer</button>
        </div>
      )}
    </Sheet>
  );
}

/* ---------------------------------------------------------
   SYNC & DATA
---------------------------------------------------------- */


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

function DataSheet({ state, session, cloudOn, syncing, syncError, lastSync, onClose, onSyncNow, onSignOut, pricing, priceInfo, onRefreshPrices }) {
  const [notice, setNotice] = useState("");

  const counts = `${state.accounts.length} accounts · ${state.ipos.length} IPOs · ${state.transfers.length} transfers`;

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(buildExport(state));
      setNotice("Copied to clipboard.");
    } catch {
      setNotice("Clipboard blocked - use Download instead.");
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
                  ? "Syncing..."
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
        {/* Which build this actually is. An installed app keeps running the
            bundle it started with however often the site is redeployed, so
            without this there is no way to tell a fixed bug from a stale one
            except by guessing at deployment times. */}
        <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
          build {BUILD_ID}
        </div>
      </div>

      {cloudOn && (
        <PrimaryButton onClick={onSyncNow} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync now"}
        </PrimaryButton>
      )}

      {/* Prices refresh on their own, but a manual pull belongs here: it says
          how fresh the figure is and gives you a way to insist. What it must
          not say is how the matching worked internally - the match count
          could disagree with the price actually shown on a card, which reads
          as a bug even when nothing is wrong. */}
      <div style={{ marginTop: 18 }}>
      <SectionLabel>Market prices</SectionLabel>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{
          flex: 1, minWidth: 0, fontSize: 12, color: priceInfo?.error ? COLORS.red : COLORS.inkSoft,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {priceInfo?.error
            ? priceInfo.error
            : pricing
              ? "Updating market prices..."
              : priceInfo?.asOf
                ? `Prices updated ${priceAge(priceInfo.asOf)}`
                : "Not updated yet"}
        </div>
        <button
          onClick={() => onRefreshPrices().catch(() => {})}
          disabled={pricing}
          style={{
            ...chipBase, flexShrink: 0, color: COLORS.navy, fontWeight: 700,
            opacity: pricing ? 0.6 : 1, cursor: pricing ? "default" : "pointer",
          }}
        >{pricing ? "Updating..." : "Refresh"}</button>
      </div>
      </div>


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
function AuthScreen({ mode, setMode, notice, recoveryToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPw, setConfirmNewPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(notice || "");
  const [info, setInfo] = useState("");
  const [noticeCleared, setNoticeCleared] = useState(false);

  const [recoveryDone, setRecoveryDone] = useState(false);
  const isRecovery = !!recoveryToken && !recoveryDone;

  const validatePassword = (pw) => {
    if (pw.length < 8) return "At least 8 characters";
    if (!/[A-Z]/.test(pw)) return "Include an uppercase letter";
    if (!/[0-9]/.test(pw)) return "Include a number";
    return null;
  };

  const submit = async () => {
    setError(""); setInfo("");
    const trimmed = email.trim();

    if (isRecovery) {
      const pwErr = validatePassword(newPassword);
      if (pwErr) return setError(pwErr);
      if (newPassword !== confirmNewPw) return setError("Passwords don't match.");
      setBusy(true);
      try {
        await cloudUpdatePassword(recoveryToken, newPassword);
        setRecoveryDone(true);
        setInfo("Password updated successfully. Sign in with your new password.");
        setMode("login");
      } catch (e) {
        setError(e.message || "Could not update password.");
      } finally { setBusy(false); }
      return;
    }

    if (mode === "forgot") {
      if (!trimmed) return setError("Enter your email address.");
      setBusy(true);
      try {
        await cloudResetPassword(trimmed);
        setInfo("Check your email for a password reset link.");
        setMode("login");
      } catch (e) {
        setError(e.message || "Could not send reset email.");
      } finally { setBusy(false); }
      return;
    }

    if (!trimmed || !password) return setError("Enter your email and password.");
    if (mode === "signup") {
      const pwErr = validatePassword(password);
      if (pwErr) return setError(pwErr);
      if (password !== confirmPw) return setError("Passwords don't match.");
    }
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setBusy(true);
    try {
      const data = mode === "signup"
        ? await cloudSignUp(trimmed, password)
        : await cloudSignIn(trimmed, password);

      if (!data.access_token) {
        setMode("login");
        setInfo("Account created. Check your email to confirm, then sign in.");
        return;
      }
      setSession(normalizeSession(data));
    } catch (e) {
      setError(e.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const title = isRecovery ? "Set New Password" : mode === "forgot" ? "Reset Password" : mode === "signup" ? "Create Account" : "Sign In";

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
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: COLORS.heading }}>
          The Ledger
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: COLORS.gold,
          letterSpacing: 0.5, marginTop: 2, marginBottom: 20,
        }}>FAMILY IPO REGISTER</div>

        <div style={{ color: COLORS.inkSoft, fontSize: 13.5, marginBottom: 20 }}>
          {isRecovery ? "Enter your new password below."
            : mode === "forgot" ? "Enter your email and we'll send you a reset link."
            : "Sign in to sync your IPOs, applications, accounts and transfers across devices."}
        </div>

        {notice && !isRecovery && !noticeCleared && (
          <div style={{
            background: COLORS.redSoft, border: `1px solid ${COLORS.red}`, borderRadius: 10,
            padding: "12px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            <AlertTriangle size={16} color={COLORS.red} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.red, marginBottom: 4 }}>Link expired or invalid</div>
              <div style={{ fontSize: 12, color: COLORS.ink }}>{notice}</div>
              <button onClick={() => { setMode("forgot"); setError(""); setNoticeCleared(true); }} style={{
                marginTop: 8, background: "none", border: 0, padding: 0, color: COLORS.navy,
                fontWeight: 600, fontSize: 12.5, cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>Request a new reset link</button>
            </div>
          </div>
        )}

        {isRecovery ? (
          <>
            <Field label="New Password">
              <Input type="password" autoComplete="new-password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters, 1 uppercase, 1 number" />
            </Field>
            <Field label="Confirm New Password">
              <Input type="password" autoComplete="new-password" value={confirmNewPw}
                onChange={(e) => setConfirmNewPw(e.target.value)} placeholder="Re-enter your password"
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
            </Field>
          </>
        ) : mode === "forgot" ? (
          <Field label="Email">
            <Input type="email" autoComplete="email" inputMode="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
          </Field>
        ) : (
          <>
            <Field label="Email">
              <Input type="email" autoComplete="email" inputMode="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <Input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 8 chars, 1 uppercase, 1 number" : "Enter your password"}
                onKeyDown={(e) => { if (e.key === "Enter" && mode !== "signup") submit(); }} />
            </Field>
            {mode === "signup" && (
              <Field label="Confirm Password">
                <Input type="password" autoComplete="new-password" value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)} placeholder="Re-enter your password"
                  onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
              </Field>
            )}
          </>
        )}

        {error && (
          <div style={{ background: COLORS.redSoft, color: COLORS.red, borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 13 }}>{error}</div>
        )}
        {info && (
          <div style={{ background: COLORS.greenSoft, color: COLORS.green, borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 13 }}>{info}</div>
        )}

        <PrimaryButton onClick={submit} disabled={busy}>
          {busy ? "Please wait..." : isRecovery ? "Update Password" : mode === "forgot" ? "Send Reset Link" : mode === "signup" ? "Create Account" : "Sign In"}
        </PrimaryButton>

        {!isRecovery && mode !== "forgot" && (
          <button onClick={() => { setMode("forgot"); setError(""); setInfo(""); setNoticeCleared(true); }}
            style={{ width: "100%", border: 0, background: "transparent", marginTop: 8, padding: 8, color: COLORS.inkSoft, fontSize: 12.5, cursor: "pointer" }}>
            Forgot password?
          </button>
        )}

        {!isRecovery && (
          <button
            onClick={() => { setMode(mode === "signup" ? "login" : mode === "forgot" ? "login" : "signup"); setError(""); setInfo(""); setNoticeCleared(true); }}
            style={{ width: "100%", border: 0, background: "transparent", marginTop: 4, padding: 12, color: COLORS.navy, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
            {mode === "signup" ? "Already have an account? Sign in" : mode === "forgot" ? "Back to sign in" : "New here? Create an account"}
          </button>
        )}
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
  const confirm = useConfirm();
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

  const submit = async () => {
    if (!chosen.length) return;
    if (clashes.length && !(await confirm(
      clashes.length + " of the selected accounts share a PAN with another application on this IPO. Duplicate PANs normally get every application rejected. Add them anyway?",
      { confirmLabel: "Add anyway", danger: false }
    ))) return;
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
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15, color: COLORS.heading }}>{ipo.company}</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: COLORS.inkSoft, marginTop: 3 }}>
          {ipo.priceBandLow ? `₹${ipo.priceBandLow}-₹${ipo.priceBand}` : `₹${ipo.priceBand || "--"}`} · lot {ipo.lotSize || "--"} sh
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
                        {blockedFor(ipo, lotsFor(a.id)) ? inr(blockedFor(ipo, lotsFor(a.id))) : "--"}
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
              one application per IPO - a duplicate normally gets every application under it rejected, not just the extra one.
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
  const fullLot = Number(ipo.lotSize) || 0;
  const lotsFromShares = (shares) => (fullLot && shares ? String(Math.round(Number(shares) / fullLot)) : "");

  const [draft, setDraft] = useState(() => {
    const d = {};
    apps.forEach((a) => {
      const status = a.allotmentStatus || "Pending";
      const needsLots = status === "Allotted" || status === "Partial";
      const lots = needsLots
        ? (lotsFromShares(a.sharesAllotted) || (status === "Allotted" ? String(a.lots || 1) : ""))
        : "";
      d[a.id] = { allotmentStatus: status, lotsAllotted: lots };
    });
    return d;
  });

  const nameOf = (id) => accounts.find((a) => a.id === id)?.name || "Unknown account";

  const lotsFor = (app, status, current) => {
    if (status === "Allotted") return String(Number(app.lots) || 1);
    if (status === "Not Allotted" || status === "Pending") return "";
    return current; // Partial: keep whatever is there for the user to correct
  };

  const setAll = (status) => {
    setDraft((d) => {
      const next = { ...d };
      apps.forEach((a) => {
        next[a.id] = { allotmentStatus: status, lotsAllotted: lotsFor(a, status, d[a.id].lotsAllotted) };
      });
      return next;
    });
  };

  const setOne = (app, status) => {
    setDraft((d) => ({
      ...d,
      [app.id]: { allotmentStatus: status, lotsAllotted: lotsFor(app, status, d[app.id].lotsAllotted) },
    }));
  };

  const counts = Object.values(draft).reduce((c, v) => {
    const k = v.allotmentStatus === "Not Allotted" ? "rejected"
      : v.allotmentStatus === "Pending" ? "pending" : "won";
    c[k] = (c[k] || 0) + 1;
    return c;
  }, {});

  /* The user only ever enters lots; the parent still expects sharesAllotted
     on each application record, so that arithmetic happens once, here, on
     save - never as something typed in. */
  const save = () => {
    const out = {};
    Object.entries(draft).forEach(([id, v]) => {
      const lots = Number(v.lotsAllotted) || 0;
      const needsShares = v.allotmentStatus === "Allotted" || v.allotmentStatus === "Partial";
      out[id] = {
        allotmentStatus: v.allotmentStatus,
        sharesAllotted: needsShares && fullLot && lots ? String(lots * fullLot) : "",
      };
    });
    onSave(out);
  };

  return (
    <Sheet title="Record allotment" onClose={onClose}>
      <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15, color: COLORS.heading, marginBottom: 4 }}>
        {ipo.company}
      </div>
      <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 14 }}>
        {apps.length} application{apps.length === 1 ? "" : "s"}. Set them all at once, then correct the exceptions.
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {["Pending", "Allotted", "Not Allotted"].map((s) => (
          <button key={s} onClick={() => setAll(s)} style={{ ...chipBase }}>All: {s}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {apps.map((app) => {
          const d = draft[app.id];
          const meta = STATUS_META[d.allotmentStatus] || STATUS_META.Pending;
          const needsLots = d.allotmentStatus === "Allotted" || d.allotmentStatus === "Partial";
          return (
            <div key={app.id} style={{
              background: COLORS.surface, border: `1px solid ${COLORS.border}`,
              borderLeft: `3px solid ${meta.color}`, borderRadius: 10, padding: "10px 12px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div title={accountLabel(accounts, app)} style={{ fontWeight: 600, fontSize: 14, color: COLORS.ink, ...ellipsisText }}>{accountLabel(accounts, app)}</div>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
                    {app.lots || 0} lot(s) applied · {inrOrDash(app.amountBlocked)}
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
              {needsLots && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: COLORS.inkSoft }}>Lots allotted</span>
                  <input
                    type="number" inputMode="numeric" min="0" value={d.lotsAllotted}
                    onChange={(e) => setDraft((x) => ({ ...x, [app.id]: { ...x[app.id], lotsAllotted: e.target.value } }))}
                    aria-label={`Lots allotted for ${nameOf(app.accountId)}`}
                    style={{ ...inputStyle, width: 90, minHeight: 38, padding: "6px 8px" }}
                  />
                  {fullLot > 0 && d.lotsAllotted !== "" && (
                    <span style={{ fontSize: 11, color: COLORS.inkSoft }}>= {Number(d.lotsAllotted) * fullLot} sh</span>
                  )}
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
        <PrimaryButton onClick={save}>Save all {apps.length}</PrimaryButton>
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
/* What the registrar says, account by account.

   The exchanges hold only the bids routed through their own platform, and which
   one a bid took is the broker's choice, made invisibly - so asking there misses
   applications without ever saying it missed them. The registrar has the whole
   issue. Two of the three answer directly; an issue registered with the third,
   or one too old to still be on a status page, says which and why.

   Asked one account at a time and shown as each answers, rather than held back
   until all of them have. A dozen accounts take a few seconds, and watching the
   list fill in is the difference between waiting and wondering.

   The registrar's own reply is kept and shown beneath the numbers. A figure that
   looks plausible but is wrong is worse than an error, and the only way to tell
   those apart is to read what was actually said. */
function AllotmentSheet({ ipo, accounts, onClose, onApply }) {
  const [phase, setPhase] = useState("resolving");   // resolving | asking | done | dead
  const [registrar, setRegistrar] = useState(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [raw, setRaw] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [written, setWritten] = useState(0);

  const holders = useMemo(
    () => accounts.filter((a) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panOf(a))),
    [accounts]
  );

  const started = useRef(false);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const ask = async (pans) => {
    const url = "/api/allotment?company=" + encodeURIComponent(ipo.company || "")
      + "&registrar=" + encodeURIComponent(ipo.registrar || "")
      + "&pans=" + encodeURIComponent(pans);
    const res = await fetch(url);
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch { /* raised below */ }
    if (!data) throw Object.assign(new Error("The reply was not JSON."), { raw: { httpStatus: res.status, body: text.slice(0, 600) } });
    if (!res.ok) throw Object.assign(new Error(data.error || ("The server answered " + res.status + ".")), { raw: data });
    return data;
  };

  /* Started on opening. There is nothing to decide before asking, and a button
     that only ever gets pressed once is a button that should not be there. */
  const run = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setError({ title: "You are offline", detail: "The registrar can only be asked with a connection." });
      setPhase("dead");
      return;
    }
    setError(null);
    setWritten(0);
    setPhase("resolving");
    setRows(holders.map((a) => ({ pan: panOf(a), account: a, status: "waiting" })));
    try {
      // Who has it, before troubling anyone about a PAN.
      const head = await ask("");
      if (!alive.current) return;
      setRaw(head);
      if (!head.registrar) {
        setNote(head.note || "");
        setRegistrar(null);
        setPhase("dead");
        return;
      }
      setRegistrar({ id: head.registrar, label: head.registrar === "kfintech" ? "KFintech" : "MUFG Intime", listedAs: head.listedAs });
      setPhase("asking");

      /* One PAN per request meant thirteen round trips for a dozen accounts,
         and the round trip - browser to the function and back - cost more than
         the registrar did. Asked four at a time instead: still filling in as
         the answers come, at a quarter of the waiting.

         Asked once per PAN, not once per account. The same person often holds
         two demats, and the registrar's answer is about the PAN, so asking
         twice would only get the same reply twice. */
      const seen = new Set();
      const wanted = [];
      holders.forEach((a) => {
        const pan = panOf(a);
        if (!seen.has(pan)) { seen.add(pan); wanted.push(pan); }
      });

      const settle = (r) =>
        // Every account on that PAN, each keeping its own name.
        setRows((prev) => prev.map((x) => (x.pan === r.pan ? { ...r, account: x.account } : x)));

      const collected = [];
      for (let i = 0; i < wanted.length; i += 4) {
        if (!alive.current) return;
        const group = wanted.slice(i, i + 4);
        try {
          const answer = await ask(group.join(","));
          const byPan = new Map((answer.results || []).map((r) => [r.pan, r]));
          group.forEach((pan) => {
            const r = byPan.get(pan) || { pan, status: "error", message: "no answer for this PAN" };
            collected.push(r);
            settle(r);
          });
        } catch (e) {
          group.forEach((pan) => {
            const r = { pan, status: "error", message: e.message || "could not be checked" };
            collected.push(r);
            settle(r);
          });
        }
      }
      if (!alive.current) return;
      setRaw({ ...head, results: collected });
      setPhase("done");
    } catch (e) {
      if (!alive.current) return;
      setError({ title: "Could not reach the registrar", detail: e.message || "The request did not complete." });
      if (e.raw) setRaw(e.raw);
      setPhase("dead");
    }
  }, [holders, ipo.company, ipo.registrar]);

  useEffect(() => {
    if (started.current || !holders.length) return;
    started.current = true;
    run();
  }, [holders.length, run]);

  const withQty = rows.map((r) => ({
    ...r,
    allotted: (r.bids || []).reduce((n, b) => n + (Number(b.allotted) || 0), 0),
    appliedQty: (r.bids || []).reduce((n, b) => n + (Number(b.applied) || 0), 0),
  }));
  const answered = withQty.filter((r) => r.status !== "waiting");
  const found = withQty.filter((r) => r.status === "found");
  const failed = withQty.filter((r) => r.status === "error");
  const wins = found.filter((r) => r.allotted > 0);

  const heading = phase === "resolving" ? "Finding the registrar..."
    : phase === "asking" ? `Checking ${answered.length} of ${holders.length}`
      + (registrar ? ` · ${registrar.label}` : "")
      : phase === "done" ? `${holders.length} checked` + (registrar ? ` · ${registrar.label}` : "")
        : holders.length + (holders.length === 1 ? " account" : " accounts") + " to check";

  return (
    <Sheet title="Check allotment" onClose={onClose}>
      <div style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12,
        padding: "10px 12px", marginBottom: 14,
      }}>
        <div title={ipo.company} style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15, color: COLORS.heading, ...ellipsisText }}>{ipo.company}</div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: COLORS.inkSoft,
          marginTop: 3, display: "flex", alignItems: "center", gap: 6, ...ellipsisText,
        }}>
          {(phase === "resolving" || phase === "asking") && <Loader2 size={12} color={COLORS.gold} className="spin" />}
          {heading}
        </div>
      </div>

      {holders.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          text="No PANs on file."
          subtitle="The registrar is asked by PAN, so add one to an account first - Accounts, then the account, then edit."
        />
      ) : (
        <>
          {error && (
            <div style={{
              background: COLORS.redSoft, border: `1px solid ${COLORS.red}`, borderRadius: 10,
              padding: "10px 12px", marginBottom: 14, fontSize: 12.5, color: COLORS.ink,
              fontFamily: "Inter, sans-serif",
            }}>
              <div style={{ fontWeight: 700, marginBottom: 3 }}>{error.title}</div>
              <div style={{ color: COLORS.inkSoft, ...wrapText }}>{error.detail}</div>
              <button onClick={run} style={{
                marginTop: 10, minHeight: 36, padding: "0 14px", borderRadius: 8,
                border: `1px solid ${COLORS.red}`, background: "transparent", color: COLORS.red,
                fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>Try again</button>
            </div>
          )}

          {/* Short, because there is nothing to be done about it here. */}
          {!error && phase === "dead" && note && (
            <div style={{
              background: COLORS.goldSoft, borderRadius: 10, padding: "10px 12px", marginBottom: 14,
              fontSize: 12.5, color: COLORS.ink, display: "flex", gap: 8, alignItems: "flex-start",
              fontFamily: "Inter, sans-serif",
            }}>
              <AlertTriangle size={14} color={COLORS.gold} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={wrapText}>{note}</span>
            </div>
          )}

          {rows.length > 0 && phase !== "dead" && (
            <>
              {phase === "done" && (
                <SectionLabel>
                  {wins.length
                    ? `Allotted to ${wins.length} of ${found.length}`
                    : found.length
                      ? `Nothing allotted (${found.length} application${found.length === 1 ? "" : "s"})`
                      : "No applications found"}
                </SectionLabel>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {withQty.map((r) => {
                  const label = r.account?.name || r.name || r.pan;
                  const tone = r.status === "waiting" ? COLORS.border
                    : r.status === "error" ? COLORS.red
                      : r.allotted > 0 ? COLORS.green : COLORS.inkSoft;
                  return (
                    <div key={r.pan} style={{
                      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                      borderLeft: `3px solid ${tone}`, borderRadius: 10, padding: "8px 10px",
                      fontFamily: "Inter, sans-serif", fontSize: 12.5,
                      opacity: r.status === "waiting" ? 0.55 : 1,
                      transition: "opacity 200ms ease-out",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <span title={label} style={{ color: COLORS.ink, fontWeight: 600, minWidth: 0, ...ellipsisText }}>{label}</span>
                        {r.status === "found" && (
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, flexShrink: 0,
                            color: r.allotted > 0 ? COLORS.green : COLORS.inkSoft,
                          }}>{r.allotted > 0 ? `${r.allotted} allotted` : "not allotted"}</span>
                        )}
                        {r.status === "waiting" && <Loader2 size={13} color={COLORS.inkSoft} className="spin" style={{ flexShrink: 0 }} />}
                      </div>
                      <div title={r.message || undefined} style={{
                        fontSize: 11, color: r.status === "error" ? COLORS.red : COLORS.inkSoft,
                        marginTop: 2, fontFamily: "'JetBrains Mono', monospace", ...ellipsisText,
                      }}>
                        {r.status === "waiting" && `${r.pan} · asking...`}
                        {r.status === "found" && `${r.pan} · applied ${r.appliedQty}`}
                        {r.status === "no_application" && `${r.pan} · no application under this PAN`}
                        {r.status === "error" && `${r.pan} · ${r.message || "could not be checked"}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {phase === "done" && failed.length > 0 && (
            <div style={{
              background: COLORS.goldSoft, borderRadius: 10, padding: "9px 12px", marginBottom: 14,
              fontSize: 12, color: COLORS.ink, fontFamily: "Inter, sans-serif", ...wrapText,
            }}>
              {failed.length} could not be checked and {failed.length === 1 ? "is" : "are"} left as
              {failed.length === 1 ? " it was" : " they were"}. Try again rather than reading a blank
              as a rejection.
            </div>
          )}

          {phase === "done" && found.length > 0 && (
            written > 0 ? (
              /* Said plainly. A button that greys out looks like a button that
                 failed, and leaves you wondering whether anything happened. */
              <div style={{
                background: COLORS.greenSoft, border: `1px solid ${COLORS.green}`, borderRadius: 10,
                padding: "10px 12px", fontSize: 12.5, color: COLORS.ink, fontFamily: "Inter, sans-serif",
                display: "flex", gap: 8, alignItems: "center",
              }}>
                <CheckCircle2 size={15} color={COLORS.green} style={{ flexShrink: 0 }} />
                <span style={wrapText}>
                  Written to the ledger - {written} application{written === 1 ? "" : "s"} updated.
                </span>
              </div>
            ) : (
              <PrimaryButton onClick={() => {
                onApply(found.map((r) => ({
                  accountId: r.account?.id, allotted: r.allotted, appliedQty: r.appliedQty,
                })));
                setWritten(found.length);
              }}>
                Write {found.length} result{found.length === 1 ? "" : "s"} to the ledger
              </PrimaryButton>
            )
          )}

          {/* The registrar's own words, for when a number looks wrong. */}
          {raw && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.border}` }}>
              <button onClick={() => setShowRaw((v) => !v)} aria-expanded={showRaw} style={{
                width: "100%", minHeight: 40, borderRadius: 8, border: `1px solid ${COLORS.border}`,
                background: COLORS.surface, color: COLORS.inkSoft, fontSize: 12.5, fontWeight: 600,
                cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex",
                alignItems: "center", justifyContent: "space-between", padding: "0 12px", gap: 8,
              }}>
                <span>Exactly what came back</span>
                <ChevronRight size={14} color={COLORS.inkSoft} style={{
                  flexShrink: 0, transform: showRaw ? "rotate(90deg)" : "none",
                  transition: "transform 150ms ease-out",
                }} />
              </button>
              {showRaw && (
                <pre style={{
                  margin: "8px 0 0", padding: "10px 12px", background: COLORS.field,
                  border: `1px solid ${COLORS.border}`, borderRadius: 8,
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, lineHeight: 1.5,
                  color: COLORS.ink, overflowX: "auto", maxHeight: 340, overflowY: "auto",
                  whiteSpace: "pre", WebkitOverflowScrolling: "touch",
                }}>{JSON.stringify(raw, null, 2)}</pre>
              )}
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}

function LiveIposSheet({ existing, onClose, onImport }) {
  const thisYear = new Date().getFullYear();
  const [mode, setMode] = useState("current");           // "current" · "year"
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
       anything reading them meanwhile - the board counts, for one - would be
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
          note = "Open and forthcoming issues from the exchange.";
        } else {
          /* Only the chosen year, since the feed is cumulative from it. Judged
             on the listing date, or the close date for an issue that has closed
             but not yet listed - those belong to neither the open-and-upcoming
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
                 stands in - otherwise the price arrives empty. */
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
            : "Everything from " + year + ", from BSE - listed, and closed awaiting listing. Lot size and listing price are fetched for what you select.";
        }

        if (mode === "current") {
          /* What is open comes first, then what is coming, then anything that
             has already closed - the order you would work down if you were
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

        // Pre-tick only what is genuinely new, and only for the current view --
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

  /* The list opens on Mainboard, but a year BSE left unlabelled - or a week of
     nothing but SME issues - would then open on an empty screen. */
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
     covers everything, including rows a search has since filtered away - which
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
     comes back without them. Ask for just the selected ones before importing --
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
      fromExchange: true,
      symbol: r.symbol || "",
      isin: r.isin || "",
      company: r.company,
      category: r.category || "Mainboard",
      applicationDate: r.closeDate || "",
      priceBand: r.priceMax != null ? String(r.priceMax) : "",
      priceBandLow: r.priceMin != null ? String(r.priceMin) : "",
      lotSize: r.lotSize != null ? String(r.lotSize) : "",
      openDate: r.openDate || "",
      closeDate: r.closeDate || "",
      allotmentDate: r.allotmentDate || "",
      // Who allots it. Fetched all along and dropped here, which left the
      // allotment check unable to say anything more useful than "not listed".
      registrar: r.registrar || "",
      listingDate: r.listedOn || r.listingDate || "",
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

  const years = [thisYear];

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
            {mode === "current" ? "Asking the exchanges..." : `Fetching ${year} listings...`}
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
              <Input type="search" enterKeyHint="search" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company" style={{ paddingLeft: 34 }} />
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
                      type="checkbox" checked={on} disabled={already}
                      onChange={() => { if (already) return; setPicked((p) => ({ ...p, [r.company]: !p[r.company] })); }}
                      style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "flex-start" }}>
                        <span title={r.company} style={{ fontWeight: 600, fontSize: 14, color: COLORS.ink, minWidth: 0, ...ellipsisText }}>{r.company}</span>
                        {r.category && <Badge color={COLORS.navy} bg={COLORS.chip}>{r.category}</Badge>}
                      </div>

                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: COLORS.inkSoft, marginTop: 4, ...ellipsisText }}>
                        {r.priceMin != null && r.priceMax != null
                          ? `₹${r.priceMin}-${r.priceMax}`
                          : r.priceMax != null ? `₹${r.priceMax}` : "price not published"}
                        {r.lotSize ? ` · lot ${r.lotSize}` : ""}
                        {r.listedOn
                          ? ` · listed ${fmtDayMon(r.listedOn)}`
                          : r.closeDate ? ` · ${fmtDayMon(r.openDate)} -> ${fmtDayMon(r.closeDate)}` : ""}
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
                            {r.subscription.toFixed(2)}x sub
                          </Badge>
                        )}
                        {r.categories && r.categories.retail != null && (
                          <Badge color={COLORS.navy} bg={COLORS.chip}>{r.categories.retail.toFixed(1)}x retail</Badge>
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
                ? "Fetching lot sizes..."
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

