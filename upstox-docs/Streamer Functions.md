# Streamer Functions

URL: https://upstox.com/developer/api-documentation/streamer-function

## Prerequisites

Connecting to the WebSocket for market and portfolio updates is streamlined through two primary Feeder functions. Both functions are designed to simplify the process of subscribing to essential data streams, ensuring users have quick and easy access to the information they need.

You need to have the SDK installed for the specific language you are using. For detailed installation instructions and repository links, refer to the [Installing the Upstox SDK](/developer/api-documentation/installing-sdk) guide.

## MarketDataStreamerV3

The MarketDataStreamerV3 interface is designed for effortless connection to the market WebSocket, enabling users to receive instantaneous updates on various instruments. The following example demonstrates how to quickly set up and start receiving market updates for selected instrument keys:

- Python SDK
- Node.js SDK
- Java SDK
- PHP SDK

```python
import upstox_client

def on_message(message):
    print(message)

def main():
    configuration = upstox_client.Configuration()
    access_token = <ACCESS_TOKEN>
    configuration.access_token = access_token

    streamer = upstox_client.MarketDataStreamerV3(
        upstox_client.ApiClient(configuration), ["NSE_INDEX|Nifty 50", "NSE_INDEX|Nifty Bank"], "full")

    streamer.on("message", on_message)

    streamer.connect()

if __name__ == "__main__":
    main()
```

```javascript
let UpstoxClient = require("upstox-js-sdk");
let defaultClient = UpstoxClient.ApiClient.instance;
var OAUTH2 = defaultClient.authentications["OAUTH2"];
OAUTH2.accessToken = <ACCESS_TOKEN>;

const streamer = new UpstoxClient.MarketDataStreamerV3(["MCX_FO|426268", "MCX_FO|427608"], "full");
streamer.connect();

streamer.on("message", (data) => {
  const feed = data.toString("utf-8");
  console.log(feed);
});
```

```java
public class MarketFeederTest {
    public static void main(String[] args) throws ApiException {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        Set<String> instrumentKeys = new HashSet<>();
        instrumentKeys.add("NSE_INDEX|Nifty 50");
        instrumentKeys.add("NSE_INDEX|Nifty Bank");

        OAuth oAuth = (OAuth) defaultClient.getAuthentication("OAUTH2");
        oAuth.setAccessToken(<ACESS_TOKEN>);

        final MarketDataStreamerV3 marketDataStreamer = new MarketDataStreamerV3(defaultClient, instrumentKeys, Mode.FULL);

        marketDataStreamer.setOnMarketUpdateListener(new OnMarketUpdateV3Listener() {

            @Override
            public void onUpdate(MarketUpdateV3 marketUpdate) {
                System.out.println(marketUpdate);
            }
        });

        marketDataStreamer.connect();
    }
}
```

```bash
use Upstox\Client\Configuration;
use Upstox\Client\Feeder\MarketDataStreamerV3;
use Revolt\EventLoop;

function on_message($streamer, $data)
{
    print($data);
}

$config = Configuration::getDefaultConfiguration()->setAccessToken(<ACCESS_TOKEN>);

$streamer = new MarketDataStreamerV3($config, ["NSE_INDEX|Nifty 50", "NSE_INDEX|Nifty Bank"], "full");

$streamer->on("message", 'on_message');
$streamer->connect();

EventLoop::run();
```

In this example, you first authenticate using an access token, then instantiate MarketDataStreamerV3 with specific instrument keys and a subscription mode. Upon connecting, the streamer listens for market updates, which are logged to the console as they arrive.

Feel free to adjust the access token placeholder and any other specifics to better fit your actual implementation or usage scenario.

### Exploring the MarketDataStreamerV3 Functionality

#### Modes

