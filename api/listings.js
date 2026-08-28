/*
 * Listing-day and current market prices for IPOs, from Upstox.
 *
 * - Listed IPOs: fetched from Upstox /ipos?status=listed (+ closed for recent ones)
 * - Listing price: from IPO details endpoint (listing_price field)
 * - Current price: from Upstox LTP market quote endpoint (batched)
 *
 * BSE category demand is NOT fetched here — that lives in /api/ipos for open ones.
 *
 * The analytics token (long-lived, read-only) is used for all Upstox calls.
 */

const UPSTOX = "https://api.upstox.com/v2";

/* -------------------------------- Upstox -------------------------------- */

async function upstoxFetch(path, token) {
  const r = await fetch(`${UPSTOX}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Upstox ${path} responded ${r.status}: ${text.slice(0, 200)}`);
  }
  return r.json();
}

/* Fetch all pages of IPOs for a given status (both regular + sme). */
async function fetchAllIpos(token, status) {
  const all = [];
  for (const issueType of ["regular", "sme"]) {
    let page = 1;
    let totalPages = 1;
    while (page <= totalPages) {
      try {
        const data = await upstoxFetch(
          `/ipos?status=${status}&issue_type=${issueType}&page_number=${page}&records=30`,
          token
        );
        if (data.status !== "success" || !Array.isArray(data.data)) break;
        all.push(...data.data);
        totalPages = data.meta_data?.page?.total_pages || 1;
        page++;
      } catch {
        break;
      }
    }
  }
  return all;
}

/* Fetch IPO details for a single IPO. */
async function fetchIpoDetail(token, id) {
  try {
    const data = await upstoxFetch(`/ipos/${encodeURIComponent(id)}`, token);
    if (data.status === "success" && data.data) return data.data;
    return null;
  } catch {
    return null;
  }
}

/* Fetch LTP for multiple instrument keys (max 500 per call).
   Response keys are in "EXCHANGE:SYMBOL" format (e.g. "NSE_EQ:NHPC"), but each
   value contains an `instrument_token` field with the original key format
   (e.g. "NSE_EQ|INE848E01016"). We index by instrument_token for reliable lookup. */
async function fetchLtp(token, instrumentKeys) {
  if (!instrumentKeys.length) return {};
  // Batch into groups of 500
  const results = {};
  for (let i = 0; i < instrumentKeys.length; i += 500) {
    const batch = instrumentKeys.slice(i, i + 500);
    const param = batch.map((k) => encodeURIComponent(k)).join(",");
    try {
      const data = await upstoxFetch(
        `/market-quote/ltp?instrument_key=${param}`,
        token
      );
      if (data.status === "success" && data.data) {
        // Re-key by instrument_token (NSE_EQ|ISIN format) for easy lookup
        Object.values(data.data).forEach((val) => {
          if (val && val.instrument_token) {
            results[val.instrument_token] = val;
          }
        });
      }
    } catch {
      // Partial failure — continue with what we have
    }
  }
  return results;
}

