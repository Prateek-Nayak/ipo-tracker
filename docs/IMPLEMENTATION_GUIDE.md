# Implementation Guide -- Remaining UX Changes

Branch: `feat/upstox-migration`  
Base commit: `a5a6738` (account detail sheet, tappable cards, unicode cleanup)

## Critical Rules

1. **Do NOT use string-replace patch scripts.** They have repeatedly matched the wrong locations in this 4700-line file. Use `str_replace` tool directly, reading the exact lines first.
2. **The file has `·` (U+00B7 middle dot) and `₹` (U+20B9 rupee) as the only non-ASCII.** All em dashes, curly quotes, etc. have been replaced with ASCII. `str_replace` should work on most strings.
3. **Build with `npx vite build` after EVERY change** to catch errors early.
4. **Read the exact lines before editing.** The file is large -- use line numbers as hints, not gospel.
5. **One commit, one push** when everything is done and verified.

## What's Already Working (do NOT break)

- Account detail sheet with stats, IPO list, transfers, edit/delete
- Tappable account cards with chevron (open detail sheet)
- Tappable transfer cards (open edit form)  
- Delete Transfer button inside the edit form
- IPO form manual entry warning banner
- IPO form price band low/high fields
- IPO detail shows price band when both values exist
- Badge tinted fill for Allotted/Not Allotted
- Swipe-to-dismiss sheets
- Offline indicator
- Search clear button... WAIT -- this was in the reverted commit

## Changes Needed

### 1. Remove chevron from transfer cards

**Why:** The `>` symbol doesn't look good on transfer cards.

**Location:** `TransferList` component. Find the ChevronRight inside the transfer card.

**How:** Read the transfer card JSX in `TransferList`. There's a `<ChevronRight>` after the date/remarks line. Remove just that one line. Do NOT remove the ChevronRight in AccountList (account cards should keep theirs).

**Exact approach:** Read lines around the transfer card in `TransferList` (starts around line 3419). Find the `<ChevronRight` inside that area and remove it.

---

### 2. Store priceBandLow from Upstox API response

**Why:** Upstox returns `minimum_price` and `maximum_price`. We store `maximum_price` as `priceBand` but never store `minimum_price`.

**Location:** In `refreshPricesFrom` function (around line 1455), find:
```
if (hit.priceMax != null) patch.priceBand = String(hit.priceMax);
```

**Add after it:**
```
if (hit.priceMin != null) patch.priceBandLow = String(hit.priceMin);
```

---

### 3. Search bar clear button (X)

**Why:** All search bars need a way to clear text without manually selecting and deleting.

**Location:** `ListControls` component (around line 2385). The search input is inside a relative-positioned div wrapper.

**How:** After the `<Input>` element inside the search wrapper div, add a clear button that shows when search is non-empty. Also add `paddingRight: search ? 34 : 12` to the Input style so text doesn't overlap the button.

Find the Input:
```jsx
<Input
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder={placeholder}
  style={{ paddingLeft: 34 }}
/>
</div>
```

Replace with:
```jsx
<Input
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder={placeholder}
  style={{ paddingLeft: 34, paddingRight: search ? 34 : 12 }}
/>
{search && (
  <button onClick={() => setSearch("")} aria-label="Clear search" style={{
    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", padding: 4, cursor: "pointer", display: "flex",
  }}><X size={14} color={COLORS.inkSoft} /></button>
)}
</div>
```

---

### 4. Remove filter section from Transfers list

**Why:** Transfer filters are vague and redundant with search.

**Location:** `TransferList` component (around line 3419).

**How:** 
1. Remove `const [filter, setFilter] = useState([]);` from the state
2. In the `shown` useMemo, remove the filter logic (the `if (!filter.length) return true; return filter.some(...)` block). Just keep the search filter.
3. Remove `filter` from the useMemo dependency array  
4. Remove the `linked` count line
5. Remove the `filter`, `setFilter`, and `filters` props from the `<ListControls>` call

**IMPORTANT:** `ListControls` receives `filter` and `filters` as optional props. When they are not passed, `ListControls` must NOT crash. The component uses `Array.isArray(filter) ? filter : []` which is safe. BUT: it calls `setFilter(...)` in the filter panel and `filters.map(...)` in the render. To prevent crashes, also make `ListControls` guard the filter section:

In `ListControls`, wrap the "Show" filter section (the div with SectionLabel "Show" and the filter chips) with: `{Array.isArray(filters) && filters.length > 0 && ( ... )}`. Also guard the `toggleFilter` function: `if (!setFilter) return;`.

---

### 5. Remove "All: Partial" from bulk allotment quick-set

**Why:** Partial allotment is rare; the button adds no value.

**Location:** `BulkStatusSheet` (around line 4205). Find:
```
{ALLOTMENT_STATUSES.map((s) => (
  <button key={s} onClick={() => setAll(s)} ...>All: {s}</button>
```

**Replace with:**
```
{["Pending", "Allotted", "Not Allotted"].map((s) => (
  <button key={s} onClick={() => setAll(s)} ...>All: {s}</button>
```

IMPORTANT: The `ALLOTMENT_STATUSES` constant is also used elsewhere (per-application dropdowns). Do NOT change the constant -- only change this one `.map()` call.

---

### 6. Transfer card padding fix

**Why:** Top padding looks larger than bottom in transfer cards.

**Location:** Transfer card in `TransferList` (around line 3480).

**How:** Change `padding: "10px 12px"` to `padding: "10px 12px 11px"` or just equalize to `padding: "10px 12px"`. The issue might be font metrics making it look uneven. Try `padding: "9px 12px 10px"` to visually balance.

Also change the account name font color from `COLORS.ink` to `COLORS.heading` and add `fontFamily: "Inter, sans-serif"` to match other card name styles.

