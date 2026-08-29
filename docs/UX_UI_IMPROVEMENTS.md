# IPO Tracker — UX/UI Improvements & Progress

Branch: `feat/upstox-migration`

## Working method

- Implement improvements in small logical groups.
- Commit after every completed fix/group.
- Push only after the current phase/group is complete and ready for review.
- Keep this document updated after every commit so work can resume safely.
- Preserve the existing compact IPO-card design unless explicitly approved otherwise.

## Product decisions from review

### Explicitly approved

- Improve the Market prices section UX.
- Fix misleading Upstox matching/status text when prices are actually arriving.
- Automatically react when connectivity returns: reload/sync cached data and refresh external data without requiring a manual reload.
- Show cached/local data immediately and update it silently in the background where possible.
- Improve sync status feedback and make sync state understandable.
- Listing-day wording:
  - Listing day + LTP is null/0 → `LISTS TODAY`.
  - Listing day + LTP > 0 → `LISTED TODAY` and show the normal LTP/gain.
- Remove edit and delete controls from IPO cards.
- Move appropriate IPO actions to the IPO detail/panel area where they make logical sense.
- IPO metadata supplied by the exchange/Upstox should be treated as immutable in the user-facing UI.
- Add a user-editable **Note** field to the IPO detail screen instead of allowing IPO metadata edits.
- Improve loading with skeletons that resemble the real cards.
- Improve user-facing API/network error states.
- Improve empty states where useful.
- Add the other previously discussed accessibility/mobile polish suggestions where they do not alter the compact visual language.

### Explicitly rejected / deferred

- Do **not** make IPO cards taller by adding price/market sections to every card.
- Do **not** implement the proposed progressive-disclosure/card-layout redesign at this stage. Keep the current compact card layout.
- Do **not** add unnecessary price emphasis to the IPO detail screen; the detail screen should remain primarily about IPO/application information.
- Do **not** expose deleted-record/recovery flows in the UI. Deleted data may remain silently in the database for sync/history purposes.

## Phase 1 — Reliability + immediate UX

### 1. Market prices UX redesign
Status: **Pending**

Current problem:
- Market prices are technically updating, but the status message is confusing.
- Users should understand whether prices are available, updating, stale, or unavailable.

Target UX:

Idle/updated:

> Market prices
> Updated 2 min ago
> 17 / 17 prices available
> [ Refresh prices ]

Updating:

> Market prices
> Updating market prices…
> 12 / 17 received

Success:

> Prices updated just now
> 17 / 17 prices available

Partial failure:

> 14 / 17 prices available
> 3 prices unavailable · [Retry]

Do not expose implementation details such as matching algorithms.

### 2. Fix misleading Upstox count
Status: **Pending**

The current UI can say that one IPO is not matched even though its price is visible on the card.

The displayed count must be derived from the **actual final price data applied to the ledger**, not from an intermediate company-name matching result.

A price is considered available when the final applied current price is numeric and greater than zero.

The UI should say:

> `17 / 17 prices available`

not:

> `17 of 17 IPOs matched on Upstox`

### 3. Connectivity recovery / automatic reload
Status: **Pending**

Current behavior:
- Offline launch correctly displays local cached data.
- When connectivity returns, the app does not automatically refresh/reconcile.

Target behavior:

1. Offline → keep showing cached local data.
2. Detect browser `online` event.
3. On transition to online:
   - reconcile/pull cloud data;
   - refresh market prices where appropriate;
   - refresh relevant remote metadata if required;
   - update the UI without a full page reload.
4. Avoid duplicate refreshes from repeated online events.
5. Do not block the UI while reconnecting.
6. Preserve unsynced local edits safely.

### 4. Cached data first / silent background updates
Status: **Pending**

The app should continue to render the local ledger immediately.

Remote work must not block initial rendering.

After rendering:
- cloud reconciliation runs in the background;
- market prices refresh in the background;
- changed values update the UI when available.

### 5. Clear sync status
Status: **Pending**

Use concise user-facing states:

- `Synced`
- `Synced just now`
- `Syncing…`
- `Sync failed · Retry`
- `Offline · Saved locally`

Manual sync remains available but should not be the only way to recover from connectivity changes.

### 6. Listing-day badge state
Status: **Pending**

Exact rule:

- Listing date is today + current LTP is null/0 → `LISTS TODAY`.
- Listing date is today + current LTP > 0 → `LISTED TODAY`.
- After listing day + current LTP > 0 → normal listed/current-price presentation.

This is intentionally a wording/state distinction, not a change to price calculations.

### 7. Loading skeleton
Status: **Pending**

Replace generic/blank loading periods with skeletons shaped like the actual ledger/card layout.

Requirements:
- visible immediately after React mounts;
- preserve approximate card height;
- avoid layout jumps;
- work in light and dark themes;
- disappear progressively as data arrives.

### 8. User-friendly errors
Status: **Pending**

Never expose raw API/HTTP errors in the primary UI.

Examples:

> Market prices couldn't be updated.
> Existing prices are still shown.
> [Try again]

> Sync failed.
> Your local changes are safe and will retry when you're online.

### 9. Better empty states
Status: **Pending**

Use contextual empty states without changing the overall compact visual style.

Examples:

> Your IPO ledger is empty
> Add your first IPO application to start tracking.
> [Add IPO]

> Nothing upcoming
> New IPOs will appear here automatically.

> Market price unavailable
> We'll continue showing the listing price until an LTP is available.

## Phase 2 — IPO detail/actions

### 10. Immutable IPO metadata
Status: **Completed in this group**

Remove the user-facing IPO edit flow for existing IPOs.

Exchange/Upstox-provided metadata should not be manually overridden:
- company name
- category
- issue price/range
- lot size
- open date
- close date
- allotment date
- listing date
- listing price when sourced externally
- exchange identifiers / ISIN / symbol

Existing application records remain user-managed.

### 11. Replace IPO edit with Notes
Status: **Completed in this group**

Add a `Note` field in the IPO detail screen.

The note is the only free-form user-editable field attached directly to an IPO.

It should:
- be optional;
- support multiline text;
- persist locally and through cloud sync;
- be visually secondary to official IPO information;
- be easy to edit from the detail screen.

### 12. Move card actions to logical detail/panel location
Status: **Completed in this group**

Remove pencil and delete icons from IPO cards.

The card should remain focused on:
- IPO identity;
- compact metadata;
- allotment/listing state;
- application/allotment summary;
- current gain where applicable.

Actions should live in the IPO detail/panel area.

The action placement must remain consistent with mobile touch-target requirements.

### 13. IPO detail screen
Status: **Design approved; implementation pending**

Keep the current compact visual language.

Proposed structure:

1. Header
   - company name
   - category/status
   - close button
2. Official IPO information
   - issue price
   - lot size
   - open/close/allotment/listing dates
3. User applications
   - account/application breakdown
   - allotment information
4. Note
   - editable user note
5. Actions
   - application-related actions where applicable
   - destructive IPO action only in the logical panel location

Do not add a large market-price section.

## Phase 3 — mobile/accessibility polish

### 14. Touch targets
Status: **Pending**

- Minimum ~44px touch targets for important actions.
- Clear pressed states.
- Accessible labels for icon-only controls.

### 15. Connectivity/offline presentation
Status: **Pending**

Use a subtle offline state rather than blocking the app.

### 16. Network action protection
Status: **Pending**

- Prevent accidental double submits.
- Avoid duplicate market-price requests.
- Disable/relabel active refresh actions while running.

### 17. Dark-mode polish
Status: **Pending / review later**

Do not change the existing dark palette without explicit review.

## Out of scope for this phase

- Large IPO card redesign.
- Adding market-price details to every card.
- Progressive disclosure redesign.
- Making the detail page primarily a price/portfolio screen.
- Any visible recovery/revival workflow for deleted data.

## Commit log

| Commit | Group | Status | Notes |
|---|---|---|---|
| — | Planning document | In progress | This roadmap created from the agreed UX scope. |
| — | Phase 1 | Pending | — |
| — | Phase 2 | Pending | — |
| — | Phase 3 | Pending | — |


## Latest completed group

### IPO detail/actions — completed

- IPO cards no longer show edit/delete controls.
- Existing IPO metadata is no longer user-editable from the UI.
- IPO detail now provides a personal Note field backed by the existing `remarks` storage field for compatibility.
- IPO deletion is available from the IPO detail action area.
- Application edit/delete controls remain unchanged.
