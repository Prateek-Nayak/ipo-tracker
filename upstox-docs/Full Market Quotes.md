# Full Market Quotes

URL: https://upstox.com/developer/api-documentation/get-full-market-quote/

```
GET
## /market-quote/quotes

```

API to retrieve the full market quotes for one or more instruments. Provides the complete market data snapshot of up to 500 instruments in one go. These snapshots are obtained directly from the exchanges at the time of request.

## New Instruments

- **Global Index** — Major global stock market indices such as GIFT NIFTY, Dow Jones, S&P, FTSE 100, and more. See [Global Instruments](/developer/api-documentation/instruments#global-instruments) for details and download the [Global Instruments file](https://assets.upstox.com/market-quote/instruments/exchange/global.json.gz) for instrument keys.
- **India VIX** — The NSE Volatility Index, available using instrument key `NSE_INDEX|India VIX` .

## Request

```bash
curl --location 'https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_EQ%7CINE848E01016' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

For additional samples in various languages, please refer to the Sample code section on this page.

## Query Parameters

| Name | Required | Type | Description 
| instrument_key | Required | string | Comma separated list of instrument keys. For the regex pattern applicable to this field, see the [Field Pattern Appendix](/developer/api-documentation/appendix/field-pattern) . 

## Responses

- 200
- 4XX

### Response Body

```json
{
  "status": "success",
  "data": {
    "NSE_EQ:NHPC": {
      "ohlc": {
        "open": 53.4,
        "high": 53.8,
        "low": 51.75,
        "close": 52.05
      },
      "depth": {
        "buy": [
          {
            "quantity": 6917,
            "price": 52.05,
            "orders": 20
          },
          {
            "quantity": 0,
            "price": 0,
            "orders": 0
          },
          {
            "quantity": 0,
            "price": 0,
            "orders": 0
          },
          {
            "quantity": 0,
            "price": 0,
            "orders": 0
          },
          {
            "quantity": 0,
            "price": 0,
            "orders": 0
          }
        ],
        "sell": [
          {
            "quantity": 0,
            "price": 0,
            "orders": 0
          },
          {
            "quantity": 0,
            "price": 0,
            "orders": 0
          },
          {
            "quantity": 0,
            "price": 0,
            "orders": 0
          },
          {
            "quantity": 0,
            "price": 0,
            "orders": 0
          },
          {
            "quantity": 0,
            "price": 0,
            "orders": 0
          }
        ]
      },
      "timestamp": "2023-10-19T05:21:51.099+05:30",
      "instrument_token": "NSE_EQ|INE848E01016",
      "symbol": "NHPC",
      "last_price": 52.04999923706055,
      "volume": 24123697,
      "average_price": 52.56,
      "oi": 0,
      "net_change": -1.0500000000000043,
      "total_buy_quantity": 6917,
      "total_sell_quantity": 0,
      "lower_circuit_limit": 42.5,
      "upper_circuit_limit": 63.7,
      "last_trade_time": "1697624972130",
      "oi_day_high": 0,
      "oi_day_low": 0
    }
  }
}
```

| Name | Type | Description 
| status | string | A string indicating the outcome of the request. Typically `success` for successful operations. 
| data | object | Data object holding full market quote information 
| data.ohlc | object | Data object with OHLC information 
| data.ohlc.open | number | The open price of the trading session 
| data.ohlc.high | number | The high price of the trading session 
| data.ohlc.low | number | The low price of the trading session 
| data.ohlc.close | number | The most recent closing price of the symbol 
| data.depth | object | Data object with top 5 buy and sell depth information 
| data.depth.buy | object[] | Bids 
| data.depth.buy[].quantity | integer | quantity 
| data.depth.buy[].price | number | price 
| data.depth.buy[].orders | integer | orders 
| data.depth.sell | object[] | Asks 
| data.depth.sell[].quantity | integer | quantity 
| data.depth.sell[].price | number | price 
| data.depth.sell[].orders | integer | orders 
| data.timestamp | string | Time in milliseconds at which the feeds was updated 
| data.instrument_token | string | Key of the instrument. For the regex pattern applicable to this field, see the [Field Pattern Appendix](/developer/api-documentation/appendix/field-pattern) . 
| data.symbol | string | Shows the trading symbol of the instrument 
| data.last_price | number | The last traded price of symbol 
| data.volume | integer | The volume traded today on symbol 
| data.average_price | number | Average price 
| data.oi | number | Total number of outstanding contracts held by market participants exchange-wide (only F&O) 
| data.net_change | number | The absolute change from yesterday's close to last traded price 
| data.total_buy_quantity | number | The total number of bid quantity available for trading 
| data.total_sell_quantity | number | The total number of ask quantity available for trading 
| data.lower_circuit_limit | number | The lower circuit of symbol 
| data.upper_circuit_limit | number | The upper circuit of symbol 
| data.last_trade_time | string | Time in milliseconds at which last trade happened 
| data.oi_day_high | number | Open interest day high 
| data.oi_day_low | number | Open interest day low 

### Error codes

| Error code | Description 
| UDAPI1087 | **One of either symbol or instrument_key is invalid** - The provided symbol or instrument_key does not confirm to the accepted format. 
| UDAPI100042 | **Data of only 500 instrument keys can be requested in single API call** - Limit your request to 500 instrument keys at a time. 

## Sample Code

### Get full market quote

- Curl
- Python
- Node.js
- Java
- PHP
- Python SDK
- Node.js SDK
- Java SDK

```bash
curl --location 'https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_EQ%7CINE848E01016' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

```python
import requests

url = 'https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_EQ%7CINE848E01016'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

print(response.text)
```

```javascript
const axios = require('axios');

const url = 'https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_EQ%7CINE848E01016';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer {your_access_token}'
};

axios.get(url, { headers })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });
```

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpHeaders;

public class Main {

    public static void main(String[] args) throws Exception {
        String url = "https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_EQ%7CINE848E01016";
        String contentTypeHeader = "application/json";
        String acceptHeader = "application/json";
        String authorizationHeader = "Bearer {your_access_token}";

        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", contentTypeHeader)
                .header("Accept", acceptHeader)
                .header("Authorization", authorizationHeader)
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        int statusCode = response.statusCode();
        HttpHeaders headers = response.headers();
        String responseBody = response.body();

        System.out.println("Status Code: " + statusCode);
        System.out.println("Response Headers: " + headers);
        System.out.println("Response Body: " + responseBody);
    }
}
```

```php
<?php

$url = 'https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_EQ%7CINE848E01016';
$contentTypeHeader = 'application/json';
$acceptHeader = 'application/json';
$authorizationHeader = 'Bearer {your_access_token}';

$ch = curl_init($url);

// Set cURL options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: ' . $contentTypeHeader,
    'Accept: ' . $acceptHeader,
    'Authorization: ' . $authorizationHeader,
]);

