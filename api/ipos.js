/*
 * Live IPO data from Upstox + BSE category demand.
 *
 * Upstox provides: IPO list (open/upcoming/closed/listed), IPO details
 * (lot size, timeline, registrar, listing price, subscription).
 *
 * BSE is retained solely for category-wise subscription split (QIB, NII,
 * Retail, Employee) — Upstox only gives the headline total_subscription.
 *
 * The analytics token (long-lived, read-only) is used for Upstox calls.
 */

const UPSTOX = "https://api.upstox.com/v2";
const BSE = "https://api.bseindia.com/BseIndiaAPI/api";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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

/* Fetch all pages of IPOs for a given status. Records per page max 30. */
async function fetchAllIpos(token, status, issueType) {
  const all = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const data = await upstoxFetch(
      `/ipos?status=${status}&issue_type=${issueType}&page_number=${page}&records=30`,
      token
    );
    if (data.status !== "success" || !Array.isArray(data.data)) break;
    all.push(...data.data);
    totalPages = data.meta_data?.page?.total_pages || 1;
    page++;
  }
  return all;
}

/* Fetch IPO details for enrichment (lot size, timeline, registrar). */
async function fetchIpoDetail(token, id) {
  try {
    const data = await upstoxFetch(`/ipos/${encodeURIComponent(id)}`, token);
    if (data.status === "success" && data.data) return data.data;
    return null;
  } catch {
    return null;
  }
}

/* ---------------------------------- BSE ---------------------------------- */

/* Company names never match exactly across sources. Reduce both to the same
   shape before comparing. */
function nameKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(limited|ltd|private|pvt|india|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* Live and forthcoming issues from BSE. Used only to find IPO_NO for
   category demand lookups. */
async function bsePublicIssues() {
  const r = await fetch(`${BSE}/GetPublicIssue_par_updated/w?flag=1`, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json, text/plain, */*",
      Referer: "https://www.bseindia.com/",
      Origin: "https://www.bseindia.com",
    },
  });
  if (!r.ok) return [];
  const text = await r.text();
  if (!text.trim()) return [];
  try {
    const data = JSON.parse(text);
    const rows = Array.isArray(data?.Table) ? data.Table : [];
    return rows
      .filter((r) => /^ipo$/i.test(String(r.IR_flag || "").trim()))
      .map((r) => ({
        key: nameKey(r.Scrip_Name || r.LONG_NAME || r.short_name),
        ipoNo: String(r.IPO_NO || "").trim(),
      }))
      .filter((r) => r.key && r.ipoNo);
  } catch {
    return [];
  }
}

/* Subscription split by investor category. */
async function bseCategoryDemand(ipoNo) {
  const r = await fetch(
    `${BSE}/Pubissues_BBS_CumultveCatdem_ng/w?IPO_NO=${encodeURIComponent(ipoNo)}`,
    {
      headers: {
        "User-Agent": UA,
        Accept: "application/json, text/plain, */*",
        Referer: "https://www.bseindia.com/",
        Origin: "https://www.bseindia.com",
      },
    }
  );
  if (!r.ok) return null;
  const text = await r.text();
  if (!text.trim()) return null;
  try {
    const data = JSON.parse(text);
    const rows = Array.isArray(data?.Table) ? data.Table : [];
    const out = { qib: null, nii: null, retail: null, employee: null };
    rows.forEach((r) => {
      if (!/^\d+$/.test(String(r.SRNo || "").trim())) return;
      const label = String(r.col2 || "").toLowerCase();
      const times = num(r.col5);
      if (times == null) return;
      if (label.includes("qualified institutional")) out.qib = times;
      else if (label.includes("non institutional")) out.nii = times;
      else if (label.includes("retail")) out.retail = times;
      else if (label.includes("employee")) out.employee = times;
    });
    return Object.values(out).some((v) => v != null) ? out : null;
  } catch {
    return null;
  }
}

/* Run a handful at a time to avoid flooding BSE. */
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

/* The market's calendar date in IST. */
function istToday() {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  } catch {
    return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  }
}

/* -------------------------------- assembly -------------------------------- */

function normaliseUpstoxIpo(item) {
  return {
    id: item.id || "",
    symbol: item.symbol || "",
    company: (item.name || "").replace(/\s*ipo\s*$/i, "").trim(),
    category: item.issue_type === "sme" ? "SME" : "Mainboard",
    priceMin: num(item.minimum_price),
    priceMax: num(item.maximum_price),
    openDate: item.bidding_start_date || "",
    closeDate: item.bidding_end_date || "",
    issueSize: num(item.issue_size),
    subscription: num(item.total_subscription),
    status: item.status || "",
    isin: item.isin || "",
    industry: item.industry || "",
    live: item.status === "open",
    // Filled in from details
    lotSize: null,
    lotCost: null,
    registrar: "",
    listingPrice: null,
    listingDate: "",
    allotmentDate: "",
    categories: null,
    source: "Upstox",
  };
}

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.UPSTOX_ANALYTICS_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "UPSTOX_ANALYTICS_TOKEN not configured" });
  }

  try {
    const today = istToday();

    /* Fetch open and upcoming IPOs from Upstox (both regular and SME). */
    const [openRegular, openSme, upcomingRegular, upcomingSme] = await Promise.all([
      fetchAllIpos(token, "open", "regular").catch(() => []),
      fetchAllIpos(token, "open", "sme").catch(() => []),
      fetchAllIpos(token, "upcoming", "regular").catch(() => []),
      fetchAllIpos(token, "upcoming", "sme").catch(() => []),
    ]);

    const allRaw = [...openRegular, ...openSme, ...upcomingRegular, ...upcomingSme];

    // Dedupe by id
    const byId = new Map();
    allRaw.forEach((item) => {
      if (item.id && !byId.has(item.id)) byId.set(item.id, item);
    });

    const ipos = [...byId.values()].map(normaliseUpstoxIpo);

    if (!ipos.length) {
      return res.status(502).json({
        error: "Upstox returned no IPOs. There may genuinely be none open/upcoming.",
      });
    }

    /* Fetch details for each IPO (lot size, timeline, registrar).
       Limited to 4 concurrent to stay well within rate limits. */
    const details = await mapLimited(ipos, 4, (ipo) =>
      fetchIpoDetail(token, ipo.id)
    );

    details.forEach((detail, i) => {
      if (!detail) return;
      const ipo = ipos[i];
      ipo.lotSize = num(detail.lot_size);
      ipo.registrar = detail.registrar_info?.name || "";
      ipo.listingPrice = num(detail.listing_price);
      ipo.listingDate = detail.timeline?.listing_date || "";
      ipo.allotmentDate = detail.timeline?.allotment_date || "";
      if (ipo.lotSize && ipo.priceMax != null) {
        ipo.lotCost = ipo.lotSize * ipo.priceMax;
      }
      // Fill in subscription from detail if missing from list
      if (ipo.subscription == null && detail.total_subscription != null) {
        ipo.subscription = num(detail.total_subscription);
      }
    });

    /* Enrich with BSE category demand for open IPOs. */
    let lotSource = "Upstox";
    try {
      const bseRows = await bsePublicIssues();
      const bseByKey = new Map(bseRows.map((r) => [r.key, r]));

      const openIpos = ipos.filter((ipo) => ipo.live);
      const matched = openIpos
        .map((ipo) => ({ ipo, hit: bseByKey.get(nameKey(ipo.company)) }))
        .filter((m) => m.hit);

      const categories = await mapLimited(matched, 4, (m) =>
        bseCategoryDemand(m.hit.ipoNo)
      );

      categories.forEach((cat, i) => {
        if (cat) matched[i].ipo.categories = cat;
      });
    } catch {
      // BSE enrichment failed — not critical
    }

    ipos.sort((a, b) => (a.closeDate || "").localeCompare(b.closeDate || ""));

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({
      source: "Upstox",
      lotSource,
      fetchedAt: new Date().toISOString(),
      ipos,
    });
  } catch (error) {
    return res.status(502).json({ error: error.message || "Could not reach Upstox" });
  }
}
