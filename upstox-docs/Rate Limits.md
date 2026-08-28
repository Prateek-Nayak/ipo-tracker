# Rate Limits

URL: https://upstox.com/developer/api-documentation/rate-limiting

In our pursuit of offering a consistent and reliable service, we've established rate limits for our API interactions. These constraints, detailed below, are designed to prevent system overloads and ensure equitable access to all our users. The rate limits are enforced on a per-API, per-user basis.

As per the circular dated [May 5, 2025](https://nsearchives.nseindia.com/content/circulars/INVG67858.pdf) , rate limiting for retail investors participating in Algo trading has been classified into two categories.

### Combined rate limiting for Order Placement APIs

(Place, Modify, Cancel, Multi Order and GTT Order)

1. **Regular Algos** -> No Algo Registration Needed

| Time duration | Request limit 
| Per second | 10 requests 
| Per minute | 500 requests 
| Per 30 minutes | 2000 requests 

1. **SEBI-Registered Algos** -> Algo Registration Needed

| Time duration | Request limit 
| Per second | 50 requests 
| Per minute | 500 requests 
| Per 30 minutes | 2000 requests 

### Other Standard APIs

(holdings, positions, funds, historical candles etc.)

| Time duration | Request limit 
| Per second | 50 requests 
| Per minute | 500 requests 
| Per 30 minutes | 2000 requests 

### Payout APIs

1. **Standard Access** (Get Payouts, Get Payout Modes, Get Payins)

| Time duration | Request limit 
| Per second | 10 requests 
| Per minute | 500 requests 
| Per 30 minutes | 2000 requests 

1. **Restricted Access** (Payout Request, Modify Payout, Cancel Payout)

| Time duration | Request limit 
| Per minute | 10 requests 
| Per 30 minutes | 300 requests 

### Apply IPO

| Time duration | Request limit 
| Per second | 1 request 
| Per minute | 10 requests 
| Per 30 minutes | 300 requests 

Please adhere to these limits to avoid potential disruptions in service. Exceeding these limits might result in temporary suspension of access.