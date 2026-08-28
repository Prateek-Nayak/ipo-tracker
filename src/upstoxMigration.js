const STORAGE_PREFIX = "ipo_ledger_";

function nameKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(limited|ltd|private|pvt|india|the|ipo)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactKey(s) {
  return String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function todayISO() {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  } catch {
    return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  }
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function jsonResponse(data, original) {
  const headers = new Headers(original?.headers || {});
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { status: original?.status || 200, headers });
}

function installApiGuard() {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const input = args[0];
    const url = typeof input === "string" ? input : input?.url || "";

    if (!url.includes("/api/ipos")) return response;

    try {
      const data = await response.clone().json();
      if (!Array.isArray(data.ipos)) return response;

      // Server-side /api/ipos applies the same rule, but keep a client guard so
      // stale deployments or cached responses can never leak undated IPOs.
      data.ipos = data.ipos.filter((ipo) => ipo?.openDate && ipo?.closeDate);

      // Subscription is meaningful only while bidding is actually open.
      const today = todayISO();
      data.ipos = data.ipos.map((ipo) => ({
        ...ipo,
        source: "Upstox",
        subscription: ipo.openDate <= today && ipo.closeDate >= today ? ipo.subscription : null,
        categories: ipo.openDate <= today && ipo.closeDate >= today ? ipo.categories : null,
      }));

      return jsonResponse(data, response);
    } catch {
      return response;
    }
  };
}

async function migrateLocalAndCloud() {
  let localIpos;
  try {
    localIpos = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}ipos`) || "[]");
  } catch {
    return;
  }
  if (!Array.isArray(localIpos) || !localIpos.length) return;

  const aliases = [];
  localIpos.forEach((ipo) => {
    [ipo.company, ipo.symbol, ipo.isin].forEach((v) => { if (v) aliases.push(String(v)); });
  });
  const keys = [...new Set(aliases)].slice(0, 120).join("|");
  if (!keys) return;

  try {
    const response = await fetch(`/api/listings?keys=${encodeURIComponent(keys)}&at=${Date.now()}`);
    if (!response.ok) return;
    const data = await response.json();
    const byAlias = new Map();
    (data.listings || []).forEach((l) => {
      [l.key, l.shortName, l.symbol, l.isin].filter(Boolean).forEach((v) => {
        byAlias.set(nameKey(v), l);
        byAlias.set(compactKey(v), l);
      });
    });

    let changed = false;
    const migrated = localIpos.map((ipo) => {
      const hit = [ipo.company, ipo.symbol, ipo.isin]
        .filter(Boolean)
        .map((v) => byAlias.get(nameKey(v)) || byAlias.get(compactKey(v)))
        .find(Boolean);
      if (!hit) return ipo;

      changed = true;
      const next = {
        ...ipo,
        source: "Upstox",
        upstoxId: hit.id || ipo.upstoxId || "",
        priceAsOf: data.fetchedAt || new Date().toISOString(),
      };
      if (hit.shortName && !next.symbol) next.symbol = hit.shortName;
      if (hit.isin) next.isin = hit.isin;
      if (hit.openDate) next.openDate = hit.openDate;
      if (hit.closeDate) {
        next.closeDate = hit.closeDate;
        next.applicationDate = hit.closeDate;
      }
      if (hit.priceMax != null) next.priceBand = String(hit.priceMax);
      if (hit.lotSize != null) next.lotSize = String(hit.lotSize);
      if (hit.listingOpen != null) {
        next.listingPrice = String(hit.listingOpen);
        next.listingPriceSource = "upstox-listing-price";
      }
      if (hit.listedOn) next.listingDate = hit.listedOn;
      if (hit.allotmentDate) next.allotmentDate = hit.allotmentDate;
      if (hit.currentPrice != null) next.currentPrice = String(hit.currentPrice);
      if (next.lotSize && next.priceBand) {
        next.applications = (next.applications || []).map((a) => {
          const amount = (Number(a.lots) || 0) * Number(next.lotSize) * Number(next.priceBand);
          return amount > 0 ? { ...a, amountBlocked: String(amount) } : a;
        });
      }
      return next;
    });

    if (!changed) return;
    localStorage.setItem(`${STORAGE_PREFIX}ipos`, JSON.stringify(migrated));

    // If the user is already signed in, update only the IPO row in Supabase so
    // cloud data is not left carrying the legacy BSE source indefinitely.
    const session = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}session`) || "null");
    const url = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
    const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
    const userId = session?.user?.id;
    if (!url || !anon || !session?.access_token || !userId) return;

    const r = await fetch(`${url}/rest/v1/user_data?on_conflict=user_id,kind`, {
      method: "POST",
      headers: {
        apikey: anon,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        user_id: userId,
        kind: "ipos",
        data: migrated,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!r.ok) console.warn("Could not push IPO source migration to cloud", r.status);
  } catch (e) {
    console.warn("Upstox legacy IPO migration skipped", e);
  }
}

function installUiRules() {
  const patch = () => {
    const today = todayISO();
    document.querySelectorAll("button, span, div").forEach((el) => {
      const text = (el.textContent || "").trim();
      if (text === "2024" || text === "2025") {
        const liveSheet = el.closest("div[style*='overflowY']");
        if (liveSheet) el.style.display = "none";
      }

      // The live IPO sheet's generic lifecycle badge says UPCOMING/LISTS.
      // For a finalized upcoming IPO the useful deadline is its close date.
      if ((text === "UPCOMING" || /^LISTS\s/.test(text)) && el.children.length === 0) {
        const container = el.closest("label");
        const body = container?.textContent || "";
        const match = body.match(/(\d{4}-\d{2}-\d{2})\s*$/);
        if (match && match[1] > today) el.textContent = `Closes ${fmtDate(match[1])}`;
      }

      const bse = {
        "Fetching from BSE…": "Fetching from Upstox…",
        "matched on BSE": "matched on Upstox",
        "Listing Price — day-one open (from BSE, ₹)": "Listing Price — day-one open (from Upstox, ₹)",
        "Listing Day Close (from BSE, ₹)": "Listing Day Close (from Upstox, ₹)",
        "BSE has none for this issue. Refreshing prices fills them in when it does.": "Upstox has no dates for this issue yet. Refreshing IPO data fills them in when available.",
        "A refresh overwrites these whenever BSE has its own value.": "A refresh overwrites these whenever Upstox has its own value.",
        "Issues and subscription from NSE; lot size and the retail book from BSE.": "Issues, dates and IPO metadata from Upstox; category-wise subscription from BSE.",
      };
      if (Object.prototype.hasOwnProperty.call(bse, text)) el.textContent = bse[text];
    });
  };

  patch();
  const observer = new MutationObserver(patch);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}

export async function bootstrapUpstoxMigration() {
  installApiGuard();
  await migrateLocalAndCloud();
  return installUiRules();
}
