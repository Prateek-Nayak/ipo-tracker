# The Ledger — Family IPO Register

A mobile-first PWA for tracking IPO applications, allotments, and returns across multiple family members' demat accounts.

**Live:** [ipo-tracker.prateeknayak.in](https://ipo-tracker.prateeknayak.in/)

## Features

### IPO Tracking
- Import IPOs directly from the exchange (Upstox) — open, upcoming, and historical
- Track applications across multiple family accounts with per-account allotment status
- Real-time market prices (LTP) for listed holdings via Upstox market data
- Price band display (min-max) with automatic lot cost calculation
- Smart stage badges: OPENS, CLOSES, CLOSES TODAY, ALLOTMENT, LISTS, LISTED — with dates
- Auto-calculated allotment and listing dates from SEBI T+3 timetable (skips weekends + trading/clearing holidays)
- Manual IPO entry with date validation (weekends and market holidays blocked)

### Portfolio & Holdings
- Broker-style holdings view on dashboard: entry price, current price, P&L in rupees and percentage
- Per-account holding breakdown in dedicated holding detail panel
- Capital deployed, realized gains, unrealized P&L, pending allotment stats
- P&L warning indicator when listed holdings have no current price

### Family Account Management
- Account detail sheet with IPO application history, allotment stats, and fund transfers
- PAN-based duplicate application detection with warnings
- Fund transfer tracking between accounts with multi-IPO linking

### Sync & Cloud
- Supabase-powered cloud sync across devices
- Local-first: cached data renders immediately, cloud reconciles in background
- Automatic reconnection and price refresh when coming back online
- Offline indicator with cached data support
- Export/backup as JSON

### Auth
- Email/password authentication via Supabase GoTrue
- Forgot password with email reset link
- Password recovery from email redirect
- Session auto-refresh with expiry handling

### UX
- Mobile-first design with PWA support (installable, works offline)
- Dark/light theme with ledger-inspired aesthetic
- Sheet-based navigation with slide-up/slide-down animations
- Swipe left/right for tab navigation
- Swipe-down to dismiss panels
- Custom confirm modals (no browser alerts)
- Inline form validation with field-level error display
- Search with clear button across all list screens
- Back button properly peels off layers (never exits prematurely)

## Technical Approach

### Architecture
- **Single-file React app** (`src/App.jsx`, ~5000 lines) — no routing library, no state management library
- **Vercel serverless functions** (`api/`) for Upstox API proxy and BSE data enrichment
- **Supabase** for auth (GoTrue) and data persistence (PostgREST)
- **Vite** for build tooling
- **PWA** with service worker for offline caching of app shell

### Data Flow
1. **Local-first rendering** — localStorage is read on mount, ledger renders immediately
2. **Cloud reconciliation** — Supabase data fetched in background, merged with local
3. **Price refresh** — Vercel function proxies Upstox `/v2/ipos` (metadata) and `/v2/market-quote/ltp` (prices)
4. **Auto-sync** — state changes debounced and pushed to Supabase with 1-second delay
5. **Reconnect recovery** — browser `online` event triggers sync + price refresh automatically

### API Layer (`api/`)
- `listings.js` — Fetches all listed/closed IPOs from Upstox, enriches with per-IPO detail (lot size, dates, allotment timeline), fetches LTP for all listed ISINs (NSE + BSE fallback). Supports extra ISINs from client for non-Upstox IPOs.
- `ipos.js` — Fetches open/upcoming IPOs from Upstox with detail enrichment and BSE category-wise subscription data.
- `holidays.js` — Trading and clearing holiday calendar for date arithmetic.

### Key Design Decisions
- **No external UI library** — all components are inline-styled React. Fonts: Fraunces (headings), Inter (body), JetBrains Mono (numbers).
- **Sheet-based navigation** — panels stack on top of each other with proper back-button handling. Parent panels stay mounted when child panels open.
- **Holiday-aware date arithmetic** — allotment/listing dates calculated using separate trading and clearing calendars, matching SEBI's T+3 timetable.
- **Name-based matching** — IPOs are matched between local records and Upstox feed using normalized company names (`nameKey`), with ISIN/symbol as secondary identifiers.
- **Confirm modal in back stack** — destructive action modals are part of the back-button layer chain, so pressing back dismisses the modal instead of the panel behind it.

## Development

```bash
npm install
npm run dev        # Vite dev server (API functions need Vercel CLI)
npx vite build     # Production build
```

### Environment Variables

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
UPSTOX_ANALYTICS_TOKEN=your_upstox_analytics_token
```

### Deployment

Deployed on Vercel. Push to `feat/upstox-migration` branch triggers automatic deployment.

## License

Private project.
