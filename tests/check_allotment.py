#!/usr/bin/env python3
"""Pull IPO application and allotment records from BSE, one JSON file per IPO.

This is a bench for the real thing. BSE holds every application that was routed
through its own bidding platform, whoever the registrar is, and answers a plain
GET with no token, no cookie and no captcha - only a Referer header. That makes
it the one automatable source we found. NSE has the same data for bids routed
through NSE, but demands a live reCAPTCHA token per request, so it cannot be
asked from a script; a bid placed there is invisible here and comes back looking
exactly like no bid at all. Measuring how often that happens, across real PANs
and real issues, is the point of running this.

    python tests/check_allotment.py                  # PANS below
    python tests/check_allotment.py ABCDE1234F ...   # or pass them in

Writes tests/allotment/<ipo>.json. Those files contain PANs and UPI ids, so they
are kept out of git - see the .gitignore entry alongside this script.
"""

import json
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

# Fill these in, or pass them on the command line instead of editing the file.
PANS: list[str] = []

# Named rather than numbered: the id is looked up below, so this survives BSE
# renumbering and reads as what it is.
IPOS = ["Tempsens Instruments", "Lumino Industries", "Symbiotec Pharmalab"]

BSE = "https://api.bseindia.com/BseIndiaAPI/api"
HEADERS = {
    # BSE answers 403 with no headers and 301 with only a User-Agent. Both of
    # these are needed, and nothing else is.
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.bseindia.com/",
    "Origin": "https://www.bseindia.com",
}
OUT_DIR = Path(__file__).resolve().parent / "allotment"
PAUSE = 0.7  # between calls, because there is no reason to lean on them


def name_key(s: str) -> str:
    """The app's own normaliser, so a match here means a match there."""
    s = re.sub(r"[^a-z0-9 ]+", " ", str(s or "").lower())
    s = re.sub(r"\b(limited|ltd|private|pvt|india|the)\b", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def get(url: str, tries: int = 3):
    """One GET, with a couple of retries - BSE drops requests now and then."""
    ctx = ssl.create_default_context()
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=25, context=ctx) as r:
                body = r.read().decode("utf-8", "replace")
            return json.loads(body) if body.strip() else None
        except (urllib.error.URLError, json.JSONDecodeError, TimeoutError) as e:
            last = e
            time.sleep(1.5 * (attempt + 1))
    print(f"    ! gave up on {url.split('?')[0]}: {last}")
    return None


def issue_index() -> dict[str, int]:
    """Every issue BSE currently lists, by normalised name, to its Scrip_cd.

    Scrip_cd is what the allotment endpoint calls imId - not IPO_NO, which is a
    different number on the same row and the one this app already stores.
    flag=1 is what is open now, flag=2 what has recently closed.
    """
    index: dict[str, int] = {}
    for flag in (1, 2):
        data = get(f"{BSE}/GetPublicIssue_par_updated/w?flag={flag}")
        for row in (data or {}).get("Table", []) or []:
            key = name_key(row.get("Scrip_Name") or row.get("LONG_NAME") or row.get("short_name"))
            code = str(row.get("Scrip_cd") or "").strip()
            if key and code.isdigit():
                index.setdefault(key, int(code))
        time.sleep(PAUSE)
    return index


def resolve(wanted: str, index: dict[str, int]) -> int | None:
    key = name_key(wanted)
    if key in index:
        return index[key]
    # A partial name is enough as long as it picks out exactly one issue.
    hits = [v for k, v in index.items() if key and (key in k or k in key)]
    return hits[0] if len(hits) == 1 else None


