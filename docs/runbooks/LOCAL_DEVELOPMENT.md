# Run the Step 02 development stack

First follow [SETUP.md](SETUP.md) and select the pinned Rust, Node and pnpm versions. Run commands from the repository root. The API loads root `.env`; Vite only uses public variables from `apps/web/.env` when present.

## Start

1. Copy `.env.example` to `.env` if it does not exist. Replace both `CHANGE_ME` passwords; keep the database password in `DATABASE_URL` consistent with `POSTGRES_PASSWORD`, and the RabbitMQ URL password consistent with `RABBITMQ_DEFAULT_PASS`. Use URL-safe passwords or URL-encode URL credentials. Do not overwrite an existing `.env`.
2. Run `pnpm install --frozen-lockfile`.
3. Run `docker compose up -d --wait --wait-timeout 180`.
4. In one terminal run `bash scripts/dev-api`.
5. In another terminal run `bash scripts/dev-web`.
6. Open `http://localhost:5173`. “Connected and ready” verifies a real browser → API → PostgreSQL connection. “DEVELOPMENT · MOCK MODE” is visible; no football data is available yet.

The root `.env` public origin must match the browser origin exactly. The default is `http://localhost:5173`; visiting via `127.0.0.1` requires changing `PUBLIC_WEB_ORIGIN`. An alternate API origin belongs in `apps/web/.env` using the supplied example, followed by restarting Vite.

## Services and ports

| Service | Host address | Container address | Persistence |
|---|---|---|---|
| Vue | localhost:5173 | Runs on host | Source files |
| API | localhost:3000 | Runs on host | No local durable state |
| PostgreSQL | localhost:5433 | postgres:5432 | postgres_data |
| Redis | localhost:6379 | redis:6379 | redis_data; rebuildable state |
| Kafka | localhost:9092 | kafka:19092 | kafka_data |
| RabbitMQ | localhost:5672 | rabbitmq:5672 | rabbitmq_data |
| RabbitMQ management | localhost:15672 | rabbitmq:15672 | Same broker volume |

All published infrastructure ports bind to loopback. Kafka's internal and external listeners allow later host or Compose workers. Single-node replication is for local development only. Start Docker infrastructure before using readiness; the API itself can start while PostgreSQL is down and returns 503 until it recovers.

## Validate

```bash
bash scripts/check
curl --fail http://localhost:3000/health
curl --fail http://localhost:3000/health/ready
curl --fail http://localhost:3000/api/v1/system
pnpm --dir apps/web exec playwright install chromium
pnpm --dir apps/web test:e2e
```

Browser tests require the running API and healthy database; they start Vite if needed and cover desktop/mobile success, loading, offline/retry, keyboard focus and 404 navigation. `scripts/check` covers formatting, Clippy, Rust tests, ESLint, TypeScript, Vitest and production build. CI uses these same gates and starts its own Compose services.

Worker configuration can be checked with `cargo run --locked -p pitchpulse-ingest-worker -- --check-config` (also `pitchpulse-event-consumer`, `pitchpulse-job-worker`). Without the flag they wait for Ctrl-C/SIGTERM. They do not ingest, consume or dispatch work yet; their logs state this explicitly.

## Failure/recovery and stop

- `docker compose ps` shows health. Inspect a specific service with `docker compose logs <service>`; never publish logs containing local secrets.
- Stop PostgreSQL with `docker compose stop postgres`: `/health` remains 200 while `/health/ready` returns 503. Restore it with `docker compose up -d --wait postgres`, then click “Check again”.
- If a host port is occupied, change its documented environment variable and corresponding client URL. PostgreSQL defaults to 5433 deliberately.
- Changing a database password in `.env` does not change the password in an initialized volume. Update the database user deliberately or use a new development volume; do not delete existing data as a routine fix.
- Stop the host API/Vite with Ctrl-C; stop infrastructure with `docker compose down`. Named volumes remain. `down -v` deletes local data and is not part of normal shutdown.

## Scope

No SQL migrations are required for the readiness query. Schema/domain data arrives in Step 04, mock feeds in Step 06, Kafka processing in Step 09 and resilient jobs in Step 21. No live data, authentication, AI requests or production deployment is provided by this foundation.