- **ltpc** : ltpc provides information solely about the most recent trade, encompassing details such as the last trade price, time of the last trade, quantity traded, and the closing price from the previous day.
- **full** : The full option offers comprehensive information, including the latest trade prices, D5 depth, 1-minute, 30-minute, and daily candlestick data, along with some additional details.
- **option_greeks** : Contains only option greeks.
- **full_d30** : full_d30 includes Full mode data plus 30 market level quotes. ![Upstox Plus](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzkiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAzOSAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMwIDAuNzVDMzQuNTU2MyAwLjc1IDM4LjI1IDQuNDQzNjUgMzguMjUgOUMzOC4yNSAxMy41NTYzIDM0LjU1NjMgMTcuMjUgMzAgMTcuMjVIOUM0LjQ0MzY1IDE3LjI1IDAuNzUgMTMuNTU2MyAwLjc1IDlDMC43NSA0LjQ0MzY1IDQuNDQzNjUgMC43NSA5IDAuNzVIMzBaIiBmaWxsPSIjMjAyMDIwIi8+CjxwYXRoIGQ9Ik0zMCAwLjc1QzM0LjU1NjMgMC43NSAzOC4yNSA0LjQ0MzY1IDM4LjI1IDlDMzguMjUgMTMuNTU2MyAzNC41NTYzIDE3LjI1IDMwIDE3LjI1SDlDNC40NDM2NSAxNy4yNSAwLjc1IDEzLjU1NjMgMC43NSA5QzAuNzUgNC40NDM2NSA0LjQ0MzY1IDAuNzUgOSAwLjc1SDMwWiIgc3Ryb2tlPSJ1cmwoI3BhaW50MF9saW5lYXJfMjY1N180NzU2OSkiIHN0cm9rZS13aWR0aD0iMC41Ii8+CjxwYXRoIGQ9Ik0xOC41MjM5IDEwLjcyMDhDMTguNDY5OCAxMS4wNDM5IDE4LjYyNTcgMTEuMjA1MiAxOC45OTE3IDExLjIwNTJDMTkuMTY4IDExLjIwNTIgMTkuMzkxOSAxMS4xNzkyIDE5LjU4MTYgMTEuMTM0MlYxMi43NTQ1QzE5LjMxNyAxMi44Mzg3IDE4LjcwNzEgMTIuOTIzNiAxOC4wMjIzIDEyLjkyMzZDMTYuODM2IDEyLjkyMzYgMTYuMTQ0MyAxMi40MTk4IDE2LjM2NzggMTEuMDc2NUwxNy42MDcyIDQuMDcwMjlIMTkuNzAyM0wxOC41MjM5IDEwLjcyMDhaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjIuOTg5IDYuNTkzODFMMjIuNDA2IDEwLjEwNzNDMjIuMjkwOCAxMC43OTg0IDIyLjc5OTMgMTEuMTI3NiAyMy4zMDc4IDExLjEyNzZDMjMuODE2MyAxMS4xMjc2IDI0LjQxOTYgMTAuNzk4NCAyNC41MzQ4IDEwLjEwNzNMMjUuMTI0OCA2LjU5MzgxSDI3LjIxMjlMMjYuMTgyNSAxMi43OTRIMjQuMjYzN0wyNC4yOTc1IDEyLjIwNjFDMjMuNzQ4MyAxMi43NjE0IDIyLjk0MTQgMTIuOTg3NSAyMi4xODkgMTIuOTg3NUMyMC45ODg4IDEyLjk4NzUgMTkuOTcxOCAxMi4xNjczIDIwLjIxNjEgMTAuNjg4MkwyMC44OTQgNi41OTM0TDIyLjk4OSA2LjU5MzgxWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTI5LjUzNTcgMTIuOTIzMUMyOC41OTMyIDEyLjkyMzEgMjcuNjg0NSAxMi43NjE4IDI3LjExNTQgMTIuNDk2OUwyNy4zOTEyIDEwLjg0ODJDMjcuOTYwNyAxMS4wODA5IDI5LjA0MTEgMTEuMzAyMSAyOS42MjQxIDExLjMwMjFDMzAuMzkwMyAxMS4zMDIxIDMwLjY1NDUgMTEuMTkyMyAzMC42NTQ1IDEwLjg5NTNDMzAuNjU0NSAxMC42OTUyIDMwLjQ1NzggMTAuNjA0OCAyOS44NjE0IDEwLjUwNzlMMjkuMjg0OSAxMC40MTc1QzI4LjE2NjIgMTAuMjQzIDI3LjYzNzMgOS43MzkyNSAyNy42MzczIDguODY3NDhDMjcuNjM3MyA3LjM5NSAyOC45ODY1IDYuNDY1MDUgMzAuOTQ2IDYuNDY1MDVDMzEuNzY2MyA2LjQ2NTA1IDMyLjQ5MTggNi42MDA3OSAzMy4wNjE0IDYuODY1NjdMMzIuNjQwOCA4LjQ0Nzg5QzMyLjI2MSA4LjI4NjU4IDMxLjMzODggOC4xMTg2NiAzMC43ODMxIDguMTE4NjZDMzAuMDIzOCA4LjExODY2IDI5LjY2NDMgOC4yNjA1OCAyOS42NjQzIDguNTUxNDVDMjkuNjY0MyA4Ljc1MTU1IDI5LjkxNTEgOC44NjEyOSAzMC41Nzk1IDguOTY0ODVMMzEuMTgyOSA5LjA2MTgxQzMyLjIxMzMgOS4yMjk3MiAzMi43MDg0IDkuNzIwNjkgMzIuNzA4NCAxMC41NjY1QzMyLjcwODQgMTIuMDEzIDMxLjQyNjcgMTIuOTIzOSAyOS41MzUzIDEyLjkyMzlMMjkuNTM1NyAxMi45MjMxWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTguMjE3IDkuOTQ4Mkw3LjcxMTk0IDEyLjc5NDFIOS44OTQ5MUwxMC4zMDg1IDkuODgzODRIMTIuMzkwMkMxNC41NDYzIDkuODgzODQgMTYuMDE4MyA4LjQ2MjM0IDE2LjM5MDUgNi43MTY4MUMxNi43NjI4IDQuOTcxMjkgMTUuMTgzOCA0LjAyMzUyIDEzLjQzNDQgNC4wMjM1MkgxMi41NDRDMTIuNTEyNSA0LjYyOTkxIDEyLjQ2MDYgNS4yMzQ0MyAxMi4zMTQgNS44MTI0NUgxMi45ODY2QzEzLjY5MTcgNS44MTI0NSAxNC4zMDM3IDYuMzM2MDkgMTQuMTMyNiA2LjkzNjNDMTMuOTM4MSA3LjYxODkyIDEzLjQ2ODIgOC4wOTQ5MSAxMi41MzI3IDguMDk0OTFIMTEuMDY3NUMxMC42ODEzIDguNTM1NTcgMTAuMjEzOSA4LjkzMDExIDkuNjAxOTIgOS4zMTM0MUM5LjEzNDU3IDkuNjA2MTIgOC42NzM5OSA5LjgwNTE4IDguMjE3IDkuOTQ4MloiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMS43OTU2IDMuOTY3NzdDMTEuNzkzIDQuNzc1NTcgMTEuNjE0MyA1LjU5MTcxIDExLjI1ODggNi4zMjFDMTAuOTAzNCA3LjA1MDMgMTAuMzg3MSA3LjY5MzU3IDkuNzQ2OTMgOC4yMDQ1OEM5LjEwNjggOC43MTU2IDguMzU4NzggOS4wODE2NyA3LjU1NjY0IDkuMjc2NDdDNi43NTQ0OSA5LjQ3MTI2IDUuOTg2NDcgOS40MzEwNCA1IDkuNDMxTDUuNDM4NDMgNy4zOTU2OUM2LjIwNTY3IDcuMzk1NjkgNi41OTg1NiA3LjQwNjA5IDcuMDgyNTIgNy4yODg1N0M3LjU2NjQ4IDcuMTcxMDQgOC4wMTE1OCA2Ljk1NDE1IDguMzk3OCA2LjY0NTg0QzguNzg0MDEgNi4zMzc1MiA5LjA0MDY0IDUuODI4MjUgOS4yNTUwOCA1LjM4ODI1QzkuNDY5NTMgNC45NDgyNCA5LjU3ODUxIDQuNDU1MTQgOS41ODAwOCAzLjk2Nzc3TDExLjc5NTYgMy45Njc3N1oiIGZpbGw9IndoaXRlIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMjY1N180NzU2OSIgeDE9IjIwLjk2MDUiIHkxPSIxIiB4Mj0iMjAuOTYwNSIgeTI9IjIyLjY2NjciIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iI0E0ODNGNCIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMxODBCMjUiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K)

