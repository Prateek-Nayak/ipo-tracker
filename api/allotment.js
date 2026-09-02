/*
 * Allotment, straight from the registrar.
 *
 * The registrar is the only source that has every application for an issue.
 * The exchanges each hold only the bids routed through their own platform -
 * measured across six family PANs and three issues, BSE had seven of eighteen -
 * and which platform a bid took is decided by the broker, invisibly. Ask the
 * registrar and there is nothing to miss.
 *
 * Two registrars are reachable, and between them they take most mainboard
 * issues. Neither wants a captcha:
 *
 *   KFintech  a GET, with the PAN in a header and the issue in another. The
 *             issue list is baked into their status page's script bundle, so
 *             it is read from there rather than guessed at.
 *   MUFG      a POST of plain JSON. It carries a `token` field which the server
 *             does not check - an empty string is accepted - so nothing has to
 *             be solved or stored. If they ever start checking it, this adapter
 *             stops working and says so rather than reporting no application.
 *
 * Bigshare, the third, does enforce a captcha and issues no key that covers
 * more than the one lookup it was solved for - one captcha per PAN, which is
 * not automation. Issues registered there resolve to `null` here and are left
 * to be entered by hand.
 *
 *   GET /api/allotment?company=<name>                 which registrar has it
 *   GET /api/allotment?company=<name>&pans=A,B,C      and what they say
 *
 * Every reply carries the registrar's own words under `raw`, because a wrong
 * number that looks plausible is worse than an error, and the only way to tell
 * them apart is to see what was actually said.
 */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
const KF_QUERY = "https://0uz601ms56.execute-api.ap-south-1.amazonaws.com/prod/api/query";
const KF_PAGE = "https://ipostatus.kfintech.com/";
const MUFG = "https://in.mpms.mufg.com/Initial_Offer/IPO.aspx";

/* The app's own normaliser. Registrars write a name out in full, with the
   suffixes and the honorifics; the ledger rarely does. */
function nameKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(limited|ltd|private|pvt|india|the|ipo|sme|ncds?)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* Their status page is a single-page app whose issue list is a literal in the
   bundle rather than anything served separately, so the bundle is where it has
   to be read from. The file is hashed, so the page is fetched first to learn
   which one is current. */
let kfCache = { at: 0, list: [] };
async function kfIssues() {
  if (Date.now() - kfCache.at < 10 * 60 * 1000 && kfCache.list.length) return kfCache.list;
  const page = await fetch(KF_PAGE, { headers: { "User-Agent": UA } });
  const html = await page.text();
  const file = (html.match(/main\.[a-z0-9]+\.js/) || [])[0];
  if (!file) return kfCache.list;
  const js = await (await fetch(`${KF_PAGE}static/js/${file}`, { headers: { "User-Agent": UA } })).text();
  const m = js.match(/JSON\.parse\('(\[\{"clientId".*?\}\])'\)/);
  if (!m) return kfCache.list;
  try {
    kfCache = { at: Date.now(), list: JSON.parse(m[1]) };
  } catch { /* leave the previous list standing */ }
  return kfCache.list;
}

