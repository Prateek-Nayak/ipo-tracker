# API Testing Rules

## Do NOT Run Any APIs

- **Never** execute or call any API endpoints on this system.
- Trust the endpoints documented in `upstox-docs/*.md` — they are correct.
- Refer to the documentation and write code based on the documented request/response structures.

## Testing Workflow

- When you need to test an endpoint, **generate a markdown file** (e.g., `tests/test-get-ipos.md`) describing:
  - The endpoint being tested
  - The request (method, URL, headers, params/body)
  - Expected response structure
  - What to verify (status codes, field presence, data types, edge cases)
- Push the test file. The user will pull it on a different system, run the tests, and report results back.

## General Rules

- If you need any information (env vars, tokens, config values, etc.), **ask** — do not assume.
- Write all code trusting the Upstox API docs as the source of truth.
- Do not guess undocumented behavior or fields.