#### Functions

1. **constructor MarketDataStreamerV3(apiClient, instrumentKeys, mode)** : Initializes the streamer with optional instrument keys and mode ( `full` , `ltpc` , `full_d30` , or `option_greeks` ).
2. **connect()** : Establishes the WebSocket connection.
3. **subscribe(instrumentKeys, mode)** : Subscribes to updates for given instrument keys in the specified mode. Both parameters are mandatory.
4. **unsubscribe(instrumentKeys)** : Stops updates for the specified instrument keys.
5. **changeMode(instrumentKeys, mode)** : Switches the mode for already subscribed instrument keys.
6. **disconnect()** : Ends the active WebSocket connection.
7. **auto_reconnect(enable, interval, retryCount)** : Customizes auto-reconnect functionality. Parameters include a flag to enable/disable it, the interval(in seconds) between attempts, and the maximum number of retries.

#### Events

- **open** : Emitted upon successful connection establishment.
- **close** : Indicates the WebSocket connection has been closed.
- **message** : Delivers market updates.
- **error** : Signals an error has occurred.
- **reconnecting** : Announced when a reconnect attempt is initiated.
- **autoReconnectStopped** : Informs when auto-reconnect efforts have ceased after exhausting the retry count.
The following documentation includes examples to illustrate the usage of these functions and events, providing a practical understanding of how to interact with the MarketDataStreamerV3 effectively.

#### Subscribing to Market Data on Connection Open with MarketDataStreamerV3

- Python SDK
- Node.js SDK
- Java SDK
- PHP SDK

```python
import upstox_client

def main():
    configuration = upstox_client.Configuration()
    access_token = <ACCESS_TOKEN>
    configuration.access_token = access_token

    streamer = upstox_client.MarketDataStreamerV3(
        upstox_client.ApiClient(configuration))

    def on_open():
        streamer.subscribe(
            ["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"], "full")

    def on_message(message):
        print(message)

    streamer.on("open", on_open)
    streamer.on("message", on_message)

    streamer.connect()

if __name__ == "__main__":
    main()
```

```javascript
let UpstoxClient = require("upstox-js-sdk");
let defaultClient = UpstoxClient.ApiClient.instance;
var OAUTH2 = defaultClient.authentications["OAUTH2"];
OAUTH2.accessToken = <ACCESS_TOKEN>;

const streamer = new UpstoxClient.MarketDataStreamerV3();
streamer.connect();

// Subscribe to instrument keys upon the 'open' event
streamer.on("open", () => {
  streamer.subscribe(["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"], "full");
});

// Handle incoming market data messages
streamer.on("message", (data) => {
  const feed = data.toString("utf-8");
  console.log(feed);
});
```

