# Implementation Guide — Next Iteration

Branch: `feat/upstox-migration`
Base commit: `0d3da08` (reverted to working state after `b410b44`)

## Architecture Rules

- **All changes go in `src/App.jsx`** (single-file React app)
- **No external DOM manipulation** — everything is React JSX and state
- **Build with `npx vite build`** after every change to verify
- **One commit, one push** when all items are done
- The file contains special Unicode: non-breaking spaces (`\u00A0`), em dashes (`\u2014`), middle dots (`\u00B7`). Be careful with string matching.

## Overview of Changes

| # | Change | Scope |
|---|--------|-------|
| 1 | Account Detail Sheet | New component + wiring |
| 2 | Tappable Account Cards | AccountList component |
| 3 | Tappable Transfer Cards | TransferList component |
| 4 | Transfer Delete in Form | TransferFormSheet component |
| 5 | IPO Form: Manual Entry Warning | IpoFormSheet component |
| 6 | IPO Form: Price Band (min/max) | IpoFormSheet component |
| 7 | IPO Detail: Show Price Band | IpoDetailSheet component |

---

## Change 1: Account Detail Sheet

### Why
Account cards currently have inline edit/delete buttons. We want to match the IPO pattern: tap card → open detail sheet → see all data → edit/delete from there.

### Step 1a: Add `acctDetail` state

**File:** `src/App.jsx`
**Location:** Line ~1028 (after `ipoDetail` state declaration)

Add this line right after `const [ipoDetail, setIpoDetail] = useState(null);`:

```jsx
const [acctDetail, setAcctDetail] = useState(null);       // account id
```

### Step 1b: Add `acctDetail` to `backLayers`

**Location:** Line ~1221

Change:
```jsx
const backLayers = { appSheet, bulkApplyFor, bulkStatusFor, ipoSheet, acctSheet,
    transferSheet, liveOpen, dataSheetOpen, ipoDetail, tab };
```

To:
```jsx
const backLayers = { appSheet, bulkApplyFor, bulkStatusFor, ipoSheet, acctSheet,
    transferSheet, liveOpen, dataSheetOpen, ipoDetail, acctDetail, tab };
```

### Step 1c: Add `acctDetail` to `closeTopLayer`

**Location:** Line ~1247 (after the `if (v.acctSheet)` line)

Add this line right after `if (v.acctSheet) { setAcctSheet(null); return true; }`:

```jsx
if (v.acctDetail) { setAcctDetail(null); return true; }
```

### Step 1d: Create the `AccountDetailSheet` component

**Location:** Insert before `function TransfersScreen(` (line ~3146)

