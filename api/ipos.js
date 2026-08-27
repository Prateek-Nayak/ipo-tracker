/*
 * Live IPO data, from both exchanges.
 *
 * Neither one lists everything. NSE Emerge SME issues never reach BSE, and BSE
 * carries issues NSE does not, so the two are unioned by company name rather
 * than one being trusted as the whole picture. It also means an exchange being
 * unreachable shortens the list instead of emptying it.
 *
 * NSE contributes the ticker and the headline subscription figure. BSE
 * contributes what NSE does not publish at all: the market lot, without which
 * an application cannot be costed, and the subscription split by investor
 * category — the retail line being the one that bears on a family's odds.
 *
 * Neither needs an API key; both are public. NSE serves a challenge page to
 * clients that do not look like a browser, so a cookie is taken from its home
 * page first. BSE only wants browser-ish headers.
 */

const NSE = "https://www.nseindia.com";
const BSE = "https://api.bseindia.com/BseIndiaAPI/api";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const MONTHS = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

// "31-Aug-2026" -> "2026-08-31" (the format the app's date inputs use)
function toISO(d) {
  if (!d || typeof d !== "string") return "";
  const m = d.trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!m) return "";
  const mm = MONTHS[m[2].toLowerCase()];
  return mm ? `${m[3]}-${mm}-${m[1].padStart(2, "0")}` : "";
}

// "Rs.78 to Rs.82" / "131.00-138.00" -> { min, max }
function parsePrice(s) {
  const nums = String(s || "").match(/\d+(?:\.\d+)?/g);
  if (!nums || !nums.length) return { min: null, max: null };
  const vals = nums.map(Number);
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

/* The market's calendar date. toISOString() would give the UTC one, which is
   the previous day through the whole Indian evening. */
function istToday() {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  } catch {
    return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  }
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* Company names never match exactly across exchanges - "Lumino Industries
   Limited" on one side, "LUMINO INDUSTRIES LTD" on the other. Reduce both to
   the same shape before comparing. */
function nameKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(limited|ltd|private|pvt|india|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ---------------------------------- NSE ---------------------------------- */

async function nseCookie() {
  try {
    const r = await fetch(NSE + "/", {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    const jar =
      typeof r.headers.getSetCookie === "function"
        ? r.headers.getSetCookie()
        : [r.headers.get("set-cookie")].filter(Boolean);
    return jar.map((c) => String(c).split(";")[0]).join("; ");
  } catch {
    return "";
  }
}

async function nseJson(path, cookie) {
  const r = await fetch(NSE + path, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: NSE + "/market-data/all-upcoming-issues-ipo",
      ...(cookie ? { Cookie: cookie } : {}),
    },
  });
  if (!r.ok) throw new Error(`NSE ${path} responded ${r.status}`);
  const text = await r.text();
  if (!text.trim()) return [];
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`NSE ${path} returned a non-JSON body`);
  }
}

/* ---------------------------------- BSE ---------------------------------- */

