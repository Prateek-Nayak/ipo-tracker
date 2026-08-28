# Portfolio Stream Feed

URL: https://upstox.com/developer/api-documentation/get-portfolio-stream-feed

```
WSS /feed/portfolio-stream-feed
```

The Order update stream feed communicates all order updates when connected over the websocket. No request object is required for this. The communication will start immediately after the connection is successfully established.

Integration involves connecting to the provided endpoint using the `wss:` protocol through a WebSocket client, which is configured to automatically redirect to the authorized WebSocket endpoint upon authentication. Therefore, the client's configuration must be adjusted to support this automatic redirection. For example, in a Node.js client, you should enable the `followRedirects` setting to facilitate seamless handling of redirection.

The order update WebSocket ensures that you receive updates on your order regardless of the platform used to place it. Whether you place an order through the Upstox mobile app or via the web application, you will still receive the order updates through the API WebSocket, and the same applies in reverse.

## Header Parameters

| Name | Required | Type | Description |
|------|----------|------|-------------|
| Authorization | Required | string | Requires the format `Bearer access_token` where `access_token` is obtained from the [Token API](/developer/api-documentation/get-token). |
| Accept | Required | string | Defines the content format the client expects, which should be set to `*/*`. |

## Query Parameters

| Name | Required | Type | Description |
|------|----------|------|-------------|
| update_types | Optional | string | Identifiers, separated by commas, specify the types of updates to receive. By default, updates on orders are transmitted via the socket. To subscribe to updates on orders, holdings, and positions, use this parameter by entering the desired values, separated by commas. Possible values: `order`, `gtt_order`, `position`, `holding`. Sample URL with update_types: `wss://api.upstox.com/v2/feed/portfolio-stream-feed?update_types=order%2Cposition%2Cholding` |

## Responses

- 302

This API does not provide a typical JSON response. Instead, upon successful authentication, it automatically redirects the client to the appropriate websocket endpoint where order updates can be received in real-time. Users are expected to handle data streams as per the websocket protocol once the redirection is complete.

Following is a sample of an order update message received on the socket.

### Message Structure

#### Order

```json
{
  "update_type": "order",
  "user_id": "******",
  "userId": "******",
  "exchange": "NSE",
  "instrument_token": "NSE_EQ|INE848E01016",
  "instrument_key": "NSE_EQ|INE848E01016",
  "trading_symbol": "NHPC-EQ",
  "tradingsymbol": "NHPC-EQ",
  "product": "D",
  "order_type": "MARKET",
  "average_price": 0,
  "price": 0,
  "trigger_price": 0,
  "quantity": 1,
  "disclosed_quantity": 0,
  "pending_quantity": 1,
  "transaction_type": "BUY",
  "order_ref_id": "57744821658411",
  "exchange_order_id": "",
  "parent_order_id": null,
  "validity": "DAY",
  "status": "put order req received",
  "is_amo": false,
  "variety": "SIMPLE",
  "tag": null,
  "exchange_timestamp": null,
  "status_message": "",
  "order_id": "240221025997024",
  "order_request_id": "1",
  "order_timestamp": "2024-02-21 14:40:02",
  "filled_quantity": 0,
  "guid": null,
  "placed_by": "******",
  "status_message_raw": null
}
```

| Name | Type | Description |
|------|------|-------------|
| update_type | string | Signifies the type of update received. Possible values: `order`, `gtt_order`, `position`, `holding`. |
| exchange | string | Exchange to which the order is associated. Valid exchanges can be found in the [Exchange Appendix](/developer/api-documentation/appendix/exchange). |
| product | string | Signifies if the order was either Intraday, Delivery or MTF. Possible values: `I`, `D`, `MTF`. |
| price | float | Price at which the order was placed. |
| quantity | int32 | Quantity with which the order was placed. |
| status | string | Indicates the current status of the order. Valid order statuses can be found in the [Order Status Appendix](/developer/api-documentation/appendix/order-status). |
| tag | string | Tag to uniquely identify an order. |
| instrument_token | string | Key of the instrument. For the regex pattern applicable to this field, see the [Field Pattern Appendix](/developer/api-documentation/appendix/field-pattern). |
| instrument_key | string | Key of the instrument. For the regex pattern applicable to this field, see the [Field Pattern Appendix](/developer/api-documentation/appendix/field-pattern). |
| placed_by | string | Uniquely identifies the user (commonly referred as UCC). |
| trading_symbol | string | Shows the trading symbol of the instrument. |
| order_type | string | Type of order. MARKET refers to market order, LIMIT refers to Limit Order, SL refers to Stop Loss Limit, SL-M refers to Stop Loss Market. Possible values: `MARKET`, `LIMIT`, `SL`, `SL-M`. |
| validity | string | It can be one of the following - DAY(default), IOC. Possible values: `DAY`, `IOC`. |
| trigger_price | float | If the order was a stop loss order then the trigger price set is mentioned here. |
| disclosed_quantity | int32 | The quantity that should be disclosed in the market depth. |
| transaction_type | string | Indicates whether its a buy or sell order. Possible values: `BUY`, `SELL`. |
| average_price | float | Average price at which the qty got traded. |
| filled_quantity | int32 | The total quantity traded from this particular order. |
| pending_quantity | int32 | Pending quantity to be filled. |
| status_message | string | Indicates the reason when any order is rejected, not modified or cancelled. |
| status_message_raw | string | Description of the order's status as received from RMS. |
| exchange_order_id | string | Unique order ID assigned by the exchange for the order placed. |
| parent_order_id | string | In case the order is part of the second of a CO, the parent order ID is indicated here. |
| order_id | string | Unique order ID assigned internally for the order placed. |
| variety | string | Order complexity. |
| order_timestamp | string | User readable timestamp at which the order was placed. |
| exchange_timestamp | string | User readable time at which the order was placed or updated. |
| is_amo | boolean | Signifies if the order is an After Market Order. |
| order_request_id | string | Apart from 1st order it shows the count of how many requests were sent. |
| order_ref_id | string | Uniquely identifies an order for internal usage. |