```java
public class MarketFeederTest {
    public static void main(String[] args) throws ApiException {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth oAuth = (OAuth) defaultClient.getAuthentication("OAUTH2");
        oAuth.setAccessToken(<ACCESS_TOKEN>);

        final MarketDataStreamerV3 marketDataStreamer = new MarketDataStreamerV3(defaultClient);

        marketDataStreamer.setOnOpenListener(new OnOpenListener() {

            @Override
            public void onOpen() {
                System.out.println("Connection Established");

                Set<String> instrumentKeys = new HashSet<>();
                instrumentKeys.add("NSE_INDEX|Nifty 50");
                instrumentKeys.add("NSE_INDEX|Nifty Bank");

                marketDataStreamer.subscribe(instrumentKeys, Mode.FULL);

            }
        });

        marketDataStreamer.setOnMarketUpdateListener(new OnMarketUpdateV3Listener() {

            @Override
            public void onUpdate(MarketUpdateV3 marketUpdate) {
                System.out.println(marketUpdate);
            }
        });

        marketDataStreamer.connect();
    }
}
```

```bash
use Upstox\Client\Configuration;
use Upstox\Client\Feeder\MarketDataStreamerV3;
use Revolt\EventLoop;

function on_open($streamer)
{
    print("Connection Established");
    $streamer->subscribe(["NSE_INDEX|Nifty 50", "NSE_INDEX|Nifty Bank"], "full");
}

function on_message($streamer, $data)
{
    print($data);
}

$config = Configuration::getDefaultConfiguration()->setAccessToken(<ACCESS_TOKEN>);

$streamer = new MarketDataStreamerV3($config);

$streamer->on("open", 'on_open');
$streamer->on("message", 'on_message');
$streamer->connect();

EventLoop::run();
```

#### Subscribing to Instruments with Delays

- Python SDK
- Node.js SDK
- Java SDK
- PHP SDK

```python
import upstox_client
import time

def main():
    configuration = upstox_client.Configuration()
    access_token = <ACCESS_TOKEN>
    configuration.access_token = access_token

    streamer = upstox_client.MarketDataStreamerV3(
        upstox_client.ApiClient(configuration))

    def on_open():
        streamer.subscribe(
            ["NSE_EQ|INE020B01018"], "full")

    # Handle incoming market data messages\
    def on_message(message):
        print(message)

    streamer.on("open", on_open)
    streamer.on("message", on_message)

    streamer.connect()

    time.sleep(5)
    streamer.subscribe(
        ["NSE_EQ|INE467B01029"], "full")

if __name__ == "__main__":
    main()
```

```javascript
let UpstoxClient = require("upstox-js-sdk");
let defaultClient = UpstoxClient.ApiClient.instance;
var OAUTH2 = defaultClient.authentications["OAUTH2"];
OAUTH2.accessToken = <ACCESS_TOKEN>;

const streamer = new UpstoxClient.MarketDataStreamerV3();
streamer.connect();

// Subscribe to the first set of instrument keys immediately upon connection
streamer.on("open", () => {
  streamer.subscribe(["NSE_EQ|INE020B01018"], "full");

  // Subscribe to another set of instrument keys after a delay
  setTimeout(() => {
    streamer.subscribe(["NSE_EQ|INE467B01029"], "full");
  }, 5000); // 5-second delay before subscribing to the second set
});

// Handle incoming market data messages
streamer.on("message", (data) => {
  const feed = data.toString("utf-8");
  console.log(feed);
});
```

```java
public class MarketFeederTest {
    public static void main(String[] args) throws ApiException {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth oAuth = (OAuth) defaultClient.getAuthentication("OAUTH2");
        oAuth.setAccessToken(<ACCESS_TOKEN>);

        final MarketDataStreamerV3 marketDataStreamer = new MarketDataStreamerV3(defaultClient);

        marketDataStreamer.setOnOpenListener(new OnOpenListener() {

            @Override
            public void onOpen() {
                System.out.println("Connection Established");

                Set<String> instrumentKeys1 = new HashSet<>();
                instrumentKeys1.add("NSE_INDEX|Nifty 50");

                marketDataStreamer.subscribe(instrumentKeys1, Mode.FULL);

                ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

                scheduler.schedule(() -> {
                    Set<String> instrumentKeys2 = new HashSet<>();
                    instrumentKeys2.add("NSE_INDEX|Nifty Bank");
                    marketDataStreamer.subscribe(instrumentKeys2, Mode.FULL);
                    scheduler.shutdown();
                }, 5, TimeUnit.SECONDS);

            }
        });

        marketDataStreamer.setOnMarketUpdateListener(new OnMarketUpdateV3Listener() {

            @Override
            public void onUpdate(MarketUpdateV3 marketUpdate) {
                System.out.println(marketUpdate);
            }
        });

        marketDataStreamer.connect();

    }
}
```

