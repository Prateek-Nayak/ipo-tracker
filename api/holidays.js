/*
 * Trading holidays, from NSE's holiday master.
 *
 * The allotment and listing dates an IPO tracker cares about are counted in
 * working days from the issue close, and a market holiday shifts every one of
 * them.
 *
 * It has to be the trading calendar, not the clearing one — they differ, and
 * the difference matters. 26 August 2026 was Id-E-Milad, a clearing holiday but
 * a normal trading day: Gaja Alternative and Dhanwel Hybrid both listed on it.
 * Counting it as a holiday moves every date that week a day late. Checked
 * against 19 issues with a known close and listing date, T+3 on the trading
 * calendar matches all 19; on the clearing calendar it matches 17.
 *
 * No API key; NSE serves a challenge page to clients that do not look like a
 * browser, so a cookie is taken from its home page first.
 */

const NSE = "https://www.nseindia.com";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const MONTHS = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

// "26-Aug-2026" -> "2026-08-26"
function toISO(d) {
  const m = String(d || "").trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!m) return "";
  const mm = MONTHS[m[2].toLowerCase()];
  return mm ? `${m[3]}-${mm}-${m[1].padStart(2, "0")}` : "";
}

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

export const config = { maxDuration: 20 };

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const cookie = await nseCookie();
    const r = await fetch(`${NSE}/api/holiday-master?type=trading`, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: NSE + "/resources/exchange-communication-holidays",
        ...(cookie ? { Cookie: cookie } : {}),
      },
    });
    if (!r.ok) throw new Error(`NSE responded ${r.status}`);
    const text = await r.text();
    if (!text.trim()) throw new Error("NSE returned an empty body");

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("NSE returned a non-JSON body");
    }

    /* The response is keyed by segment — CM, FO, CD and the rest. CM is the
       equity segment, which is the one an IPO settles and lists in. Any segment
       is taken as a fallback, since in practice a market holiday closes all of
       them together. */
    const rows = Array.isArray(data?.CM) && data.CM.length
      ? data.CM
      : Object.values(data || {}).flat();

    const byDate = new Map();
    rows.forEach((row) => {
      const iso = toISO(row?.tradingDate);
      if (iso && !byDate.has(iso)) byDate.set(iso, String(row?.description || "").trim());
    });

    const holidays = [...byDate.entries()]
      .map(([date, description]) => ({ date, description }))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (!holidays.length) {
      return res.status(502).json({ error: "NSE returned no holidays." });
    }

    // A holiday calendar changes about once a year.
    res.setHeader("Cache-Control", "s-maxage=43200, stale-while-revalidate=86400");
    return res.status(200).json({
      source: "NSE",
      fetchedAt: new Date().toISOString(),
      segment: Array.isArray(data?.CM) && data.CM.length ? "CM" : "all",
      holidays,
    });
  } catch (error) {
    return res.status(502).json({ error: error.message || "Could not reach NSE" });
  }
}
