# Feature Roadmap

## Completed in this session

### UX/UI
- [x] Account detail sheet with stats, IPO list, transfers, edit/delete
- [x] Tappable account/transfer cards with chevron
- [x] Confirm modal replaces browser confirm/alert for all destructive actions
- [x] Panel close animation (slide down)
- [x] Panel stacking (child sheets don't remount parent)
- [x] IPO edit button for manually-added IPOs
- [x] 2x2 date grid with auto-calculated allotment/listing dates
- [x] Date validation (weekends + trading/clearing holidays)
- [x] Inline form validation (red error under field labels)
- [x] Holdings view on dashboard (broker-style P&L cards)
- [x] Holding detail panel
- [x] Search bar clear button (X)
- [x] Transfer filter section removed
- [x] Transfer delete inside edit form
- [x] Multi-IPO transfer linking (chip selector)
- [x] Price band (min-max) everywhere
- [x] Badge tinted fill for Allotted/Not Allotted
- [x] Header alignment fix
- [x] Sheet slide-up animation
- [x] Font standardization
- [x] Dark theme heading color bump
- [x] Offline indicator
- [x] Contextual empty states with icons
- [x] Smart IPO stage badges (OPENS/CLOSES/ALLOTMENT/LISTS/LISTED with dates)
- [x] Swipe left/right for tab navigation
- [x] Remove "All: Partial" from bulk allotment
- [x] Prevent re-importing already-added IPOs
- [x] All "Upstox" references removed from UI
- [x] Trim trailing whitespace on all form saves
- [x] P&L LTP warning (exclamation on dashboard when prices missing)

### Data/Sync
- [x] Store priceBandLow from API
- [x] Store allotmentDate from API (listings + ipos endpoints)
- [x] Store isin + symbol from API on refresh
- [x] Extra ISIN LTP fetch for non-Upstox IPOs (like ICICI)
- [x] Auto-enrich missing dates for active/upcoming IPOs from ipos API
- [x] Fix data leak on logout
- [x] Fix stale data (price clearing bug in refreshPricesFrom)
- [x] Skip migration when cloud sync active
- [x] Back button history management
- [x] Confirm modal in back handler chain
- [x] Unicode cleanup (only middot + rupee remain)

## Pending

### Priority 1 - Auth
- [ ] Forgot password flow (Supabase resetPasswordForEmail)
- [ ] Email confirmation redirect handling
- [ ] Session expiry: show "Session expired, sign in again" instead of sync errors

### Priority 2 - UX
- [ ] Import panel badges (uniform with IPO list stage badges)
- [ ] Pull-to-refresh on mobile
- [ ] Loading spinners for async operations (delete, bulk apply)
- [ ] Price staleness indicator on cards (> 1 day old)

### Priority 3 - Features
- [ ] Return calculator (XIRR) in holding detail
- [ ] IPO timeline view on dashboard
- [ ] Browser push notifications (close tomorrow, allotment day, listing day)
- [ ] CSV export for tax purposes
- [ ] ISIN field in manual IPO form

### Priority 4 - Architecture
- [ ] Remove upstoxMigration.js entirely (React handles everything)
- [ ] Centralized online/offline state
- [ ] Stale-while-revalidate for cached market data
- [ ] Optimistic local writes
