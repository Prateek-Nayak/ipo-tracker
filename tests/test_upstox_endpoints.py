"""
Upstox API Endpoint Tests
==========================
Run this on a system with UPSTOX_ANALYTICS_TOKEN set as an environment variable.

Usage:
    export UPSTOX_ANALYTICS_TOKEN="your_token_here"
    python test_upstox_endpoints.py

Or on Windows:
    set UPSTOX_ANALYTICS_TOKEN=your_token_here
    python test_upstox_endpoints.py

Reports pass/fail for each test and prints response shapes for verification.
"""

import os
import sys
import json
import requests
from dotenv import load_dotenv

load_dotenv()

UPSTOX = "https://api.upstox.com/v2"
TOKEN = os.getenv("UPSTOX_ANALYTICS_TOKEN")

if not TOKEN:
    print("ERROR: UPSTOX_ANALYTICS_TOKEN environment variable not set.")
    print("Set it and re-run:")
    print("  export UPSTOX_ANALYTICS_TOKEN='your_token_here'")
    sys.exit(1)

HEADERS = {
    "Accept": "application/json",
    "Authorization": f"Bearer {TOKEN}",
}

results = []


def report(name, passed, detail=""):
    status = "PASS" if passed else "FAIL"
    results.append((name, passed))
    print(f"\n{'='*60}")
    print(f"[{status}] {name}")
    if detail:
        print(f"  {detail}")
    print(f"{'='*60}")


def pretty(data, max_lines=30):
    """Pretty-print JSON, truncated."""
    text = json.dumps(data, indent=2, ensure_ascii=False)
    lines = text.split("\n")
    if len(lines) > max_lines:
        return "\n".join(lines[:max_lines]) + f"\n  ... ({len(lines) - max_lines} more lines)"
    return text


# --------------------------------------------------------------------------
# Test 1: Get Open IPOs (regular)
# --------------------------------------------------------------------------
def test_open_ipos_regular():
    url = f"{UPSTOX}/ipos?status=open&issue_type=regular&page_number=1&records=30"
    r = requests.get(url, headers=HEADERS)

    if r.status_code != 200:
        report("Open IPOs (regular)", False, f"Status {r.status_code}: {r.text[:200]}")
        return None

    data = r.json()
    ok = (
        data.get("status") == "success"
        and isinstance(data.get("data"), list)
        and "meta_data" in data
    )

    print(f"  Response status: {data.get('status')}")
    print(f"  IPO count: {len(data.get('data', []))}")
    print(f"  Pagination: {data.get('meta_data', {}).get('page', {})}")

    if data.get("data"):
        print(f"\n  First item keys: {list(data['data'][0].keys())}")
        print(f"  First item sample:\n{pretty(data['data'][0])}")

    report("Open IPOs (regular)", ok)
    return data


# --------------------------------------------------------------------------
# Test 2: Get Open IPOs (sme)
# --------------------------------------------------------------------------
def test_open_ipos_sme():
    url = f"{UPSTOX}/ipos?status=open&issue_type=sme&page_number=1&records=30"
    r = requests.get(url, headers=HEADERS)

    if r.status_code != 200:
        report("Open IPOs (sme)", False, f"Status {r.status_code}: {r.text[:200]}")
        return None

    data = r.json()
    ok = data.get("status") == "success" and isinstance(data.get("data"), list)

    print(f"  Response status: {data.get('status')}")
    print(f"  IPO count: {len(data.get('data', []))}")

    if data.get("data"):
        # Verify all are SME
        all_sme = all(item.get("issue_type") == "sme" for item in data["data"])
        print(f"  All issue_type=sme: {all_sme}")
        ok = ok and all_sme

    report("Open IPOs (sme)", ok)
    return data


# --------------------------------------------------------------------------
# Test 3: Get Upcoming IPOs
# --------------------------------------------------------------------------
def test_upcoming_ipos():
    url = f"{UPSTOX}/ipos?status=upcoming&page_number=1&records=30"
    r = requests.get(url, headers=HEADERS)

    if r.status_code != 200:
        report("Upcoming IPOs", False, f"Status {r.status_code}: {r.text[:200]}")
        return None

    data = r.json()
    ok = data.get("status") == "success" and isinstance(data.get("data"), list)

    print(f"  Response status: {data.get('status')}")
    print(f"  IPO count: {len(data.get('data', []))}")

    if data.get("data"):
        all_upcoming = all(item.get("status") == "upcoming" for item in data["data"])
        print(f"  All status=upcoming: {all_upcoming}")

    report("Upcoming IPOs", ok)
    return data


