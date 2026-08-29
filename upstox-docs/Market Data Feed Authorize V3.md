# Market Data Feed Authorize V3

URL: https://upstox.com/developer/api-documentation/get-market-data-feed-authorize-v3

```
GET /feed/market-data-feed/authorize
```

API to retrieve the designated socket endpoint URI for Market updates. This endpoint is intended for use with a WebSocket client. If automatic redirection is not configured through the [Market Stream Feed V3 API](Market%20Data%20Feed%20V3.md), this API serves as an alternative method to acquire the necessary `wss://` URL for establishing a connection via a WebSocket client.

## New Instruments

- **Global Index** — Major global stock market indices such as GIFT NIFTY, Dow Jones, S&P, FTSE 100, and more. See [Global Instruments](/developer/api-documentation/instruments#global-instruments) for details and download the [Global Instruments file](https://assets.upstox.com/market-quote/instruments/exchange/global.json.gz) for instrument keys.
- **India VIX** — The NSE Volatility Index, available using instrument key `NSE_INDEX|India VIX`.

## Header Parameters

| Name | Required | Type | Description |
|------|----------|------|-------------|
| Authorization | Required | string | Requires the format `Bearer access_token` where `access_token` is obtained from the [Token API](/developer/api-documentation/get-token). |
| Accept | Required | string | Defines the content format the client expects, which should be set to `application/json`. |

## Responses

- 200

### Response Body

```json
{
  "status": "success",
  "data": {
    "authorized_redirect_uri": "wss://xyz.upstox.com/market-data-feeder/v3/upstox-developer-api/feeds?requestId=2f646f57-a097-4402-bb36-c44085c5f8e7&code=9355b100-25cf-4fa7-b038-06d27ddb4823"
  }
}
```

### Response Fields

| Name | Type | Description |
|------|------|-------------|
| status | string | A string indicating the outcome of the request. Typically `success` for successful operations. |
| data | object | Response data for WebsocketAuthRedirectResponse. |
| data.authorized_redirect_uri | string | The verified URL used for secure WebSocket connections, allowing real-time market data updates. This URL is valid for one-time use because the `code` present as the req parameter is a single-use authentication token for the WebSocket connection. |

## Notes

If there is no data to stream over an open WebSocket connection, the API automatically sends a standard `ping` frame periodically to maintain the connection's aliveness. Most standard WebSocket client libraries across various programming languages handle this automatically by responding with a `pong` frame, requiring no manual intervention.
