# Historical Candle Data Deprecated

URL: https://upstox.com/developer/api-documentation/get-historical-candle-data/

```
GET
## /historical-candle/:instrument_key/:interval/:to_date/:from_date

```

API to retrieve OHLC (Open, High, Low, Close) data for instruments spanning multiple timeframes. Historical data is available for the following time durations:

- 1-minute: Retrieve the candles from the final month leading up to the endDate.
- 30-minute: Retrieve the candles from the past year up to the endDate.
- Daily: Retrieve data for the past year, concluding on the endDate.
- Weekly: Retrieve data from the previous ten years, ending on the endDate.
- Monthly: Retrieve data spanning the last ten years, up to the specified endDate.

## Request

```bash
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/1minute/2023-11-13/2023-11-12' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

Additional samples in various languages are available in the Sample Code section on this page.

## Path Parameters

| Name | Required | Type | Description 
| instrument_key | Required | string | The unique identifier for the financial instrument for which historical data is being queried. For the regex pattern applicable to this field, see the [Field Pattern Appendix](/developer/api-documentation/appendix/field-pattern) . 
| interval | Required | string | Specifies the time frame of the candles.
Possible values: `1minute` , `30minute` , `day` , `week` , `month` . 
| to_date | Required | string | The ending date (inclusive) for the historical data range. Format: 'YYYY-MM-DD'. 
| from_date | Optional | string | The starting date for the historical data range. Format: 'YYYY-MM-DD'. 

## Responses

- 200
- 4XX

### Response Body

```json
{
  "status": "success",
  "data": {
    "candles": [
      [
        "2023-10-01T00:00:00+05:30",
        53.1,
        53.95,
        51.6,
        52.05,
        235519861,
        0
      ],
      [
        "2023-09-01T00:00:00+05:30",
        50.35,
        56.85,
        49.35,
        52.8,
        1004998611,
        0
      ]
    ]
  }
}
```

| Name | Type | Description 
| status | string | A string indicating the outcome of the request. Typically `success` for successful operations. 
| data | object | Contains OHLC values for all instruments across various timeframes. 
| data.candles | array[] | Array of candle data, each presented as an array with sequential elements representing trading activity. 
| data.candle[0] | number | `Timestamp` : Indicating the start time of the candle's timeframe. 
| data.candle[1] | number | `Open` : The opening price of the asset for the given timeframe. 
| data.candle[2] | number | `High` : The highest price at which the asset traded during the timeframe. 
| data.candle[3] | number | `Low` : The lowest price at which the asset traded during the timeframe. 
| data.candle[4] | number | `Close` : The closing price of the asset for the given timeframe. 
| data.candle[5] | number | `Volume` : The total amount of the asset that was traded during the timeframe. 
| data.candle[6] | number | `Open Interest` : The total number of outstanding derivative contracts, such as options or futures. 

### Error codes

| Error code | Description 
| UDAPI1021 | **Instrument key is of invalid format** - The provided instrument key doesn't conform to the expected format. 
| UDAPI1020 | **Interval accepts one of (1minute,30minute,day,week,month)** - Ensure the 'interval' is one of the specified values. 
| UDAPI1022 | **to_date is required** - You must specify the 'to_date' in your request. 
| UDAPI100011 | **Invalid Instrument key** - The instrument key you provided doesn't match any of the recognized keys in the system. 

## Sample Code

### Get historical candle data with a 1-minute interval

- Curl
- Python
- Node.js
- Java
- PHP
- Python SDK
- Node.js SDK
- Java SDK

```bash
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/1minute/2023-11-13/2023-11-12' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

```python
import requests

url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/1minute/2023-11-13/2023-11-12'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

# Check the response status
if response.status_code == 200:
    # Do something with the response data (e.g., print it)
    print(response.json())
else:
    # Print an error message if the request was not successful
    print(f"Error: {response.status_code} - {response.text}")
```

```javascript
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/1minute/2023-11-13/2023-11-12';
const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });
```

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {

    public static void main(String[] args) {
        String url = "https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/1minute/2023-11-13/2023-11-12";

        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("Authorization", "Bearer {your_access_token}")
                .build();

        try {
            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            // Check the response status
            if (httpResponse.statusCode() == 200) {
                // Do something with the response body (e.g., print it)
                System.out.println(httpResponse.body());
            } else {
                // Print an error message if the request was not successful
                System.err.println("Error: " + httpResponse.statusCode() + " - " + httpResponse.body());
            }
        } catch (Exception e) {
            // Handle exceptions
            e.printStackTrace();
        }
    }
}
```

```php
<?php

$url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/1minute/2023-11-12/2023-11-12';

$options = [
    'http' => [
        'header' => "Content-Type: application/json\r\nAccept: application/json\r\nAuthorization: Bearer {your_access_token}\r\n",
        'method' => 'GET',
    ],
];

$context = stream_context_create($options);
$response = file_get_contents($url, false, $context);

