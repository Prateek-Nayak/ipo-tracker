/*
 * Live IPO data, proxied from NSE.
 *
 * NSE sends no CORS headers, so the browser cannot call it directly; this
 * function is the proxy. It needs no API key — the data is public — but NSE
 * does reject requests that do not look like a browser, so we take a cookie
 * from the home page first and replay it on the API call.
 */

const NSE = "https://www.nseindia.com";
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
  if (!mm) return "";
  return `${m[3]}-${mm}-${m[1].padStart(2, "0")}`;
}

// "Rs.78 to Rs.82" -> { min: 78, max: 82 }; also handles a single "Rs.82"
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

async function getCookie() {
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
    // NSE serves an HTML challenge page when it decides we are a bot.
    throw new Error(`NSE ${path} returned a non-JSON body`);
  }
}

function normalise(row, live) {
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
    // Times subscribed, across all categories. Only present while bidding is open.
    subscription: live ? num(row.noOfTime) : null,
    status: row.status || "",
    live: !!live,
  };
}

// One row per symbol. Current issues win over upcoming, since they carry
// subscription figures.
function merge(current, upcoming) {
  const bySymbol = new Map();
  upcoming.forEach((r) => {
    const n = normalise(r, false);
    if (n.symbol) bySymbol.set(n.symbol, n);
  });
  current.forEach((r) => {
    const n = normalise(r, true);
    if (!n.symbol) return;
    const prev = bySymbol.get(n.symbol);
    // Keep the highest subscription seen if NSE returns several category rows.
    if (prev && prev.live && prev.subscription != null && n.subscription != null) {
      n.subscription = Math.max(prev.subscription, n.subscription);
    }
    bySymbol.set(n.symbol, n);
  });
  return [...bySymbol.values()].sort((a, b) => (a.closeDate || "").localeCompare(b.closeDate || ""));
}

export const config = { maxDuration: 20 };

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const cookie = await getCookie();
    const [current, upcoming] = await Promise.all([
      nseJson("/api/ipo-current-issue", cookie).catch(() => []),
      nseJson("/api/all-upcoming-issues?category=ipo", cookie).catch(() => []),
    ]);

    const ipos = merge(
      Array.isArray(current) ? current : [],
      Array.isArray(upcoming) ? upcoming : []
    );

    if (!ipos.length) {
      return res.status(502).json({
        error: "NSE did not return any IPOs. It may be blocking this server, or there may genuinely be none open.",
      });
    }

    // Cache at the edge: NSE updates subscription figures every few minutes,
    // and this keeps us from hammering them.
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ source: "NSE", fetchedAt: new Date().toISOString(), ipos });
  } catch (error) {
    return res.status(502).json({ error: error.message || "Could not reach NSE" });
  }
}
