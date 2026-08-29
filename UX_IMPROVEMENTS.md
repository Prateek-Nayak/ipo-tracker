# IPO Tracker — UX/UI Improvements

Branch: `feat/upstox-migration`

## Scope

This document tracks the agreed UX/UI improvements and implementation history for the current IPO Tracker. Changes must be implemented in the application's actual React source wherever the behavior/UI already belongs there. Do not use post-render DOM manipulation as a substitute for fixing the React JSX/state logic.

## Explicitly excluded / declined

- **Do not redesign IPO cards around market price.** The card should remain compact; price is secondary and should not materially increase card height.
- **Do not implement the proposed richer IPO detail information architecture yet.** User wants to see an exact UI mockup first.
- **Do not change the existing empty-state design yet.** User wants to see an exact UI mockup first.
- **Do not introduce unnecessary visual redesign.** Preserve the current ledger aesthetic and compact card layout.
- Deleted records remain in the database silently for sync/data integrity, but there must be **no user-facing deleted-record/recovery flow**.

## Implementation architecture rule — IMPORTANT

### Fix the source, not the rendered DOM

If a UI element, label, layout, form field, button, state, or interaction is rendered by `App.jsx`/React, fix it directly in the JSX and React state/handlers.

**Do NOT create or use a separate JavaScript post-render enhancement layer to modify the same UI.** In particular:

- Do not use `querySelector`, `TreeWalker`, MutationObserver, or text replacement to rename/remove React controls.
- Do not use a separate `uxEnhancements.js` file to patch UI that can be correctly implemented in `App.jsx`.
- Do not make React render one thing and then mutate it into something else after render.
- Swipe gestures that belong to a React sheet should be implemented by the sheet component itself.
- Form state and disabled/enabled states must come from React state, not DOM inspection.
- Labels, grids, badges, fields, and actions should be changed at their actual JSX source.
- If reconnect/sync behavior belongs in React effects, keep it in the React application rather than programmatically clicking rendered buttons from another script.

`uxEnhancements.js` was introduced as a workaround during an unsuccessful implementation attempt. It is **not the intended architecture** and should be removed if it is not independently required after the real JSX implementation is completed.

## Iteration / Git / deployment rule — IMPORTANT

The user explicitly requires:

**One iteration = all requested changes completed → inspect/test → one commit → one push.**

Do not push individual fixes during an iteration. Do not create a commit for every tiny change. This is specifically to avoid unnecessary Vercel builds and build-limit bottlenecks.

Before the single commit/push:
- inspect all affected source files;
- verify all requested items together;
- remove obsolete workaround code;
- check for regressions;
- ensure the build is syntactically valid where possible.

Never report an item as fixed merely because a workaround or CSS override was added. Confirm that the actual rendered React implementation contains the requested behavior.

## Previous implementation/reporting failure — recorded for continuity

The previous iteration was incorrectly reported as complete even though most requested changes were not actually reflected in the UI.

Specific failures:

- A DOM-level `uxEnhancements.js` workaround was used instead of changing the source JSX.
- The workaround itself was not reliably connected to the React implementation.
- Several changes were reported as fixed when the actual JSX still contained the old labels/controls.
- `Add one` and `Apply in bulk` remained in the source/UI.
- The date layout remained incorrect rather than becoming the requested 2×2 matrix.
- Record Allotment continued to use shares instead of making lots the user input.
- Edit Application did not correctly implement the requested editable/immutable-field behavior.
- Market-price status changes were not reliably reflected in the actual source UI.
- Multiple intermediate commits/pushes were made, contrary to the user's one-push-per-iteration requirement, causing unnecessary deployment/build activity.

These reports must **not** be treated as completed work. The stable reference supplied by the user is:

`e31bff6 — feat: polish detail sheet and reconnect UX`

When recovering/reworking this iteration, use that stable point as the reference rather than assuming the previously reported fixes were correct.

## Phase 1 — Immediate UX / data-state improvements

### 1. Market-price status UX
**Goal:** make the market-price area communicate useful status without exposing implementation details.

