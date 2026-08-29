# Websocket Implementation

URL: https://upstox.com/developer/api-documentation/websocket-implementation

The websocket streaming provides an efficient way to receive market and order related communication over a long standing connection.

Websockets offer several technical advantages over standard API calls:

- **Efficiency:** Instead of repeatedly polling for data, websockets allow data to be pushed to the client as it becomes available.
- **Real-time:** Websockets provide real-time communication which is crucial for trading applications where every second counts.
- **Reduced overhead:** With websockets, the overhead of establishing a connection is reduced as one connection can be kept open for longer durations.

Websockets should be preferred when:

- Real-time updates are required.
- The frequency of data updates is high, making regular API polling inefficient.
- Reducing network overhead is a priority.

We provide two types of streaming options:

- Market related changes for the subscribed entities
- Order related updates

## Related Documentation

- [Market Data Feed V3](Market%20Data%20Feed%20V3.md) — Real-time market data via WebSocket with Protobuf encoding.
- [Market Data Feed Authorize V3](Market%20Data%20Feed%20Authorize%20V3.md) — Get the authorized WebSocket endpoint URI.
- [Portfolio Stream Feed](Portfolio%20Stream%20Feed.md) — Real-time order, position, and holding updates via WebSocket.
- [Streamer Functions](Streamer%20Functions.md) — Use Upstox API streamer functions to connect to WebSocket feeds for live market data and portfolio updates via SDK helper methods for trading platforms.
