/*
 * Listing-day reminders — server side (approach B).
 *
 * Run by a daily Vercel Cron at 04:15 UTC (09:45 IST). For every stored push
 * subscription it reads that user's IPOs, finds the ones listing today that they
 * applied to, fetches the current price from Upstox, and sends a Web Push — so
 * the reminder arrives even with the app closed. Dead subscriptions are pruned.
 *
 * Required env (set in Vercel):
 *   VAPID_PRIVATE_KEY          - private half of the VAPID keypair
 *   VAPID_PUBLIC_KEY           - public half (also baked into the client)
 *   SUPABASE_SERVICE_ROLE_KEY  - to read every user's data past RLS
 *   VITE_SUPABASE_URL          - the Supabase project URL (already set for the build)
 *   UPSTOX_ANALYTICS_TOKEN     - already used by the other API routes
 *   CRON_SECRET                - Vercel sends it as a Bearer token; we verify it
 */
import webpush from "web-push";

const UPSTOX = "https://api.upstox.com/v2";
const SUPA_URL = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || "BBMs6l_rEsHHDLXJPUvI3y5i31VLaUN8OlkhdThwgPJFcrqba_YhVcz_Jd-a6VYZgvLDvlvX_u9xTOuxld0cwKU";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";

function todayISTISO() {
  try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()); }
  catch { return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10); }
}

async function supa(path, options = {}) {
  const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${text.slice(0, 200)}`);
  return text.trim() ? JSON.parse(text) : null;
}

async function upstoxFetch(path, token) {
  const r = await fetch(`${UPSTOX}${path}`, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`Upstox ${path} ${r.status}`);
  return r.json();
}
// Last traded price by ISIN — NSE first, then BSE for whatever it didn't answer.
async function fetchLtp(token, isins) {
  const out = {};
  const ask = async (seg, list) => {
    for (let i = 0; i < list.length; i += 500) {
      const param = list.slice(i, i + 500).map((x) => encodeURIComponent(`${seg}|${x}`)).join(",");
      try {
        const data = await upstoxFetch(`/market-quote/ltp?instrument_key=${param}`, token);
        if (data.status !== "success" || !data.data) continue;
        Object.values(data.data).forEach((val) => {
          const isin = String(val?.instrument_token || "").split("|")[1];
          if (isin && val.last_price != null) out[isin] = Number(val.last_price);
        });
      } catch { /* partial beats none */ }
    }
  };
  await ask("NSE_EQ", isins);
  const missing = isins.filter((x) => out[x] == null);
  if (missing.length) await ask("BSE_EQ", missing);
  return out;
}

const inr = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

function listingNotice(ipo, ltp) {
  const company = ipo.company || "An IPO";
  const issue = Number(ipo.priceBand) || 0;
  const lotSize = Number(ipo.lotSize) || 0;
  const shares = (ipo.applications || []).reduce(
    (s, a) => s + ((a.allotmentStatus === "Allotted" || a.allotmentStatus === "Partial") ? (Number(a.sharesAllotted) || 0) : 0), 0);
  const lots = lotSize && shares ? Math.round(shares / lotSize) : 0;
  if (ltp && issue > 0) {
    const up = (ltp - issue) >= 0;
    const pct = ((ltp - issue) / issue) * 100;
    const title = `${up ? "📈" : "📉"} ${company} listed — ${up ? "+" : "−"}${Math.abs(pct).toFixed(1)}%`;
    const body = shares > 0
      ? `LTP ₹${ltp} vs ₹${issue} issue. Your ${lots} allotted lot${lots === 1 ? "" : "s"} ${up ? "up" : "down"} ${inr(Math.abs(shares * (ltp - issue)))}.`
      : `LTP ₹${ltp} vs ₹${issue} issue. No allotment on this one.`;
    return { title, body };
  }
  return { title: `🔔 ${company} lists today`, body: "Listing price isn't in yet — open The Ledger to record it." };
}

export default async function handler(req, res) {
  // Vercel Cron sends Authorization: Bearer $CRON_SECRET when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET;
  if (secret && (req.headers.authorization || "") !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (!SUPA_URL || !SERVICE_KEY) return res.status(500).json({ error: "Supabase service env not configured" });
  if (!VAPID_PRIVATE) return res.status(500).json({ error: "VAPID_PRIVATE_KEY not configured" });

  webpush.setVapidDetails("mailto:noreply@ipo-tracker.app", VAPID_PUBLIC, VAPID_PRIVATE);
  const token = process.env.UPSTOX_ANALYTICS_TOKEN;
  const today = todayISTISO();

  try {
    const subs = (await supa("push_subscriptions?select=endpoint,user_id,subscription,last_sent_date")) || [];
    if (!subs.length) return res.status(200).json({ ok: true, date: today, sent: 0, note: "no subscriptions" });

    const byUser = {};
    for (const s of subs) (byUser[s.user_id] = byUser[s.user_id] || []).push(s);

    let sent = 0, pruned = 0, users = 0;
    for (const [userId, userSubs] of Object.entries(byUser)) {
      let ipos = [];
      try {
        const rows = await supa(`user_data?user_id=eq.${userId}&kind=eq.ipos&select=data`);
        ipos = Array.isArray(rows?.[0]?.data) ? rows[0].data : [];
      } catch { continue; }

      const due = ipos.filter((i) => i.listingDate === today && (i.applications || []).length > 0);
      if (!due.length) continue;
      users++;

      let ltpMap = {};
      const isins = [...new Set(due.map((i) => i.isin).filter(Boolean))];
      if (token && isins.length) { try { ltpMap = await fetchLtp(token, isins); } catch { /* fall back to stored */ } }

      const notices = due.map((i) => {
        const ltp = (i.isin && ltpMap[i.isin]) || Number(i.currentPrice) || Number(i.listingPrice) || null;
        return { ipo: i, ...listingNotice(i, ltp) };
      });

      const payload = notices.length === 1
        ? { title: notices[0].title, body: notices[0].body, tag: `listing-${notices[0].ipo.id}-${today}`, icon: "/icon-192.png", badge: "/badge-96.png", data: { url: "/" } }
        : { title: `📈 ${notices.length} IPOs list today`, body: notices.map((n) => n.ipo.company).filter(Boolean).slice(0, 4).join(" · "), tag: `listing-multi-${today}`, icon: "/icon-192.png", badge: "/badge-96.png", data: { url: "/" } };

      for (const s of userSubs) {
        if (s.last_sent_date === today) continue;   // already delivered today (retry-safe)
        try {
          await webpush.sendNotification(s.subscription, JSON.stringify(payload));
          sent++;
          try {
            await supa(`push_subscriptions?endpoint=eq.${encodeURIComponent(s.endpoint)}`, {
              method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ last_sent_date: today }),
            });
          } catch { /* the send happened; the stamp is best-effort */ }
        } catch (e) {
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            try { await supa(`push_subscriptions?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }); pruned++; } catch { /* nothing */ }
          }
        }
      }
    }
    return res.status(200).json({ ok: true, date: today, users, sent, pruned });
  } catch (e) {
    return res.status(500).json({ error: e.message || "failed" });
  }
}
