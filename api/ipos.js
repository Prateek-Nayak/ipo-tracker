/*
 * Live IPO data.
 *
 * NSE is the spine: it publishes the open and upcoming issues together with
 * live subscription figures. It does not publish lot size, which is the one
 * number you cannot apply without — so each issue is then matched against
 * BSE's public-issue list to pick up its IPO number, and BSE's per-issue
 * endpoint supplies the market lot.
 *
 * Neither source needs an API key; both are public. NSE serves a challenge
 * page to clients that do not look like a browser, so we take a cookie from
 * its home page first. BSE only wants browser-ish headers.
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

// Live and forthcoming issues, which is where each issue's IPO number comes from.
async function bsePublicIssues() {
  const data = await bseJson("/GetPublicIssue_par_updated/w?flag=1");
  const rows = Array.isArray(data?.Table) ? data.Table : [];
  return rows
    .map((r) => ({
      key: nameKey(r.Scrip_Name || r.LONG_NAME || r.short_name),
      ipoNo: String(r.IPO_NO || "").trim(),
      platform: String(r.eXCHANGE_PLATFORM || "").trim(),
      faceValue: num(r.Face_Val),
    }))
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
    const cookie = await nseCookie();
    const [current, upcoming] = await Promise.all([
      nseJson("/api/ipo-current-issue", cookie).catch(() => []),
      nseJson("/api/all-upcoming-issues?category=ipo", cookie).catch(() => []),
    ]);

    const ipos = mergeNse(
      Array.isArray(current) ? current : [],
      Array.isArray(upcoming) ? upcoming : []
    );

    if (!ipos.length) {
      return res.status(502).json({
        error: "NSE did not return any IPOs. It may be blocking this server, or there may genuinely be none open.",
      });
    }

    // Enrich with BSE's lot size. Best effort: if BSE is unreachable the IPOs
    // still come back, just without a lot size, which the app already handles.
    let lotSource = "none";
    try {
      const bseRows = await bsePublicIssues();
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
