# Request Structure

URL: https://upstox.com/developer/api-documentation/request-structure

## Request format

Use the following structure to make requests to the Upstox API:

```bash
curl --request [API_METHOD] \
  --url 'https://api.upstox.com/[API_VERSION]/[API_ENDPOINT]' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer [YOUR_ACCESS_TOKEN]' \
  [CONTENT_TYPE_HEADER] \
  [REQUEST_PAYLOAD]
```

## Placeholders

| Name | Description |
|------|-------------|
| [API_METHOD] | The HTTP method for your request (e.g., GET, POST, PUT, DELETE). |
| [API_VERSION] | The API version for the endpoint you're targeting (e.g., `v2`, `v3`). Refer to each endpoint's documentation for its supported version. |
| [API_ENDPOINT] | The specific endpoint you're targeting (e.g., /user/profile, /order/place). |
| [YOUR_ACCESS_TOKEN] | Your personal access token for authentication. |
| [CONTENT_TYPE_HEADER] | Include `-H 'Content-Type: application/json'` for requests that send a JSON payload. Include `-H 'Content-Type: application/x-www-form-urlencoded'` for requests that send data in key-value pair format. Omit for other requests. |
| [REQUEST_PAYLOAD] | For POST and PUT methods that send data, use `-d '[YOUR_JSON_DATA]'`. Omit for other methods. |

## URL encoding

All API requests must be encoded using the **Standard URL Encoding** — encodes special characters and non-ASCII characters using the percent sign and two hexadecimal digits.
