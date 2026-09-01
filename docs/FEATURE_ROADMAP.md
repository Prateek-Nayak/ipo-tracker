# Feature Roadmap

## Completed

### UX/UI
- [x] Account detail sheet with stats, IPO list, transfers, edit/delete
- [x] Tappable account/transfer cards with chevron
- [x] Confirm modal replaces browser confirm/alert for all destructive actions
- [x] Panel close animation (slide down + fade)
- [x] Panel stacking (child sheets don't remount parent)
- [x] IPO edit button for manually-added IPOs
- [x] 2x2 date grid with auto-calculated allotment/listing dates
- [x] Date validation (weekends + trading/clearing holidays)
- [x] Inline form validation (red error under field labels)
- [x] Holdings view on dashboard (broker-style P&L cards)
- [x] Holding detail panel with per-account breakdown
- [x] Search bar clear button (X) on all screens
- [x] Transfer filter section removed (search covers everything)
- [x] Transfer delete inside edit form
- [x] Multi-IPO transfer linking (chip selector with search)
- [x] Price band (min-max) on cards, detail, import, and form
- [x] Badge tinted fill for Allotted/Not Allotted in light theme
- [x] Header alignment fix (title centered with icons)
- [x] Sheet slide-up/slide-down animation
- [x] Font standardization (Inter body, Fraunces headings, JetBrains Mono numbers)
- [x] Dark theme heading color bump (#F5F3EE)
- [x] Light theme subtext darkened (#4B5563)
- [x] Offline indicator banner
- [x] Contextual empty states with icons and subtitles
- [x] Smart IPO stage badges (OPENS/CLOSES/CLOSES TOMORROW/CLOSES TODAY/CLOSED TODAY/ALLOTMENT/LISTS/LISTED)
- [x] Swipe left/right for tab navigation
- [x] Remove "All: Partial" from bulk allotment quick-set
- [x] Prevent re-importing already-added IPOs (disabled checkbox)
- [x] All "Upstox" references removed from UI
- [x] Trim trailing whitespace on all form saves
- [x] P&L LTP warning (exclamation on dashboard when listed holdings have no current price)
- [x] Price staleness indicator (! next to gain when price > 24h old)
- [x] Scrollbar contained to content area only (doesn't overlap header/nav)
- [x] Amount blocked read-only (computed from lots x lot size x price)
- [x] Confirm password + strong password validation (8+ chars, uppercase, number)
- [x] Expired/invalid reset link banner with "Request new link" action

### Auth
- [x] Forgot password flow (sends reset email via Supabase)
- [x] Password reset from email link (recovery token handling)
- [x] Email confirmation redirect (auto sign-in from confirmation link)

### Data/Sync
- [x] Store priceBandLow from API on refresh
- [x] Store allotmentDate from API (listings + ipos endpoints)
- [x] Store allotmentDate + listingDate + isin on import from exchange
- [x] Store isin + symbol from API on refresh (enables LTP for name-matched IPOs)
- [x] Extra ISIN LTP fetch for non-Upstox IPOs (client sends ISINs, API fetches LTPs)
- [x] Auto-enrich missing dates for active/upcoming IPOs from ipos API (per-session fallback)
- [x] Fix data leak on logout (strict owner check, clear localStorage)
- [x] Fix data leak on new signup (localIsOurs requires exact owner match)
- [x] Fix stale data (price clearing bug when listingsLoaded but no listing record)
- [x] Fix empty sync (allow push when trash has entries = intentional deletion)
- [x] Skip upstoxMigration when cloud sync active (prevents race condition)
- [x] Back button history management with ref-based state tracking
- [x] Confirm modal in back handler chain (back dismisses modal, not underlying sheet)
- [x] Unicode cleanup (only middot + rupee remain as non-ASCII)

## Pending

### Priority 1 - UX Polish
- [ ] Pull-to-refresh on mobile (refresh prices by pulling down)
- [ ] Loading spinners for async operations (delete, bulk apply, bulk status)
- [ ] Session expiry handling (show "Session expired, sign in again" instead of sync errors)
- [ ] Import panel: replace raw date display with stage badges

### Priority 2 - Features
- [ ] Return calculator (XIRR) in holding detail panel
- [ ] IPO timeline view on dashboard (upcoming events: closing, allotment, listing)
- [ ] Browser push notifications (close tomorrow, allotment day, listing day)
- [ ] CSV export for tax purposes (allotments, sells, P&L)
- [ ] ISIN field in manual IPO form (for LTP lookup)

### Priority 3 - Architecture
- [ ] Remove upstoxMigration.js entirely (React handles everything now)
- [ ] Centralized online/offline state management
- [ ] Stale-while-revalidate for cached market data
- [ ] Optimistic local writes for faster UI feedback
- [ ] Test suite for issueStage badge logic