```bash
use Upstox\Client\Configuration;
use Upstox\Client\Feeder\MarketDataStreamerV3;
use Revolt\EventLoop;
use function Amp\delay;

function on_open($streamer)
{
    print("Connection Established");
    $streamer->subscribe(["NSE_INDEX|Nifty 50"], "full");
    delay(5);
    $streamer->subscribe(["NSE_INDEX|Nifty Bank"], "full");
}

function on_message($streamer, $data)
{
    print($data);
}

$config = Configuration::getDefaultConfiguration()->setAccessToken(<ACCESS_TOKEN>);

$streamer = new MarketDataStreamerV3($config);

$streamer->on("open", 'on_open');
$streamer->on("message", 'on_message');
$streamer->connect();

EventLoop::run();
```

#### Subscribing and Unsubscribing Instruments

- Python SDK
- Node.js SDK
- Java SDK
- PHP SDK

```python
import upstox_client
import time

def main():
    configuration = upstox_client.Configuration()
    access_token = <ACCESS_TOKEN>
    configuration.access_token = access_token

    streamer = upstox_client.MarketDataStreamerV3(
        upstox_client.ApiClient(configuration))

    def on_open():
        print("Connected. Subscribing to instrument keys.")
        streamer.subscribe(
            ["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"], "full")

    # Handle incoming market data messages\
    def on_message(message):
        print(message)

    streamer.on("open", on_open)
    streamer.on("message", on_message)

    streamer.connect()

    time.sleep(5)
    print("Unsubscribing from instrument keys.")
    streamer.unsubscribe(["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"])

if __name__ == "__main__":
    main()
```

```javascript
let UpstoxClient = require("upstox-js-sdk");
let defaultClient = UpstoxClient.ApiClient.instance;
var OAUTH2 = defaultClient.authentications["OAUTH2"];
OAUTH2.accessToken = <ACCESS_TOKEN>;

const streamer = new UpstoxClient.MarketDataStreamerV3();
streamer.connect();

// Subscribe to instrument keys immediately upon connection
streamer.on("open", () => {
  console.log("Connected. Subscribing to instrument keys.");
  streamer.subscribe(["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"], "full");
  
  // Unsubscribe after a delay
  setTimeout(() => {
    console.log("Unsubscribing from instrument keys.");
    streamer.unsubscribe(["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"]);
  }, 5000); // Adjust delay as needed
});

streamer.on("message", (data) => {
  const feed = data.toString("utf-8");
  console.log("Market Update:", feed);
});
```

```java
public class MarketFeederTest {
    public static void main(String[] args) throws ApiException {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth oAuth = (OAuth) defaultClient.getAuthentication("OAUTH2");
        oAuth.setAccessToken(<ACCESS_TOKEN>);

        final MarketDataStreamerV3 marketDataStreamer = new MarketDataStreamerV3(defaultClient);

        marketDataStreamer.setOnOpenListener(new OnOpenListener() {

            @Override
            public void onOpen() {
                System.out.println("Connection Established");

                Set<String> instrumentKeys = new HashSet<>();
                instrumentKeys.add("NSE_INDEX|Nifty 50");
                instrumentKeys.add("NSE_INDEX|Nifty Bank");

                marketDataStreamer.subscribe(instrumentKeys, Mode.FULL);

                ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

                scheduler.schedule(() -> {
                    marketDataStreamer.unsubscribe(instrumentKeys);
                    scheduler.shutdown();
                }, 5, TimeUnit.SECONDS);

            }
        });

        marketDataStreamer.setOnMarketUpdateListener(new OnMarketUpdateV3Listener() {

            @Override
            public void onUpdate(MarketUpdateV3 marketUpdate) {
                System.out.println(marketUpdate);
            }
        });

        marketDataStreamer.connect();
    }
}
```

```bash
use Upstox\Client\Configuration;
use Upstox\Client\Feeder\MarketDataStreamerV3;
use Revolt\EventLoop;
use function Amp\delay;

function on_open($streamer)
{
    print("Connection Established");
    $streamer->subscribe(["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"], "full");
    delay(5);
    $streamer->unsubscribe(["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"]);
}

function on_message($streamer, $data)
{
    print($data);
}

$config = Configuration::getDefaultConfiguration()->setAccessToken(<ACCESS_TOKEN>);

$streamer = new MarketDataStreamerV3($config);

$streamer->on("open", 'on_open');
$streamer->on("message", 'on_message');
$streamer->connect();

EventLoop::run();
```

#### Subscribe, Change Mode and Unsubscribe

- Python SDK
- Node.js SDK
- Java SDK
- PHP SDK

```python
import upstox_client
import time

def main():
    configuration = upstox_client.Configuration()
    access_token = <ACCESS_TOKEN>
    configuration.access_token = access_token

    streamer = upstox_client.MarketDataStreamerV3(
        upstox_client.ApiClient(configuration))

    def on_open():
        print("Connected. Subscribing to instrument keys.")
        streamer.subscribe(
            ["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"], "full")

    # Handle incoming market data messages\
    def on_message(message):
        print(message)

    streamer.on("open", on_open)
    streamer.on("message", on_message)

    streamer.connect()

    time.sleep(5)
    print("Changing subscription mode to ltpc...")
    streamer.change_mode(
        ["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"], "ltpc")

    time.sleep(5)
    print("Unsubscribing from instrument keys.")
    streamer.unsubscribe(["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"])

if __name__ == "__main__":
    main()
```

