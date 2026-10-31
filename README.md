# PitchPulse — The Game, Decoded.

A planned football intelligence platform combining match coverage, grounded AI text/voice Q&A, pitch visualization, explainable player ratings, scouting and historical comparisons, deterministic dream-team simulations, and two non-monetary fantasy modes (season squads and matchday predictions). News, transfers, favourites and notifications round out the product.

Development starts with deterministic fictional demo data. Recorded tracking, reconstructed movement and simulated matches must always have distinct provenance labels; licensed live feeds can be added later.

## Current state

This repository contains the environment scaffold and setup diagnostics for roadmap Step 01. No API, Vue application, database schema or Docker Compose stack exists yet. Those begin in Step 02. See [roadmap progress](docs/ROADMAP.md#6-milestone-checklist-and-progress) for verified completion status.

## Get started

Follow the [macOS, Linux and Windows setup guide](docs/runbooks/SETUP.md), select the pinned tool versions, start Docker, then run:

```bash
bash scripts/check-prerequisites
cp .env.example .env
```

The checker reports every missing tool and exits nonzero on required failures. Use `--strict-git` to also require a clean working tree. Replace local credential placeholders before services are introduced; provider/AI credentials are optional for demo development.

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
