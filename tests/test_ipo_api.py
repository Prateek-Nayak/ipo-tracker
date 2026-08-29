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
from fastapi import params
import requests
from dotenv import load_dotenv

load_dotenv()

UPSTOX = "https://api.upstox.com/v2"
your_access_token = os.getenv("UPSTOX_ANALYTICS_TOKEN")

if not your_access_token:
    print("ERROR: UPSTOX_ANALYTICS_TOKEN environment variable not set.")
    print("Set it and re-run:")
    print("  export UPSTOX_ANALYTICS_TOKEN='your_token_here'")
    sys.exit(1)

HEADERS = {
    "Accept": "application/json",
    "Authorization": f"Bearer {your_access_token}",
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
def test_open_ipos_regular(ipo_id=None):
    params = {
        'status': 'closed',
        'issue_type': 'regular',
        'page_number': 1,
        'records': 30
    }
    headers = {
        'Accept': 'application/json',
        'Authorization': f'Bearer {your_access_token}'
    }

    response = requests.get(UPSTOX + "/ipos", params=params, headers=headers)
    data = response.json() # Parse the response into a Python dictionary
    
    # 1. Print the truncated version to the console
    format_response = pretty(data)
    # print(format_response)
    
    # 2. Write the full, formatted JSON to a file
    filename = "open_ipos_regular.json"
    with open(filename, "w", encoding="utf-8") as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)
        
    print(f"\n[INFO] Full response saved with formatting to: {filename}")
    # print(pretty(data))
    for item in data.get('data', []):
        # print(pretty(item))
        for key, value in item.items():
            print(key, ":", value)
            if key == 'id':
                ipo_id = item.get('id')
                if ipo_id:
                    url = f'https://api.upstox.com/v2/ipos/{ipo_id}'
                    headers = {
                        'Accept': 'application/json',
                        'Authorization': f'Bearer {your_access_token}'
                    }
                    filename = f"ipo_details_{ipo_id}.json"
                    response = requests.get(url, headers=headers)
                    # print(response.json())
                    with open(filename, "w", encoding="utf-8") as json_file:
                        json.dump(response.json(), json_file, indent=4, ensure_ascii=False)
    
# --------------------------------------------------------------------------
# Run all tests
# --------------------------------------------------------------------------
if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("UPSTOX API ENDPOINT TESTS")
    print("=" * 60)
    print(f"Token (first 20 chars): {your_access_token[:20]}...")
    print(f"Base URL: {UPSTOX}")

    # Run tests in sequence
    test_open_ipos_regular("augmont-enterprises-limited-ipo")
    # fetch_ipo_details("augmont-enterprises-limited-ipo")  # Replace with a valid IPO ID for testing

