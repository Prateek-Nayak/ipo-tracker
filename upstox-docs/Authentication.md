# Authentication

URL: https://upstox.com/developer/api-documentation/authentication

Upstox uses the standard **OAuth 2.0 authorization code flow** to log customers in and issue access tokens. Your application never handles Upstox credentials directly — the customer signs in on Upstox, and your app receives an access token to call the API on their behalf.

In short: your app sends the customer to Upstox, the customer logs in, Upstox returns a single-use authorization `code`, your server exchanges that code for an `access_token`, and your app uses the token to call the API. The steps below walk through each stage.

All logins are handled by upstox.com. There is no public endpoint for other applications to directly log the customer into their upstox.com. For security and compliance purposes, all logins and logouts are handled exclusively by upstox.com.

## Before you begin

To complete the flow, create an app on [Upstox Developer Apps](https://account.upstox.com/developer/apps). From it you will need:

- The **API key** (`client_id`) and **API secret** (`client_secret`).
- A registered **redirect URI** that exactly matches the one you send in Step 1.

In OAuth, `client_id` is your **API Key** (not the customer's UCC) and `client_secret` is your **API Secret**.

## Step 1: Redirect the customer to the Upstox login

Open the Upstox login page in a Webview (or similar) and pass the parameters below as query parameters:

```text
https://api.upstox.com/v2/login/authorization/dialog
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `client_id` | Yes | The API key obtained during the app generation process. |
| `redirect_uri` | Yes | The URL the customer is redirected to after authentication. Must match the URL registered during app generation. |
| `response_type` | Yes | Must always be `code`. |
| `state` | No | Returned unchanged after authentication, letting you maintain state continuity between the request and the callback. |

URL construction:

```text
https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=<Your-API-Key-Here>&redirect_uri=<Your-Redirect-URI-Here>&state=<Your-Optional-State-Parameter-Here>
```

Sample URL:

```text
https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=615b1297-d443-3b39-ba19-1927fbcdddc7&redirect_uri=https%3A%2F%2Fwww.trading.tech%2Flogin%2Fupstox-v2&state=RnJpIERlYyAxNiAyMDIyIDE1OjU4OjUxIEdNVCswNTMwIChJbmRpYSBTdGFuZGFyZCBUaW1lKQ%3D%3D
```

> **Note:** Redirect URLs ending in `.php` or similar extensions may be blocked for security reasons. Avoid placing the redirect at the end of the URL — position it somewhere in the middle instead.

> **Note:** An `Invalid Credentials` error usually means the request parameters (`client_id`, `redirect_uri`, and `response_type`) do not match the values registered during app creation. Verify these and correct any discrepancies before retrying.

The customer is then taken to the Upstox login page to sign in.

Customers can choose [TOTP (Time-based One-Time Password)](https://en.wikipedia.org/wiki/Time-based_one-time_password) instead of SMS OTP for 2FA — a more secure method for a safer login. Learn how to activate TOTP on an Upstox account [here](https://help.upstox.com/support/solutions/articles/260346-what-is-totp-and-how-to-enable-totp-for-my-account-from-upstox-web-platform-).

## Step 2: Receive the authorization code

After a successful login, Upstox redirects to the `redirect_uri` you provided, with the `code` needed for token generation included as a query parameter:

```text
https://<redirect_uri>?code=mk404x&state=XX56849
```

| Parameter | Description |
|-----------|-------------|
| `code` | Use this to generate the `access_token` in the next step. |
| `state` | Returned only if it was included in the original request URL. |

## Step 3: Exchange the code for an access token

Make a server-to-server `POST` call from your backend to exchange the authorization code for an `access_token`:

```text
https://api.upstox.com/v2/login/authorization/token
```

The authorization code is valid for a single use, regardless of whether the access token generation succeeds or fails.

Pass the following parameters:

| Parameter | Description |
|-----------|-------------|
| `code` | The single-use code returned in Step 2 upon a successful [Authorize API](/developer/api-documentation/authorize) authentication. |
| `client_id` | The API key obtained during the app generation process. |
| `client_secret` | The API secret obtained during the app generation process. Keep it confidential — it is known only to your app and Upstox. |
| `redirect_uri` | The URL provided during app generation. |
| `grant_type` | Must always be `authorization_code`. |

### cURL

```bash
curl -X 'POST' 'https://api.upstox.com/v2/login/authorization/token' \
-H 'accept: application/json' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-d 'code=<Your-Auth-Code-Here>&client_id=<Your-API-Key-Here>&client_secret=<Your-API-Secret-Here>&redirect_uri=<Your-Redirect-URI-Here>&grant_type=authorization_code'
```

### Python

```python
import requests

url = "https://api.upstox.com/v2/login/authorization/token"
headers = {
    "accept": "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
}
data = {
    "code": "<Your-Auth-Code-Here>",
    "client_id": "<Your-API-Key-Here>",
    "client_secret": "<Your-API-Secret-Here>",
    "redirect_uri": "<Your-Redirect-URI-Here>",
    "grant_type": "authorization_code",
}

response = requests.post(url, headers=headers, data=data)
print(response.json())
```

### Node.js

```javascript
const url = "https://api.upstox.com/v2/login/authorization/token";

const params = new URLSearchParams({
  code: "<Your-Auth-Code-Here>",
  client_id: "<Your-API-Key-Here>",
  client_secret: "<Your-API-Secret-Here>",
  redirect_uri: "<Your-Redirect-URI-Here>",
  grant_type: "authorization_code",
});

const response = await fetch(url, {
  method: "POST",
  headers: {
    accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: params,
});

const data = await response.json();
console.log(data);
```

The response returns an `access_token`, which your front-end application can use to call the Upstox API on the customer's behalf.

## Other ways to generate a token

The authorization code flow above is the standard, interactive method. Two alternatives are available for apps that cannot run an interactive login each time:

| Method | Best for | How a token is delivered |
|--------|----------|-------------------------|
| Authorization code flow (Steps 1–3 above) | Apps that log customers in interactively | Exchanged on your server from a single-use code |
| Semi-automated | Scheduled/automated apps that still require approval | Pushed to your notifier URL after manual approval |
| Manual | One-off or personal utilities | Copied from the developer dashboard |

### Semi-automated token generation

For apps that automate authentication requests but require manual approval:

1. Configure your app to trigger the **auth request** at a specific time, as detailed in the **[Access Token Request API](/developer/api-documentation/access-token-request#request)**.
2. When notified on your mobile, approve the authentication by either:
   - Clicking the link in the notification, or
   - Visiting **[Upstox Developer Apps](https://account.upstox.com/developer/apps)** and approving the request.
3. Once approved, the access token is delivered to the **notifier URL** set during app creation.
4. Ensure your app **listens on the notifier URL** and stores the token for further use.

For more details on implementation and usage, see the [Access Token Request Documentation](/developer/api-documentation/access-token-request).

### Manual token generation

If your app is a small utility where manual input is feasible, you can generate an access token directly:

1. Visit [Upstox Developer Apps](https://account.upstox.com/developer/apps) and click the app you created.
2. Click **Generate** to create a new access token.
3. Copy the generated token and use it in your app.

This is ideal for one-time or occasional API usage where automation isn't required.