```javascript
let UpstoxClient = require("upstox-js-sdk");
let defaultClient = UpstoxClient.ApiClient.instance;
var OAUTH2 = defaultClient.authentications["OAUTH2"];
OAUTH2.accessToken = <ACCESS_TOKEN>;

const streamer = new UpstoxClient.MarketDataStreamerV3();
streamer.connect();

// Initially subscribe to instrument keys in 'full' mode
streamer.on("open", async () => {
  console.log("Connected. Subscribing in full mode...");
  streamer.subscribe(["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"], "full");

  // Change mode to 'ltpc' after a short delay
  setTimeout(() => {
    console.log("Changing subscription mode to ltpc...");
    streamer.changeMode(["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"], "ltpc");
  }, 5000); // 5-second delay

  // Unsubscribe after another delay
  setTimeout(() => {
    console.log("Unsubscribing...");
    streamer.unsubscribe(["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"]);
  }, 10000); // 10 seconds after subscription
});

// Setup event listeners to log messages, errors, and closure
streamer.on("message", (data) => {
  const feed = data.toString("utf-8");
  console.log("Market Update:", feed);
});
streamer.on("error", (error) => console.error("Error:", error));
streamer.on("close", () => console.log("Connection closed."));
```

```java
public class MarketFeederTest {
    public static void main(String[] args) throws ApiException {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth oAuth = (OAuth) defaultClient.getAuthentication("OAUTH2");
        oAuth.setAccessToken(<ACCESS_TOKEN>);

        final MarketDataStreamerV3 marketDataStreamer = new MarketDataStreamerV3(defaultClient);

        marketDataStreamer.setOnOpenListener(new OnOpenListener() {

            @Override
            public void onOpen() {
                System.out.println("Connection Established");

                Set<String> instrumentKeys = new HashSet<>();
                instrumentKeys.add("NSE_INDEX|Nifty 50");
                instrumentKeys.add("NSE_INDEX|Nifty Bank");

                marketDataStreamer.subscribe(instrumentKeys, Mode.FULL);

                ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

                scheduler.schedule(() -> {
                    marketDataStreamer.changeMode(instrumentKeys, Mode.LTPC);
                    scheduler.shutdown();
                }, 5, TimeUnit.SECONDS);

                scheduler.schedule(() -> {
                    marketDataStreamer.unsubscribe(instrumentKeys);
                    scheduler.shutdown();
                }, 10, TimeUnit.SECONDS);

            }
        });

        marketDataStreamer.setOnMarketUpdateListener(new OnMarketUpdateV3Listener() {

            @Override
            public void onUpdate(MarketUpdateV3 marketUpdate) {
                System.out.println(marketUpdate);
            }
        });

        marketDataStreamer.connect();
    }
}
```

```bash
use Upstox\Client\Configuration;
use Upstox\Client\Feeder\MarketDataStreamerV3;
use Revolt\EventLoop;
use function Amp\delay;

function on_open($streamer)
{
    print("Connection Established");
    $streamer->subscribe(["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"], "full");
    delay(5);
    $streamer->changeMode(
        ["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"], "ltpc");
}

function on_message($streamer, $data)
{
    print($data);
}

$config = Configuration::getDefaultConfiguration()->setAccessToken(<ACCESS_TOKEN>);

$streamer = new MarketDataStreamerV3($config);

$streamer->on("open", 'on_open');
$streamer->on("message", 'on_message');
$streamer->connect();

EventLoop::run();
```

#### Disable Auto-Reconnect

- Python SDK
- Node.js SDK
- Java SDK
- PHP SDK

```python
import upstox_client
import time

def main():
    configuration = upstox_client.Configuration()
    access_token = <ACCESS_TOKEN>
    configuration.access_token = access_token

    streamer = upstox_client.MarketDataStreamerV3(
        upstox_client.ApiClient(configuration))

    def on_reconnection_halt(message):
        print(message)

    streamer.on("autoReconnectStopped", on_reconnection_halt)

    # Disable auto-reconnect feature
    streamer.auto_reconnect(False)

    streamer.connect()

if __name__ == "__main__":
    main()
```

```javascript
let UpstoxClient = require("upstox-js-sdk");
let defaultClient = UpstoxClient.ApiClient.instance;
var OAUTH2 = defaultClient.authentications["OAUTH2"];
OAUTH2.accessToken = <ACCESS_TOKEN>;

const streamer = new UpstoxClient.MarketDataStreamerV3();
streamer.connect();

// Disable auto-reconnect feature
streamer.autoReconnect(false);

streamer.on("autoReconnectStopped", (data) => {
  console.log(data);
});
```

