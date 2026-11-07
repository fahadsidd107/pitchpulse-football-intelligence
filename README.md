# PitchPulse — The Game, Decoded.

A planned football intelligence platform combining match coverage, grounded AI text/voice Q&A, pitch visualization, explainable player ratings, scouting and historical comparisons, deterministic dream-team simulations, and two non-monetary fantasy modes (season squads and matchday predictions). News, transfers, favourites and notifications round out the product.

Development starts with deterministic fictional demo data. Recorded tracking, reconstructed movement and simulated matches must always have distinct provenance labels; licensed live feeds can be added later.

## Current state

Step 01 setup is verified. Step 02 provides a Rust workspace, a Vue status page, and local PostgreSQL/Redis/Kafka/RabbitMQ infrastructure. The status page checks the real API and PostgreSQL connection; no football feed exists yet. See [roadmap progress](docs/ROADMAP.md#6-milestone-checklist-and-progress) for validation status.

## Run locally

Follow the [toolchain setup guide](docs/runbooks/SETUP.md), select the pinned versions and start Docker. Then follow [local development](docs/runbooks/LOCAL_DEVELOPMENT.md) to configure your ignored `.env` with local credentials.

```bash
pnpm install --frozen-lockfile
docker compose up -d --wait --wait-timeout 180
bash scripts/dev-api
# In a second terminal:
bash scripts/dev-web
```

Open `http://localhost:5173` for the status page. The API listens on port 3000; PostgreSQL uses host port 5433. `bash scripts/check` runs Rust formatting/Clippy/tests and web lint/typecheck/tests/build. With API and database running, `pnpm --dir apps/web test:e2e` runs browser checks (install Chromium as described in the runbook first).

The worker targets currently validate configuration and handle shutdown; their processing pipelines are introduced in later steps. All infrastructure ports are local-only. Stop with Ctrl-C and `docker compose down` (preserves data volumes).

## Planned stack

- Rust, Axum, Tokio and SQLx for APIs, workers and domain engines.
- Vue 3, TypeScript, Vite, Tailwind, Pinia and Three.js/TresJS for the client.
- PostgreSQL as canonical storage, Kafka for ordered event ingestion, Redis for rebuildable live state, and RabbitMQ for background jobs.
- Configurable, evidence-grounded LLM integration with honest fallback behavior.

## Project documents

- [Engineering roadmap](docs/ROADMAP.md) — scope, acceptance criteria and progress.
- [Current architecture](docs/ARCHITECTURE.md) — implemented vs planned boundaries.
- [Decisions](docs/DECISIONS.md) — toolchain and licensing decisions.
- [Blockers](docs/BLOCKERS.md) — outstanding verification requirements.
- [Setup guide](docs/runbooks/SETUP.md) — installation, checks and troubleshooting.

## License

No open-source license is granted at this stage (`UNLICENSED`). The owner can choose a license before public distribution; dependency and data licenses remain separate obligations.

## Matchday fixtures and the interactive stadium

Open **/** for the stadium, **/matches** for matchday fixtures, **/system** for API readiness, and **/design-system** for reusable components. Choose **Build-up**, **Switch play**, or **Finish** to show an authored tactical sequence. These plays are hypothetical; they are independent of provider scores. Reduced-motion and no-WebGL browsers can choose the same plays on a static pitch.

To enable real fixtures, register for a free [football-data.org API key](https://www.football-data.org/client/register) and add this line to the **repository-root, Git-ignored `.env`** next to `Cargo.toml`:

```dotenv
FOOTBALL_DATA_API_KEY=your-token-here
```

Restart the Rust API. No frontend rebuild or provider switch is needed. Never place this token in `apps/web/.env`, any `VITE_*` variable, or a tracked file. On a server set the same variable in the API process's secrets configuration. Without it, the API serves two labeled fictional fixtures. With it, the match centre shows today's UTC matches from football-data.org, including an honest empty state on quiet days. The [free tier](https://www.football-data.org/pricing) offers delayed results, not real-time tracking.

## One-command startup

Use the pinned Node version (`nvm use`), then run `npm run dev` from the repository root. The root `dev.mjs` creates `.env` only if absent, starts Docker Desktop on macOS if needed, starts PostgreSQL/Redis, installs missing web dependencies, builds Rust, applies migrations/demo seed, waits for API readiness and starts Vue. Ctrl-C stops the host processes and keeps database data. Existing local configuration is preserved.

Kafka and RabbitMQ are optional messaging services until their processing milestones; default startup stops existing project broker containers to free resources. `npm run dev:full` starts them too. `npm run dev:stop` stops all project containers without deleting volumes. First startup downloads dependencies/builds Rust; subsequent launches reuse caches. Broker health failures no longer block the default app.

If Node selection fails, run `nvm install 24 && nvm use 24`, then `npm run dev`. The project accepts Node 24 patch releases; an exact patch installation is not required.

## Rolling simulated football kit

The local `pitchpulse-data` kit supplies an always-active synthetic match schedule. `npm run dev` starts its loopback service and the Rust adapter exposes `/api/v1/football/*`. Visit `/matches` for the rolling calendar and Match Center with events, lineups, evidence lookup and deterministic 2D/3D ball replay. All scores, players and tracking are synthetic.

This is the first provider/Match Center increment. Kafka ingestion, persisted projections, Redis live state, WebSocket recovery, computed ratings and fantasy/prediction settlement are not yet implemented by this integration. See `docs/data-sources/rolling-provider.md` for actual boundaries and remaining work.
