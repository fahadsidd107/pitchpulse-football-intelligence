# Step 02 HTTP contracts

Only `GET` is supported. All application responses include a server-generated UUID `x-request-id`. CORS allows exactly `PUBLIC_WEB_ORIGIN`; it does not enable credentials. Requests time out after `REQUEST_TIMEOUT_SECONDS` (1–30, default 5). Do not infer authentication from CORS: these initial health/metadata routes are deliberately public.

| Route | Success | Failure |
|---|---|---|
| `/health`, `/health/live`, `/api/v1/health/live` | 200 `{"status":"ok","service":"pitchpulse-api"}` | Process unreachable |
| `/health/ready`, `/api/v1/health/ready` | 200 `{"status":"ready","dependencies":{"postgresql":"up"}}` | 503 `DATABASE_UNAVAILABLE` |
| `/api/v1/system` | 200 `{"name":"PitchPulse","version":"0.1.0","data_mode":"MOCK","football_data_available":false}` | Process unreachable |

Readiness runs a bounded SQLx `SELECT 1` with a maximum of five connections. Pool acquisition and the complete check are bounded at two seconds. PostgreSQL loss affects readiness, not liveness; restoration is detected by the next check. Brokers are unused by these handlers and are monitored by Compose separately.

Errors use `{"error":{"code":"...","message":"...","request_id":"UUID","retryable":true,"details":{}}}`. Codes: `DATABASE_UNAVAILABLE` (503), `REQUEST_TIMEOUT` (504), `NOT_FOUND` (404), `METHOD_NOT_ALLOWED` (405). Only server failures are retryable. Responses never contain connection URLs, credentials or SQL driver errors. Logs contain request ID, method, status and duration rather than raw headers or query strings.

System metadata is not a football data feed. There are no fixtures, timestamps or provider capabilities to invent at this step. Authentication and full domain OpenAPI arrive in Step 05.