async function bseJson(path) {
  const r = await fetch(BSE + path, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json, text/plain, */*",
      Referer: "https://www.bseindia.com/",
      Origin: "https://www.bseindia.com",
    },
  });
  if (!r.ok) throw new Error(`BSE ${path} responded ${r.status}`);
  const text = await r.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`BSE ${path} returned a non-JSON body`);
  }
}

/* Live and forthcoming issues. This is both a source of issues in its own right
   and where each one's IPO number comes from.

   The feed mixes in things that are not IPOs at all, and IR_flag is what tells
   them apart: IPO, RI (rights), OTB (offer to buy), DPI (debt public issue) and
   BuyBack. Only IPO belongs in an IPO tracker — the platform field does not
   separate them, since an open offer on the mainboard still says MainBoard. */
function parseBand(s) {
  const nums = String(s || "").match(/\d+(?:\.\d+)?/g);
  if (!nums || !nums.length) return { min: null, max: null };
  const vals = nums.map(Number);
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

async function bsePublicIssues() {
  const data = await bseJson("/GetPublicIssue_par_updated/w?flag=1");
  const rows = Array.isArray(data?.Table) ? data.Table : [];
  return rows
    .map((r) => {
      const platform = String(r.eXCHANGE_PLATFORM || "").trim();
      const band = parseBand(r.Price_Band);
      return {
        key: nameKey(r.Scrip_Name || r.LONG_NAME || r.short_name),
        company: String(r.Scrip_Name || r.LONG_NAME || "").replace(/\s+/g, " ").trim(),
        ipoNo: String(r.IPO_NO || "").trim(),
        platform,
        category: /sme/i.test(platform) ? "SME" : "Mainboard",
        priceMin: band.min,
        priceMax: band.max,
        openDate: String(r.Start_Dt || "").slice(0, 10),
        closeDate: String(r.End_Dt || "").slice(0, 10),
        faceValue: num(r.Face_Val),
        isIpo: /^ipo$/i.test(String(r.IR_flag || "").trim()),
      };
    })
    .filter((r) => r.key && r.ipoNo);
}

// The per-issue endpoint. Market_Lot is the reason we are here.
async function bseIssueDetail(ipoNo) {
  const data = await bseJson(`/GetMkt_ISSUE_BBS_IPO/w?IPO_NO=${encodeURIComponent(ipoNo)}`);
  const d = Array.isArray(data?.IPONO_0) ? data.IPONO_0[0] : null;
  if (!d) return null;
  const lot = parseInt(String(d.Market_Lot || "").replace(/[^0-9]/g, ""), 10);
  return {
    lotSize: Number.isFinite(lot) && lot > 0 ? lot : null,
    minBidQty: num(String(d.Minimum_Bid_Quantity || "").replace(/[^0-9]/g, "")),
    faceValue: num(d.Face_Value),
    registrar: String(d.Registrar || "").split("^")[0].trim(),
    upiCutOff: String(d.Cut_off_time_for_UPI_Mandate_Confirmation || "").trim(),
  };
}

/* Subscription split by investor category. The retail figure is the one that
   bears on a family application's odds - a retail book at 3x behaves very
   differently from one at 90x, even when the headline number looks the same. */
async function bseCategoryDemand(ipoNo) {
  const data = await bseJson(`/Pubissues_BBS_CumultveCatdem_ng/w?IPO_NO=${encodeURIComponent(ipoNo)}`);
  const rows = Array.isArray(data?.Table) ? data.Table : [];
  const out = { qib: null, nii: null, retail: null, employee: null };
  rows.forEach((r) => {
    // Sub-rows are numbered "1(a)", "2.1" and so on; only the whole-category
    // rows carry a meaningful times-subscribed figure.
    if (!/^\d+$/.test(String(r.SRNo || "").trim())) return;
    const label = String(r.col2 || "").toLowerCase();
    const times = num(r.col5);
    if (times == null) return;
    if (label.includes("qualified institutional")) out.qib = times;
    else if (label.includes("non institutional")) out.nii = times;
    else if (label.includes("retail")) out.retail = times;
    else if (label.includes("employee")) out.employee = times;
  });
  return out;
}

// Run a handful at a time; there is no reason to open twenty sockets at BSE.
async function mapLimited(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        try {
          out[idx] = await fn(items[idx]);
        } catch {
          out[idx] = null;
        }
      }
    })
  );
  return out;
}

/* -------------------------------- assembly -------------------------------- */

function normaliseNse(row, live) {
  const price = parsePrice(row.issuePrice);
  return {
    symbol: row.symbol || "",
    company: (row.companyName || "").replace(/\s+/g, " ").trim(),
    category: String(row.series || "").toUpperCase() === "SME" ? "SME" : "Mainboard",
    priceMin: price.min,
    priceMax: price.max,
    openDate: toISO(row.issueStartDate),
    closeDate: toISO(row.issueEndDate),
    issueSize: num(row.issueSize),
    // Times subscribed overall. Only present while bidding is open.
    subscription: live ? num(row.noOfTime) : null,
    status: row.status || "",
    live: !!live,
    lotSize: null,
    lotCost: null,
    registrar: "",
    categories: null,
    source: "NSE",
  };
}