---

### 7. Remove ALL "Upstox" from UI strings  

**Why:** Implementation detail shouldn't be user-facing.

**Locations to check:**
1. `IpoFormSheet` dates comment (around line 3554) -- replace with "Dates are typically filled automatically when prices are refreshed."
2. No-dates message (around line 3587): "Upstox has none..." -> "No dates available yet. Refresh prices to fill them in automatically."
3. Edit dates note (around line 3594): "A refresh overwrites these whenever Upstox..." -> "Dates update automatically when prices are refreshed."
4. Listing price label (around line 3602): "(from Upstox, ...)" -> "(from exchange, ...)"  -- there are TWO instances on this line (bse-open and bse-close variants)
5. Live IPOs note (around line 4410): "from Upstox." -> "from the exchange."

---

### 8. Account detail -- sort transfers descending (newest first)

**Location:** `AccountDetailSheet` component (around line 3196). Find:
```
const acctTransfers = useMemo(() =>
  transfers.filter((t) => t.fromAccountId === account.id || t.toAccountId === account.id),
  [account.id, transfers]
);
```

**Add `.sort()` before the comma:**
```
const acctTransfers = useMemo(() =>
  transfers.filter((t) => t.fromAccountId === account.id || t.toAccountId === account.id)
    .sort((a, b) => (b.date || "").localeCompare(a.date || "")),
  [account.id, transfers]
);
```

---

### 9. Prevent re-importing already-added IPOs

**Why:** The exchange import greys out existing IPOs but still lets you select them.

**Location:** `LiveIposSheet` (around line 4356). The component has a `known` Set and `isKnown()` function. There is NO `toggle` function in this component -- instead, the checkbox `onChange` calls `setPicked` directly or the `selectAllNew` function.

**How:** Find the checkbox for each IPO row. It likely looks like:
```jsx
<input type="checkbox" checked={!!picked[r.company]} onChange={() => setPicked(...)} ... />
```

Add `disabled={isKnown(r)}` to it. Also, in the `selectAllNew` function, it already only selects `newVisible` (which filters out known ones), so that's fine.

Also check: the `doImport` function -- make sure it doesn't import known ones.

---

### 10. Field component -- error prop support

**Location:** `Field` component (around line 787).

Change signature from `{ label, children }` to `{ label, children, error }`.

Change the label color: `color: error ? COLORS.red : COLORS.inkSoft`

Add after `{children}`:
```jsx
{error && <span style={{ display: "block", fontSize: 11, color: COLORS.red, marginTop: 4, fontFamily: "Inter, sans-serif" }}>{error}</span>}
```

This is prep work for inline form validation (replacing alert() calls later).

---

### 11. Sheet animation -- fix stacking behavior

**Current problem:** The slide-up animation plays on every Sheet mount. When closing a second panel reveals a first panel that was behind it, the first panel either re-animates (if it remounted) or has no animation.

**Desired behavior:**
- First panel opening: slide-up animation
- Second panel opening on top: slide-up animation  
- Closing second panel: NO re-animation on first panel
- Closing first panel: no animation needed (it's going away)

**The root issue:** In the IPO section, opening BulkApply/BulkStatus does `setIpoDetail(null)` first, then `setBulkApplyFor(ipoId)`. When the bulk sheet closes, it does `setBulkApplyFor(null)` then `setIpoDetail(bulkApplyFor)`. This REMOUNTS the IpoDetailSheet, causing it to re-animate.

In the account section, opening edit does `setAcctSheet(...)` WITHOUT closing `acctDetail`, so the detail sheet stays mounted behind the edit sheet. This is why it doesn't re-animate on accounts -- it never unmounted.

**Fix approach:** Make the IPO section behave like accounts -- keep `ipoDetail` set while `bulkApplyFor`/`bulkStatusFor` are open. Change:
- `onBulkApply={(ipoId) => { setIpoDetail(null); setBulkApplyFor(ipoId); }}` to just `setBulkApplyFor(ipoId)` (don't clear ipoDetail)
- `onBulkStatus={(ipoId) => { setIpoDetail(null); setBulkStatusFor(ipoId); }}` to just `setBulkStatusFor(ipoId)`
- The close handlers already restore ipoDetail, so remove that: `onClose={() => { setBulkApplyFor(null); setIpoDetail(bulkApplyFor); }}` becomes `onClose={() => setBulkApplyFor(null)}`

This keeps the IPO detail sheet mounted behind the bulk sheet, so it doesn't re-animate.

For the slide-up animation itself, keep it as `animation: "sheetSlideUp 280ms ease-out"` (always animate on mount). The fix is preventing unnecessary remounts, not suppressing the animation.

---

### 12. Back button exits app from first panel

**Why:** Pressing back on the first (only) panel should close it and return to the list, not exit the app.

This is likely already handled by `closeTopLayer`. Verify that `acctDetail` is in the `closeTopLayer` chain. It was added in commit `a5a6738`. The issue might be that the back button handler's history buffer isn't being replenished.

Check: does the `onPop` handler in the `useEffect` at the bottom of App's back button logic properly push a new history entry after closing a layer?

---

## Verification Checklist

After all changes:
1. `npx vite build` succeeds
2. Transfer cards have no chevron, are tappable, have balanced padding
3. Search bars show X clear button when text is present
4. Transfer list has no filter section (just search + sort)
5. No "All: Partial" in bulk allotment
6. No "Upstox" in any UI string
7. Account detail transfers sorted newest first
8. Already-imported IPOs can't be selected in exchange import
9. Field component accepts error prop
10. Opening/closing stacked panels doesn't re-animate the underlying panel
11. Back button peels layers correctly, doesn't exit the app
12. Auto-fetched IPOs get priceBandLow from API
13. ALL existing functionality still works
