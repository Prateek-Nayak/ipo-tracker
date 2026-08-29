# Market Holidays

URL: https://upstox.com/developer/api-documentation/get-market-holidays/

```
GET
## /market/holidays

```

API to retrieve holidays for the current year. It also supports an optional parameter to fetch holiday details for a specific date.

## Path Parameters

| Name | Required | Type | Description 
| date | Optional | string | The date for retrieving holiday information. Format: 'YYYY-MM-DD'. 

## Request

```bash
curl --location 'https://api.upstox.com/v2/market/holidays' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

For additional samples in various languages, please refer to the Sample code section on this page.

## Responses

- 200

### Response Body

```json
{
  "status": "success",
  "data": [
    {
      "date": "2024-01-01",
      "description": "New Year Day",
      "holiday_type": "TRADING_HOLIDAY",
      "closed_exchanges": [],
      "open_exchanges": [
        {
          "exchange": "MCX",
          "start_time": 1704079800000,
          "end_time": 1704108600000
        },
        {
          "exchange": "NSE",
          "start_time": 1704080700000,
          "end_time": 1704103200000
        },
        {
          "exchange": "NFO",
          "start_time": 1704080700000,
          "end_time": 1704103200000
        },
        {
          "exchange": "CDS",
          "start_time": 1704079800000,
          "end_time": 1704108600000
        },
        {
          "exchange": "BSE",
          "start_time": 1704080700000,
          "end_time": 1704103200000
        },
        {
          "exchange": "BCD",
          "start_time": 1704079800000,
          "end_time": 1704108600000
        },
        {
          "exchange": "BFO",
          "start_time": 1704080700000,
          "end_time": 1704103200000
        }
      ]
    },
    {
      "date": "2024-01-20",
      "description": "Special DR Trading",
      "holiday_type": "TRADING_HOLIDAY",
      "closed_exchanges": ["MCX", "CDS", "BCD"],
      "open_exchanges": [
        {
          "exchange": "NSE",
          "start_time": 1705722300000,
          "end_time": 1705734000000
        },
        {
          "exchange": "NFO",
          "start_time": 1705722300000,
          "end_time": 1705734000000
        },
        {
          "exchange": "BSE",
          "start_time": 1705722300000,
          "end_time": 1705734000000
        },
        {
          "exchange": "BFO",
          "start_time": 1705722300000,
          "end_time": 1705734000000
        }
      ]
    },
    {
      "date": "2024-01-26",
      "description": "Republic Day",
      "holiday_type": "TRADING_HOLIDAY",
      "closed_exchanges": ["NFO", "CDS", "BSE", "BCD", "MCX", "NSE", "BFO"],
      "open_exchanges": []
    }
  ]
}
```

| Name | Type | Description 
| status | string | A string indicating the outcome of the request. Typically `success` for successful operations. 
| data | object | Data object holding holidays information in the current year 
| data[].date | string | Date of the holiday in particular format `YYYY-MM-DD` 
| data[].description | string | Description about the holiday 
| data[].holiday_type | string | Type of the holiday.
Possible values: `SETTLEMENT_HOLIDAY` , `TRADING_HOLIDAY` , `SPECIAL_TIMING` 
| data[].closed_exchanges | string[] | List of exchanges for which market is close. 
| data[].open_exchanges | string[] | List of exchanges for which market is open. 
| data[].open_exchanges[].exchange | string | Exchange for which the market is open 
| data[].open_exchanges[].start_time | number | Timestamp at which market will start. 
| data[].open_exchanges[].end_time | number | Timestamp at which market will end. 

## Sample Code

### Get market holidays for current year

- Curl
- Python
- Node.js
- Java
- PHP
- Python SDK
- Node.js SDK
- Java SDK

```bash
curl --location 'https://api.upstox.com/v2/market/holidays' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json'
```

```python
import requests

url = 'https://api.upstox.com/v2/market/holidays'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

if response.status_code == 200:
    data = response.json()
    # Process the JSON response
    print(data)
else:
    print("Failed to retrieve data. Status code:", response.status_code)
```

```javascript
const axios = require('axios');

const url = 'https://api.upstox.com/v2/market/holidays';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer {your_access_token}'
};

