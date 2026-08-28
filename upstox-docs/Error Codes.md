# Error Codes

URL: https://upstox.com/developer/api-documentation/error-codes

## HTTP error codes

| Error code | Description |
|------------|-------------|
| `400` Bad Request | Your request parameters are incorrect. |
| `401` Unauthorized | Your API key is wrong or missing. |
| `403` Forbidden | The requested resource is hidden for administrators only. |
| `404` Not Found | The specified resource could not be found. |
| `405` Method Not Allowed | You tried to access a resource with an invalid method. |
| `406` Not Acceptable | You requested a format that isn't json. |
| `410` Gone | The resource requested has been removed from our servers. |
| `429` Too Many Requests | You're requesting too many resources! Slow down! |
| `500` Internal Server Error | We had a problem with our server. Please try again later. |
| `503` Service Unavailable | We're temporarily offline for maintenance. Please try again later. |

## Common API error codes

| Error code | Description |
|------------|-------------|
| UDAPI10000 | **This request is not supported by Upstox API** — This error is thrown when the API call is not recognized or valid, possibly due to incorrect URL formatting or the presence of unexpected characters in the URL. |
| UDAPI100016 | **Invalid Credentials** — Thrown when one of the credentials you've passed to this API is invalid. |
| UDAPI10005 | **Too Many Request Sent** — Thrown when you've exceeded the rate limits for the API. |
| UDAPI100015 | **API Version does not exist** — Thrown when API version isn't part of the Header attributes. |
| UDAPI100050 | **Invalid token used to access API** — Thrown when an invalid token is used to access the API. |
| UDAPI100067 | **The API you are trying to access is not permitted with an extended_token** — Thrown when trying to access an API that is not allowed with an extended_token. |
| UDAPI100036 | **Invalid Input** — Thrown when an invalid input is passed to the API. |
| UDAPI100038 | **Invalid input passed to the API** — Thrown when an invalid input is passed to the API. |
| UDAPI100073 | **Your 'client_id' is inactive.** — Thrown when the `client_id` is not active. Please contact the support team for further assistance. |
| UDAPI100500 | **Something went wrong... please contact us** — An unexpected error occurred. Please contact support. |

Error codes specific to each API are detailed in the **4XX** response section within their respective documentation.