async function mufgIssues() {
  const r = await fetch(`${MUFG}/GetDetails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "User-Agent": UA,
      Referer: "https://in.mpms.mufg.com/Initial_Offer/public-issues.html",
    },
    body: "{}",
  });
  if (!r.ok) return [];
  const xml = (await r.json()).d || "";
  return [...xml.matchAll(/<company_id>(\d+)<\/company_id>\s*<companyname>([^<]+)<\/companyname>/g)]
    .map((m) => ({ id: m[1], name: m[2] }));
}

/* Which of the known registrars a name belongs to, from whatever Upstox calls
   it. Worth knowing even for the ones that cannot be asked: "Bigshare, which
   needs a captcha" is a useful thing to be told, where "not listed" is not. */
const REGISTRARS = [
  { id: "kfintech", label: "KFintech", reach: true, match: /kfin/i },
  { id: "mufg", label: "MUFG Intime", reach: true, match: /mufg|link\s*intime|mpms/i },
  { id: "bigshare", label: "Bigshare", reach: false, match: /bigshare/i },
  { id: "cameo", label: "Cameo", reach: false, match: /cameo/i },
  { id: "skyline", label: "Skyline", reach: false, match: /skyline/i },
  { id: "maashitla", label: "Maashitla", reach: false, match: /maashitla/i },
  { id: "purva", label: "Purva Sharegistry", reach: false, match: /purva/i },
  { id: "integrated", label: "Integrated Registry", reach: false, match: /integrated/i },
  { id: "mas", label: "MAS Services", reach: false, match: /\bmas\b/i },
];
const knownRegistrar = (name) =>
  REGISTRARS.find((r) => r.match.test(String(name || ""))) || null;

/* Neither registrar keeps an issue for long. KFintech holds a few months;
   MUFG holds only what is current - a scan of its ids found data for exactly
   the two issues on its dropdown and nothing behind them. So for anything but
   a recent issue the lists cannot even say who the registrar was, and the
   exchange feed has to be asked instead. Upstox knows it for closed and listed
   issues as well as open ones, which is the whole span that matters. */
let upstoxCache = { at: 0, byId: new Map() };
async function upstoxIndex() {
  if (Date.now() - upstoxCache.at < 30 * 60 * 1000 && upstoxCache.byId.size) return upstoxCache.byId;
  const token = process.env.UPSTOX_ANALYTICS_TOKEN;
  if (!token) return upstoxCache.byId;
  const headers = { Accept: "application/json", Authorization: `Bearer ${token}` };
  const grab = async (status, type) => {
    try {
      const r = await fetch(
        `https://api.upstox.com/v2/ipos?status=${status}&issue_type=${type}&page_number=1&records=30`,
        { headers });
      if (!r.ok) return [];
      return (await r.json())?.data || [];
    } catch { return []; }
  };
  const lists = await Promise.all([
    grab("closed", "regular"), grab("closed", "sme"),
    grab("listed", "regular"), grab("listed", "sme"),
    grab("open", "regular"), grab("open", "sme"),
  ]);
  const byId = new Map();
  lists.flat().forEach((r) => {
    const key = nameKey(r?.name || r?.company_name || r?.id);
    if (key && r?.id && !byId.has(key)) byId.set(key, r.id);
  });
  if (byId.size) upstoxCache = { at: Date.now(), byId };
  return upstoxCache.byId;
}

/* The list endpoint gives an id and no registrar; only the per-issue detail
   carries registrar_info. So the name is matched against the lists and then
   one detail is fetched for the issue that matched - which is a request worth
   making only when the registrars themselves have already come up empty. */
async function registrarFromExchange(company) {
  const key = nameKey(company);
  if (!key) return "";
  const token = process.env.UPSTOX_ANALYTICS_TOKEN;
  if (!token) return "";
  const byId = await upstoxIndex().catch(() => new Map());
  let id = byId.get(key);
  if (!id) {
    for (const [k, v] of byId) {
      if (k.length > 6 && key.length > 6 && (k.includes(key) || key.includes(k))) { id = v; break; }
    }
  }
  if (!id) return "";
  try {
    const r = await fetch(`https://api.upstox.com/v2/ipos/${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return "";
    return (await r.json())?.data?.registrar_info?.name || "";
  } catch { return ""; }
}

/* Whichever of them is carrying this issue. An issue absent from both has
   either not had its allotment published yet - they list it only once the
   basis of allotment is done - or belongs to a third registrar. */
async function findRegistrar(company) {
  const key = nameKey(company);
  if (!key) return null;
  const near = (a, b) => a === b || (a.length > 6 && b.length > 6 && (a.includes(b) || b.includes(a)));

  const [kf, mu] = await Promise.all([kfIssues().catch(() => []), mufgIssues().catch(() => [])]);
  const k = kf.find((r) => near(nameKey(r.name), key));
  if (k) return { registrar: "kfintech", id: String(k.clientId), listedAs: k.name };
  const m = mu.find((r) => near(nameKey(r.name), key));
  if (m) return { registrar: "mufg", id: m.id, listedAs: m.name };
  return null;
}

async function kfLookup(clientId, pan) {
  const r = await fetch(`${KF_QUERY}?type=pan`, {
    headers: {
      "User-Agent": UA,
      Origin: KF_PAGE.replace(/\/$/, ""),
      reqparam: pan,
      client_id: clientId,
    },
  });
  const text = await r.text();
  let raw;
  try { raw = JSON.parse(text); } catch { raw = { unparsed: text.slice(0, 400) }; }
  /* A PAN with nothing on the issue comes back 404, not an empty list, so a
     miss and a failure look alike unless the status is read first. Calling a
     miss an error would be the worse mistake of the two: it reads as "we could
     not check" when the registrar answered perfectly clearly. */
  if (r.status === 404) return { status: "no_application", raw };
  if (!r.ok) return { status: "error", message: `KFintech returned ${r.status}`, raw };

  const rows = Array.isArray(raw.data) ? raw.data : [];
  if (!rows.length) return { status: "no_application", raw };
  // Every bid this PAN made on the issue; more than one is normal in a family
  // that applies from the same demat under different applicants.
  return {
    status: "found",
    name: rows[0].Name || "",
    bids: rows.map((x) => ({
      applicationNo: x.Appln_No || "",
      applied: Number(x.App_Shares || 0),
      allotted: Number(x.All_Shares || 0),
      dpClientId: x.DP_CLID || "",
    })),
    raw,
  };
}

async function mufgLookup(clientId, pan) {
  const r = await fetch(`${MUFG}/SearchOnPan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "User-Agent": UA,
      Referer: "https://in.mpms.mufg.com/Initial_Offer/public-issues.html",
    },
    // token is sent empty on purpose - see the note at the top of this file.
    body: JSON.stringify({ clientid: String(clientId), PAN: pan, IFSC: "", CHKVAL: "1", token: "" }),
  });
  const text = await r.text();
  let payload;
  try { payload = JSON.parse(text); } catch { payload = null; }
  const xml = payload && typeof payload.d === "string" ? payload.d : "";
  const raw = { d: xml || text.slice(0, 400) };
  if (!r.ok) return { status: "error", message: `MUFG returned ${r.status}`, raw };
  if (!xml.includes("<Table>")) return { status: "no_application", raw };

  const tables = [...xml.matchAll(/<Table>([\s\S]*?)<\/Table>/g)].map((m) => m[1]);
  const field = (block, tag) => {
    const m = block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
    return m ? m[1] : "";
  };
  /* Their ALLOT is a number when there was one and a word - NON-ALLOTTED -
     when there was not, so it cannot simply be parsed as a number. */
  const asQty = (v) => (/^\d+$/.test(String(v).trim()) ? Number(v) : 0);
  return {
    status: "found",
    name: field(tables[0], "NAME1"),
    bids: tables.map((t) => ({
      applicationNo: field(t, "APPLNO") || field(t, "RFNDNO") || "",
      applied: asQty(field(t, "SHARES")),
      allotted: asQty(field(t, "ALLOT")),
      dpClientId: field(t, "DPCLITID"),
    })),
    raw,
  };
}