// Execute cURL session and get the response
$response = curl_exec($ch);

// Check for cURL errors
if (curl_errno($ch)) {
    echo 'Curl error: ' . curl_error($ch);
}

// Close cURL session
curl_close($ch);

// Output the response
echo $response;
?>
```

```python
import upstox_client
from upstox_client.rest import ApiException

configuration = upstox_client.Configuration()
configuration.access_token = '{your_access_token}'
api_version = '2.0'

symbol = 'NSE_EQ|INE669E01016'
api_instance = upstox_client.MarketQuoteApi(upstox_client.ApiClient(configuration))

try:
    api_response = api_instance.get_full_market_quote(symbol, api_version)
    print(api_response)
except ApiException as e:
    print("Exception when calling MarketQuoteApi->get_full_market_quote: %s\n" % e)
```

```javascript
let UpstoxClient = require('upstox-js-sdk');
let defaultClient = UpstoxClient.ApiClient.instance;
var OAUTH2 = defaultClient.authentications['OAUTH2'];
OAUTH2.accessToken = "{your_access_token}";
let apiInstance = new UpstoxClient.MarketQuoteApi();

let apiVersion = "2.0"; 
let symbol = "NSE_EQ|INE669E01016"; 

apiInstance.getFullMarketQuote(symbol, apiVersion, (error, data, response) => {
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
import com.upstox.api.GetFullMarketQuoteResponse;
import com.upstox.auth.*;
import io.swagger.client.api.MarketQuoteApi;

public class Main {
    public static void main(String[] args) {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth OAUTH2 = (OAuth) defaultClient.getAuthentication("OAUTH2");
        OAUTH2.setAccessToken("{your_access_token}");

        MarketQuoteApi apiInstance = new MarketQuoteApi();
        String symbol = "NSE_EQ|INE669E01016"; // String | Comma separated list of symbols
        String apiVersion = "2.0"; // String | API Version Header
        try {
            GetFullMarketQuoteResponse result = apiInstance.getFullMarketQuote(symbol, apiVersion);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling MarketQuoteApi#getFullMarketQuote");
            e.printStackTrace();
        }

    }
}
```

### Get full market quote for multiple instrument keys

- Curl
- Python
- Node.js
- Java
- PHP
- Python SDK
- Node.js SDK
- Java SDK

```bash
curl --location 'https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_EQ%7CINE848E01016,NSE_EQ|INE669E01016' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

```python
import requests

url = 'https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_EQ%7CINE848E01016,NSE_EQ|INE669E01016'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

print(response.text)
```

```javascript
const axios = require('axios');

const url = 'https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_EQ%7CINE848E01016,NSE_EQ|INE669E01016';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer {your_access_token}'
};

axios.get(url, { headers })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });
```

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpHeaders;

public class Main {

    public static void main(String[] args) throws Exception {
        String url = "https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_EQ%7CINE848E01016,NSE_EQ|INE669E01016";
        String contentTypeHeader = "application/json";
        String acceptHeader = "application/json";
        String authorizationHeader = "Bearer {your_access_token}";

        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", contentTypeHeader)
                .header("Accept", acceptHeader)
                .header("Authorization", authorizationHeader)
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        int statusCode = response.statusCode();
        HttpHeaders headers = response.headers();
        String responseBody = response.body();

        System.out.println("Status Code: " + statusCode);
        System.out.println("Response Headers: " + headers);
        System.out.println("Response Body: " + responseBody);
    }
}
```

```php
<?php

$url = 'https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_EQ%7CINE848E01016,NSE_EQ|INE669E01016';
$contentTypeHeader = 'application/json';
$acceptHeader = 'application/json';
$authorizationHeader = 'Bearer {your_access_token}';

$ch = curl_init($url);

// Set cURL options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: ' . $contentTypeHeader,
    'Accept: ' . $acceptHeader,
    'Authorization: ' . $authorizationHeader,
]);

