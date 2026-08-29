# IPO Tracker — UX/UI Improvements & Progress

Branch: `feat/upstox-migration`

## Working method

- Implement changes in small logical groups.
- Keep a progress log so work can resume safely.
- Create/validate commits during an iteration, but **push only once the iteration is complete and ready for review**. This avoids unnecessary Vercel builds.
- Preserve the compact mobile-first IPO-card design unless explicitly approved otherwise.

## Product decisions

### Approved

- Improve Market prices UX and remove implementation terminology such as “matched on Upstox”.
- When connectivity returns, automatically reconcile/sync and refresh market prices without requiring a page reload.
- Keep cached/local data visible immediately; remote work must remain non-blocking.
- Listing day: `LISTS TODAY` while LTP is null/0; `LISTED TODAY` once a positive LTP is available.
- IPO cards must stay compact.
- No edit-pencil action on IPO cards.
- IPO metadata sourced from Upstox/exchange is immutable in the UI.
- IPO detail has a user-editable Note instead of editable IPO metadata.
- Delete action lives in the IPO detail/action area, not on the card.
- `Add one` is removed; bulk application is the IPO-level application entry point and is labelled `Apply IPO`.
- Note Save is enabled only when the note differs from the saved value.
- Detail dates use fixed label/value positions.
- Detail secondary text/fields should use a smaller, consistent typography system while retaining the approved title/account/subtitle/badge/button styling.
- Detail sheets can be dismissed with a downward swipe when their internal scroll position is at the top; otherwise normal scrolling remains intact.
- Keep empty states, errors, touch targets, double-submit protection and offline behaviour subtle and compact.

### Explicitly rejected / deferred

- Do not make IPO cards taller to expose more market-price information.
- Do not redesign the detail page into a price/portfolio-heavy screen.
- Do not implement the previously proposed progressive-disclosure/card-layout redesign.
- Do not expose deleted-record/recovery flows. Deleted data may remain silently in storage/database.
- Do not change the existing dark palette without explicit review.

## Phase 1 — Reliability + immediate UX

### 1. Market prices UX redesign
Status: **Completed in current iteration**

- Replace `X of Y IPOs matched on Upstox` with a user-facing freshness message.
- Avoid exposing the matching implementation because the displayed matching count could disagree with the actual LTP shown on cards.
- `Fetching from Upstox…` becomes `Updating market prices…`.
- Successful refresh is presented as `Prices updated <age>`.
- Existing Refresh button remains the explicit manual action.

### 2. Misleading Upstox count
Status: **Completed in current iteration**

The old counter could report one unmatched IPO even while its card had a valid price. The user-facing count has therefore been removed rather than presenting a potentially misleading intermediate matching metric.

### 3. Connectivity recovery
Status: **Completed in current iteration**

When the browser changes from offline to online:

1. Keep the cached ledger visible.
2. Wait briefly for the connection to settle.
3. Trigger cloud sync when available.
4. Refresh market prices after sync.
5. Do this without reloading the page.
6. Debounce repeated reconnect events.
7. Do not interrupt normal UI use.

### 4. Cached data first / silent updates
Status: **Already implemented / preserved**

React mounts before remote migration work and the ledger can render from local state. Remote reconciliation remains background work.

### 5. Sync status
Status: **Existing behaviour retained; reconnect now uses it automatically**

Keep concise states such as `Syncing…`, `Sync now`, and existing error/offline feedback. Manual sync remains available.

### 6. Listing-day wording
Status: **Implemented previously; preserve**

- Listing today + LTP null/0 → `LISTS TODAY`.
- Listing today + LTP > 0 → `LISTED TODAY`.
- Do not alter the underlying price calculation.

### 7. Loading skeleton / first paint
Status: **Implemented previously; preserve**

React is mounted immediately so the existing loading/lazy UI can render rather than showing a blank/black screen during startup migration.

### 8. User-friendly errors
Status: **Existing handling retained; further polish pending**

Raw network/API errors should not become the primary user-facing message. Further targeted error copy can be refined in a later iteration.

### 9. Empty states
Status: **Pending review**

Keep current empty states unless a concrete confusing state is identified.

## Phase 2 — IPO detail/actions

### 10. Immutable IPO metadata
Status: **Completed**

Official IPO metadata is no longer manually editable.

### 11. Replace IPO edit with Notes
Status: **Completed + polished in current iteration**

- Note is optional and multiline.
- Helper text saying the note is the only editable field has been removed.
- Save is disabled when unchanged.
- Save becomes enabled only after the user modifies the note.
- After saving, the control returns to disabled state.
- Note keeps the existing `remarks` storage field for compatibility.

### 12. Card actions
Status: **Completed + polished in current iteration**

- Pencil/edit removed from IPO cards.
- Delete removed from IPO cards.
- `Add one` removed from the IPO detail screen.
- `Apply in bulk` renamed to `Apply IPO`.
- IPO-level actions remain in the detail/action area.
- Application-level actions remain user-managed.

### 13. Detail-screen layout
Status: **Partially completed in current iteration**

- Official date rows use a fixed 2x2 grid so dates align consistently regardless of which ones exist.
- A broader secondary-typography consistency pass was not undertaken this iteration and remains open.

### 14. Detail-sheet gesture
Status: **Completed in current iteration**

- Downward swipe dismisses the sheet only when its scroll position is at the very top.
- If the body has been scrolled down, normal scrolling takes priority.
- Inputs, buttons and text fields do not accidentally trigger dismissal.
- Existing close/back controls remain available.

## Phase 3 — Mobile/accessibility polish

### 15. Touch targets
Status: **Not yet audited**

Icon buttons in dense lists (e.g. edit/delete on an application row) are 30–36px, below the 44px guideline. Left as-is for now since enlarging them would conflict with the approved compact card-height goal; a real tradeoff, not an oversight, and open for a future targeted pass if it proves to be a problem in practice.

### 16. Network action protection
Status: **Existing disabled states retained; reconnect flow debounced**

- Do not fire repeated reconnect refreshes.
- Existing disabled state prevents duplicate manual actions.

### 17. Offline presentation
Status: **Pending targeted UI review**

The app already remains usable with cached data. A subtle explicit offline indicator can be considered separately if needed.

### 18. Dark-mode polish
Status: **Deferred**

No palette changes without explicit review.

## Out of scope

- Large IPO-card redesign.
- More market-price information on every card.
- Price-heavy IPO detail page.
- Visible recovery/revival workflow for deleted records.

## Iteration log

| Iteration | Group | Status | Notes |
|---|---|---|---|
| 1 | IPO metadata immutable + Note + card actions | Completed | Pushed as `d8cda0b9`. |
| 2 | Detail polish + Market status + reconnect | **Pushed** | All items below verified directly against `App.jsx` (not assumed from a prior status write-up) before pushing. |

## Current iteration — review checklist

- [x] Remove `Add one`.
- [x] Rename `Apply in bulk` → `Apply IPO`.
- [x] Remove Note helper text.
- [x] Save Note only enabled when modified.
- [x] Align official dates with fixed label/value positions.
- [x] Add swipe-down-to-dismiss at scroll top.
- [x] Replace misleading Upstox matching message.
- [x] Refresh sync/prices automatically after reconnecting to the internet.
- [x] Allotment quantity entry is lots-based (Edit Application and Record Allotment), shares are always derived.
- [x] Allotted / Not Allotted badges read clearly in light theme (fixed the badge's opacity, not its fill style).
- [x] `uxEnhancements.js` removed; every item it used to DOM-patch now lives directly in `App.jsx`.
- [ ] User review and feedback.
