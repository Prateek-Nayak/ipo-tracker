const STORAGE_PREFIX = "ipo_ledger_";

function nameKey(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\b(limited|ltd|private|pvt|india|the|ipo)\b/g, " ").replace(/\s+/g, " ").trim();
}
function compactKey(s) { return String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
function todayISO() {
  try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()); }
  catch { return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10); }
}
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
function jsonResponse(data, original) {
  const headers = new Headers(original?.headers || {}); headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { status: original?.status || 200, headers });
}

function installApiGuard() {
  if (window.__ipoUpstoxApiGuard) return;
  window.__ipoUpstoxApiGuard = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const input = args[0]; const url = typeof input === "string" ? input : input?.url || "";
    if (!url.includes("/api/ipos")) return response;
    try {
      const data = await response.clone().json();
      if (!Array.isArray(data.ipos)) return response;
      const today = todayISO();
      data.ipos = data.ipos.filter((ipo) => ipo?.openDate && ipo?.closeDate).map((ipo) => ({
        ...ipo, source: "Upstox",
        subscription: ipo.openDate <= today && ipo.closeDate >= today ? ipo.subscription : null,
        categories: ipo.openDate <= today && ipo.closeDate >= today ? ipo.categories : null,
      }));
      return jsonResponse(data, response);
    } catch { return response; }
  };
}

function readSession() {
  try { return JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}session`) || "null"); } catch { return null; }
}
function cloudConfig() {
  return { url: (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, ""), anon: import.meta.env.VITE_SUPABASE_ANON_KEY || "" };
}
async function readCloudIpos(session) {
  const { url, anon } = cloudConfig();
  if (!url || !anon || !session?.access_token || !session?.user?.id) return [];
  const r = await fetch(`${url}/rest/v1/user_data?select=kind,data&kind=eq.ipos`, { headers: { apikey: anon, Authorization: `Bearer ${session.access_token}` } });
  if (!r.ok) return [];
  const rows = await r.json(); return Array.isArray(rows?.[0]?.data) ? rows[0].data : [];
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

/* The same IPO can legitimately exist more than once in the ledger because it
   may have been imported twice or deliberately kept as separate records. That
   must not create two different market prices. Share market metadata between
   duplicate records without merging their applications or their IDs. */
function normalizeDuplicateMarketData(records) {
  if (!Array.isArray(records) || records.length < 2) return { records, changed: false };
  const groups = new Map();
  records.forEach((ipo) => {
    const key = compactKey(ipo?.isin) || compactKey(ipo?.symbol) || nameKey(ipo?.company);
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(ipo);
  });

  let changed = false;
  const out = records.map((ipo) => {
    const key = compactKey(ipo?.isin) || compactKey(ipo?.symbol) || nameKey(ipo?.company);
    const group = groups.get(key) || [];
    if (group.length < 2) return ipo;

    const best = group.find((x) => Number(x?.currentPrice) > 0) ||
      group.find((x) => Number(x?.listingPrice) > 0) || group[0];
    const patch = {};

    if (Number(best?.currentPrice) > 0 && Number(ipo?.currentPrice) !== Number(best.currentPrice)) {
      patch.currentPrice = String(best.currentPrice);
      patch.priceAsOf = best.priceAsOf || new Date().toISOString();
    }
    if (!ipo.listingPrice && best.listingPrice) {
      patch.listingPrice = String(best.listingPrice);
      if (best.listingPriceSource) patch.listingPriceSource = best.listingPriceSource;
    }
    if (!ipo.listingDate && best.listingDate) patch.listingDate = best.listingDate;
    if (!ipo.allotmentDate && best.allotmentDate) patch.allotmentDate = best.allotmentDate;
    if (!ipo.symbol && best.symbol) patch.symbol = best.symbol;
    if (!ipo.isin && best.isin) patch.isin = best.isin;

    if (!Object.keys(patch).length) return ipo;
    changed = true;
    return { ...ipo, ...patch };
  });
  return { records: out, changed };
}

async function migrateRecords(records) {
  if (!Array.isArray(records) || !records.length) return { records: [], changed: false };
  const aliases = [];
  records.forEach((ipo) => [ipo.company, ipo.symbol, ipo.isin].forEach((v) => { if (v) aliases.push(String(v)); }));
  const keys = [...new Set(aliases)].slice(0, 120).join("|"); if (!keys) return { records, changed: false };
  const response = await fetch(`/api/listings?keys=${encodeURIComponent(keys)}&at=${Date.now()}`);
  if (!response.ok) return { records, changed: false };
  const payload = await response.json(); const byAlias = new Map();
  (payload.listings || []).forEach((l) => [l.key, l.shortName, l.symbol, l.isin].filter(Boolean).forEach((v) => { byAlias.set(nameKey(v), l); byAlias.set(compactKey(v), l); }));
  let changed = false;
  const migrated = records.map((ipo) => {
    const hit = [ipo.company, ipo.symbol, ipo.isin].filter(Boolean).map((v) => byAlias.get(nameKey(v)) || byAlias.get(compactKey(v))).find(Boolean);
    if (!hit) return ipo;
    changed = true;
    const next = { ...ipo, source: "Upstox", upstoxId: hit.id || ipo.upstoxId || "", priceAsOf: payload.fetchedAt || new Date().toISOString() };
    if (hit.shortName) next.symbol = hit.shortName; if (hit.isin) next.isin = hit.isin;
    if (hit.openDate) next.openDate = hit.openDate; if (hit.closeDate) { next.closeDate = hit.closeDate; next.applicationDate = hit.closeDate; }
    if (hit.priceMax != null) next.priceBand = String(hit.priceMax); if (hit.lotSize != null) next.lotSize = String(hit.lotSize);
    if (hit.listingOpen != null) { next.listingPrice = String(hit.listingOpen); next.listingPriceSource = "upstox-listing-price"; }
    if (hit.listedOn) next.listingDate = hit.listedOn; if (hit.allotmentDate) next.allotmentDate = hit.allotmentDate;
    if (hit.currentPrice != null) next.currentPrice = String(hit.currentPrice);
    if (next.lotSize && next.priceBand) next.applications = (next.applications || []).map((a) => { const amount = (Number(a.lots) || 0) * Number(next.lotSize) * Number(next.priceBand); return amount > 0 ? { ...a, amountBlocked: String(amount) } : a; });
    return next;
  });
  const normalized = normalizeDuplicateMarketData(migrated);
  return { records: normalized.records, changed: changed || normalized.changed };
}

async function migrateLocalAndCloud() {
  const session = readSession(); let local = [];
  try { local = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}ipos`) || "[]"); } catch { local = []; }
  if (!Array.isArray(local)) local = [];
  try {
    const cloud = await readCloudIpos(session); const source = mergeIpos(local, cloud); if (!source.length) return;
    const migrated = await migrateRecords(source); if (!migrated.changed) return;
    localStorage.setItem(`${STORAGE_PREFIX}ipos`, JSON.stringify(migrated.records));
    const { url, anon } = cloudConfig(); const userId = session?.user?.id;
    if (!url || !anon || !session?.access_token || !userId) return;
    await fetch(`${url}/rest/v1/user_data?on_conflict=user_id,kind`, { method: "POST", headers: { apikey: anon, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ user_id: userId, kind: "ipos", data: migrated.records, updated_at: new Date().toISOString() }) });
  } catch (e) { console.warn("Upstox legacy IPO migration skipped", e); }
}

