# IPO Tracker — UX/UI Improvements

Branch: `feat/upstox-migration`

## Scope

This document tracks the agreed UX/UI improvements for the current IPO Tracker. Work is intentionally incremental: **one fix at a time, one commit per fix**. Nothing is pushed to remote until the current phase is complete and reviewed.

## Explicitly excluded / declined

- **Do not redesign IPO cards around market price.** The card should remain compact; price is secondary and should not materially increase card height.
- **Do not implement the proposed richer IPO detail information architecture yet.** User wants to see an exact UI mockup first.
- **Do not change the existing empty-state design yet.** User wants to see an exact UI mockup first.
- **Do not introduce unnecessary visual redesign.** Preserve the current ledger aesthetic and compact card layout.
- Deleted records remain in the database silently for sync/data integrity, but there must be **no user-facing deleted-record/recovery flow**.

## Phase 1 — Immediate UX / data-state improvements

### 1. Market-price status UX
**Goal:** make the market-price area communicate useful status without exposing implementation details.

Current problem:
- All/most prices can be arriving successfully while the status can still say that an IPO was not matched on Upstox.
- The user should not have to understand the distinction between identity matching, instrument lookup, and LTP retrieval.

Target behavior:
- Replace implementation-oriented wording such as `matched on Upstox` with a user-facing availability/status message.
- Count an IPO as price-available only when a valid positive LTP is actually present.
- If a price is unavailable, say so clearly rather than implying that the company failed to match when the real issue is data availability.
- Keep the Upstox source indication where useful, but do not expose internal matching mechanics.
- During refresh, show progress/working state without blocking the rest of the app.
- On completion, show a concise freshness state.

### 2. Automatic online recovery / refresh
**Goal:** when the app opens offline, local cached data is immediately usable; when connectivity returns, the app automatically refreshes/syncs without requiring a manual reload.

Required behavior:
- Offline startup: render cached local ledger immediately.
- Detect transition from offline → online using browser connectivity events.
- When online returns, trigger the appropriate background cloud/data refresh automatically.
- Do not replace good cached data with an empty/partial response because a request failed.
- Avoid duplicate concurrent refreshes if several connectivity signals fire.
- Keep the UI usable while refresh occurs.
- Update visible sync/market freshness state after successful refresh.
- If the device remains offline, do not repeatedly hammer the APIs.

### 3. Listing-day badge wording
**Goal:** distinguish scheduled listing from actual market availability.

Exact rule:
- On listing date, if LTP is `null`, `0`, or otherwise unavailable: **`LISTS TODAY`**.
- On listing date, once a valid positive LTP is available: **`LISTED TODAY`** and show the normal LTP/gain presentation.
- This is primarily a wording/state distinction; do not enlarge the card.

### 4. Compact card actions
**Goal:** remove action clutter from the card while preserving exactly the same edit/delete capabilities elsewhere.

Required change:
- Remove the pencil/edit button from the IPO card.
- Remove the delete button from the IPO card.
- Lift/shift those actions into the IPO detail/edit panel in a logical location.
- Preserve existing behavior and confirmation/safety where appropriate.
- Do not add new card height or new card controls.

### 5. General mobile UX polish
Apply only low-risk improvements that preserve the current visual language:
- Clear pressed/loading states for interactive controls.
- Minimum comfortable mobile tap targets.
- Prevent accidental repeated network actions.
- Keep network operations non-blocking where possible.
- Use concise, human-readable error states instead of raw API errors.
- Preserve the existing typography, colors, spacing, and compact ledger aesthetic.

## Phase 2 — Review-before-implementation UI proposals

These are **not to be implemented until the user approves the visual design**.

### A. IPO detail panel redesign
First produce an exact visual mockup based on the current application style. The proposal should remain compact and should not turn the card itself into a large market-price panel.

### B. Empty states
First produce an exact visual mockup for:
- empty ledger
- no upcoming IPOs
- unavailable market price
- offline state

Keep the current UI unchanged until approved.

## Phase 3 — Robustness / architecture

Potential improvements to consider after Phase 1:
- stale-while-revalidate behavior for cached market data
- automatic retry after transient network failures with backoff
- centralized online/offline state
- centralized request deduplication
- optimistic local writes for ledger changes
- clearer sync conflict handling
- background refresh that never blocks first paint

## Progress

### Phase 0 — Documentation
- [x] Create this plan and progress tracker.
- [ ] Commit documentation.

### Phase 1
- [ ] Market-price status UX
- [ ] Automatic online recovery / refresh
- [ ] Listing-day badge wording
- [ ] Move card edit/delete actions to panel
- [ ] General low-risk mobile UX polish

### Phase 2
- [ ] Show IPO detail-panel mockup for approval
- [ ] Implement only after approval
- [ ] Show empty-state mockups for approval
- [ ] Implement only after approval

### Phase 3
- [ ] Evaluate robustness improvements after Phase 1 review

## Working rule

**One change → test/inspect → one commit → next change.**

Do not push the phase until all approved items in that phase are complete and reviewed.