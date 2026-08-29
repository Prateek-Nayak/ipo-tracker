# Upstox API Endpoint Tests

Run these on a system with the `UPSTOX_ANALYTICS_TOKEN` configured. Verify responses match expected shapes.

## Test 1: Get Open IPOs (regular)

```bash
curl --location 'https://api.upstox.com/v2/ipos?status=open&issue_type=regular&page_number=1&records=30' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer $UPSTOX_ANALYTICS_TOKEN'
```

**Verify:**
- Status 200
- `status` = "success"
- `data` is an array
- Each item has: `id`, `symbol`, `name`, `status`, `isin`, `issue_type`, `issue_size`, `minimum_price`, `maximum_price`, `bidding_start_date`, `bidding_end_date`, `total_subscription`
- `meta_data.page` has `page_number`, `total_pages`, `records`, `total_records`

---

## Test 2: Get Open IPOs (sme)

```bash
curl --location 'https://api.upstox.com/v2/ipos?status=open&issue_type=sme&page_number=1&records=30' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer $UPSTOX_ANALYTICS_TOKEN'
```

**Verify:** Same shape as Test 1, all items have `issue_type` = "sme"

---

## Test 3: Get Upcoming IPOs

```bash
curl --location 'https://api.upstox.com/v2/ipos?status=upcoming&page_number=1&records=30' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer $UPSTOX_ANALYTICS_TOKEN'
```

**Verify:** Same shape. Items have `status` = "upcoming".

---

## Test 4: Get Listed IPOs

```bash
curl --location 'https://api.upstox.com/v2/ipos?status=listed&page_number=1&records=30' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer $UPSTOX_ANALYTICS_TOKEN'
```

**Verify:** Same shape. Items have `status` = "listed".

---

## Test 5: Get Closed IPOs

```bash
curl --location 'https://api.upstox.com/v2/ipos?status=closed&page_number=1&records=30' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer $UPSTOX_ANALYTICS_TOKEN'
```

**Verify:** Same shape. Items have `status` = "closed".

---

## Test 6: Get IPO Details

Use an `id` from one of the above responses (e.g. from a listed IPO).

```bash
curl --location 'https://api.upstox.com/v2/ipos/REPLACE_WITH_ACTUAL_ID' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer $UPSTOX_ANALYTICS_TOKEN'
```

**Verify:**
- Status 200
- `data` has: `id`, `symbol`, `name`, `status`, `isin`, `issue_type`, `lot_size`, `listing_price`, `listing_exchange`
- `data.timeline` has: `application_start_date`, `application_end_date`, `allotment_date`, `listing_date`
- `data.registrar_info` has: `name`, `email`, `website`
- `data.total_subscription` is a string

---

## Test 7: LTP Market Quote (single)

Use an ISIN from a listed IPO above.

```bash
curl --location 'https://api.upstox.com/v2/market-quote/ltp?instrument_key=NSE_EQ%7CINE848E01016' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer $UPSTOX_ANALYTICS_TOKEN'
```

**Verify:**
- Status 200
- `status` = "success"
- `data` is an object keyed by instrument (e.g. `"NSE_EQ:NHPC"`)
- Each value has `last_price` (number), `instrument_token` (string)

---

## Test 8: LTP Market Quote (multiple)

```bash
curl --location 'https://api.upstox.com/v2/market-quote/ltp?instrument_key=NSE_EQ%7CINE848E01016,NSE_EQ%7CINE669E01016' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer $UPSTOX_ANALYTICS_TOKEN'
```

**Verify:**
- Multiple keys in `data` object
- Each has `last_price`

---

## Test 9: Market Holidays

```bash
curl --location 'https://api.upstox.com/v2/market/holidays' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer $UPSTOX_ANALYTICS_TOKEN'
```

**Verify:**
- Status 200
- `data` is an array
- Each entry: `date` (YYYY-MM-DD), `description`, `holiday_type` (TRADING_HOLIDAY | SETTLEMENT_HOLIDAY | SPECIAL_TIMING), `closed_exchanges` (array), `open_exchanges` (array)

---

## Test 10: Full Market Quote (confirm response shape for LTP key names)

```bash
curl --location 'https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_EQ%7CINE848E01016' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer $UPSTOX_ANALYTICS_TOKEN'
```

**Verify:**
- `data` key format: confirm if it's `"NSE_EQ:NHPC"` or `"NSE_EQ|INE848E01016"`
- Has `last_price`, `ohlc.open`, `ohlc.close`, `volume`

---

## Critical: LTP Response Key Format

I need to know the exact key format returned in `data` for the LTP endpoint. The Full Market Quote doc shows `"NSE_EQ:NHPC"` but I need to confirm if LTP uses the same or `"NSE_EQ|INE848E01016"`. This determines how we parse the response.

**Please report the exact keys returned in Test 7 and Test 10.**