/* Manual Sync now is intentionally a pull/reconcile operation. The React
   button used to call pushToCloud(), which means a phone containing stale data
   could overwrite the newer laptop copy. Pull the cloud ledger first, replace
   local tables, then reload so React starts from the reconciled state. */
async function pullCloudLedger() {
  const session = readSession(); const { url, anon } = cloudConfig();
  if (!url || !anon || !session?.access_token || !session?.user?.id) return false;
  const r = await fetch(`${url}/rest/v1/user_data?select=kind,data&user_id=eq.${encodeURIComponent(session.user.id)}`, { headers: { apikey: anon, Authorization: `Bearer ${session.access_token}` } });
  if (!r.ok) return false;
  const rows = await r.json();
  const byKind = new Map((rows || []).map((x) => [x.kind, Array.isArray(x.data) ? x.data : []]));
  if (!["accounts", "ipos", "transfers"].some((k) => byKind.has(k))) return false;
  ["accounts", "ipos", "transfers"].forEach((k) => { if (byKind.has(k)) localStorage.setItem(`${STORAGE_PREFIX}${k}`, JSON.stringify(byKind.get(k))); });
  if (byKind.has("trash")) localStorage.setItem(`${STORAGE_PREFIX}trash`, JSON.stringify(byKind.get("trash")));
  localStorage.setItem(`${STORAGE_PREFIX}owner`, session.user.id);
  return true;
}

/* Delete remains a normal destructive action. The retained database copy is
   implementation-only; no deleted-record screen or recovery action is exposed. */
