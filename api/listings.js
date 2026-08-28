/*
 * Listing-day and current market prices for IPOs, from Upstox.
 * Upstox is the source of truth for listing, pricing, dates and IPO metadata.
 * BSE category demand is NOT fetched here — that lives in /api/ipos for open ones.
 */
const UPSTOX = "https://api.upstox.com/v2";
async function upstoxFetch(path, token) {
  const r = await fetch(`${UPSTOX}${path}`, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } });
  if (!r.ok) { const text = await r.text(); throw new Error(`Upstox ${path} responded ${r.status}: ${text.slice(0, 200)}`); }
  return r.json();
}
async function fetchAllIpos(token, status) {
  const all = [];
  for (const issueType of ["regular", "sme"]) {
    let page = 1, totalPages = 1;
    while (page <= totalPages) {
      try {
        const data = await upstoxFetch(`/ipos?status=${status}&issue_type=${issueType}&page_number=${page}&records=30`, token);
        if (data.status !== "success" || !Array.isArray(data.data)) break;
        all.push(...data.data); totalPages = data.meta_data?.page?.total_pages || 1; page++;
      } catch { break; }
    }
  }
  return all;
}
async function fetchIpoDetail(token, id) {
  try { const data = await upstoxFetch(`/ipos/${encodeURIComponent(id)}`, token); return data.status === "success" && data.data ? data.data : null; }
  catch { return null; }
}
async function fetchLtp(token, instrumentKeys) {
  if (!instrumentKeys.length) return {};
  const results = {};
  for (let i = 0; i < instrumentKeys.length; i += 500) {
    const batch = instrumentKeys.slice(i, i + 500);
    const param = batch.map((k) => encodeURIComponent(k)).join(",");
    try {
      const data = await upstoxFetch(`/market-quote/ltp?instrument_key=${param}`, token);
      if (data.status === "success" && data.data) {
        Object.entries(data.data).forEach(([instrumentKey, val]) => { if (val) results[instrumentKey] = val; });
      }
    } catch { /* continue with partial results */ }
  }
  return results;
}
function num(v) { if (v === null || v === undefined || String(v).trim() === "") return null; const n = Number(v); return Number.isFinite(n) ? n : null; }
function price(v) { const n = num(v); return n != null && n > 0 ? n : null; }
function nameKey(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\b(limited|ltd|private|pvt|india|the|ipo)\b/g, " ").replace(/\s+/g, " ").trim(); }
function compactKey(s) { return String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
async function mapLimited(items, limit, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => { while (i < items.length) { const idx = i++; try { out[idx] = await fn(items[idx]); } catch { out[idx] = null; } } }));
  return out;
}
export const config = { maxDuration: 60 };
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const token = process.env.UPSTOX_ANALYTICS_TOKEN;
  if (!token) return res.status(500).json({ error: "UPSTOX_ANALYTICS_TOKEN not configured" });
  try {
    const [listed, closed] = await Promise.all([fetchAllIpos(token, "listed"), fetchAllIpos(token, "closed")]);
    const byId = new Map(); [...listed, ...closed].forEach((item) => { if (item.id && !byId.has(item.id)) byId.set(item.id, item); });
    const items = [...byId.values()];
    const requestedYear = String(req.query?.from || "").trim();
    const filtered = requestedYear ? items.filter((item) => (item.bidding_start_date || "").slice(0, 4) === requestedYear) : items;
    if (!filtered.length) return res.status(200).json({ source: "Upstox", fetchedAt: new Date().toISOString(), from: requestedYear || null, categoryKnown: true, listingsKnown: true, listings: [] });
    const rawKeys = String(req.query?.keys || "").split("|").map((k) => String(k || "").trim()).filter(Boolean).slice(0, 120);
    const wanted = new Set(rawKeys.flatMap((k) => [nameKey(k), compactKey(k)]).filter(Boolean));
    let toEnrich = filtered;
    if (wanted.size) {
      toEnrich = filtered.filter((item) => [nameKey(item.name), nameKey(item.short_name), compactKey(item.symbol), compactKey(item.isin)].filter(Boolean).some((a) => wanted.has(a)));
      if (!toEnrich.length) toEnrich = filtered.slice(0, 80);
    } else toEnrich = filtered.slice(0, 80);
    const details = await mapLimited(toEnrich, 6, (item) => fetchIpoDetail(token, item.id));
    const detailMap = new Map(); details.forEach((d, i) => { if (d) detailMap.set(toEnrich[i].id, d); });
    const listedWithIsin = filtered.filter((item) => item.status === "listed" && item.isin);
    const instrumentKeys = listedWithIsin.map((item) => `NSE_EQ|${item.isin}`);
    const ltpData = await fetchLtp(token, [...new Set(instrumentKeys)]);
    const listings = filtered.map((item) => {
      const detail = detailMap.get(item.id), key = nameKey(item.name), instKey = item.isin ? `NSE_EQ|${item.isin}` : "", ltp = instKey ? ltpData[instKey] : null;
      const issuePrice = price(item.maximum_price) || price(item.minimum_price), listingPrice = detail ? price(detail.listing_price) : null, currentPrice = ltp ? price(ltp.last_price) : null;
      const listingDayGain = listingPrice != null && issuePrice != null ? ((listingPrice - issuePrice) / issuePrice) * 100 : null;
      const gainSinceIssue = currentPrice != null && issuePrice != null ? ((currentPrice - issuePrice) / issuePrice) * 100 : null;
      return { source: "Upstox", upstoxId: item.id || "", company: (item.name || "").replace(/\s*ipo\s*$/i, "").trim(), key, shortName: item.symbol || "", symbol: item.symbol || "", category: item.issue_type === "sme" ? "SME" : "Mainboard", issuePrice, listedOn: detail?.timeline?.listing_date || "", listingClose: null, listingOpen: listingPrice, lotSize: detail ? num(detail.lot_size) : null, priceMin: num(item.minimum_price), priceMax: num(item.maximum_price), listingDayGain, currentPrice, gainSinceIssue, openDate: item.bidding_start_date || "", closeDate: item.bidding_end_date || "", ipoNo: "", isin: item.isin || "", instrumentKey: instKey, allotmentDate: detail?.timeline?.allotment_start_date || detail?.timeline?.allotment_date || "", listingDate: detail?.timeline?.listing_date || "", industry: item.industry || "", subscription: num(item.total_subscription) };
    });
    listings.sort((a, b) => (b.listedOn || b.closeDate || "").localeCompare(a.listedOn || a.closeDate || ""));
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ source: "Upstox", fetchedAt: new Date().toISOString(), from: requestedYear || null, categoryKnown: true, listingsKnown: true, listings });
  } catch (error) { return res.status(502).json({ error: error.message || "Could not reach Upstox" }); }
}
