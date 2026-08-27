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

/* BSE drops connections intermittently — a given query can throw "fetch failed"
   for a spell and then recover — so a transient failure gets one more go before
   being believed. */
async function bseFetch(url, attempts = 2) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "application/json, text/plain, */*",
          Referer: "https://www.bseindia.com/",
          Origin: "https://www.bseindia.com",
        },
      });
      if (!r.ok) throw new Error(`BSE responded ${r.status}`);
      return r;
    } catch (e) {
      last = e;
      if (i < attempts - 1) await new Promise((res) => setTimeout(res, 400));
    }
  }
  throw last;
}

async function moreCompany(year, type) {
  const r = await bseFetch(`${BSE}/MoreCompanyN/w?Fromdt=${year}&company=&flag=1&type=${type}`);
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

/* The two variants carry different things and both are needed: type=1 lists
   mainboard and SME together but omits the company link, while type=2 is
   mainboard only and includes it. That link is the only place the scrip code
   appears, and without a scrip code there is no listing-day price to fetch. */
async function bseYear(year) {
  /* The two variants behave differently: type=1 is cumulative, so one call from
     the earliest year returns everything since. type=2 is per-year, so it has
     to be asked for each year separately - which is worth doing only because it
     is the sole carrier of the company link, and so of the scrip code. */
  const thisYear = new Date().getFullYear();
  const years = [];
  for (let y = year; y <= thisYear && years.length < 8; y++) years.push(y);

  const [all, ...perYear] = await Promise.all([
    moreCompany(year, 1),
    ...years.map((y) => moreCompany(y, 2).then((rows) => ({ ok: true, rows })).catch(() => ({ ok: false, rows: [] }))),
  ]);

  /* Category is inferred from absence — an issue is SME because it is *not* in
     the mainboard list — so it can only be asserted when that list actually
     arrived. A failed fetch would otherwise relabel every mainboard IPO as SME,
     which looks like data rather than like a failure. */
  const mainboardKnown = perYear.some((p) => p.ok && p.rows.length);

  const links = new Map();
  const mainboard = new Set();
  perYear.forEach((p) => p.rows.forEach((r) => {
    const k = nameKey(r.CompanyName);
    if (!k) return;
    mainboard.add(k);
    if (r.IMAGE) links.set(k, { IMAGE: r.IMAGE, Company_Short_Name: r.Company_Short_Name });
  }));

  const rows = all.map((r) => {
    const k = nameKey(r.CompanyName);
    const extra = links.get(k);
    return {
      ...r,
      ...(extra || {}),
      __category: mainboardKnown ? (mainboard.has(k) ? "Mainboard" : "SME") : "",
    };
  });

  return { rows, mainboardKnown, listingsKnown: all.length > 0 };
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
    /* The feed is public issues of every kind, and only a minority are IPOs:
       alongside them sit OFS, OTB, RI, FPO, DPI, BuyBack, ZCZP and CMN — better
       than half the rows. Hindustan Copper appearing as a closed 2026 "IPO" was
       an offer for sale by its promoter. Their dates must not be attached to a
       company's IPO record either, so the filter belongs here rather than only
       where standalone rows are added. */
    if (!/^ipo$/i.test(String(r.IR_flag || "").trim())) return;
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

/* The price a share actually listed at — the opening print on its first day.
   MoreCompanyN only carries the listing-day close, which on a volatile debut is
   a different number entirely. This is the daily OHLC endpoint, asked for a
   single date. Verified against a known listing: it returns the same close that
   MoreCompanyN reports, so its open is trustworthy too. */
async function bseListingOpen(scripCode, isoDay) {
  if (!scripCode || !/^\d{4}-\d{2}-\d{2}$/.test(isoDay || "")) return null;
  const [y, m, d] = isoDay.split("-");
  const dmy = `${d}/${m}/${y}`;
  const url =
    `${BSE}/StockpricesearchData/w?MonthDate=${dmy}&YearDate=${dmy}` +
    `&pageType=0&Scode=${encodeURIComponent(scripCode)}&Seg=C&rbType=D`;
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
    const row = JSON.parse(t)?.StockData?.[0];
    // This endpoint returns prices as display strings, so anything over a
    // thousand arrives grouped: "1,193.80". Number() makes that NaN, which
    // silently dropped every listing above Rs.1000.
    return { open: money(row?.qe_open), close: money(row?.qe_close) };
  } catch {
    return null;
  }
}

const money = (v) => {
  // Number("") is 0, so an absent price would otherwise become a confident zero.
  const s = String(v ?? "").replace(/,/g, "").trim();
  return s ? num(s) : null;
};

// The scrip code is embedded in the company link BSE returns: .../aye/544699/
function scripCodeFrom(url) {
  const m = String(url || "").match(/\/(\d{6})\/?$/);
  return m ? m[1] : "";
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
    category: row.__category || "",
    issuePrice: num(row.IssuePrice),
    listedOn: isoDate(row.ListedOn),
    listingClose: num(row.ListingDayClose),
    lotSize: null,
    listingOpen: null,
    priceMin: null,
    priceMax: null,
    listingDayGain: num(row.ListingDayGain),
    currentPrice: num(row.CurrentPrice),
    gainSinceIssue: num(row.GainLoss),
    bseUrl: row.IMAGE || "",
  };
}

export const config = { maxDuration: 30 };

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
    const [yearData, windows] = await Promise.all([
      bseYear(from),
      bseIssueWindows().catch(() => new Map()),
    ]);
    const rows = yearData.rows;

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
      const rowsFor = wanted.map((k) => byKey.get(k)).filter(Boolean);

      const lotTargets = rowsFor.filter((r) => r.ipoNo && r.lotSize == null).slice(0, 25);
      const openTargets = rowsFor
        .filter((r) => r.listedOn && scripCodeFrom(r.bseUrl))
        .slice(0, 25);

      const [lots, opens] = await Promise.all([
        mapLimited(lotTargets, 5, (r) => bseLotSize(r.ipoNo)),
        mapLimited(openTargets, 5, (r) => bseListingOpen(scripCodeFrom(r.bseUrl), r.listedOn)),
      ]);

      lots.forEach((lot, i) => { if (lot) lotTargets[i].lotSize = lot; });
      opens.forEach((o, i) => {
        if (!o) return;
        const row = openTargets[i];
        if (o.open != null) row.listingOpen = o.open;
        // Same-day close straight from the OHLC record, rather than the
        // aggregate feed's copy of it.
        if (o.close != null) row.listingClose = o.close;
      });
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
      categoryKnown: yearData.mainboardKnown,
      listingsKnown: yearData.listingsKnown,
      listings,
    });
  } catch (error) {
    return res.status(502).json({ error: error.message || "Could not reach BSE" });
  }
}