function installDeleteCopyGuard() {
  if (window.__ipoDeleteCopyGuard) return;
  window.__ipoDeleteCopyGuard = true;
  const originalConfirm = window.confirm.bind(window);
  window.confirm = (message) => {
    let text = String(message || "");
    text = text
      .replace(/\s*It is kept, and can be put back from Sync & Data\.?/gi, "")
      .replace(/\s*It can be put back from Sync & Data\.?/gi, "")
      .replace(/\s*You can put it back from Sync & Data\.?/gi, "")
      .replace(/\s*The account itself is kept and can be put back from Sync & Data\.?/gi, "")
      .replace(/\s*The account itself is kept and can be put back from Sync & Data\.*/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    return originalConfirm(text);
  };
}

function hideDeletedUi() {
  const elements = Array.from(document.querySelectorAll("body *"));

  /* Remove the entire deleted-record section from Sync & Data. The underlying
     retained data remains available to the sync layer but is never presented. */
  const deletedLabel = elements.find((el) => /^Deleted\s*\(/i.test((el.textContent || "").trim()) && el.children.length === 1);
  if (deletedLabel) {
    deletedLabel.style.display = "none";
    let sibling = deletedLabel.nextElementSibling;
    while (sibling) {
      const text = (sibling.textContent || "").trim();
      if (/^Restore from a backup/i.test(text)) break;
      sibling.style.display = "none";
      sibling = sibling.nextElementSibling;
    }
  }

  /* The backup import is unrelated to deleted records, but the old UI called it
     a restore action. Keep normal JSON export/download and remove that wording
     and entry point from the visible UI. */
  elements.forEach((el) => {
    const text = (el.textContent || "").trim();
    if (/^Restore from a backup/i.test(text)) {
      el.style.display = "none";
      if (el.parentElement && el.parentElement.children.length <= 2) el.parentElement.style.display = "none";
    }
    if (/^(Show \d+ deleted item|Show \d+ deleted items|Restore|Restore all|Deleted items|Trash)$/i.test(text) || /^Restore\b/i.test(text)) {
      el.style.display = "none";
    }
  });
}

function patchBadgesAndText() {
  const today = todayISO();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const replacements = [
    ["Fetching from BSE…", "Fetching from Upstox…"],
    ["matched on BSE", "matched on Upstox"],
    ["from BSE, ₹", "from Upstox, ₹"],
    ["whenever BSE has its own value", "whenever Upstox has its own value"],
    ["Pull listing and current market prices from BSE", "Pull listing and current market prices from Upstox"],
  ];
  const nodes = []; let node; while ((node = walker.nextNode())) nodes.push(node);
  nodes.forEach((textNode) => {
    let text = textNode.nodeValue || "";
    replacements.forEach(([a, b]) => { text = text.split(a).join(b); });
    text = text.replace(/\s*·\s*\d+\s+deleted\b/gi, "");
    if (!/subscription/i.test(textNode.parentElement?.textContent || "")) text = text.replace(/\bBSE\b/g, "Upstox");
    if (text !== textNode.nodeValue) textNode.nodeValue = text;
  });

  /* A listing badge is secondary to an allotment date. If the card itself says
     an allotment still needs to be recorded, a same-day/future listing badge
     must not be shown ahead of that event. */
  document.querySelectorAll("span, div, button").forEach((el) => {
    const text = (el.textContent || "").trim();
    if (!/^LISTS(?:\s|$)/i.test(text) || el.children.length) return;
    const container = el.closest("article, li, label, section, div");
    const body = container?.textContent || "";
    if (!/RECORD ALLOTMENT/i.test(body)) return;

    let allot = "";
    try {
      const raw = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}ipos`) || "[]");
      const candidates = raw.filter((i) => i?.company && body.includes(i.company));
      const exact = candidates.find((i) => i.allotmentDate) || candidates.find((i) => i.company);
      allot = exact?.allotmentDate || "";
    } catch {}

    if (allot && allot >= today) {
      el.textContent = allot === today ? "ALLOTMENT TODAY" : `ALLOTMENT ${fmtDate(allot).toUpperCase()}`;
      el.style.display = "inline-block";
    }
  });
}

function installUiRules() {
  if (window.__ipoUpstoxUiRules) return () => {};
  window.__ipoUpstoxUiRules = true;
  let syncingPull = false;
  installDeleteCopyGuard();

  const patch = () => {
    hideDeletedUi();
    patchBadgesAndText();
  };
  patch();
  const observer = new MutationObserver(patch);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

  /* Intercept the existing Sync now button. Pulling first prevents a stale
     device from pushing its old ledger over the newer cloud state. */
  document.addEventListener("click", async (event) => {
    if (syncingPull) return;
    const button = event.target?.closest?.("button"); if (!button) return;
    const text = (button.textContent || "").trim();
    if (!/^Sync now$/i.test(text)) return;
    event.preventDefault(); event.stopImmediatePropagation(); syncingPull = true;
    button.disabled = true;
    try { if (await pullCloudLedger()) window.location.reload(); }
    finally { syncingPull = false; button.disabled = false; }
  }, true);
  return () => observer.disconnect();
}

export async function bootstrapUpstoxMigration() {
  installApiGuard();
  await migrateLocalAndCloud();
  return installUiRules();
}