```jsx
function AccountDetailSheet({ account, ipos, transfers, accounts, onClose, onEdit, onDelete }) {
  if (!account) return null;

  const apps = useMemo(() => {
    const list = [];
    ipos.forEach((ipo) => {
      (ipo.applications || []).forEach((app) => {
        if (app.accountId === account.id) list.push({ ...app, ipo });
      });
    });
    return list.sort((a, b) =>
      (b.ipo.applicationDate || b.ipo.openDate || "").localeCompare(
        a.ipo.applicationDate || a.ipo.openDate || ""));
  }, [account.id, ipos]);

  const totals = useMemo(() => {
    let applied = 0, allotted = 0, invested = 0, realized = 0, unrealized = 0;
    apps.forEach((app) => {
      applied++;
      const price = Number(app.ipo.priceBand) || 0;
      const shares = Number(app.sharesAllotted) || 0;
      if (app.allotmentStatus === "Allotted" || app.allotmentStatus === "Partial") {
        allotted++;
        invested += shares * price;
        if (app.sold) {
          realized += shares * ((Number(app.sellPrice) || 0) - price);
        } else {
          const mark = valuationPrice(app.ipo);
          if (mark) unrealized += shares * (mark - price);
        }
      }
    });
    return { applied, allotted, invested, realized, unrealized };
  }, [apps]);

  const acctTransfers = useMemo(() =>
    transfers.filter((t) => t.fromAccountId === account.id || t.toAccountId === account.id),
    [account.id, transfers]
  );

  const pan = panOf(account);

  return (
    <Sheet title={account.name} onClose={onClose}>
      {/* Header: badges + edit pencil */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Badge color={COLORS.navy} bg={COLORS.chip}>{account.relation || "Self"}</Badge>
          {account.bank && <Badge color={COLORS.inkSoft} bg="#EFEDE7">{account.bank}</Badge>}
          {pan
            ? <Badge color={COLORS.inkSoft} bg="#EFEDE7">{pan}</Badge>
            : <Badge color={COLORS.gold} bg={COLORS.goldSoft}>No PAN</Badge>}
        </div>
        <button onClick={onEdit} aria-label="Edit account" style={roundIconBtn}>
          <Pencil size={14} color={COLORS.inkSoft} />
        </button>
      </div>

      {/* Notes */}
      {account.notes && (
        <div style={{
          fontSize: 12.5, color: COLORS.inkSoft, fontFamily: "Inter, sans-serif",
          fontStyle: "italic", marginBottom: 14,
        }}>"{account.notes}"</div>
      )}

      {/* 2×2 stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: COLORS.ink }}>{totals.applied}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: "Inter, sans-serif" }}>Applied</div>
        </div>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: totals.allotted ? COLORS.green : COLORS.ink }}>{totals.allotted}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: "Inter, sans-serif" }}>Allotted</div>
        </div>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: COLORS.ink }}>{inr(totals.invested)}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: "Inter, sans-serif" }}>Invested</div>
        </div>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: (totals.realized + totals.unrealized) >= 0 ? COLORS.green : COLORS.red }}>{inr(totals.realized + totals.unrealized)}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: "Inter, sans-serif" }}>Total P&L</div>
        </div>
      </div>

      {/* IPO Applications list */}
      <SectionLabel>IPO Applications ({apps.length})</SectionLabel>
      {apps.length === 0 ? (
        <EmptyState text="No applications from this account yet." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {apps.map((app) => {
            const meta = STATUS_META[app.allotmentStatus] || STATUS_META.Pending;
            const strongStatus = app.allotmentStatus === "Allotted" || app.allotmentStatus === "Not Allotted";
            const price = Number(app.ipo.priceBand) || 0;
            const shares = Number(app.sharesAllotted) || 0;
            let pnl = null;
            if (app.sold) pnl = shares * ((Number(app.sellPrice) || 0) - price);
            else if ((app.allotmentStatus === "Allotted" || app.allotmentStatus === "Partial") && shares) {
              const mark = valuationPrice(app.ipo);
              if (mark) pnl = shares * (mark - price);
            }
            return (
              <div key={app.id} style={{
                background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "9px 10px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{
                    fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13.5, color: COLORS.ink,
                    minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{app.ipo.company || "Untitled IPO"}</div>
                  <Badge color={meta.color} bg={meta.bg} strong={strongStatus}>{app.allotmentStatus}</Badge>
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginTop: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5,
                }}>
                  <span style={{ color: COLORS.inkSoft }}>{app.lots || 0} lot(s){app.sold ? " · Sold" : ""}</span>
                  {pnl !== null && (
                    <span style={{ fontWeight: 700, color: pnl >= 0 ? COLORS.green : COLORS.red }}>
                      {app.sold ? "P&L " : "Unreal. "}{inr(pnl)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fund Transfers for this account */}
      {acctTransfers.length > 0 && (
        <>
          <SectionLabel>Fund Transfers ({acctTransfers.length})</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {acctTransfers.map((t) => {
              const from = accounts.find((a) => a.id === t.fromAccountId)?.name || "Unknown";
              const to = accounts.find((a) => a.id === t.toAccountId)?.name || "Unknown";
              const isOutgoing = t.fromAccountId === account.id;
              return (
                <div key={t.id} style={{
                  background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "8px 10px",
                  fontFamily: "Inter, sans-serif", fontSize: 12.5,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: COLORS.ink, fontWeight: 600 }}>
                      {isOutgoing ? `To ${to}` : `From ${from}`}
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                      color: isOutgoing ? COLORS.red : COLORS.green,
                    }}>{isOutgoing ? "-" : "+"}{inrOrDash(t.amount)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>
                    {fmtDate(t.date)}{t.remarks ? ` · ${t.remarks}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Delete at bottom */}
      <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${COLORS.border}` }}>
        <SectionLabel>Account actions</SectionLabel>
        <button onClick={() => {
          const n = apps.length;
          const msg = n
            ? `Delete ${account.name || "this account"} and remove it from ${n} application${n === 1 ? "" : "s"}? The applications stay on their IPOs.`
            : `Delete ${account.name || "this account"}?`;
          if (confirm(msg)) onDelete(account.id);
        }} style={{
          width: "100%", marginTop: 6, minHeight: 44, borderRadius: 10,
          border: `1px solid ${COLORS.red}`, background: COLORS.redSoft, color: COLORS.red,
          fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif",
        }}>Delete Account</button>
      </div>
    </Sheet>
  );
}
```