// Check for errors
if ($response === FALSE) {
    echo 'Error fetching data';
} else {
    // Do something with the response (e.g., print it)
    echo $response;
}
?>
```

```python
import upstox_client
from upstox_client.rest import ApiException

configuration = upstox_client.Configuration()
configuration.access_token = '{your_access_token}'
api_version = '2.0'

api_instance = upstox_client.HistoryApi(upstox_client.ApiClient(configuration))
instrument_key = 'NSE_EQ|INE669E01016'
interval = '1minute'
to_date = '2023-11-13'
from_date = '2023-11-12'
try:
    api_response = api_instance.get_historical_candle_data1(instrument_key, interval, to_date,from_date, api_version)
    print(api_response)
except ApiException as e:
    print("Exception when calling HistoryApi->get_historical_candle_data: %s\n" % e)
```

```javascript
let UpstoxClient = require('upstox-js-sdk');
let defaultClient = UpstoxClient.ApiClient.instance;
var OAUTH2 = defaultClient.authentications['OAUTH2'];
OAUTH2.accessToken = "{your_access_token}";
let apiInstance = new UpstoxClient.HistoryApi();

let apiVersion = "2.0"; 
let instrumentKey = "NSE_EQ|INE669E01016"; 
let interval = "1minute"; 
let toDate = "2023-11-13";
let fromDate = "2023-11-12";

