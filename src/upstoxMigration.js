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
  return { records: migrated, changed };
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

function installUiRules() {
  if (window.__ipoUpstoxUiRules) return () => {};
  window.__ipoUpstoxUiRules = true;
  let syncingPull = false;
  const patch = () => {
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
    nodes.forEach((textNode) => { let text = textNode.nodeValue || ""; replacements.forEach(([a, b]) => { text = text.split(a).join(b); }); if (!/subscription/i.test(textNode.parentElement?.textContent || "")) text = text.replace(/\bBSE\b/g, "Upstox"); if (text !== textNode.nodeValue) textNode.nodeValue = text; });

    /* Restore/trash UI is removed completely. Deleting remains available; the
       deleted records can still be retained internally for sync safety. */
    document.querySelectorAll("button, a, [role='button'], span, div").forEach((el) => {
      const text = (el.textContent || "").trim();
      if (/^(Show \d+ deleted item|Show \d+ deleted items|Restore|Restore all|Deleted items|Trash)$/i.test(text) || /^Restore\b/i.test(text)) el.style.display = "none";
      if (text === "2024" || text === "2025") el.style.display = "none";
    });

    /* Badge rule: before allotment, the card must show allotment information,
       never a future LISTS badge. Once allotment is past, LISTS is allowed. */
    document.querySelectorAll("span, div, button").forEach((el) => {
      const text = (el.textContent || "").trim();
      if (!/^LISTS(?:\s|$)/i.test(text) || el.children.length) return;
      const container = el.closest("article, li, label, section, div"); const body = container?.textContent || "";
      const a = body.match(/Allotment\s+(\d{2}\s+[A-Za-z]{3}|\d{4}-\d{2}-\d{2})/i);
      if (!a) return;
      let allot = "";
      if (/^\d{4}-/.test(a[1])) allot = a[1]; else { const m = a[1].match(/(\d{2})\s+([A-Za-z]{3})/i); if (m) { const months = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 }; allot = `${new Date().getFullYear()}-${String(months[m[2].slice(0,3)] || 1).padStart(2,"0")}-${m[1]}`; } }
      if (allot && allot > today) { el.textContent = `ALLOTMENT ${fmtDate(allot).toUpperCase()}`; el.style.display = "inline-block"; }
    });
  };
  patch();
  const observer = new MutationObserver(patch); observer.observe(document.body, { childList: true, subtree: true, characterData: true });

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