// Execute cURL session and get the response
$response = curl_exec($ch);

// Check for cURL errors
if (curl_errno($ch)) {
    echo 'Curl error: ' . curl_error($ch);
}

// Close cURL session
curl_close($ch);

// Output the response
echo $response;
?>
```

```python
import upstox_client
from upstox_client.rest import ApiException

configuration = upstox_client.Configuration()
configuration.access_token = '{your_access_token}'
api_version = '2.0'

symbol = 'NSE_EQ|INE669E01016,NSE_EQ|INE848E01016'
api_instance = upstox_client.MarketQuoteApi(upstox_client.ApiClient(configuration))

try:
    api_response = api_instance.get_full_market_quote(symbol, api_version)
    print(api_response)
except ApiException as e:
    print("Exception when calling MarketQuoteApi->get_full_market_quote: %s\n" % e)
```

```javascript
let UpstoxClient = require('upstox-js-sdk');
let defaultClient = UpstoxClient.ApiClient.instance;
var OAUTH2 = defaultClient.authentications['OAUTH2'];
OAUTH2.accessToken = "{your_access_token}";
let apiInstance = new UpstoxClient.MarketQuoteApi();

let apiVersion = "2.0"; 
let symbol = "NSE_EQ|INE669E01016,NSE_EQ|INE848E01016"; 

apiInstance.getFullMarketQuote(symbol, apiVersion, (error, data, response) => {
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
import com.upstox.api.GetFullMarketQuoteResponse;
import com.upstox.auth.*;
import io.swagger.client.api.MarketQuoteApi;

public class Main {
    public static void main(String[] args) {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth OAUTH2 = (OAuth) defaultClient.getAuthentication("OAUTH2");
        OAUTH2.setAccessToken("{your_access_token}");

        MarketQuoteApi apiInstance = new MarketQuoteApi();
        String symbol = "NSE_EQ|INE669E01016,NSE_EQ|INE848E01016"; // String | Comma separated list of symbols
        String apiVersion = "2.0"; // String | API Version Header
        try {
            GetFullMarketQuoteResponse result = apiInstance.getFullMarketQuote(symbol, apiVersion);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling MarketQuoteApi#getFullMarketQuote");
            e.printStackTrace();
        }

    }
}
```