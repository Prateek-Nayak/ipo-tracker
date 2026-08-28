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
      data.ipos = data.ipos.filter((ipo) => ipo?.openDate && ipo?.closeDate);
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

function readSession() {
  try { return JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}session`) || "null"); }
  catch { return null; }
}

function cloudConfig() {
  return {
    url: (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, ""),
    anon: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  };
}

async function readCloudIpos(session) {
  const { url, anon } = cloudConfig();
  if (!url || !anon || !session?.access_token || !session?.user?.id) return [];
  const r = await fetch(`${url}/rest/v1/user_data?select=kind,data&kind=eq.ipos`, {
    headers: { apikey: anon, Authorization: `Bearer ${session.access_token}` },
  });
  if (!r.ok) return [];
  const rows = await r.json();
  return Array.isArray(rows?.[0]?.data) ? rows[0].data : [];
}

function mergeIpos(a, b) {
  const byId = new Map();
  [...a, ...b].forEach((ipo) => {
    if (!ipo?.id) return;
    const old = byId.get(ipo.id);
    if (!old) { byId.set(ipo.id, ipo); return; }
    const apps = new Map((old.applications || []).map((x) => [x.id, x]));
    (ipo.applications || []).forEach((x) => apps.set(x.id, x));
    byId.set(ipo.id, { ...old, ...ipo, applications: [...apps.values()] });
  });
  return [...byId.values()];
}

async function migrateRecords(records) {
  if (!Array.isArray(records) || !records.length) return { records: [], changed: false };
  const aliases = [];
  records.forEach((ipo) => {
    [ipo.company, ipo.symbol, ipo.isin].forEach((v) => { if (v) aliases.push(String(v)); });
  });
  const keys = [...new Set(aliases)].slice(0, 120).join("|");
  if (!keys) return { records, changed: false };

  const response = await fetch(`/api/listings?keys=${encodeURIComponent(keys)}&at=${Date.now()}`);
  if (!response.ok) return { records, changed: false };
  const payload = await response.json();
  const byAlias = new Map();
  (payload.listings || []).forEach((l) => {
    [l.key, l.shortName, l.symbol, l.isin].filter(Boolean).forEach((v) => {
      byAlias.set(nameKey(v), l);
      byAlias.set(compactKey(v), l);
    });
  });

  let changed = false;
  const migrated = records.map((ipo) => {
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
      priceAsOf: payload.fetchedAt || new Date().toISOString(),
    };
    if (hit.shortName) next.symbol = hit.shortName;
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
  return { records: migrated, changed };
}

async function migrateLocalAndCloud() {
  const session = readSession();
  let local = [];
  try { local = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}ipos`) || "[]"); }
  catch { /* empty */ }
  if (!Array.isArray(local)) local = [];

  try {
    const cloud = await readCloudIpos(session);
    const source = mergeIpos(local, cloud);
    if (!source.length) return;

    const migrated = await migrateRecords(source);
    if (!migrated.changed) return;

    localStorage.setItem(`${STORAGE_PREFIX}ipos`, JSON.stringify(migrated.records));

    const { url, anon } = cloudConfig();
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
      body: JSON.stringify({ user_id: userId, kind: "ipos", data: migrated.records, updated_at: new Date().toISOString() }),
    });
    if (!r.ok) console.warn("Could not push IPO source migration to cloud", r.status);
  } catch (e) {
    console.warn("Upstox legacy IPO migration skipped", e);
  }
}

function installUiRules() {
  const patch = () => {
    const today = todayISO();

    // Replace only text nodes. This catches BSE wording embedded in longer
    // sentences while leaving the one intentional BSE exception — subscription
    // category demand — untouched.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const replacements = [
      ["Fetching from BSE…", "Fetching from Upstox…"],
      ["matched on BSE", "matched on Upstox"],
      ["Listing Price — day-one open (from BSE, ₹)", "Listing Price — day-one open (from Upstox, ₹)"],
      ["Listing Day Close (from BSE, ₹)", "Listing Day Close (from Upstox, ₹)"],
      ["BSE has none for this issue. Refreshing prices fills them in when it does.", "Upstox has no dates for this issue. Refreshing IPO data fills them in when available."],
      ["A refresh overwrites these whenever BSE has its own value.", "A refresh overwrites these whenever Upstox has its own value."],
      ["Issues and subscription from NSE; lot size and the retail book from BSE.", "Issues, dates and IPO metadata from Upstox; category-wise subscription from BSE."],
    ];
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach((textNode) => {
      let text = textNode.nodeValue || "";
      const parentText = textNode.parentElement?.textContent || "";
      replacements.forEach(([from, to]) => { text = text.split(from).join(to); });
      if (!/subscription/i.test(parentText)) text = text.replace(/\bBSE\b/g, "Upstox");
      if (text !== textNode.nodeValue) textNode.nodeValue = text;
    });

    document.querySelectorAll("button, span, div").forEach((el) => {
      const text = (el.textContent || "").trim();
      if (text === "2024" || text === "2025") el.style.display = "none";

      if ((text === "UPCOMING" || /^LISTS\s/.test(text)) && el.children.length === 0) {
        const container = el.closest("label");
        const body = container?.textContent || "";
        const match = body.match(/→\s*(\d{4}-\d{2}-\d{2})/);
        if (match && match[1] > today) el.textContent = `Closes ${fmtDate(match[1])}`;
      }
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