apiInstance.getHistoricalCandleData1(instrumentKey, interval, toDate, fromDate,apiVersion, (error, data, response) => {
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
import com.upstox.api.GetHistoricalCandleResponse;
import com.upstox.auth.*;
import io.swagger.client.api.HistoryApi;
public class Main {
    public static void main(String[] args) {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth OAUTH2 = (OAuth) defaultClient.getAuthentication("OAUTH2");
        OAUTH2.setAccessToken("{your_access_token}");

        HistoryApi apiInstance = new HistoryApi();
        String apiVersion = "2.0";
        String instrumentKey = "NSE_EQ|INE669E01016";
        String interval = "1minute";
        String toDate = "2023-11-13";
        String fromDate = "2023-11-12";
        try {
            GetHistoricalCandleResponse result = apiInstance.getHistoricalCandleData1(instrumentKey, interval, toDate, fromDate, apiVersion);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling HistoryApi#getHistoricalCandleData1");
            e.printStackTrace();
        }
    }
}
```

### Get data with a 30-minute interval

- Curl
- Python
- Node.js
- Java
- PHP
- Python SDK
- Node.js SDK
- Java SDK

```bash
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/30minute/2023-11-13/2023-11-12' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

```python
import requests

url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/30minute/2023-11-13/2023-11-12'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

# Check the response status
if response.status_code == 200:
    # Do something with the response data (e.g., print it)
    print(response.json())
else:
    # Print an error message if the request was not successful
    print(f"Error: {response.status_code} - {response.text}")
```

```javascript
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/30minute/2023-11-13/2023-11-12';
const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });
```

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {

    public static void main(String[] args) {
        String url = "https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/30minute/2023-11-13/2023-11-12";

        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("Authorization", "Bearer {your_access_token}")
                .build();

        try {
            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            // Check the response status
            if (httpResponse.statusCode() == 200) {
                // Do something with the response body (e.g., print it)
                System.out.println(httpResponse.body());
            } else {
                // Print an error message if the request was not successful
                System.err.println("Error: " + httpResponse.statusCode() + " - " + httpResponse.body());
            }
        } catch (Exception e) {
            // Handle exceptions
            e.printStackTrace();
        }
    }
}
```

```php
<?php

$url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/30minute/2023-11-13/2023-11-12';

$options = [
    'http' => [
        'header' => "Content-Type: application/json\r\nAccept: application/json\r\nAuthorization: Bearer {your_access_token}\r\n",
        'method' => 'GET',
    ],
];

$context = stream_context_create($options);
$response = file_get_contents($url, false, $context);

// Check for errors
if ($response === FALSE) {
    echo 'Error fetching data';
} else {
    // Do something with the response (e.g., print it)
    echo $response;
}
?>
```

```python
import upstox_client
from upstox_client.rest import ApiException

configuration = upstox_client.Configuration()
configuration.access_token = '{your_access_token}'
api_version = '2.0'

api_instance = upstox_client.HistoryApi(upstox_client.ApiClient(configuration))
instrument_key = 'NSE_EQ|INE669E01016'
interval = '30minute'
to_date = '2023-11-13'
from_date = '2023-11-12'
try:
    api_response = api_instance.get_historical_candle_data1(instrument_key, interval, to_date,from_date, api_version)
    print(api_response)
except ApiException as e:
    print("Exception when calling HistoryApi->get_historical_candle_data: %s\n" % e)
```

```javascript
let UpstoxClient = require('upstox-js-sdk');
let defaultClient = UpstoxClient.ApiClient.instance;
var OAUTH2 = defaultClient.authentications['OAUTH2'];
OAUTH2.accessToken = "{your_access_token}";
let apiInstance = new UpstoxClient.HistoryApi();

let apiVersion = "2.0"; 
let instrumentKey = "NSE_EQ|INE669E01016"; 
let interval = "30minute"; 
let toDate = "2023-11-13";
let fromDate = "2023-11-12";
apiInstance.getHistoricalCandleData1(instrumentKey, interval, toDate, fromDate,apiVersion, (error, data, response) => {
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
import com.upstox.api.GetHistoricalCandleResponse;
import com.upstox.auth.*;
import io.swagger.client.api.HistoryApi;
public class Main {
    public static void main(String[] args) {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth OAUTH2 = (OAuth) defaultClient.getAuthentication("OAUTH2");
        OAUTH2.setAccessToken("{your_access_token}");

        HistoryApi apiInstance = new HistoryApi();
        String apiVersion = "2.0";
        String instrumentKey = "NSE_EQ|INE669E01016";
        String interval = "30minute";
        String toDate = "2023-11-13";
        String fromDate = "2023-11-12";
        try {
            GetHistoricalCandleResponse result = apiInstance.getHistoricalCandleData1(instrumentKey, interval, toDate, fromDate, apiVersion);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling HistoryApi#getHistoricalCandleData1");
            e.printStackTrace();
        }
    }
}
```

### Get data with a daily interval

- Curl
- Python
- Node.js
- Java
- PHP
- Python SDK
- Node.js SDK
- Java SDK

```bash
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/day/2023-11-19/2023-11-12' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

```python
import requests

url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/day/2023-11-19/2023-11-12'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

# Check the response status
if response.status_code == 200:
    # Do something with the response data (e.g., print it)
    print(response.json())
else:
    # Print an error message if the request was not successful
    print(f"Error: {response.status_code} - {response.text}")
```

```javascript
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/day/2023-11-19/2023-11-12';
const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });
```

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {

    public static void main(String[] args) {
        String url = "https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/day/2023-11-19/2023-11-12";

        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("Authorization", "Bearer {your_access_token}")
                .build();

        try {
            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            // Check the response status
            if (httpResponse.statusCode() == 200) {
                // Do something with the response body (e.g., print it)
                System.out.println(httpResponse.body());
            } else {
                // Print an error message if the request was not successful
                System.err.println("Error: " + httpResponse.statusCode() + " - " + httpResponse.body());
            }
        } catch (Exception e) {
            // Handle exceptions
            e.printStackTrace();
        }
    }
}
```

```php
<?php

$url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/day/2023-11-19/2023-11-12';

$options = [
    'http' => [
        'header' => "Content-Type: application/json\r\nAccept: application/json\r\nAuthorization: Bearer {your_access_token}\r\n",
        'method' => 'GET',
    ],
];

$context = stream_context_create($options);
$response = file_get_contents($url, false, $context);

// Check for errors
if ($response === FALSE) {
    echo 'Error fetching data';
} else {
    // Do something with the response (e.g., print it)
    echo $response;
}
?>
```

```python
import upstox_client
from upstox_client.rest import ApiException

configuration = upstox_client.Configuration()
configuration.access_token = '{your_access_token}'
api_version = '2.0'

api_instance = upstox_client.HistoryApi(upstox_client.ApiClient(configuration))
instrument_key = 'NSE_EQ|INE669E01016'
interval = 'day'
to_date = '2023-11-13'
from_date = '2023-11-12'
try:
    api_response = api_instance.get_historical_candle_data1(instrument_key, interval, to_date,from_date, api_version)
    print(api_response)
except ApiException as e:
    print("Exception when calling HistoryApi->get_historical_candle_data: %s\n" % e)
```

```javascript
let apiVersion = "2.0"; 
let instrumentKey = "NSE_EQ|INE669E01016"; 
let interval = "day"; 
let toDate = "2023-11-13";
let fromDate = "2023-11-07";

apiInstance.getHistoricalCandleData1(instrumentKey, interval, toDate, fromDate,apiVersion, (error, data, response) => {
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
import com.upstox.api.GetHistoricalCandleResponse;
import com.upstox.auth.*;
import io.swagger.client.api.HistoryApi;
public class Main {
    public static void main(String[] args) {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth OAUTH2 = (OAuth) defaultClient.getAuthentication("OAUTH2");
        OAUTH2.setAccessToken("{your_access_token}");

        HistoryApi apiInstance = new HistoryApi();
        String apiVersion = "2.0";
        String instrumentKey = "NSE_EQ|INE669E01016";
        String interval = "day";
        String toDate = "2023-11-13";
        String fromDate = "2023-11-12";
        try {
            GetHistoricalCandleResponse result = apiInstance.getHistoricalCandleData1(instrumentKey, interval, toDate, fromDate, apiVersion);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling HistoryApi#getHistoricalCandleData1");
            e.printStackTrace();
        }
    }
}
```

### Get data with a weekly interval

- Curl
- Python
- Node.js
- Java
- PHP
- Python SDK
- Node.js SDK
- Java SDK

```bash
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/week/2023-11-19/2023-07-12' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

```python
import requests

url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/week/2023-11-19/2023-07-12'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

# Check the response status
if response.status_code == 200:
    # Do something with the response data (e.g., print it)
    print(response.json())
else:
    # Print an error message if the request was not successful
    print(f"Error: {response.status_code} - {response.text}")
```

```javascript
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/week/2023-11-19/2023-07-12';
const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });
```

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {

    public static void main(String[] args) {
        String url = "https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/week/2023-11-19/2023-07-12";

        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("Authorization", "Bearer {your_access_token}")
                .build();

        try {
            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            // Check the response status
            if (httpResponse.statusCode() == 200) {
                // Do something with the response body (e.g., print it)
                System.out.println(httpResponse.body());
            } else {
                // Print an error message if the request was not successful
                System.err.println("Error: " + httpResponse.statusCode() + " - " + httpResponse.body());
            }
        } catch (Exception e) {
            // Handle exceptions
            e.printStackTrace();
        }
    }
}
```

```php
<?php

$url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/week/2023-11-19/2023-07-12';

$options = [
    'http' => [
        'header' => "Content-Type: application/json\r\nAccept: application/json\r\nAuthorization: Bearer {your_access_token}\r\n",
        'method' => 'GET',
    ],
];

$context = stream_context_create($options);
$response = file_get_contents($url, false, $context);

// Check for errors
if ($response === FALSE) {
    echo 'Error fetching data';
} else {
    // Do something with the response (e.g., print it)
    echo $response;
}
?>
```

```python
import upstox_client
from upstox_client.rest import ApiException

configuration = upstox_client.Configuration()
configuration.access_token = '{your_access_token}'
api_version = '2.0'

api_instance = upstox_client.HistoryApi(upstox_client.ApiClient(configuration))
instrument_key = 'NSE_EQ|INE669E01016'
interval = 'week'
to_date = '2023-11-13'
from_date = '2023-10-13'
try:
    # Historical candle data
    api_response = api_instance.get_historical_candle_data1(instrument_key, interval, to_date,from_date, api_version)
    print(api_response)
except ApiException as e:
    print("Exception when calling HistoryApi->get_historical_candle_data: %s\n" % e)
```

```javascript
let apiVersion = "2.0"; 
let instrumentKey = "NSE_EQ|INE669E01016"; 
let interval = "week"; 
let toDate = "2023-11-13";
let fromDate = "2023-10-07";

apiInstance.getHistoricalCandleData1(instrumentKey, interval, toDate, fromDate,apiVersion, (error, data, response) => {
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
import com.upstox.api.GetHistoricalCandleResponse;
import com.upstox.auth.*;
import io.swagger.client.api.HistoryApi;
public class Main {
    public static void main(String[] args) {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth OAUTH2 = (OAuth) defaultClient.getAuthentication("OAUTH2");
        OAUTH2.setAccessToken("{your_access_token}");

        HistoryApi apiInstance = new HistoryApi();
        String apiVersion = "2.0";
        String instrumentKey = "NSE_EQ|INE669E01016";
        String interval = "week";
        String toDate = "2023-11-13";
        String fromDate = "2023-10-13";
        try {
            GetHistoricalCandleResponse result = apiInstance.getHistoricalCandleData1(instrumentKey, interval, toDate, fromDate, apiVersion);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling HistoryApi#getHistoricalCandleData1");
            e.printStackTrace();
        }
    }
}
```

### Get data with a monthly interval

- Curl
- Python
- Node.js
- Java
- PHP
- Python SDK
- Node.js SDK
- Java SDK

```bash
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/month/2023-11-19/2022-11-12' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

```python
import requests

url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/month/2023-11-19/2022-11-12'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

# Check the response status
if response.status_code == 200:
    # Do something with the response data (e.g., print it)
    print(response.json())
else:
    # Print an error message if the request was not successful
    print(f"Error: {response.status_code} - {response.text}")
```

```javascript
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/month/2023-11-19/2022-11-12';
const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });
```

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {

    public static void main(String[] args) {
        String url = "https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/month/2023-11-19/2022-11-12";

        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("Authorization", "Bearer {your_access_token}")
                .build();

        try {
            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            // Check the response status
            if (httpResponse.statusCode() == 200) {
                // Do something with the response body (e.g., print it)
                System.out.println(httpResponse.body());
            } else {
                // Print an error message if the request was not successful
                System.err.println("Error: " + httpResponse.statusCode() + " - " + httpResponse.body());
            }
        } catch (Exception e) {
            // Handle exceptions
            e.printStackTrace();
        }
    }
}
```

```php
<?php

$url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/month/2023-11-19/2022-11-12';

$options = [
    'http' => [
        'header' => "Content-Type: application/json\r\nAccept: application/json\r\nAuthorization: Bearer {your_access_token}\r\n",
        'method' => 'GET',
    ],
];

$context = stream_context_create($options);
$response = file_get_contents($url, false, $context);

// Check for errors
if ($response === FALSE) {
    echo 'Error fetching data';
} else {
    // Do something with the response (e.g., print it)
    echo $response;
}
?>
```

```python
import upstox_client
from upstox_client.rest import ApiException

configuration = upstox_client.Configuration()
configuration.access_token = '{your_access_token}'
api_version = '2.0'

api_instance = upstox_client.HistoryApi(upstox_client.ApiClient(configuration))
instrument_key = 'NSE_EQ|INE669E01016'
interval = 'month'
to_date = '2023-11-13'
from_date = '2022-10-13'
try:
    api_response = api_instance.get_historical_candle_data1(instrument_key, interval, to_date,from_date, api_version)
    print(api_response)
except ApiException as e:
    print("Exception when calling HistoryApi->get_historical_candle_data: %s\n" % e)
```

```javascript
let apiVersion = "2.0"; 
let instrumentKey = "NSE_EQ|INE669E01016"; 
let interval = "month"; 
let toDate = "2023-11-13";
let fromDate = "2022-10-07";

apiInstance.getHistoricalCandleData1(instrumentKey, interval, toDate, fromDate,apiVersion, (error, data, response) => {
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
import com.upstox.api.GetHistoricalCandleResponse;
import com.upstox.auth.*;
import io.swagger.client.api.HistoryApi;
public class Main {
    public static void main(String[] args) {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth OAUTH2 = (OAuth) defaultClient.getAuthentication("OAUTH2");
        OAUTH2.setAccessToken("{your_access_token}");

        HistoryApi apiInstance = new HistoryApi();
        String apiVersion = "2.0";
        String instrumentKey = "NSE_EQ|INE669E01016";
        String interval = "month";
        String toDate = "2023-11-13";
        String fromDate = "2022-10-13";
        try {
            GetHistoricalCandleResponse result = apiInstance.getHistoricalCandleData1(instrumentKey, interval, toDate, fromDate, apiVersion);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling HistoryApi#getHistoricalCandleData1");
            e.printStackTrace();
        }
    }
}
```

### Get historical candle data with a 1-minute interval

- Curl
- Python
- Node.js
- Java
- PHP
- Python SDK
- Node.js SDK
- Java SDK

```bash
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/1minute/2023-11-13' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

```python
import requests

url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/1minute/2023-11-13'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

# Check the response status
if response.status_code == 200:
    # Do something with the response data (e.g., print it)
    print(response.json())
else:
    # Print an error message if the request was not successful
    print(f"Error: {response.status_code} - {response.text}")
```

```javascript
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/1minute/2023-11-13';
const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });
```

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {

    public static void main(String[] args) {
        String url = "https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/1minute/2023-11-13";

        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("Authorization", "Bearer {your_access_token}")
                .build();

        try {
            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            // Check the response status
            if (httpResponse.statusCode() == 200) {
                // Do something with the response body (e.g., print it)
                System.out.println(httpResponse.body());
            } else {
                // Print an error message if the request was not successful
                System.err.println("Error: " + httpResponse.statusCode() + " - " + httpResponse.body());
            }
        } catch (Exception e) {
            // Handle exceptions
            e.printStackTrace();
        }
    }
}
```

```php
<?php

$url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/1minute/2023-11-12';

$options = [
    'http' => [
        'header' => "Content-Type: application/json\r\nAccept: application/json\r\nAuthorization: Bearer {your_access_token}\r\n",
        'method' => 'GET',
    ],
];

$context = stream_context_create($options);
$response = file_get_contents($url, false, $context);

// Check for errors
if ($response === FALSE) {
    echo 'Error fetching data';
} else {
    // Do something with the response (e.g., print it)
    echo $response;
}
?>
```

```python
import upstox_client
from upstox_client.rest import ApiException

configuration = upstox_client.Configuration()
configuration.access_token = '{your_access_token}'
api_version = '2.0'

api_instance = upstox_client.HistoryApi(upstox_client.ApiClient(configuration))
instrument_key = 'NSE_EQ|INE669E01016'
interval = '1minute'
to_date = '2023-11-13'
try:
    api_response = api_instance.get_historical_candle_data(instrument_key, interval, to_date, api_version)
    print(api_response)
except ApiException as e:
    print("Exception when calling HistoryApi->get_historical_candle_data: %s\n" % e)
```

```javascript
let UpstoxClient = require('upstox-js-sdk');
let defaultClient = UpstoxClient.ApiClient.instance;
var OAUTH2 = defaultClient.authentications['OAUTH2'];
OAUTH2.accessToken = "{your_access_token}";
let apiInstance = new UpstoxClient.HistoryApi();

let apiVersion = "2.0"; 
let instrumentKey = "NSE_EQ|INE669E01016"; 
let interval = "1minute"; 
let toDate = "2023-11-13";
apiInstance.getHistoricalCandleData(instrumentKey, interval, toDate, apiVersion, (error, data, response) => {
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
import com.upstox.api.GetHistoricalCandleResponse;
import com.upstox.auth.*;
import io.swagger.client.api.HistoryApi;
public class Main {
    public static void main(String[] args) {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth OAUTH2 = (OAuth) defaultClient.getAuthentication("OAUTH2");
        OAUTH2.setAccessToken("{your_access_token}");

        HistoryApi apiInstance = new HistoryApi();
        String apiVersion = "2.0";
        String instrumentKey = "NSE_EQ|INE669E01016";
        String interval = "1minute";
        String toDate = "2023-11-13";
        try {
            GetHistoricalCandleResponse result = apiInstance.getHistoricalCandleData(instrumentKey, interval, toDate, apiVersion);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling HistoryApi#getHistoricalCandleData1");
            e.printStackTrace();
        }
    }
}
```

### Get data with a 30-minute interval

- Curl
- Python
- Node.js
- Java
- PHP
- Python SDK
- Node.js SDK
- Java SDK

```bash
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/30minute/2023-11-13' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

```python
import requests

url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/30minute/2023-11-13'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

# Check the response status
if response.status_code == 200:
    # Do something with the response data (e.g., print it)
    print(response.json())
else:
    # Print an error message if the request was not successful
    print(f"Error: {response.status_code} - {response.text}")
```

```javascript
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/30minute/2023-11-13';
const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });
```

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {

    public static void main(String[] args) {
        String url = "https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/30minute/2023-11-13";

        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("Authorization", "Bearer {your_access_token}")
                .build();

        try {
            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            // Check the response status
            if (httpResponse.statusCode() == 200) {
                // Do something with the response body (e.g., print it)
                System.out.println(httpResponse.body());
            } else {
                // Print an error message if the request was not successful
                System.err.println("Error: " + httpResponse.statusCode() + " - " + httpResponse.body());
            }
        } catch (Exception e) {
            // Handle exceptions
            e.printStackTrace();
        }
    }
}
```

```php
<?php

$url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/30minute/2023-11-13';

$options = [
    'http' => [
        'header' => "Content-Type: application/json\r\nAccept: application/json\r\nAuthorization: Bearer {your_access_token}\r\n",
        'method' => 'GET',
    ],
];

$context = stream_context_create($options);
$response = file_get_contents($url, false, $context);

// Check for errors
if ($response === FALSE) {
    echo 'Error fetching data';
} else {
    // Do something with the response (e.g., print it)
    echo $response;
}
?>
```

```python
import upstox_client
from upstox_client.rest import ApiException

configuration = upstox_client.Configuration()
configuration.access_token = '{your_access_token}'
api_version = '2.0'

api_instance = upstox_client.HistoryApi(upstox_client.ApiClient(configuration))
instrument_key = 'NSE_EQ|INE669E01016'
interval = '30minute'
to_date = '2023-11-13'
try:
    api_response = api_instance.get_historical_candle_data(instrument_key, interval, to_date, api_version)
    print(api_response)
except ApiException as e:
    print("Exception when calling HistoryApi->get_historical_candle_data: %s\n" % e)
```

```javascript
let UpstoxClient = require('upstox-js-sdk');
let defaultClient = UpstoxClient.ApiClient.instance;
var OAUTH2 = defaultClient.authentications['OAUTH2'];
OAUTH2.accessToken = "{your_access_token}";
let apiInstance = new UpstoxClient.HistoryApi();

let apiVersion = "2.0"; 
let instrumentKey = "NSE_EQ|INE669E01016"; 
let interval = "30minute"; 
let toDate = "2023-11-13";

apiInstance.getHistoricalCandleData(instrumentKey, interval, toDate, apiVersion, (error, data, response) => {
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
import com.upstox.api.GetHistoricalCandleResponse;
import com.upstox.auth.*;
import io.swagger.client.api.HistoryApi;
public class Main {
    public static void main(String[] args) {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth OAUTH2 = (OAuth) defaultClient.getAuthentication("OAUTH2");
        OAUTH2.setAccessToken("{your_access_token}");

        HistoryApi apiInstance = new HistoryApi();
        String apiVersion = "2.0";
        String instrumentKey = "NSE_EQ|INE669E01016";
        String interval = "30minute";
        String toDate = "2023-11-13";
        try {
            GetHistoricalCandleResponse result = apiInstance.getHistoricalCandleData(instrumentKey, interval, toDate, apiVersion);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling HistoryApi#getHistoricalCandleData1");
            e.printStackTrace();
        }
    }
}
```

### Get data with a daily interval

- Curl
- Python
- Node.js
- Java
- PHP
- Python SDK
- Node.js SDK
- Java SDK

```bash
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/day/2023-11-19' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

```python
import requests

url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/day/2023-11-19'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

# Check the response status
if response.status_code == 200:
    # Do something with the response data (e.g., print it)
    print(response.json())
else:
    # Print an error message if the request was not successful
    print(f"Error: {response.status_code} - {response.text}")
```

```javascript
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/day/2023-11-19';
const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });
```

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {

    public static void main(String[] args) {
        String url = "https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/day/2023-11-19";

        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("Authorization", "Bearer {your_access_token}")
                .build();

        try {
            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            // Check the response status
            if (httpResponse.statusCode() == 200) {
                // Do something with the response body (e.g., print it)
                System.out.println(httpResponse.body());
            } else {
                // Print an error message if the request was not successful
                System.err.println("Error: " + httpResponse.statusCode() + " - " + httpResponse.body());
            }
        } catch (Exception e) {
            // Handle exceptions
            e.printStackTrace();
        }
    }
}
```

```php
<?php

$url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/day/2023-11-19';

$options = [
    'http' => [
        'header' => "Content-Type: application/json\r\nAccept: application/json\r\nAuthorization: Bearer {your_access_token}\r\n",
        'method' => 'GET',
    ],
];

$context = stream_context_create($options);
$response = file_get_contents($url, false, $context);

// Check for errors
if ($response === FALSE) {
    echo 'Error fetching data';
} else {
    // Do something with the response (e.g., print it)
    echo $response;
}
?>
```

```python
import upstox_client
from upstox_client.rest import ApiException

configuration = upstox_client.Configuration()
configuration.access_token = '{your_access_token}'
api_version = '2.0'

api_instance = upstox_client.HistoryApi(upstox_client.ApiClient(configuration))
instrument_key = 'NSE_EQ|INE669E01016'
interval = 'day'
to_date = '2023-11-13'
try:
    api_response = api_instance.get_historical_candle_data(instrument_key, interval, to_date, api_version)
    print(api_response)
except ApiException as e:
    print("Exception when calling HistoryApi->get_historical_candle_data: %s\n" % e)
```

```javascript
let apiVersion = "2.0"; 
let instrumentKey = "NSE_EQ|INE669E01016"; 
let interval = "day"; 
let toDate = "2023-11-13";

apiInstance.getHistoricalCandleData(instrumentKey, interval, toDate, apiVersion, (error, data, response) => {
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
import com.upstox.api.GetHistoricalCandleResponse;
import com.upstox.auth.*;
import io.swagger.client.api.HistoryApi;
public class Main {
    public static void main(String[] args) {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth OAUTH2 = (OAuth) defaultClient.getAuthentication("OAUTH2");
        OAUTH2.setAccessToken("{your_access_token}");

        HistoryApi apiInstance = new HistoryApi();
        String apiVersion = "2.0";
        String instrumentKey = "NSE_EQ|INE669E01016";
        String interval = "day";
        String toDate = "2023-11-13";
        try {
            GetHistoricalCandleResponse result = apiInstance.getHistoricalCandleData(instrumentKey, interval, toDate, apiVersion);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling HistoryApi#getHistoricalCandleData1");
            e.printStackTrace();
        }
    }
}
```

### Get data with a weekly interval

- Curl
- Python
- Node.js
- Java
- PHP
- Python SDK
- Node.js SDK
- Java SDK

```bash
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/week/2023-11-19' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

```python
import requests

url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/week/2023-11-19'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

# Check the response status
if response.status_code == 200:
    # Do something with the response data (e.g., print it)
    print(response.json())
else:
    # Print an error message if the request was not successful
    print(f"Error: {response.status_code} - {response.text}")
```

```javascript
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/week/2023-11-19';
const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });
```

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {

    public static void main(String[] args) {
        String url = "https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/week/2023-11-19";

        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("Authorization", "Bearer {your_access_token}")
                .build();

        try {
            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            // Check the response status
            if (httpResponse.statusCode() == 200) {
                // Do something with the response body (e.g., print it)
                System.out.println(httpResponse.body());
            } else {
                // Print an error message if the request was not successful
                System.err.println("Error: " + httpResponse.statusCode() + " - " + httpResponse.body());
            }
        } catch (Exception e) {
            // Handle exceptions
            e.printStackTrace();
        }
    }
}
```

```php
<?php

$url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/week/2023-11-19';

$options = [
    'http' => [
        'header' => "Content-Type: application/json\r\nAccept: application/json\r\nAuthorization: Bearer {your_access_token}\r\n",
        'method' => 'GET',
    ],
];

$context = stream_context_create($options);
$response = file_get_contents($url, false, $context);

// Check for errors
if ($response === FALSE) {
    echo 'Error fetching data';
} else {
    // Do something with the response (e.g., print it)
    echo $response;
}
?>
```

```python
import upstox_client
from upstox_client.rest import ApiException

configuration = upstox_client.Configuration()
configuration.access_token = '{your_access_token}'
api_version = '2.0'

api_instance = upstox_client.HistoryApi(upstox_client.ApiClient(configuration))
instrument_key = 'NSE_EQ|INE669E01016'
interval = 'week'
to_date = '2023-11-13'
try:
    api_response = api_instance.get_historical_candle_data(instrument_key, interval, to_date, api_version)
    print(api_response)
except ApiException as e:
    print("Exception when calling HistoryApi->get_historical_candle_data: %s\n" % e)
```

```javascript
let apiVersion = "2.0"; 
let instrumentKey = "NSE_EQ|INE669E01016"; 
let interval = "week"; 
let toDate = "2023-11-13";

apiInstance.getHistoricalCandleData(instrumentKey, interval, toDate, apiVersion, (error, data, response) => {
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
import com.upstox.api.GetHistoricalCandleResponse;
import com.upstox.auth.*;
import io.swagger.client.api.HistoryApi;
public class Main {
    public static void main(String[] args) {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth OAUTH2 = (OAuth) defaultClient.getAuthentication("OAUTH2");
        OAUTH2.setAccessToken("{your_access_token}");

        HistoryApi apiInstance = new HistoryApi();
        String apiVersion = "2.0";
        String instrumentKey = "NSE_EQ|INE669E01016";
        String interval = "week";
        String toDate = "2023-11-13";
        try {
            GetHistoricalCandleResponse result = apiInstance.getHistoricalCandleData(instrumentKey, interval, toDate, apiVersion);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling HistoryApi#getHistoricalCandleData1");
            e.printStackTrace();
        }
    }
}
```

### Get data with a monthly interval

- Curl
- Python
- Node.js
- Java
- PHP
- Python SDK
- Node.js SDK
- Java SDK

```bash
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/month/2023-11-19' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
```

```python
import requests

url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/month/2023-11-19'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

# Check the response status
if response.status_code == 200:
    # Do something with the response data (e.g., print it)
    print(response.json())
else:
    # Print an error message if the request was not successful
    print(f"Error: {response.status_code} - {response.text}")
```

```javascript
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/month/2023-11-19';
const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });
```

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {

    public static void main(String[] args) {
        String url = "https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/month/2023-11-19";

        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("Authorization", "Bearer {your_access_token}")
                .build();

        try {
            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            // Check the response status
            if (httpResponse.statusCode() == 200) {
                // Do something with the response body (e.g., print it)
                System.out.println(httpResponse.body());
            } else {
                // Print an error message if the request was not successful
                System.err.println("Error: " + httpResponse.statusCode() + " - " + httpResponse.body());
            }
        } catch (Exception e) {
            // Handle exceptions
            e.printStackTrace();
        }
    }
}
```

```php
<?php

$url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/month/2023-11-19';

$options = [
    'http' => [
        'header' => "Content-Type: application/json\r\nAccept: application/json\r\nAuthorization: Bearer {your_access_token}\r\n",
        'method' => 'GET',
    ],
];

$context = stream_context_create($options);
$response = file_get_contents($url, false, $context);

// Check for errors
if ($response === FALSE) {
    echo 'Error fetching data';
} else {
    // Do something with the response (e.g., print it)
    echo $response;
}
?>
```

```python
import upstox_client
from upstox_client.rest import ApiException

configuration = upstox_client.Configuration()
configuration.access_token = '{your_access_token}'
api_version = '2.0'

api_instance = upstox_client.HistoryApi(upstox_client.ApiClient(configuration))
instrument_key = 'NSE_EQ|INE669E01016'
interval = 'month'
to_date = '2023-11-13'
try:
    api_response = api_instance.get_historical_candle_data(instrument_key, interval, to_date, api_version)
    print(api_response)
except ApiException as e:
    print("Exception when calling HistoryApi->get_historical_candle_data: %s\n" % e)
```

```javascript
let apiVersion = "2.0"; 
let instrumentKey = "NSE_EQ|INE669E01016"; 
let interval = "month"; 
let toDate = "2023-11-13";

apiInstance.getHistoricalCandleData(instrumentKey, interval, toDate, apiVersion, (error, data, response) => {
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
import com.upstox.api.GetHistoricalCandleResponse;
import com.upstox.auth.*;
import io.swagger.client.api.HistoryApi;
public class Main {
    public static void main(String[] args) {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth OAUTH2 = (OAuth) defaultClient.getAuthentication("OAUTH2");
        OAUTH2.setAccessToken("{your_access_token}");

        HistoryApi apiInstance = new HistoryApi();
        String apiVersion = "2.0";
        String instrumentKey = "NSE_EQ|INE669E01016";
        String interval = "month";
        String toDate = "2023-11-13";
        try {
            GetHistoricalCandleResponse result = apiInstance.getHistoricalCandleData(instrumentKey, interval, toDate, apiVersion);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling HistoryApi#getHistoricalCandleData1");
            e.printStackTrace();
        }
    }
}
```

- Use the [Intraday API](/developer/api-documentation/get-intra-day-candle-data) to retrieve data specific to the current trading day.
- One-minute and 30-minute candle data are accessible solely for the preceding six months.
- It's important to note that `instrument_key` parameter accepts only a single identifier per request; comma-separated values or multiple identifiers are not supported.