```java
public class MarketFeederTest {
    public static void main(String[] args) throws ApiException {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth oAuth = (OAuth) defaultClient.getAuthentication("OAUTH2");
        oAuth.setAccessToken(<ACCESS_TOKEN>);

        final MarketDataStreamerV3 marketDataStreamer = new MarketDataStreamerV3(defaultClient);

        marketDataStreamer.setOnAutoReconnectStoppedListener(new OnAutoReconnectStoppedListener() {

            @Override
            public void onHault(String message) {
                System.out.println(message);

            }
        });

        marketDataStreamer.autoReconnect(false);
        marketDataStreamer.connect();
    }
}
```

```bash
use Upstox\Client\Configuration;
use Upstox\Client\Feeder\MarketDataStreamerV3;
use Revolt\EventLoop;

function on_reconnectstopped($streamer, $data)
{
    print($data);
}

$config = Configuration::getDefaultConfiguration()->setAccessToken(<ACCESS_TOKEN>);

$streamer = new MarketDataStreamerV3($config);

$streamer->on("autoReconnectStopped", 'on_reconnectstopped');

$streamer->autoReconnect(false);
$streamer->connect();

EventLoop::run();
```

#### Modify Auto-Reconnect parameters

- Python SDK
- Node.js SDK
- Java SDK
- PHP SDK

```python
import upstox_client

def main():
    configuration = upstox_client.Configuration()
    access_token = <ACCESS_TOKEN>
    configuration.access_token = access_token

    streamer = upstox_client.MarketDataStreamerV3(
        upstox_client.ApiClient(configuration))

    # Modify auto-reconnect parameters: enable it, set interval to 10 seconds, and retry count to 3
    streamer.auto_reconnect(True, 10, 3)

    streamer.connect()

if __name__ == "__main__":
    main()
```

```javascript
let UpstoxClient = require("upstox-js-sdk");
let defaultClient = UpstoxClient.ApiClient.instance;
var OAUTH2 = defaultClient.authentications["OAUTH2"];
OAUTH2.accessToken = <ACCESS_TOKEN>;

const streamer = new UpstoxClient.MarketDataStreamerV3();
streamer.connect();

// Modify auto-reconnect parameters: enable it, set interval to 10 seconds, and retry count to 3
streamer.autoReconnect(true, 10, 3);
```

```java
public class MarketFeederTest {
    public static void main(String[] args) throws ApiException {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth oAuth = (OAuth) defaultClient.getAuthentication("OAUTH2");
        oAuth.setAccessToken(<ACCESS_TOKEN>);

        final MarketDataStreamerV3 marketDataStreamer = new MarketDataStreamerV3(defaultClient);

        marketDataStreamer.autoReconnect(true, 10, 3);
        marketDataStreamer.connect();
    }
}
```

```bash
use Upstox\Client\Configuration;
use Upstox\Client\Feeder\MarketDataStreamerV3;
use Revolt\EventLoop;

$config = Configuration::getDefaultConfiguration()->setAccessToken(<ACCESS_TOKEN>);

$streamer = new MarketDataStreamerV3($config);

$streamer->autoReconnect(true, 10, 3);
$streamer->connect();

EventLoop::run();
```

## PortfolioDataStreamer

Connecting to the Portfolio WebSocket for real-time order updates is straightforward with the PortfolioDataStreamer function. Below is a concise guide to get you started on receiving updates. For detailed API documentation, refer to the [Portfolio Stream Feed API](/developer/api-documentation/get-portfolio-stream-feed) .

- Python SDK
- Node.js SDK
- Java SDK
- PHP SDK

```python
import upstox_client

def on_message(message):
    print(message)

def main():
    configuration = upstox_client.Configuration()
    access_token = <ACCESS_TOKEN>
    configuration.access_token = access_token

    streamer = upstox_client.PortfolioDataStreamer(
        upstox_client.ApiClient(configuration))

    streamer.on("message", on_message)

    streamer.connect()

if __name__ == "__main__":
    main()
```

```javascript
let UpstoxClient = require("upstox-js-sdk");
let defaultClient = UpstoxClient.ApiClient.instance;
var OAUTH2 = defaultClient.authentications["OAUTH2"];
OAUTH2.accessToken = "<ACCESS_TOKEN>";

const streamer = new UpstoxClient.PortfolioDataStreamer();
streamer.connect();

streamer.on("message", (data) => {
  const feed = data.toString("utf-8");
  console.log(feed);
});
```

```java
public class PortfolioFeederTest {
    public static void main(String[] args) throws ApiException {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth oAuth = (OAuth) defaultClient.getAuthentication("OAUTH2");
        oAuth.setAccessToken(<ACCESS_TOKEN>);

        final PortfolioDataStreamer portfolioDataStreamer = new PortfolioDataStreamer(defaultClient);

        portfolioDataStreamer.setOnOrderUpdateListener(new OnOrderUpdateListener() {

            @Override
            public void onUpdate(OrderUpdate orderUpdate) {
                System.out.println(orderUpdate);

            }
        });

        portfolioDataStreamer.connect();
    }
}
```