axios.get(url, { headers })
  .then(response => {
    // Process the JSON response
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

```java
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Hello {
    public static void main(String[] args) throws URISyntaxException, IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(new URI("https://api.upstox.com/v2/market/holidays"))
                .header("Content-Type", "application/json")
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

```php
<?php
$url = 'https://api.upstox.com/v2/market/holidays';
$headers = array(
    'Content-Type: application/json',
    'Accept: application/json',
    'Authorization: Bearer {your_access_token}'
);

$curl = curl_init($url);
curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($curl);

if ($response === false) {
    echo 'Error: ' . curl_error($curl);
} else {
    // Process the response
    echo $response;
}

curl_close($curl);
?>
```

```python
import upstox_client
from upstox_client.rest import ApiException

configuration = upstox_client.Configuration()

api_instance = upstox_client.MarketHolidaysAndTimingsApi(upstox_client.ApiClient(configuration))

try:
    api_response = api_instance.get_holidays()
    print(api_response)
except ApiException as e:
    print("Exception when calling MarketHolidaysAndTimingsApi: %s\n" %e)
```

```javascript
let UpstoxClient = require('upstox-js-sdk');

let apiInstance = new UpstoxClient.MarketHolidaysAndTimingsApi();
apiInstance.getHolidays((error, data, response) => {
    if (error) {
      console.error(error);
    } else {
      console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    }
  });
```

```java
import com.upstox.ApiClient;
import com.upstox.ApiException;
import com.upstox.Configuration;
import com.upstox.api.GetHolidayResponse;
import io.swagger.client.api.MarketHolidaysAndTimingsApi;

public class Main {
    public static void main(String[] args) {
        MarketHolidaysAndTimingsApi apiInstance = new MarketHolidaysAndTimingsApi();

        try {
            GetHolidayResponse result = apiInstance.getHolidays();
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling API= " + e.getResponseBody());
            e.printStackTrace();
        }
    }
}
```

### Get market holiday status of a date

- Curl
- Python
- Node.js
- Java
- PHP
- Python SDK
- Node.js SDK
- Java SDK

```bash
curl --location 'https://api.upstox.com/v2/market/holidays/2024-01-22' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

```python
import requests

url = 'https://api.upstox.com/v2/market/holidays/2024-01-22'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

if response.status_code == 200:
    data = response.json()
    # Process the JSON response
    print(data)
else:
    print("Failed to retrieve data. Status code:", response.status_code)
```

```javascript
const axios = require('axios');

const url = 'https://api.upstox.com/v2/market/holidays/2024-01-22';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer {your_access_token}'
};

axios.get(url, { headers })
  .then(response => {
    // Process the JSON response
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

```java
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Hello {
    public static void main(String[] args) throws URISyntaxException, IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(new URI("https://api.upstox.com/v2/market/holidays/2024-01-22"))
                .header("Content-Type", "application/json")
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

```php
<?php
$url = 'https://api.upstox.com/v2/market/holidays/2024-01-22';
$headers = array(
    'Content-Type: application/json',
    'Accept: application/json',
    'Authorization: Bearer {your_access_token}'
);

$curl = curl_init($url);
curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($curl);

if ($response === false) {
    echo 'Error: ' . curl_error($curl);
} else {
    // Process the response
    echo $response;
}

curl_close($curl);
?>
```

```python
import upstox_client
from upstox_client.rest import ApiException
configuration = upstox_client.Configuration()

api_instance = upstox_client.MarketHolidaysAndTimingsApi(upstox_client.ApiClient(configuration))

try:
    api_response = api_instance.get_holiday("2024-01-22")
    print(api_response)
except ApiException as e:
    print("Exception when calling MarketHolidaysAndTimingsApi: %s\n" %e)
```

```javascript
let UpstoxClient = require('upstox-js-sdk');

let apiInstance = new UpstoxClient.MarketHolidaysAndTimingsApi();

apiInstance.getHoliday("2024-01-22",(error, data, response) => {
    if (error) {
      console.error(error);
    } else {
      console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    }
  });
```

```java
import com.upstox.ApiClient;
import com.upstox.ApiException;
import com.upstox.Configuration;
import com.upstox.api.GetHolidayResponse;
import io.swagger.client.api.MarketHolidaysAndTimingsApi;

public class Main {
    public static void main(String[] args) {
        MarketHolidaysAndTimingsApi apiInstance = new MarketHolidaysAndTimingsApi();

        try {
            GetHolidayResponse result = apiInstance.getHoliday("2024-01-22");
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling API= " + e.getResponseBody());
            e.printStackTrace();
        }
    }
}
```