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