# --------------------------------------------------------------------------
# Test 4: Get Listed IPOs
# --------------------------------------------------------------------------
def test_listed_ipos():
    url = f"{UPSTOX}/ipos?status=listed&page_number=1&records=30"
    r = requests.get(url, headers=HEADERS)

    if r.status_code != 200:
        report("Listed IPOs", False, f"Status {r.status_code}: {r.text[:200]}")
        return None

    data = r.json()
    ok = data.get("status") == "success" and isinstance(data.get("data"), list)

    print(f"  Response status: {data.get('status')}")
    print(f"  IPO count: {len(data.get('data', []))}")

    if data.get("data"):
        print(f"  First listed item:\n{pretty(data['data'][0])}")

    report("Listed IPOs", ok)
    return data


# --------------------------------------------------------------------------
# Test 5: Get Closed IPOs
# --------------------------------------------------------------------------
def test_closed_ipos():
    url = f"{UPSTOX}/ipos?status=closed&page_number=1&records=30"
    r = requests.get(url, headers=HEADERS)

    if r.status_code != 200:
        report("Closed IPOs", False, f"Status {r.status_code}: {r.text[:200]}")
        return None

    data = r.json()
    ok = data.get("status") == "success" and isinstance(data.get("data"), list)

    print(f"  Response status: {data.get('status')}")
    print(f"  IPO count: {len(data.get('data', []))}")

    report("Closed IPOs", ok)
    return data


# --------------------------------------------------------------------------
# Test 6: Get IPO Details
# --------------------------------------------------------------------------
def test_ipo_details(ipo_id):
    if not ipo_id:
        report("IPO Details", False, "No IPO id available from previous tests")
        return None

    url = f"{UPSTOX}/ipos/{ipo_id}"
    r = requests.get(url, headers=HEADERS)

    if r.status_code != 200:
        report("IPO Details", False, f"Status {r.status_code}: {r.text[:200]}")
        return None

    data = r.json()
    detail = data.get("data", {})
    ok = (
        data.get("status") == "success"
        and detail.get("id") == ipo_id
        and "timeline" in detail
        and "registrar_info" in detail
    )

    print(f"  IPO: {detail.get('name')}")
    print(f"  Status: {detail.get('status')}")
    print(f"  ISIN: {detail.get('isin')}")
    print(f"  Lot size: {detail.get('lot_size')}")
    print(f"  Listing price: {detail.get('listing_price')}")
    print(f"  Timeline: {json.dumps(detail.get('timeline', {}), indent=4)}")
    print(f"  Registrar: {detail.get('registrar_info', {}).get('name')}")
    print(f"  Total subscription: {detail.get('total_subscription')}")
    print(f"\n  Full detail keys: {list(detail.keys())}")

    report("IPO Details", ok)
    return detail


# --------------------------------------------------------------------------
# Test 7: LTP Market Quote (single)
# --------------------------------------------------------------------------
def test_ltp_single(isin=None):
    # Default to NHPC if no ISIN provided
    instrument_key = f"NSE_EQ|{isin}" if isin else "NSE_EQ|INE848E01016"
    encoded = instrument_key.replace("|", "%7C")

    url = f"{UPSTOX}/market-quote/ltp?instrument_key={encoded}"
    r = requests.get(url, headers=HEADERS)

    if r.status_code != 200:
        report("LTP Quote (single)", False, f"Status {r.status_code}: {r.text[:200]}")
        return None

    data = r.json()
    ok = data.get("status") == "success" and isinstance(data.get("data"), dict)

    print(f"  Response status: {data.get('status')}")
    print(f"  Data keys (THIS IS CRITICAL): {list(data.get('data', {}).keys())}")
    print(f"  Full data:\n{pretty(data.get('data', {}))}")

    report("LTP Quote (single)", ok, f"Instrument: {instrument_key}")
    return data


# --------------------------------------------------------------------------
# Test 8: LTP Market Quote (multiple)
# --------------------------------------------------------------------------
def test_ltp_multiple():
    keys = "NSE_EQ%7CINE848E01016,NSE_EQ%7CINE669E01016"
    url = f"{UPSTOX}/market-quote/ltp?instrument_key={keys}"
    r = requests.get(url, headers=HEADERS)

    if r.status_code != 200:
        report("LTP Quote (multiple)", False, f"Status {r.status_code}: {r.text[:200]}")
        return None

    data = r.json()
    ok = data.get("status") == "success" and isinstance(data.get("data"), dict)
    key_count = len(data.get("data", {}))

    print(f"  Response status: {data.get('status')}")
    print(f"  Number of instruments returned: {key_count}")
    print(f"  Data keys: {list(data.get('data', {}).keys())}")
    print(f"  Full data:\n{pretty(data.get('data', {}))}")

    ok = ok and key_count >= 1

    report("LTP Quote (multiple)", ok)
    return data