def check(im_id: int, pan: str) -> dict:
    """One PAN against one IPO.

    Three answers are possible and they mean different things:
      applied      - the bid is here, with what was bid and what was allotted
      no_record    - BSE knows the IPO but has nothing for this PAN. Either no
                     application, or one placed through NSE. The two are
                     indistinguishable from here, which is the known blind spot.
      unknown_ipo  - the imId is wrong; nothing came back at all
    """
    url = f"{BSE}/GETIPOAPPLSTATUS_EQ_Live_ng/w?imId={im_id}&appNo=&panNo={urllib.parse.quote(pan)}"
    raw = get(url)
    if raw is None:
        return {"pan": pan, "status": "request_failed", "raw": None}

    table = raw.get("Table") or []
    if not table:
        return {"pan": pan, "status": "unknown_ipo", "raw": raw}

    rows = [r for r in table if r.get("OE_APPLICATIONNO")]
    if not rows:
        return {
            "pan": pan,
            "status": "no_record",
            "ipo": (table[0] or {}).get("IM_IPO_NAME"),
            "note": "no application on BSE - either none was made, or it went through NSE",
            "raw": raw,
        }

    # Allotment lands in Table1 as well; take whichever carries a quantity.
    allotted_rows = (raw.get("Table1") or []) + rows
    applications = []
    for r in rows:
        allotted = next(
            (a.get("ARAD_ALLTDQTY") for a in allotted_rows
             if a.get("OE_APPLICATIONNO") == r.get("OE_APPLICATIONNO")
             and a.get("ARAD_ALLTDQTY") not in (None, 0)),
            r.get("ARAD_ALLTDQTY"),
        )
        applications.append({
            "application_no": r.get("OE_APPLICATIONNO"),
            "applied_qty": int(r.get("OE_QTY") or 0),
            "bid_price": r.get("OE_PRICE"),
            "amount_blocked": r.get("OE_SPONBNKAMTBLOCKED"),
            "allotted_qty": allotted or 0,
            "allotted_price": r.get("ARAD_ALLTDPRICE"),
            "upi_status": r.get("UPI_CONFIRMATION_STATUS"),
            "applied_at": r.get("OE_ADDEDDATE"),
        })

    return {
        "pan": pan,
        "status": "applied",
        "ipo": rows[0].get("IM_IPO_NAME"),
        "symbol": rows[0].get("IM_IPO_SYMBOL"),
        "applications": applications,
        "raw": raw,
    }


def main() -> int:
    pans = [p.strip().upper() for p in (sys.argv[1:] or PANS) if p.strip()]
    if not pans:
        print("No PANs. Put them in PANS at the top, or pass them as arguments.")
        return 1

    print(f"Resolving {len(IPOS)} issues against BSE...")
    index = issue_index()
    if not index:
        print("  ! BSE returned no issue list - cannot resolve names to ids.")
        return 1
    print(f"  {len(index)} issues listed\n")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    summary: list[tuple[str, str, str]] = []

    for wanted in IPOS:
        im_id = resolve(wanted, index)
        slug = re.sub(r"[^a-z0-9]+", "-", wanted.lower()).strip("-")
        if im_id is None:
            print(f"{wanted}: not found in BSE's list (it may have aged out)")
            summary.append((wanted, "-", "not resolved"))
            continue

        print(f"{wanted}  (imId {im_id})")
        results = []
        for pan in pans:
            r = check(im_id, pan)
            results.append(r)
            if r["status"] == "applied":
                for a in r["applications"]:
                    print(f"    {pan}  applied {a['applied_qty']:>5} @ {a['bid_price']}"
                          f"  blocked {a['amount_blocked']}"
                          f"  allotted {a['allotted_qty']}")
            else:
                print(f"    {pan}  {r['status']}")
            time.sleep(PAUSE)

        out = OUT_DIR / f"{slug}.json"
        out.write_text(json.dumps({
            "ipo": wanted,
            "im_id": im_id,
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "source": f"{BSE}/GETIPOAPPLSTATUS_EQ_Live_ng/w?imId={im_id}&appNo=&panNo=<PAN>",
            "results": results,
        }, indent=2), encoding="utf-8")
        print(f"    -> {out.relative_to(Path.cwd()) if out.is_relative_to(Path.cwd()) else out}\n")

        applied = sum(1 for r in results if r["status"] == "applied")
        summary.append((wanted, str(im_id), f"{applied}/{len(pans)} found on BSE"))

    print("summary")
    for name, im_id, note in summary:
        print(f"  {name:<34} {im_id:>6}  {note}")
    print("\n'no_record' is the blind spot: no application, or one placed through")
    print("NSE. If that count stays at zero across your PANs, BSE covers your flow.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