export default async function handler(req, res) {
  /* The two indexes on their own. One call the app can make on opening to see
     whether anything it is waiting on has been published, without asking after
     each issue in turn. */
  if (req.query.index) {
    try {
      const [kf, mu] = await Promise.all([kfIssues().catch(() => []), mufgIssues().catch(() => [])]);
      return res.status(200).json({
        checkedAt: new Date().toISOString(),
        kfintech: kf.map((r) => r.name),
        mufg: mu.map((r) => r.name),
      });
    } catch (error) {
      return res.status(502).json({ error: error.message || "Could not reach the registrars" });
    }
  }

  const company = String(req.query.company || "").trim();
  if (!company) return res.status(400).json({ error: "company is required" });
  // What the ledger believes the registrar to be, if it knows. Only ever used
  // to explain a miss - never to choose an adapter, since the name could be
  // stale and the lists are the truth.
  const hinted = knownRegistrar(req.query.registrar);

  const pans = String(req.query.pans || "")
    .split(",")
    .map((p) => p.trim().toUpperCase())
    .filter((p) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(p));

  try {
    const found = await findRegistrar(company);
    if (!found) {
      /* Fall back to the exchange for who registers it, so an issue too old for
         the registrar's own list can still be named rather than shrugged at. */
      const who = hinted || knownRegistrar(await registrarFromExchange(company));
      const note = !who
        ? "Could not find out who registers this issue. Registrars keep only "
          + "recent issues on their status pages, so an older one has to be "
          + "checked from your own records."
        : !who.reach
          ? `${who.label} registers this issue and needs a captcha for every PAN, `
            + "so it cannot be checked here."
          : `${who.label} is not showing this issue. Results appear on the evening `
            + "of allotment day, and drop off again after a few weeks.";
      return res.status(200).json({
        company,
        registrar: null,
        knownRegistrar: who ? who.label : "",
        reachable: who ? who.reach : null,
        results: [],
        note,
        checkedAt: new Date().toISOString(),
      });
    }

    const lookup = found.registrar === "kfintech" ? kfLookup : mufgLookup;
    const results = [];
    for (const pan of pans) {
      try {
        results.push({ pan, ...(await lookup(found.id, pan)) });
      } catch (e) {
        results.push({ pan, status: "error", message: e.message || "request failed", raw: null });
      }
      // One at a time, unhurried. KFintech's own page backs off when pressed.
      await new Promise((r) => setTimeout(r, 250));
    }

    return res.status(200).json({
      company,
      registrar: found.registrar,
      registrarId: found.id,
      listedAs: found.listedAs,
      results,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(502).json({ error: error.message || "Could not reach the registrar" });
  }
}
