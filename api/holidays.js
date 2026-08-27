/*
 * Market holidays, from NSE's holiday master — both calendars, because an IPO
 * timetable needs both.
 *
 * Allotment is a clearing event and listing is a trading event, and the two
 * calendars are not the same. 26 August 2026 (Id-E-Milad) is the clean example:
 * a clearing holiday but an ordinary trading day. Gaja Alternative closed on the
 * 21st, was allotted on the 24th and listed on the 26th — trading through a
 * clearing holiday. Augmont closed on the 25th, and because the 26th was closed
 * for clearing its allotment slipped to the 27th and its listing to the 31st.
 * One calendar cannot explain both; two can.
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

/* The response is keyed by segment — CM, FO, CD and the rest. CM is the equity
   segment, the one an IPO settles and lists in. Any segment is taken as a
   fallback, since in practice a holiday closes all of them together. */
async function calendar(type, cookie) {
  const r = await fetch(`${NSE}/api/holiday-master?type=${type}`, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: NSE + "/resources/exchange-communication-holidays",
      ...(cookie ? { Cookie: cookie } : {}),
    },
  });
  if (!r.ok) throw new Error(`NSE responded ${r.status} for ${type}`);
  const text = await r.text();
  if (!text.trim()) throw new Error(`NSE returned an empty ${type} body`);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`NSE returned a non-JSON ${type} body`);
  }

  const cm = Array.isArray(data?.CM) && data.CM.length;
  const rows = cm ? data.CM : Object.values(data || {}).flat();

  const byDate = new Map();
  rows.forEach((row) => {
    const iso = toISO(row?.tradingDate);
    if (iso && !byDate.has(iso)) byDate.set(iso, String(row?.description || "").trim());
  });

  return {
    segment: cm ? "CM" : "all",
    holidays: [...byDate.entries()]
      .map(([date, description]) => ({ date, description }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export const config = { maxDuration: 20 };

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const cookie = await nseCookie();
    const [trading, clearing] = await Promise.all([
      calendar("trading", cookie),
      calendar("clearing", cookie),
    ]);

    if (!trading.holidays.length || !clearing.holidays.length) {
      return res.status(502).json({ error: "NSE returned no holidays." });
    }

    // A holiday calendar changes about once a year.
    res.setHeader("Cache-Control", "s-maxage=43200, stale-while-revalidate=86400");
    return res.status(200).json({
      source: "NSE",
      fetchedAt: new Date().toISOString(),
      segment: trading.segment,
      trading: trading.holidays,
      clearing: clearing.holidays,
      // Older clients read `holidays` and mean the trading calendar.
      holidays: trading.holidays,
    });
  } catch (error) {
    return res.status(502).json({ error: error.message || "Could not reach NSE" });
  }
}
