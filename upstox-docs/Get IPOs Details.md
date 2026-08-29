# Get IPO Details

URL: https://upstox.com/developer/api-documentation/get-ipo-details

```
GET /ipos/:id
```

API to retrieve full details for a specific IPO using its slug identifier. The response includes the price band, lot size, bidding schedule, daily bidding hours, key event timeline, registrar contact information, prospectus URLs, and live subscription data.

To get the `id` for an IPO, first call [Get IPOs](Get%20IPOs.md) and use the `id` field from any item in the response.

## Path Parameters

| Name | Required | Type | Description |
|------|----------|------|-------------|
| id | Required | string | IPO identifier. Example: `autofurnish-limited-ipo`. Obtain from the `id` field in [Get IPOs](Get%20IPOs.md). |

## Request

```bash
curl --location 'https://api.upstox.com/v2/ipos/autofurnish-limited-ipo' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

For additional samples in various languages, please refer to the Sample code section on this page.

## Responses

- 200
- 4XX

### Response Body

```json
{
  "status": "success",
  "data": {
    "id": "autofurnish-limited-ipo",
    "symbol": "AFLTD",
    "name": "Autofurnish IPO",
    "status": "open",
    "isin": "INE18HI01019",
    "issue_type": "sme",
    "issue_size": 15,
    "industry": "Automobile Two & Three Wheelers",
    "minimum_price": 41,
    "maximum_price": 41,
    "bidding_start_date": "2026-05-21",
    "bidding_end_date": "2026-05-25",
    "daily_start_time": "10:00:00",
    "daily_end_time": "17:00:00",
    "face_value": 10,
    "tick_size": null,
    "lot_size": 3000,
    "minimum_quantity": 6000,
    "cut_off_price": 41,
    "listing_price": null,
    "listing_exchange": "BSE",
    "rhp_url": null,
    "drhp_url": "https://www.bsesme.com/download/325882/SME_IPO%20InPrinciple/DP_Autofurnish_Final_20250930195434.pdf",
    "timeline": {
      "pre_apply_start_date": "2026-05-20",
      "application_start_date": "2026-05-21",
      "application_end_date": "2026-05-25",
      "allotment_start_date": "2026-05-26",
      "allotment_date": "2026-05-27",
      "refund_initiation_date": "2026-05-27",
      "listing_date": "2026-05-29",
      "mandate_end_date": "2026-07-06"
    },
    "registrar_info": {
      "name": "SKYLINE FINANCIAL SERVICES PRIVATE LIMITED",
      "email": "virenr@skylinerta.com",
      "contact_name": "Mr. Anuj Rana",
      "contact_number": "+91-11-40450193-97",
      "website": "https://www.skylinerta.com/",
      "registrar": "SKYLINE"
    },
    "total_subscription": "0.68"
  }
}
```

### Response Fields

| Name | Type | Description |
|------|------|-------------|
| status | string | Outcome of the request. Possible values: `success`, `error`. |
| data.id | string | Unique identifier for the IPO. |
| data.symbol | string | Stock exchange ticker symbol. |
| data.name | string | Full name of the IPO. |
| data.status | string | Current IPO status. Possible values: `open`, `closed`, `listed`, `upcoming`. |
| data.isin | string | International Securities Identification Number of the company. |
| data.issue_type | string | Issue type. Possible values: `regular` (mainboard), `sme`. |
| data.issue_size | number | Total issue size in INR crore. |
| data.industry | string | Industry sector of the company. |
| data.minimum_price | number | Lower bound of the price band (in INR). `0` if not yet announced. |
| data.maximum_price | number | Upper bound of the price band (in INR). `0` if not yet announced. |
| data.bidding_start_date | string | Bidding open date in `YYYY-MM-DD` format. |
| data.bidding_end_date | string | Bidding close date in `YYYY-MM-DD` format. |
| data.daily_start_time | string | Daily bidding window start time in `HH:MM:SS` format (IST). |
| data.daily_end_time | string | Daily bidding window end time in `HH:MM:SS` format (IST). |
| data.face_value | number | Face value per share (in INR). |
| data.tick_size | number | Minimum price movement increment (in INR). `null` if not applicable. |
| data.lot_size | integer | Number of shares per lot. |
| data.minimum_quantity | integer | Minimum number of shares an investor must apply for. |
| data.cut_off_price | number | Price at which allotment is made. Relevant for retail investors who apply at cut-off. |
| data.listing_price | number | Price at which the stock listed on the exchange (in INR). `null` until listing. |
| data.listing_exchange | string | Exchange(s) where the stock will be listed (e.g., `BSE`, `NSE,BSE`). |
| data.rhp_url | string | URL to the Red Herring Prospectus (RHP). `null` if not yet available. |
| data.drhp_url | string | URL to the Draft Red Herring Prospectus (DRHP). `null` if not yet available. |
| data.timeline.pre_apply_start_date | string | Date from which pre-applications can be submitted, in `YYYY-MM-DD` format. |
| data.timeline.application_start_date | string | Bidding open date in `YYYY-MM-DD` format. |
| data.timeline.application_end_date | string | Bidding close date in `YYYY-MM-DD` format. |
| data.timeline.allotment_start_date | string | Date on which allotment processing begins, in `YYYY-MM-DD` format. |
| data.timeline.allotment_date | string | Date on which share allotment is finalised, in `YYYY-MM-DD` format. |
| data.timeline.refund_initiation_date | string | Date on which refunds for unallotted applications are initiated, in `YYYY-MM-DD` format. |
| data.timeline.listing_date | string | Stock exchange listing date in `YYYY-MM-DD` format. |
| data.timeline.mandate_end_date | string | Last date for ASBA mandate execution by the bank, in `YYYY-MM-DD` format. |
| data.registrar_info.name | string | Full name of the IPO registrar. |
| data.registrar_info.email | string | Contact email for the registrar. |
| data.registrar_info.contact_name | string | Name of the contact person at the registrar. |
| data.registrar_info.contact_number | string | Contact phone number for the registrar. |
| data.registrar_info.website | string | Website URL of the registrar. |
| data.registrar_info.registrar | string | Short identifier for the registrar. |
| data.total_subscription | string | Overall subscription multiple as a decimal string (e.g., `"10.0"` = 10x subscribed). |

### Error codes

| Error code | Description |
|------------|-------------|
| UDAPI100500 | **IPO data not found for Id** - No IPO found for the provided `id`. Verify using [Get IPOs](Get%20IPOs.md). |

## Sample Code

### Python

```python
import requests

ipo_id = 'autofurnish-limited-ipo'
url = f'https://api.upstox.com/v2/ipos/{ipo_id}'
headers = {
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)
print(response.json())
```

### Node.js

```javascript
const axios = require('axios');

const ipoId = 'autofurnish-limited-ipo';

axios.get(`https://api.upstox.com/v2/ipos/${ipoId}`, {
  headers: {
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
  }
}).then(response => console.log(response.data))
  .catch(error => console.error('Error:', error));
```

### Java

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class GetIpoDetails {
    public static void main(String[] args) throws Exception {
        String ipoId = "autofurnish-limited-ipo";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(new URI("https://api.upstox.com/v2/ipos/" + ipoId))
                .header("Accept", "application/json")
                .header("Authorization", "Bearer {your_access_token}")
                .GET()
                .build();
        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.body());
    }
}
```

### PHP

```php
<?php
$ipoId = 'autofurnish-limited-ipo';
$url = "https://api.upstox.com/v2/ipos/{$ipoId}";

$headers = [
    'Accept: application/json',
    'Authorization: Bearer {your_access_token}'
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_errno($ch) ? print('Error: ' . curl_error($ch)) : print($response);
curl_close($ch);
?>
```
