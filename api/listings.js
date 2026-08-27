/*
 * Listing-day and current market prices for IPOs that have already listed,
 * proxied from BSE.
 *
 * This is what turns `listingPrice` from a number typed once into something
 * that stays true. BSE also gives the current traded price, which is the
 * honest basis for an unrealised gain — a stock that listed at 372 and now
 * trades at 251 has not gained anything.
 *
 * No API key: the data is public. BSE only requires browser-ish headers.
 */

const BSE = "https://api.bseindia.com/BseIndiaAPI/api";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Company names never match exactly across sources: "Aye Finance Limited" here,
// "AYE FINANCE LTD" there. Reduce both sides to the same shape before comparing.
function nameKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(limited|ltd|private|pvt|india|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const isoDate = (v) => (typeof v === "string" && v.length >= 10 ? v.slice(0, 10) : "");

async function bseYear(year) {
  // type=1 covers mainboard and SME together; type=2 would be mainboard only.
  const url = `${BSE}/MoreCompanyN/w?Fromdt=${year}&company=&flag=1&type=1`;
  const r = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json, text/plain, */*",
      Referer: "https://www.bseindia.com/",
      Origin: "https://www.bseindia.com",
    },
  });
  if (!r.ok) throw new Error(`BSE responded ${r.status} for ${year}`);
  const text = await r.text();
  if (!text.trim()) return [];
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`BSE returned a non-JSON body for ${year}`);
  }
  return Array.isArray(data?.Table) ? data.Table : [];
}

/* Bidding windows. flag=1 is live and forthcoming, flag=2 is closed issues;
   between them they carry the open and close dates that the listing feed does
   not. BSE only keeps the current year here, so older IPOs get a listing date
   but no bidding window - there is nowhere to read one from. */
async function bseIssueWindows() {
  const pull = async (flag) => {
    const url = `${BSE}/GetPublicIssue_par_updated/w?flag=${flag}`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json, text/plain, */*",
        Referer: "https://www.bseindia.com/",
        Origin: "https://www.bseindia.com",
      },
    });
    if (!r.ok) return [];
    const t = await r.text();
    if (!t.trim()) return [];
    try {
      return JSON.parse(t)?.Table || [];
    } catch {
      return [];
    }
  };

  const rows = (await Promise.all([pull(1), pull(2)])).flat();
  const byKey = new Map();
  rows.forEach((r) => {
    const key = nameKey(r.Scrip_Name || r.LONG_NAME || r.short_name);
    if (!key) return;
    const openDate = isoDate(r.Start_Dt);
    const closeDate = isoDate(r.End_Dt);
    if (!openDate && !closeDate) return;
    if (!byKey.has(key)) {
      const band = parseBand(r.Price_Band);
      byKey.set(key, {
        openDate,
        closeDate,
        priceMin: band.min,
        priceMax: band.max,
        ipoNo: String(r.IPO_NO || "").trim(),
        company: String(r.Scrip_Name || r.LONG_NAME || "").replace(/\s+/g, " ").trim(),
      });
    }
  });
  return byKey;
}

// "131.00 - 138.00" -> { min: 131, max: 138 }
function parseBand(s) {
  const nums = String(s || "").match(/\d+(?:\.\d+)?/g);
  if (!nums || !nums.length) return { min: null, max: null };
  const vals = nums.map(Number);
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

/* Market lot, which lives only on the per-issue endpoint. One request each, so
   it is fetched for the issues the caller actually asked about rather than for
   every issue BSE has ever run. */
async function bseLotSize(ipoNo) {
  const url = `${BSE}/GetMkt_ISSUE_BBS_IPO/w?IPO_NO=${encodeURIComponent(ipoNo)}`;
  const r = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json, text/plain, */*",
      Referer: "https://www.bseindia.com/",
      Origin: "https://www.bseindia.com",
    },
  });
  if (!r.ok) return null;
  const t = await r.text();
  if (!t.trim()) return null;
  try {
    const d = JSON.parse(t)?.IPONO_0?.[0];
    const lot = parseInt(String(d?.Market_Lot || "").replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(lot) && lot > 0 ? lot : null;
  } catch {
    return null;
  }
}

async function mapLimited(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        try { out[idx] = await fn(items[idx]); } catch { out[idx] = null; }
      }
    })
  );
  return out;
}

function normalise(row) {
  return {
    company: String(row.CompanyName || "").replace(/\s+/g, " ").trim(),
    key: nameKey(row.CompanyName),
    shortName: row.Company_Short_Name || "",
    issuePrice: num(row.IssuePrice),
    listedOn: isoDate(row.ListedOn),
    listingClose: num(row.ListingDayClose),
    lotSize: null,
    priceMin: null,
    priceMax: null,
    listingDayGain: num(row.ListingDayGain),
    currentPrice: num(row.CurrentPrice),
    gainSinceIssue: num(row.GainLoss),
    bseUrl: row.IMAGE || "",
  };
}

export const config = { maxDuration: 20 };

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  /* BSE's Fromdt is a starting year, not a single one: Fromdt=2023 returns
     2023 through today in one response. So one call with the earliest year
     the caller cares about covers everything, and asking for several years
     would just fetch the same rows repeatedly. */
  const thisYear = new Date().getFullYear();
  const asked = parseInt(String(req.query?.from ?? req.query?.years ?? "").split(",").pop(), 10);
  const from = Number.isFinite(asked)
    ? Math.min(Math.max(asked, 2010), thisYear)
    : thisYear - 1;

  try {
    const [rows, windows] = await Promise.all([
      bseYear(from),
      bseIssueWindows().catch(() => new Map()),
    ]);

    // One row per company. A row that actually carries a current price beats
    // one that does not; otherwise the more recent listing wins.
    const byKey = new Map();
    rows.forEach((raw) => {
      const row = normalise(raw);
      if (!row.key) return;
      const prev = byKey.get(row.key);
      if (!prev) { byKey.set(row.key, row); return; }
      const better =
        (row.currentPrice != null && prev.currentPrice == null) ||
        (row.listedOn || "") > (prev.listedOn || "");
      if (better) byKey.set(row.key, row);
    });

    // Attach bidding windows, and keep issues that have not listed yet — they
    // have no price but they do have dates worth filling in.
    windows.forEach((w, key) => {
      const existing = byKey.get(key);
      if (existing) {
        Object.assign(existing, {
          openDate: w.openDate, closeDate: w.closeDate,
          priceMin: w.priceMin, priceMax: w.priceMax, ipoNo: w.ipoNo,
        });
      } else {
        byKey.set(key, {
          company: w.company || "", key, shortName: "",
          issuePrice: null, listedOn: "", listingClose: null, listingDayGain: null,
          currentPrice: null, gainSinceIssue: null, bseUrl: "",
          openDate: w.openDate, closeDate: w.closeDate,
          priceMin: w.priceMin, priceMax: w.priceMax, ipoNo: w.ipoNo,
        });
      }
    });

    /* Lot sizes for the companies the caller named. Without this the blocked
       amount cannot be worked out, and it is one request per issue, so the
       caller says which ones matter instead of us fetching all of them. */
    const wanted = String(req.query?.keys || "")
      .split("|")
      .map((k) => nameKey(k))
      .filter(Boolean);

    if (wanted.length) {
      const targets = wanted
        .map((k) => byKey.get(k))
        .filter((row) => row && row.ipoNo && row.lotSize == null)
        .slice(0, 25);
      const lots = await mapLimited(targets, 5, (row) => bseLotSize(row.ipoNo));
      lots.forEach((lot, i) => { if (lot) targets[i].lotSize = lot; });
    }

    const listings = [...byKey.values()].sort((a, b) => (b.listedOn || "").localeCompare(a.listedOn || ""));

    if (!listings.length) {
      return res.status(502).json({ error: "BSE returned no listings. It may be blocking this server." });
    }

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1800");
    return res.status(200).json({
      source: "BSE",
      fetchedAt: new Date().toISOString(),
      from,
      listings,
    });
  } catch (error) {
    return res.status(502).json({ error: error.message || "Could not reach BSE" });
  }
}
