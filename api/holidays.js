/*
 * Market holidays from Upstox.
 *
 * The IPO timeline dates (allotment, listing) now come directly from the
 * Upstox IPO details endpoint, so this holidays endpoint is largely vestigial.
 * It is kept for the frontend's calendar arithmetic (addTradingDays etc.) which
 * still consults it for edge cases.
 *
 * Upstox provides holiday_type: TRADING_HOLIDAY and SETTLEMENT_HOLIDAY which
 * map to the app's trading/clearing distinction.
 */

const UPSTOX = "https://api.upstox.com/v2";

async function upstoxFetch(path, token) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`${UPSTOX}${path}`, { headers });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Upstox ${path} responded ${r.status}: ${text.slice(0, 200)}`);
  }
  return r.json();
}

export const config = { maxDuration: 20 };

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.UPSTOX_ANALYTICS_TOKEN || "";

  try {
    const data = await upstoxFetch("/market/holidays", token);

    if (data.status !== "success" || !Array.isArray(data.data)) {
      return res.status(502).json({ error: "Upstox returned no holidays." });
    }

    const tradingHolidays = [];
    const clearingHolidays = [];

    data.data.forEach((entry) => {
      const date = entry.date;
      if (!date) return;

      const type = entry.holiday_type || "";
      const allClosed =
        Array.isArray(entry.closed_exchanges) &&
        entry.closed_exchanges.length > 0 &&
        (!Array.isArray(entry.open_exchanges) || entry.open_exchanges.length === 0);

      // NSE/BSE fully closed = trading holiday
      const nseClosed =
        Array.isArray(entry.closed_exchanges) &&
        (entry.closed_exchanges.includes("NSE") || entry.closed_exchanges.includes("BSE"));

      if (type === "SETTLEMENT_HOLIDAY") {
        clearingHolidays.push({ date, description: entry.description || "" });
      } else if (type === "TRADING_HOLIDAY" && (allClosed || nseClosed)) {
        tradingHolidays.push({ date, description: entry.description || "" });
      }
    });

    // A holiday calendar changes about once a year.
    res.setHeader("Cache-Control", "s-maxage=43200, stale-while-revalidate=86400");
    return res.status(200).json({
      source: "Upstox",
      fetchedAt: new Date().toISOString(),
      segment: "CM",
      trading: tradingHolidays,
      clearing: clearingHolidays,
      // Legacy field for older frontend versions
      holidays: tradingHolidays,
    });
  } catch (error) {
    return res.status(502).json({ error: error.message || "Could not reach Upstox" });
  }
}