Target behavior:
- Remove misleading implementation-oriented wording such as `X of Y IPOs matched on Upstox`.
- Completion should show a concise freshness state such as `Prices updated 2 min ago`.
- During refresh use `Updating market prices…`.
- Keep the status and refresh action compact; they should not unnecessarily consume the full available row width.

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

### 5. Detail-panel actions and notes

Required behavior:
- Remove **Add one** completely.
- Rename **Apply in bulk** to **Apply IPO**.
- Keep the explanatory note text under the Note field removed.
- **Save Note** is disabled until the note is actually changed.
- Save Note should be positioned naturally at the right of the note controls.
- After saving, Save Note becomes disabled again until the note changes.

### 6. Detail-panel dates

The four dates must be a real fixed **2×2 matrix**, not a flexible four-item row:

```text
Open       | Close
Allotment  | Listing
```

The labels and values should have consistent alignment across both columns.

### 7. Detail-panel swipe dismissal

Required behavior:
- At the top of the detail panel, swipe down dismisses the panel.
- If the panel is scrolled down, normal scrolling takes priority.
- Touches beginning on inputs, textareas, selects, buttons, or links must not accidentally dismiss the panel.
- Short panels without an internal scrollbar must also support swipe-down dismissal.
- Implement this in the actual React sheet component, not with a DOM post-processing script.

### 8. Application cards

- Reduce application-card height slightly while preserving readability.
- Do not introduce unnecessary typography variation.

### 9. Edit Application form

The form must allow editing of the fields that are intended to be mutable. IPO metadata/immutable fields must remain protected.

Specific requirement from the user:
- **Only allotted lots should be mutable for the allotment quantity.**
- Do not expose raw share quantity as the user input for allotment.
- Form typography should match the rest of the application form/UI.

### 10. Record Allotment

The user input must be:

**Lots allotted**

not:

**Shares allotted / Quantity**

The underlying share quantity may continue to be derived from:

`lots allotted × IPO lot size`

The user should never have to calculate or enter the share quantity manually.

### 11. Light-theme allotment badges

The **Allotted** and **Not Allotted** badges in the detail panel must visually match the stronger green/red treatment used by the allotment progress bar. The dark theme already looks acceptable and should not be unnecessarily changed.

### 12. General mobile UX polish

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

### Stable reference
- [x] `e31bff6` identified by user as the recent stable commit.
- [x] Subsequent incorrect implementation attempts identified and should not be treated as completed fixes.

### Phase 0 — Documentation
- [x] Create this plan and progress tracker.
- [x] Record implementation architecture rule: fix React JSX/state directly; do not use a JS DOM-enhancement layer.
- [x] Record previous false completion reports and the one-push-per-iteration requirement.

### Phase 1
- [ ] Market-price status UX
- [ ] Automatic online recovery / refresh
- [ ] Listing-day badge wording
- [ ] Move card edit/delete actions to panel
- [ ] Remove Add one
- [ ] Rename Apply in bulk → Apply IPO
- [ ] Note save dirty-state and positioning
- [ ] Real 2×2 date matrix
- [ ] Short-sheet swipe dismissal
- [ ] Application-card height reduction
- [ ] Edit Application mutable/immutable fields
- [ ] Record Allotment lots input
- [x] Light-theme Allotted / Not Allotted badge treatment (this is the only item previously observed to visibly change)
- [ ] General low-risk mobile UX polish

### Phase 2
- [ ] Show IPO detail-panel mockup for approval
- [ ] Implement only after approval
- [ ] Show empty-state mockups for approval
- [ ] Implement only after approval

### Phase 3
- [ ] Evaluate robustness improvements after Phase 1 review

## Working rule

**Do not report an item as complete until it is verified in the actual React source and rendered behavior.**

**Do not create a separate JS DOM-enhancement file for functionality that belongs in the JSX/component implementation.**

**Complete the entire requested iteration first, then make exactly ONE commit and ONE push.**

This avoids unnecessary Vercel builds and preserves the user's deployment/build limit.