function num(v) {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function price(v) {
  const n = num(v);
  return n != null && n > 0 ? n : null;
}

function nameKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(limited|ltd|private|pvt|india|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* Run limited concurrency. */
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

/* -------------------------------- Handler -------------------------------- */

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.UPSTOX_ANALYTICS_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "UPSTOX_ANALYTICS_TOKEN not configured" });
  }

  try {
    /* Fetch listed + closed IPOs from Upstox.
       "listed" = shares trading on exchange.
       "closed" = bidding ended, allotment underway — some may have listing_price already. */
    const [listed, closed] = await Promise.all([
      fetchAllIpos(token, "listed"),
      fetchAllIpos(token, "closed"),
    ]);

    const allRaw = [...listed, ...closed];

    // Dedupe by id
    const byId = new Map();
    allRaw.forEach((item) => {
      if (item.id && !byId.has(item.id)) byId.set(item.id, item);
    });

    const items = [...byId.values()];

    // Filter: only 2025 and 2026 IPOs (skip 2024 and older)
    const filtered = items.filter((item) => {
      const year = parseInt((item.bidding_start_date || "").slice(0, 4), 10);
      return year >= 2025;
    });

    if (!filtered.length) {
      return res.status(200).json({
        source: "Upstox",
        fetchedAt: new Date().toISOString(),
        from: 2025,
        categoryKnown: true,
        listingsKnown: true,
        listings: [],
      });
    }

    /* Fetch details for each IPO to get listing_price, lot_size, timeline.
       Limited to 6 concurrent requests to stay within rate limits. */
    const keys = String(req.query?.keys || "")
      .split("|")
      .map((k) => nameKey(k))
      .filter(Boolean);
    const wantedSet = new Set(keys);

    // If caller specified keys, only fetch details for those + listed ones.
    // Otherwise fetch all (but cap at 50 to avoid rate limit issues).
    let toEnrich = filtered;
    if (wantedSet.size > 0) {
      toEnrich = filtered.filter(
        (item) =>
          wantedSet.has(nameKey(item.name)) || item.status === "listed"
      );
    }
    toEnrich = toEnrich.slice(0, 50);

    const details = await mapLimited(toEnrich, 6, (item) =>
      fetchIpoDetail(token, item.id)
    );

    // Build a details map by id
    const detailMap = new Map();
    details.forEach((d, i) => {
      if (d) detailMap.set(toEnrich[i].id, d);
    });

    /* Build instrument keys for LTP lookup.
       Instrument key format: NSE_EQ|{ISIN} */
    const listedWithIsin = filtered.filter(
      (item) => item.status === "listed" && item.isin
    );
    const instrumentKeys = listedWithIsin.map((item) => `NSE_EQ|${item.isin}`);

    // Also check if caller's wanted keys have ISINs
    const allIsins = new Map();
    filtered.forEach((item) => {
      if (item.isin) allIsins.set(nameKey(item.name), `NSE_EQ|${item.isin}`);
    });

    // Add wanted keys' instrument keys
    const extraKeys = [];
    wantedSet.forEach((k) => {
      const instKey = allIsins.get(k);
      if (instKey && !instrumentKeys.includes(instKey)) {
        extraKeys.push(instKey);
      }
    });

    const allInstrumentKeys = [...new Set([...instrumentKeys, ...extraKeys])];

    /* Fetch current prices via LTP endpoint. */
    const ltpData = await fetchLtp(token, allInstrumentKeys);

    /* Build output listings in the same shape the frontend expects. */
    const listings = filtered.map((item) => {
      const detail = detailMap.get(item.id);
      const key = nameKey(item.name);
      const instKey = item.isin ? `NSE_EQ|${item.isin}` : "";
      const ltp = instKey ? ltpData[instKey] : null;

      const issuePrice = price(item.maximum_price) || price(item.minimum_price);
      const listingPrice = detail ? price(detail.listing_price) : null;
      const currentPrice = ltp ? price(ltp.last_price) : null;

      // Gain calculations
      let listingDayGain = null;
      let gainSinceIssue = null;
      if (listingPrice != null && issuePrice != null) {
        listingDayGain = ((listingPrice - issuePrice) / issuePrice) * 100;
      }
      if (currentPrice != null && issuePrice != null) {
        gainSinceIssue = ((currentPrice - issuePrice) / issuePrice) * 100;
      }

      return {
        company: (item.name || "").replace(/\s*ipo\s*$/i, "").trim(),
        key,
        shortName: item.symbol || "",
        category: item.issue_type === "sme" ? "SME" : "Mainboard",
        issuePrice,
        listedOn: detail?.timeline?.listing_date || "",
        listingClose: null, // Not available from Upstox
        listingOpen: listingPrice, // listing_price is the listing open price
        lotSize: detail ? num(detail.lot_size) : null,
        priceMin: num(item.minimum_price),
        priceMax: num(item.maximum_price),
        listingDayGain,
        currentPrice,
        gainSinceIssue,
        bseUrl: "",
        openDate: item.bidding_start_date || "",
        closeDate: item.bidding_end_date || "",
        ipoNo: "",
        isin: item.isin || "",
        instrumentKey: instKey,
        // Extra fields from Upstox
        allotmentDate: detail?.timeline?.allotment_start_date || "",
        listingDate: detail?.timeline?.listing_date || "",
        industry: item.industry || "",
        subscription: num(item.total_subscription),
      };
    });

    listings.sort((a, b) => (b.listedOn || b.closeDate || "").localeCompare(a.listedOn || a.closeDate || ""));

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({
      source: "Upstox",
      fetchedAt: new Date().toISOString(),
      from: 2025,
      categoryKnown: true,
      listingsKnown: true,
      listings,
    });
  } catch (error) {
    return res.status(502).json({ error: error.message || "Could not reach Upstox" });
  }
}