function mergeNse(current, upcoming) {
  const bySymbol = new Map();
  upcoming.forEach((r) => {
    const n = normaliseNse(r, false);
    if (n.symbol) bySymbol.set(n.symbol, n);
  });
  current.forEach((r) => {
    const n = normaliseNse(r, true);
    if (!n.symbol) return;
    const prev = bySymbol.get(n.symbol);
    if (prev && prev.live && prev.subscription != null && n.subscription != null) {
      n.subscription = Math.max(prev.subscription, n.subscription);
    }
    bySymbol.set(n.symbol, n);
  });
  return [...bySymbol.values()].sort((a, b) => (a.closeDate || "").localeCompare(b.closeDate || ""));
}

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    /* Both exchanges, because neither lists everything: NSE Emerge SME issues
       never appear on BSE, and BSE has issues NSE does not. Asking both and
       taking the union is the only way to see them all — and it means one
       exchange being unreachable degrades the list rather than emptying it. */
    const cookie = await nseCookie();
    const [current, upcoming, bseRows] = await Promise.all([
      nseJson("/api/ipo-current-issue", cookie).catch(() => []),
      nseJson("/api/all-upcoming-issues?category=ipo", cookie).catch(() => []),
      bsePublicIssues().catch(() => []),
    ]);

    const ipos = mergeNse(
      Array.isArray(current) ? current : [],
      Array.isArray(upcoming) ? upcoming : []
    );

    // Add the issues only BSE knows about, skipping debt and rights.
    const seen = new Set(ipos.map((i) => nameKey(i.company)));
    bseRows.forEach((r) => {
      if (!r.isIpo || seen.has(r.key)) return;
      seen.add(r.key);
      ipos.push({
        symbol: r.key.replace(/\s+/g, "-").slice(0, 24).toUpperCase(),
        company: r.company,
        category: r.category,
        priceMin: r.priceMin,
        priceMax: r.priceMax,
        openDate: r.openDate,
        closeDate: r.closeDate,
        issueSize: null,
        subscription: null,
        status: "",
        live: !!r.openDate && r.openDate <= istToday(),
        lotSize: null,
        lotCost: null,
        registrar: "",
        categories: null,
        source: "BSE",
      });
    });

    ipos.sort((a, b) => (a.closeDate || "").localeCompare(b.closeDate || ""));

    if (!ipos.length) {
      return res.status(502).json({
        error: "Neither NSE nor BSE returned any IPOs. They may be blocking this server, or there may genuinely be none open.",
      });
    }

    // Enrich with BSE's lot size and category demand.
    let lotSource = "none";
    try {
      const byKey = new Map(bseRows.map((r) => [r.key, r]));
      const matched = ipos
        .map((ipo, idx) => ({ idx, hit: byKey.get(nameKey(ipo.company)) }))
        .filter((m) => m.hit);

      const enriched = await mapLimited(matched, 4, async (m) => ({
        detail: await bseIssueDetail(m.hit.ipoNo).catch(() => null),
        // Only open issues have a book to report on.
        categories: await bseCategoryDemand(m.hit.ipoNo).catch(() => null),
      }));

      enriched.forEach((e, n) => {
        const ipo = ipos[matched[n].idx];
        if (e.detail) {
          ipo.lotSize = e.detail.lotSize;
          ipo.registrar = e.detail.registrar || "";
          if (e.detail.lotSize && ipo.priceMax != null) ipo.lotCost = e.detail.lotSize * ipo.priceMax;
        }
        if (e.categories && Object.values(e.categories).some((v) => v != null)) {
          ipo.categories = e.categories;
        }
        // NSE omits the price band for some SME issues; BSE often has it.
        const bse = matched[n].hit;
        if (ipo.priceMax == null && bse.priceMax != null) {
          ipo.priceMin = bse.priceMin;
          ipo.priceMax = bse.priceMax;
          if (ipo.lotSize) ipo.lotCost = ipo.lotSize * bse.priceMax;
        }
        if (!ipo.openDate && bse.openDate) ipo.openDate = bse.openDate;
        if (!ipo.closeDate && bse.closeDate) ipo.closeDate = bse.closeDate;
      });
      if (enriched.some((e) => e.detail && e.detail.lotSize)) lotSource = "BSE";
    } catch {
      // leave lotSize null
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({
      source: "NSE",
      lotSource,
      fetchedAt: new Date().toISOString(),
      ipos,
    });
  } catch (error) {
    return res.status(502).json({ error: error.message || "Could not reach NSE" });
  }
}