#### GTT Order

```json
{
  "update_type": "gtt_order",
  "type": "MULTIPLE",
  "exchange": "NSE_EQ",
  "instrument_token": "NSE_EQ|INE806A01020",
  "quantity": 1,
  "product": "D",
  "gtt_order_id": "GTT-CU25270200024002",
  "expires_at": 1772216999000000,
  "created_at": 1740641185000000,
  "rules": [
    {
      "strategy": "ENTRY",
      "status": "FAILED",
      "trigger_type": "IMMEDIATE",
      "trigger_price": 7.7,
      "transaction_type": "BUY",
      "message": "The price set should be within the circuit limits. Please modify your order price.",
      "order_id": "250228010168535",
      "trailing_gap": null
    },
    {
      "strategy": "STOPLOSS",
      "status": "CANCELLED",
      "trigger_type": "IMMEDIATE",
      "trigger_price": 7.6,
      "transaction_type": "SELL",
      "message": "",
      "order_id": null,
      "trailing_gap": 1
    },
    {
      "strategy": "TARGET",
      "status": "CANCELLED",
      "trigger_type": "IMMEDIATE",
      "trigger_price": 7.64,
      "transaction_type": "SELL",
      "message": "",
      "order_id": null,
      "trailing_gap": null
    }
  ]
}
```

| Name | Type | Description |
|------|------|-------------|
| update_type | string | Signifies the type of update received. Possible values: `order`, `gtt_order`, `position`, `holding`. |
| type | string | Specifies the GTT order type. Indicates if it's a single or multi-leg order. Possible values: `SINGLE`, `MULTIPLE`. |
| exchange | string | The exchange where the order is placed. Possible values: `NSE_EQ`, `BSE_EQ`, etc. |
| quantity | integer | The number of units specified in the order. |
| product | string | Specifies whether the order is for Intraday, Delivery or MTF. Possible values: `I` (Intraday), `D` (Delivery), `MTF` (Margin Trading Facility). |
| instrument_token | string | Unique identifier for the instrument being traded. |
| trading_symbol | string | The symbol of the traded instrument. |
| gtt_order_id | string | Unique identifier assigned to the GTT order. |
| expires_at | integer | The timestamp indicating when the GTT order expires. |
| created_at | integer | The timestamp when the GTT order was created. |
| rules | array | Defines the conditions for order execution, such as trigger price and strategy. |
| rules[].strategy | string | Specifies the role of the rule. Possible values: `ENTRY`, `TARGET`, `STOPLOSS`. **ENTRY** - Defines the condition for the first-leg order execution (BUY or SELL). **TARGET** - Sets an exit condition at a predefined profit level. **STOPLOSS** - Sets an exit condition to limit losses. |
| rules[].status | string | Indicates the status of the rule. Possible values: `PENDING`, `COMPLETED`, `FAILED`, `CANCELLED`. |
| rules[].trigger_type | string | Specifies the condition under which the order is triggered. Possible values: `BELOW`, `ABOVE`, `IMMEDIATE`. **BELOW** - Triggers when the market price falls below the trigger price. **ABOVE** - Triggers when the market price rises above the trigger price. **IMMEDIATE** - Triggers when the market price matches the trigger price. |
| rules[].trigger_price | float | The price at which the order will be triggered based on the condition. |
| rules[].transaction_type | string | Defines whether the order is a buy or sell transaction. Possible values: `BUY`, `SELL`. |
| rules[].message | string | This field specifies the error reason when the rule fails. |
| rules[].order_id | string | Unique identifier for the order generated after execution. May be `null` if the order hasn't been placed yet. |
| rules[].trailing_gap | float | Only applicable for **STOPLOSS** strategy for **TSL** orders, in other cases the value would be `null`. This defines the consistent gap between your stop-loss and the market price, letting your stop-loss trail automatically. |

#### Holding