### Step 1e: Wire `AccountDetailSheet` in the render

**Location:** Right before `{acctSheet && (` (line ~1853)

Insert this block:

```jsx
      {acctDetail && (
        <AccountDetailSheet
          account={accounts.find((a) => a.id === acctDetail)}
          ipos={ipos}
          transfers={transfers}
          accounts={accounts}
          onClose={() => setAcctDetail(null)}
          onEdit={() => { setAcctSheet({ account: accounts.find((a) => a.id === acctDetail) }); }}
          onDelete={(id) => {
            const gone = accounts.find((x) => x.id === id);
            if (!gone) return;
            discard("account", gone, gone.name || "Unnamed account");
            persistAccounts(accounts.filter((x) => x.id !== id));
            setAcctDetail(null);
          }}
        />
      )}
```

---

## Change 2: Tappable Account Cards

### Why
Remove inline edit/delete buttons from account cards. Make the whole card tappable to open the detail sheet.

### Step 2a: Update `AccountList` function signature

**Location:** Line ~3011

Change:
```jsx
function AccountList({ accounts, ipos, transfers = [], onEdit, onDelete }) {
```
To:
```jsx
function AccountList({ accounts, ipos, transfers = [], onOpen }) {
```

### Step 2b: Make account card tappable

**Location:** Line ~3112 (the `<div key={acc.id}` line)

Change:
```jsx
              <div key={acc.id} style={{
                background: COLORS.surface, border: `1px solid ${isDup ? COLORS.red : COLORS.border}`,
                borderRadius: 12, padding: "12px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
              }}>
```
To:
```jsx
              <div key={acc.id} onClick={() => onOpen(acc.id)} style={{
                background: COLORS.surface, border: `1px solid ${isDup ? COLORS.red : COLORS.border}`,
                borderRadius: 12, padding: "12px 14px", cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
              }}>
```

### Step 2c: Replace edit/delete buttons with chevron

**Location:** Line ~3137 (the `<div style={{ display: "flex", gap: 6` block with the two buttons)

Replace the entire block:
```jsx
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => onEdit(acc)} aria-label="Edit account" style={roundIconBtn}><Pencil size={14} color={COLORS.inkSoft} /></button>
                  <button onClick={() => { if (confirmAccountDelete(acc)) onDelete(acc.id); }} aria-label="Delete account" style={roundIconBtn}><Trash2 size={14} color={COLORS.red} /></button>
                </div>
```

With:
```jsx
                <ChevronRight size={14} color={COLORS.inkSoft} style={{ flexShrink: 0 }} />
```

### Step 2d: Update AccountList caller

