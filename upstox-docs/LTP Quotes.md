# LTP Quotes

URL: https://upstox.com/developer/api-documentation/example-code/market-quote/ltp-quotes?_highlight=quote

## Get ltp (last traded price) market quotes

- Curl
- Python
- Node.js
- Java
- PHP
- Python SDK
- Node.js SDK
- Java SDK

```bash
curl --location 'https://api.upstox.com/v2/market-quote/ltp?instrument_key=NSE_EQ%7CINE848E01016' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

```python
import requests

url = 'https://api.upstox.com/v2/market-quote/ltp?instrument_key=NSE_EQ%7CINE848E01016'
headers = {
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

print(response.text)
```

```javascript
const axios = require('axios');

const url = 'https://api.upstox.com/v2/market-quote/ltp?instrument_key=NSE_EQ%7CINE848E01016';
const headers = {
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
        String url = "https://api.upstox.com/v2/market-quote/ltp?instrument_key=NSE_EQ%7CINE848E01016";
        String acceptHeader = "application/json";
        String authorizationHeader = "Bearer {your_access_token}";

        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
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

$url = 'https://api.upstox.com/v2/market-quote/ltp?instrument_key=NSE_EQ%7CINE848E01016';
$acceptHeader = 'application/json';
$authorizationHeader = 'Bearer {your_access_token}';

$ch = curl_init($url);

// Set cURL options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
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
    api_response = api_instance.ltp(symbol,api_version)
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
apiInstance.ltp(symbol,apiVersion, (error, data, response) => {
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
import com.upstox.api.GetMarketQuoteLastTradedPriceResponse;
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
            GetMarketQuoteLastTradedPriceResponse result = apiInstance.ltp(symbol, apiVersion);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling MarketQuoteApi#ltp");
            e.printStackTrace();
        }

    }
}
```

## Get ltp (last traded price) market quotes for multiple instruments keys

- Curl
- Python
- Node.js
- Java
- PHP
- Python SDK
- Node.js SDK
- Java SDK

```bash
curl --location 'https://api.upstox.com/v2/market-quote/ltp?instrument_key=NSE_EQ%7CINE848E01016,NSE_EQ|INE669E01016' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

```python
import requests

url = 'https://api.upstox.com/v2/market-quote/ltp?instrument_key=NSE_EQ%7CINE848E01016,NSE_EQ|INE669E01016'
headers = {
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

print(response.text)
```

```javascript
const axios = require('axios');

const url = 'https://api.upstox.com/v2/market-quote/ltp?instrument_key=NSE_EQ%7CINE848E01016,NSE_EQ|INE669E01016';
const headers = {
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
        String url = "https://api.upstox.com/v2/market-quote/ltp?instrument_key=NSE_EQ%7CINE848E01016,NSE_EQ|INE669E01016";
        String acceptHeader = "application/json";
        String authorizationHeader = "Bearer {your_access_token}";

        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
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

$url = 'https://api.upstox.com/v2/market-quote/ltp?instrument_key=NSE_EQ%7CINE848E01016,NSE_EQ|INE669E01016';
$acceptHeader = 'application/json';
$authorizationHeader = 'Bearer {your_access_token}';

$ch = curl_init($url);

// Set cURL options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
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
    api_response = api_instance.ltp(symbol,api_version)
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
let symbol = 'NSE_EQ|INE669E01016,NSE_EQ|INE848E01016'; 
apiInstance.ltp(symbol,apiVersion, (error, data, response) => {
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
import com.upstox.api.GetMarketQuoteLastTradedPriceResponse;
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
            GetMarketQuoteLastTradedPriceResponse result = apiInstance.ltp(symbol, apiVersion);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling MarketQuoteApi#ltp");
            e.printStackTrace();
        }
    }
}
```