```bash
use Upstox\Client\Configuration;
use Upstox\Client\Feeder\PortfolioDataStreamer;
use Revolt\EventLoop;

function on_message($streamer, $data)
{
    print($data);
}

$config = Configuration::getDefaultConfiguration()->setAccessToken(<ACCESS_TOKEN>);

$streamer = new PortfolioDataStreamer($config);

$streamer->on("message", 'on_message');
$streamer->connect();

EventLoop::run();
```

Position, Holding, and GTT order updates can be enabled by setting the corresponding flag to `True` in the constructor of the `PortfolioDataStreamer` class.

- Python SDK
- Node.js SDK
- Java SDK
- PHP SDK

```python
import upstox_client
import data_token

def on_message(message):
    print(message)

def on_open():
    print("connection opened")

def main():
    configuration = upstox_client.Configuration()
    configuration.access_token = <ACCESS_TOKEN>

    streamer = upstox_client.PortfolioDataStreamer(upstox_client.ApiClient(configuration),
                                                  order_update=True,
                                                  position_update=True,
                                                  holding_update=True,
                                                  gtt_update=True)

    streamer.on("message", on_message)
    streamer.on("open", on_open)
    streamer.connect()

if __name__ == "__main__":
    main()
```

```javascript
let UpstoxClient = require("upstox-js-sdk");
let defaultClient = UpstoxClient.ApiClient.instance;
var OAUTH2 = defaultClient.authentications["OAUTH2"];
OAUTH2.accessToken = "<ACCESS_TOKEN>";

// Enable all update types: orders, positions, holdings, and GTT orders
const streamer = new UpstoxClient.PortfolioDataStreamer(true, true, true, true);
streamer.connect();

streamer.on("message", (data) => {
  const feed = data.toString("utf-8");
  console.log(feed);
});
```

```java
import com.upstox.feeder.HoldingUpdate;
import com.upstox.feeder.PositionUpdate;

public class PortfolioFeederTest {
    public static void main(String[] args) throws ApiException {
        ApiClient defaultClient = Configuration.getDefaultApiClient();

        OAuth oAuth = (OAuth) defaultClient.getAuthentication("OAUTH2");
        oAuth.setAccessToken( < ACCESS_TOKEN >);

        final PortfolioDataStreamer portfolioDataStreamer = new PortfolioDataStreamer(defaultClient, true, true, true, true);

        portfolioDataStreamer.setOnOrderUpdateListener(new OnOrderUpdateListener() {

            @Override
            public void onUpdate(OrderUpdate orderUpdate) {
                System.out.println(orderUpdate);

            }
        });

        portfolioDataStreamer.setOnHoldingUpdateListener(new OnHoldingUpdateListener() {

            @Override
            public void onUpdate(HoldingUpdate holdingUpdate) {
                System.out.println(holdingUpdate);

            }
        });

        portfolioDataStreamer.setOnPositionUpdateListener(new OnPositionUpdateListener() {

            @Override
            public void onUpdate(PositionUpdate positionUpdate) {
                System.out.println(positionUpdate);

            }
        });

        portfolioDataStreamer.setOnGttUpdateListener(new OnGttUpdateListener() {

            @Override
            public void onUpdate(GttUpdate gttUpdate) {
                System.out.println(gttUpdate);

            }
        });
        
        portfolioDataStreamer.connect();
    }
}
```

```bash
use Upstox\Client\Configuration;
use Upstox\Client\Feeder\PortfolioDataStreamer;
use Revolt\EventLoop;

function on_message($streamer,$data)
{
    print("on_message= " . ($data) . "\n");
}

$config = Upstox\Client\Configuration::getDefaultConfiguration()->setAccessToken(<ACCESS_TOKEN>);
$streamer = new PortfolioDataStreamer(
    $config,
    orderUpdate: true,
    holdingUpdate: true,
    positionUpdate: true,
    gttUpdate: true
);

$streamer->on("message", 'on_message');
$streamer->connect();

EventLoop::run();
```

### Exploring the PortfolioDataStreamer Functionality

#### Constructor Parameters

1. **api_client** : Your API client instance
2. **order_update** : Set to `True` to receive real-time order updates (default: `True` )
3. **position_update** : Set to `True` to receive position updates (default: `False` )
4. **holding_update** : Set to `True` to receive holding updates (default: `False` )
5. **gtt_update** : Set to `True` to receive GTT order updates (default: `False` )

#### Functions

1. **constructor PortfolioDataStreamer()** : Initializes the streamer.
2. **connect()** : Establishes the WebSocket connection.
3. **disconnect()** : Ends the active WebSocket connection.
4. **auto_reconnect(enable, interval, retryCount)** : Customizes auto-reconnect functionality. Parameters include a flag to enable/disable it, the interval(in seconds) between attempts, and the maximum number of retries.

#### Events

- **open** : Emitted upon successful connection establishment.
- **close** : Indicates the WebSocket connection has been closed.
- **message** : Delivers market updates.
- **error** : Signals an error has occurred.
- **reconnecting** : Announced when a reconnect attempt is initiated.
- **autoReconnectStopped** : Informs when auto-reconnect efforts have ceased after exhausting the retry count.