**Location:** Line ~1708 (inside the `{tab === "accounts"` block)

Change:
```jsx
          <AccountList
            transfers={transfers}
            accounts={accounts} ipos={ipos}
            onEdit={(account) => setAcctSheet({ account })}
            onDelete={(id) => {
              const gone = accounts.find((x) => x.id === id);
              if (!gone) return;
              discard("account", gone, gone.name || "Unnamed account");
              persistAccounts(accounts.filter((x) => x.id !== id));
            }}
          />
```

To:
```jsx
          <AccountList
            transfers={transfers}
            accounts={accounts} ipos={ipos}
            onOpen={(id) => setAcctDetail(id)}
          />
```

---

## Change 3: Tappable Transfer Cards

### Why
Make transfer cards tappable to open the edit form (same interaction pattern as IPO/account cards).

### Step 3a: Make transfer card clickable

**Location:** Line ~3331 (the `<div key={t.id} style={{` line in TransferList)

Change:
```jsx
        <div key={t.id} style={{
          background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12,
          padding: "10px 12px",
        }}>
```

To:
```jsx
        <div key={t.id} onClick={() => onEdit(t)} style={{
          background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12,
          padding: "10px 12px", cursor: "pointer",
        }}>
```

### Step 3b: Replace edit/delete buttons with chevron

**Location:** Line ~3353 (the edit/delete button div inside the transfer card)

Replace:
```jsx
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => onEdit(t)} aria-label="Edit transfer" style={smallIconBtn}><Pencil size={13} color={COLORS.inkSoft} /></button>
              <button onClick={() => { if (confirm("Delete this transfer?")) onDelete(t.id); }} aria-label="Delete transfer" style={smallIconBtn}><Trash2 size={13} color={COLORS.red} /></button>
            </div>
```

With:
```jsx
            <ChevronRight size={14} color={COLORS.inkSoft} style={{ flexShrink: 0 }} />
```

---

## Change 4: Transfer Delete in Form

### Why
Since we removed the delete button from the card, it needs to live inside the edit form.

### Step 4a: Update `TransferFormSheet` signature

**Location:** Line ~3597

Change:
```jsx
function TransferFormSheet({ initial, accounts, ipos, onClose, onSave }) {
```
To:
```jsx
function TransferFormSheet({ initial, accounts, ipos, onClose, onSave, onDelete }) {
```

### Step 4b: Add delete button to the form

**Location:** Right after the `</PrimaryButton>` and before `</Sheet>` in `TransferFormSheet` (line ~3633)

Insert between `</PrimaryButton>` and `</Sheet>`:

```jsx
      {initial && onDelete && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.border}` }}>
          <button onClick={() => {
            if (confirm("Delete this transfer?")) { onDelete(f.id); onClose(); }
          }} style={{
            width: "100%", minHeight: 44, borderRadius: 10,
            border: `1px solid ${COLORS.red}`, background: COLORS.redSoft, color: COLORS.red,
            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif",
          }}>Delete Transfer</button>
        </div>
      )}