```json
{
  "update_type": "holding",
  "instrument_token": "NSE_EQ|INE848E01016",
  "instrument_key": "NSE_EQ|INE848E01016",
  "average_price": 89.22,
  "isin": "INE848E01016",
  "cnc_used_quantity": 0,
  "collateral_quantity": 0,
  "collateral_type": "WC",
  "collateral_update_quantity": 0,
  "company_name": "NHPC LTD",
  "haircut": 0.21,
  "product": "D",
  "quantity": 3,
  "t1_quantity": 0,
  "exchange": "NSE"
}
```

| Name | Type | Description |
|------|------|-------------|
| update_type | string | Signifies the type of update received. Possible values: `order`, `gtt_order`, `position`, `holding`. |
| isin | string | The standard ISIN representing stocks listed on multiple exchanges. |
| cnc_used_quantity | int32 | Quantity either blocked towards open or completed order. |
| collateral_type | string | Category of collateral assigned by RMS. |
| company_name | string | Name of the company. |
| haircut | float | This is the haircut percentage applied from RMS (applicable in case of collateral). |
| product | string | Signifies if the order was either Intraday, Delivery or MTF. Possible values: `I`, `D`, `MTF`. |
| quantity | int32 | The total holding qty. |
| instrument_token | string | Key of the instrument. For the regex pattern applicable to this field, see the [Field Pattern Appendix](/developer/api-documentation/appendix/field-pattern). |
| instrument_key | string | Key of the instrument. For the regex pattern applicable to this field, see the [Field Pattern Appendix](/developer/api-documentation/appendix/field-pattern). |
| average_price | float | Average price at which the net holding quantity was acquired. |
| collateral_quantity | int32 | Quantity marked as collateral by RMS on users request. |
| collateral_update_quantity | int32 | Updated collateral quantity. |
| t1_quantity | int32 | Quantity on T+1 day after order execution. |
| exchange | string | Exchange to which the order is associated. Valid exchanges can be found in the [Exchange Appendix](/developer/api-documentation/appendix/exchange). |

#### Position

```json
{
  "update_type": "position",
  "instrument_token": "NSE_EQ|INE848E01016",
  "instrument_key": "NSE_EQ|INE848E01016",
  "average_price": 0,
  "buy_value": 185.85,
  "overnight_quantity": 0,
  "exchange": "NSE_EQ",
  "day_buy_value": 185.85,
  "day_buy_price": 92.92,
  "overnight_buy_amount": 0,
  "overnight_buy_quantity": 0,
  "day_buy_quantity": 2,
  "day_sell_value": 0,
  "day_sell_price": 0,
  "overnight_sell_amount": 0,
  "overnight_sell_quantity": 0,
  "day_sell_quantity": 0,
  "multiplier": 1,
  "quantity": 2,
  "product": "D",
  "sell_value": 0,
  "buy_price": 92.925,
  "sell_price": 0
}
```

| Name | Type | Description |
|------|------|-------------|
| update_type | string | Signifies the type of update received. Possible values: `order`, `gtt_order`, `position`, `holding`. |
| exchange | string | Exchange to which the order is associated. Valid exchanges can be found in the [Exchange Appendix](/developer/api-documentation/appendix/exchange). |
| multiplier | float | The quantity/lot size multiplier used for calculating P&Ls. |
| product | string | Signifies if the order was either Intraday, Delivery, MTF. Possible values: `I`, `D`, `MTF`. |
| instrument_token | string | Key of the instrument. For the regex pattern applicable to this field, see the [Field Pattern Appendix](/developer/api-documentation/appendix/field-pattern). |
| instrument_key | string | Key of the instrument. For the regex pattern applicable to this field, see the [Field Pattern Appendix](/developer/api-documentation/appendix/field-pattern). |
| average_price | float | Average price at which the net position quantity was acquired. |
| buy_value | float | Net value of the bought quantities. |
| overnight_quantity | int32 | Quantity held previously and carried forward over night. |
| day_buy_value | float | Amount at which the quantity is bought during the day. |
| day_buy_price | float | Average price at which the day qty was bought. Default is empty string. |
| overnight_buy_amount | float | Amount at which the quantity was bought in the previous session. |
| overnight_buy_quantity | int32 | Quantity bought in the previous session. |
| day_buy_quantity | int32 | Quantity bought during the day. |
| day_sell_value | float | Amount at which the quantity is sold during the day. |
| day_sell_price | float | Average price at which the day quantity was sold. |
| overnight_sell_amount | float | Amount at which the quantity was sold in the previous session. |
| overnight_sell_quantity | int32 | Quantity sold short in the previous session. |
| day_sell_quantity | int32 | Quantity sold during the day. |
| quantity | int32 | Quantity left after nullifying Day and CF buy quantity towards Day and CF sell quantity. |
| sell_value | float | Net value of the sold quantities. |
| buy_price | float | Average price at which quantities were bought. |
| sell_price | float | Average price at which quantities were sold. |

## Notes

If there is no data to stream over an open WebSocket connection, the API automatically sends a standard `ping` frame periodically to maintain the connection's aliveness. Most standard WebSocket client libraries across various programming languages handle this automatically by responding with a `pong` frame, requiring no manual intervention.

> The lowercase field (`tradingsymbol`) is deprecated and will be removed in future versions. Use the snake_case versions for consistency.
