# Get IPOs

URL: https://upstox.com/developer/api-documentation/get-ipos

```
GET /ipos
```

API to retrieve a list of IPOs available on Indian exchanges. By default it returns currently open IPOs. Use the `status` and `issue_type` parameters to filter by lifecycle stage or market segment.

Use the `id` from each listing item as the path parameter in [Get IPO Details](/developer/api-documentation/get-ipo-details) to fetch the full data for that IPO — including price band, lot size, event timeline, registrar info, and live subscription figures.

## IPO lifecycle

An IPO moves through four stages. The `status` parameter maps directly to these stages:

| Status | Description |
|--------|-------------|
| `upcoming` | IPO is announced but the bidding window has not opened. Price band and dates may not be finalised yet. |
| `open` | Bidding is active. Investors can apply during this period. |
| `closed` | Bidding has ended. Allotment and refund processing is underway. |
| `listed` | Shares are trading on the exchange. |

## Issue types

| Issue type | Description |
|------------|-------------|
| `regular` | Mainboard IPO. Larger companies listed on NSE/BSE under standard SEBI norms. |
| `sme` | Small and Medium Enterprise IPO. Listed on NSE Emerge or BSE SME under relaxed eligibility criteria. |

## Query Parameters

| Name | Required | Type | Description |
|------|----------|------|-------------|
| status | Optional | string | IPO status filter. Allowed values: `open`, `closed`, `listed`, `upcoming`. Default: `open`. |
| issue_type | Optional | string | Issue type filter. Allowed values: `regular` (mainboard IPOs), `sme` (SME IPOs). Default: It returns both. |
| page_number | Optional | integer | Page number for pagination. Default: `1`. |
| records | Optional | integer | Number of IPO records to return per page. Default: `20`. Maximum: `30`. |

## Request

```bash
curl --location 'https://api.upstox.com/v2/ipos?status=open&issue_type=regular&page_number=1&records=30' \
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
  "data": [
    {
      "id": "yaashvi-jewellers-limited-ipo",
      "symbol": "YAASHVI",
      "name": "Yaashvi Jewellers IPO",
      "status": "open",
      "isin": "INE1T6L01010",
      "issue_type": "sme",
      "issue_size": 44,
      "industry": "Diamond & Jewellery",
      "minimum_price": 83,
      "maximum_price": 83,
      "bidding_start_date": "2026-05-25",
      "bidding_end_date": "2026-05-27",
      "total_subscription": "0.0"
    },
    {
      "id": "m-r-maniveni-foods-limited-ipo",
      "symbol": "MANIVENI",
      "name": "M R Maniveni Foods IPO",
      "status": "open",
      "isin": "INE0YD301010",
      "issue_type": "sme",
      "issue_size": 27,
      "industry": "Consumer Food",
      "minimum_price": 51,
      "maximum_price": 52,
      "bidding_start_date": "2026-05-22",
      "bidding_end_date": "2026-05-26",
      "total_subscription": "1.27"
    }
  ],
  "meta_data": {
    "page": {
      "page_number": 1,
      "total_pages": 1,
      "records": 2,
      "total_records": 2
    }
  }
}
```

### Response Fields

| Name | Type | Description |
|------|------|-------------|
| status | string | Outcome of the request. Possible values: `success`, `error`. |
| data | array | Array of IPO objects matching the filter criteria. |
| data[].id | string | Unique identifier for the IPO (e.g., `hero-fincorp-ipo`). Use this as the `{id}` path parameter in [Get IPO Details](/developer/api-documentation/get-ipo-details). |
| data[].symbol | string | Stock exchange ticker symbol. |
| data[].name | string | Full name of the IPO. |
| data[].status | string | Current IPO status. Possible values: `open`, `closed`, `listed`, `upcoming`. |
| data[].isin | string | International Securities Identification Number of the company. |
| data[].issue_type | string | Issue type. Possible values: `regular` (mainboard), `sme`. |
| data[].issue_size | number | Total issue size in crores (INR). |
| data[].industry | string | Industry sector of the company. |
| data[].minimum_price | number | Minimum price of the price band (in INR). `0` if not yet announced. |
| data[].maximum_price | number | Maximum price of the price band (in INR). `0` if not yet announced. |
| data[].bidding_start_date | string | Bidding open date in `YYYY-MM-DD` format. |
| data[].bidding_end_date | string | Bidding close date in `YYYY-MM-DD` format. |
| data[].total_subscription | string | Overall subscription multiple as a decimal string (e.g., `"10.0"` means 10x subscribed). |
| meta_data.page.page_number | integer | Current page number returned. |
| meta_data.page.total_pages | integer | Total number of pages available. |
| meta_data.page.records | integer | Number of records in the current page. |
| meta_data.page.total_records | integer | Total number of IPOs matching the filter. |

### Error codes

| Error code | Description |
|------------|-------------|
| UDAPI1219 | **Invalid IPO status** - The provided `status` value is not valid. Allowed values: `open`, `closed`, `listed`, `upcoming`. |
| UDAPI1220 | **Invalid issue type** - The provided `issue_type` value is not valid. Allowed values: `regular`, `sme`. |

## Sample Code

### Python

```python
import requests

url = 'https://api.upstox.com/v2/ipos'
params = {
    'status': 'open',
    'issue_type': 'regular',
    'page_number': 1,
    'records': 30
}
headers = {
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, params=params, headers=headers)
print(response.json())
```

### Node.js

```javascript
const axios = require('axios');

axios.get('https://api.upstox.com/v2/ipos', {
  params: {
    status: 'open',
    issue_type: 'regular',
    page_number: 1,
    records: 30
  },
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

public class GetIpos {
    public static void main(String[] args) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(new URI("https://api.upstox.com/v2/ipos?status=open&issue_type=regular&page_number=1&records=30"))
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
$url = 'https://api.upstox.com/v2/ipos?' . http_build_query([
    'status'      => 'open',
    'issue_type'  => 'regular',
    'page_number' => 1,
    'records'     => 30
]);

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