```

### Step 4c: Pass `onDelete` to `TransferFormSheet`

**Location:** Line ~1869 (where `<TransferFormSheet` is rendered inside App)

Add the `onDelete` prop:

```jsx
      {transferSheet && (
        <TransferFormSheet
          initial={transferSheet.transfer}
          accounts={accounts}
          ipos={ipos}
          onClose={() => setTransferSheet(null)}
          onDelete={(id) => {
            const gone = transfers.find((x) => x.id === id);
            if (!gone) return;
            const who = (aid) => accounts.find((a) => a.id === aid)?.name || "Unknown";
            discard("transfer", gone, `${inr(gone.amount)} · ${who(gone.fromAccountId)} to ${who(gone.toAccountId)}`);
            persistTransfers(transfers.filter((x) => x.id !== id));
          }}
          onSave={(data) => {
```

Note: the existing `onSave` block stays as-is, just insert `onDelete` before it.

---

## Change 5: IPO Form — Manual Entry Warning

### Why
When manually adding an IPO (not from exchange), market prices won't sync. Warn the user.

### Step 5: Add warning banner

**Location:** Inside `IpoFormSheet`, right after `<Sheet title={...} onClose={onClose}>` (line ~3389)

Insert before `<Field label="Company Name">`:

```jsx
      {!initial && (
        <div style={{
          background: COLORS.goldSoft, display: "flex", alignItems: "flex-start",
          gap: 8, padding: "10px 12px", borderRadius: 10, marginBottom: 14,
          fontSize: 12, color: COLORS.ink, fontFamily: "Inter, sans-serif",
        }}>
          <AlertTriangle size={14} color={COLORS.gold} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Market prices can only sync for IPOs added from the exchange. Use <strong>Add from exchange</strong> in the IPO list header when possible.</span>
        </div>
      )}
```

---

## Change 6: IPO Form — Price Band (min/max)

### Why
Currently only shows the cutoff price. Users need to see and set the full band (low–high).

### Step 6a: Add `priceBandLow` to the form state default

**Location:** Line ~3370 (the `useState` in `IpoFormSheet`)

The current state initializer has `priceBand: ""`. Keep it and ensure `priceBandLow` is also initialized:

```jsx
  const [f, setF] = useState(initial || {
    id: undefined, company: "", category: "Mainboard", applicationDate: "", priceBand: "",
    priceBandLow: "", lotSize: "", listingDate: "", listingPrice: "", remarks: "",
  });
```

### Step 6b: Replace single price field with two fields

**Location:** Line ~3388 (the Price per Share field)

Replace:
```jsx
      <Field label="Price per Share (₹)"><Input type="number" inputMode="numeric" value={f.priceBand} onChange={set("priceBand")} placeholder="e.g. 285" /></Field>
```

With:
```jsx
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Price Band Low (₹)">
            <Input type="number" inputMode="numeric" value={f.priceBandLow || ""} onChange={set("priceBandLow")} placeholder="e.g. 270" />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Cutoff Price (₹)">
            <Input type="number" inputMode="numeric" value={f.priceBand} onChange={set("priceBand")} placeholder="e.g. 285" />
          </Field>
        </div>
      </div>
```

---

## Change 7: IPO Detail — Show Price Band

### Why
Show "₹270–₹285" instead of just "Price ₹285" when both values are set.

### Step 7: Update the price badge in `IpoDetailSheet`

**Location:** Line ~2849 (inside the badges div at the top of `IpoDetailSheet`)

Find the price badge:
```jsx
        <Badge color={COLORS.inkSoft} bg="#EFEDE7">Price ₹{ipo.priceBand || "—"}</Badge>
```

Replace with:
```jsx
        <Badge color={COLORS.inkSoft} bg="#EFEDE7">
          {ipo.priceBandLow
            ? `₹${ipo.priceBandLow}–₹${ipo.priceBand}`
            : `Price ₹${ipo.priceBand || "—"}`}
        </Badge>
```

---

## Verification Checklist

After implementing all changes, verify:

1. `npx vite build` succeeds with no errors
2. **Accounts tab**: Cards show chevron (no edit/delete buttons), tapping opens detail sheet
3. **Account detail**: Shows badges, 2×2 stats, IPO list with P&L, transfers, edit pencil, delete at bottom
4. **Account edit**: Pencil in detail header opens the account form; back button returns to detail
5. **Transfers tab**: Cards show chevron, tapping opens edit form
6. **Transfer edit form**: Has "Delete Transfer" button at bottom when editing existing transfer
7. **IPO form (manual)**: Shows gold warning banner about exchange sync
8. **IPO form**: Has two price fields (Low + Cutoff)
9. **IPO detail**: Shows "₹270–₹285" format when band low is set
10. **Back gesture**: Peels layers correctly: detail sheet → main list