# --------------------------------------------------------------------------
# Test 9: Market Holidays
# --------------------------------------------------------------------------
def test_holidays():
    url = f"{UPSTOX}/market/holidays"
    r = requests.get(url, headers=HEADERS)

    if r.status_code != 200:
        report("Market Holidays", False, f"Status {r.status_code}: {r.text[:200]}")
        return None

    data = r.json()
    ok = data.get("status") == "success" and isinstance(data.get("data"), list)
    count = len(data.get("data", []))

    print(f"  Response status: {data.get('status')}")
    print(f"  Holiday count: {count}")

    if data.get("data"):
        # Show types present
        types = set(item.get("holiday_type") for item in data["data"])
        print(f"  Holiday types found: {types}")
        # Show first 3
        for entry in data["data"][:3]:
            print(f"    {entry.get('date')} | {entry.get('holiday_type')} | {entry.get('description')}")
            print(f"      closed: {entry.get('closed_exchanges', [])}")

    report("Market Holidays", ok)
    return data


# --------------------------------------------------------------------------
# Test 10: Full Market Quote (confirm key format)
# --------------------------------------------------------------------------
def test_full_quote():
    url = f"{UPSTOX}/market-quote/quotes?instrument_key=NSE_EQ%7CINE848E01016"
    r = requests.get(url, headers=HEADERS)

    if r.status_code != 200:
        report("Full Market Quote", False, f"Status {r.status_code}: {r.text[:200]}")
        return None

    data = r.json()
    ok = data.get("status") == "success" and isinstance(data.get("data"), dict)

    print(f"  Response status: {data.get('status')}")
    print(f"  Data keys (KEY FORMAT): {list(data.get('data', {}).keys())}")

    if data.get("data"):
        first_key = list(data["data"].keys())[0]
        first_val = data["data"][first_key]
        print(f"\n  Key format example: '{first_key}'")
        print(f"  Value keys: {list(first_val.keys()) if isinstance(first_val, dict) else 'N/A'}")
        print(f"  last_price: {first_val.get('last_price')}")
        print(f"  instrument_token: {first_val.get('instrument_token')}")
        print(f"  symbol: {first_val.get('symbol')}")
        print(f"  ohlc: {first_val.get('ohlc')}")

    report("Full Market Quote", ok)
    return data


# --------------------------------------------------------------------------
# Run all tests
# --------------------------------------------------------------------------
if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("UPSTOX API ENDPOINT TESTS")
    print("=" * 60)
    print(f"Token (first 20 chars): {TOKEN[:20]}...")
    print(f"Base URL: {UPSTOX}")

    # Run tests in sequence
    open_data = test_open_ipos_regular()
    test_open_ipos_sme()
    test_upcoming_ipos()
    listed_data = test_listed_ipos()
    closed_data = test_closed_ipos()

    # Pick an IPO id for detail test
    test_id = None
    test_isin = None

    # Prefer a listed IPO for detail test (has listing_price)
    if listed_data and listed_data.get("data"):
        test_id = listed_data["data"][0].get("id")
        test_isin = listed_data["data"][0].get("isin")
    elif open_data and open_data.get("data"):
        test_id = open_data["data"][0].get("id")
        test_isin = open_data["data"][0].get("isin")

    print(f"\n  Using IPO id for detail test: {test_id}")
    print(f"  Using ISIN for LTP test: {test_isin}")

    test_ipo_details(test_id)
    test_ltp_single(test_isin)
    test_ltp_multiple()
    test_holidays()
    test_full_quote()

    # Summary
    print("\n\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    passed = sum(1 for _, p in results if p)
    failed = sum(1 for _, p in results if not p)
    for name, p in results:
        print(f"  {'PASS' if p else 'FAIL'} - {name}")
    print(f"\n  Total: {passed} passed, {failed} failed, {len(results)} total")
    print("=" * 60)

    # Critical info needed
    print("\n\nCRITICAL INFO TO REPORT BACK:")
    print("-" * 40)
    print("1. What is the key format in LTP response data?")
    print("   (e.g. 'NSE_EQ:NHPC' or 'NSE_EQ|INE848E01016')")
    print("2. What is the key format in Full Quote response data?")
    print("3. Does listing_price show up for listed IPOs in detail?")
    print("4. Any unexpected errors or missing fields?")

    sys.exit(0 if failed == 0 else 1)
