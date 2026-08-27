# The Ledger — Family IPO Register

A mobile-first PWA for tracking IPO applications across family demat accounts,
with email/password login and cloud sync through Supabase.

- Installable on Android/iOS home screen.
- Email + password login.
- Cloud sync via Supabase, protected by Row Level Security.
- localStorage doubles as an offline cache, so the app still opens without a network.
- No third-party API keys and no server-side code — it is a static site plus Supabase.

---

## 1. Create the Supabase project

1. Go to https://supabase.com and create an account.
2. **New project** → give it a name, set a database password, pick a region near you
   (Mumbai / `ap-south-1` if you are in India). Wait for it to finish provisioning.
3. Open **SQL Editor** → **New query**, paste the entire contents of
   [`supabase.sql`](supabase.sql), and click **Run**. It should report success.
4. Go to **Authentication → Sign In / Providers** and make sure **Email** is enabled.
   - If you would rather not deal with confirmation emails, turn **Confirm email**
     off. Then sign-up logs you straight in.
   - If you leave it on, you must click the link in the confirmation email before
     your first sign-in will work.
5. Go to **Project Settings → API Keys** and copy two values:
   - **Project URL** (under **General**) → `https://xxxxxxxx.supabase.co`
   - Under the **Legacy anon, service_role API keys** tab, the **anon / public**
     key → a long `eyJ...` string. Use the **Copy** button; the value shown on
     screen is truncated.

The anon key is meant to be public and ships in the browser bundle. Row Level
Security is what keeps your data private, and step 3 set that up. Never put the
`service_role` key in this project — it bypasses RLS completely.

> **On the newer publishable keys:** Supabase is phasing legacy `anon` keys out by
> the end of 2026 in favour of `sb_publishable_...` keys. When that time comes, no
> code change is needed here — this app only ever sends the key in the `apikey`
> header and never as `Authorization: Bearer`, which is the pattern that breaks
> with publishable keys. Swapping is just a new value in `VITE_SUPABASE_ANON_KEY`
> plus a redeploy.

---

## 2. Run it locally (optional)

```bash
npm install
cp .env.example .env        # then edit .env with your two values
npm run dev
```

`.env` is gitignored. Without those variables the app still runs, but in
local-only mode with no login and no sync.

---

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "IPO Ledger with Supabase cloud sync"
git branch -M main
git remote add origin https://github.com/Prateek-Nayak/ipo-tracker.git
git push -u origin main
```

---

## 4. Deploy to Vercel

1. Go to https://vercel.com and sign in with GitHub.
2. **Add New → Project**, import the repo.
3. Framework preset should auto-detect as **Vite**. Leave the build settings alone.
4. Under **Environment Variables**, add both, for all environments:

   ```text
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```

5. **Deploy**.

> These are baked into the bundle at build time. If you change either one later,
> you must **redeploy** — editing the variable alone does nothing to the live site.

---

## 5. Point Supabase at your real URLs

By default Supabase sends confirmation and recovery emails back to
`http://localhost:3000`, which is why such a link opens a dead page.

Go to **Authentication → URL Configuration** and set:

- **Site URL**: `https://prateeknayak.in`
- **Redirect URLs** (add each one):
  ```text
  https://prateeknayak.in/**
  https://www.prateeknayak.in/**
  https://silly-sherbet-a650b6.netlify.app/**
  http://localhost:5173/**
  ```

The Netlify entry is only needed for the one-time data move below; drop it after.
`localhost:5173` is Vite's dev port — note it is 5173, not 3000.

The app reads the session out of the `#access_token=...` fragment these links come
back with, so clicking a confirmation email drops you straight into the ledger,
already signed in.

---

## 6. Move the data off your phone

Browser storage is per-origin. The data you entered on the old Netlify site lives
in that site's localStorage and does **not** follow you to the Vercel URL. Only
code served from the Netlify origin can read it, so the move has to start there.
The app keeps the same `ipo_ledger_*` storage keys the original build used, which
turns it into a one-time, no-typing operation:

1. Make sure `.env` has your two Supabase values, then run `npm run build`.
2. Deploy that `dist/` folder to your **existing Netlify site** — open the site in
   the Netlify dashboard, go to **Deploys**, and drag the `dist` folder onto the
   drop zone. This replaces the old single-file build in place, on the same URL.
3. On your phone, open **https://silly-sherbet-a650b6.netlify.app/** and reload.
4. Sign in with the account you already confirmed. The app finds the ledger sitting
   in localStorage and uploads it to Supabase.
5. Check it worked: tap the cloud icon. It should show your email, "Synced at …",
   and the right counts.
6. Open **https://prateeknayak.in**, sign in with the same account, and the ledger
   is there. Install it from the browser menu (**Install app** / **Add to Home
   screen**), then delete the Netlify site.

**Order does not matter.** If you have already added entries on the Vercel site,
the phone's data is merged with what is in the cloud rather than overwritten — you
end up with both sets, and nothing is lost whichever device syncs first.

**If you would rather not touch Netlify at all,** the only alternative is retyping
the entries by hand. The old single-file build has no export button, and nothing
outside that origin — including this project and any script you run elsewhere —
can reach its localStorage. Step 2 is what puts an export button on that origin in
the first place; once it is there you could instead use the cloud icon →
**Copy JSON** on the phone and **Restore from a backup…** on Vercel, but by then
signing in has already done the job for you.

---

## How sync works

Each account owns exactly three rows in one `user_data` table, one per kind:
`accounts`, `ipos`, `transfers`. Each row holds that table as a JSON array.

On sign-in:
- local data renders immediately, so the app is never blank;
- cloud data is fetched;
- if the cloud has data, it wins and overwrites the local cache;
- if the cloud is empty and this device has data, the local data is uploaded once.

After an edit:
- localStorage is written immediately;
- a cloud push follows about a second later, so a burst of edits becomes one write.

Access tokens expire after roughly an hour and are refreshed automatically before
each request, so a phone left installed for weeks stays signed in.

The device remembers which account its cached data belongs to. If someone else
signs in on the same phone, their empty ledger will not swallow your data and
yours will not be uploaded into their account.

## Backup and restore

The cloud icon in the header opens **Sync & Data**, which has:
- **Sync now** — force a push.
- **Copy JSON** / **Download** — a full backup of everything.
- **Restore from a backup…** — paste a backup and either **Merge in**
  (keeps what is there, adds what is missing) or **Replace all**.

## Known limitation

This is a whole-table JSON sync, which is the right shape for a personal tracker.
It is not built for two devices editing the same record at the same moment — the
last write wins. If you ever want per-row history, conflict resolution, or several
family members editing one shared ledger at once, the schema needs to be
normalised into individual rows.
