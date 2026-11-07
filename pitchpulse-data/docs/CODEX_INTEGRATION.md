# Codex integration instructions — PitchPulse two-week rolling mock provider

Read the repository's `ROADMAP.md` and `ARCHITECTURE.md`, then inspect this mock package. Treat this package as a **development data adapter**, not a replacement architecture.

## Implement in this order

1. Preserve the Rust Axum backend / Vue frontend / PostgreSQL / Kafka / RabbitMQ / Redis service boundaries.
2. Build an `MockFootballProvider` Rust adapter for the response contracts documented in `README.md`. Validate event versions and normalize IDs, timestamps and coordinates.
3. Add an `APP_DATA_MODE=mock|real` option. `real` must fail clearly if real credentials are not configured; never silently relabel mock data as live.
4. Import competitions, clubs, squads and history through the existing Rust ingestion pipeline, respecting the unverified roster flags. Maintain stable provider-ID mappings.
5. Start the rolling calendar + always-on showcase at runtime. Generate the schedule from UTC every week; don't freeze it to an installation date. The current package is a reference implementation; port the algorithms to Rust or connect through the provider adapter.
6. Emit normalized Kafka fixture/event/tracking messages. Use stable event IDs and idempotent consumers; handle corrections and restarts.
7. Store match history in PostgreSQL; maintain active match read-model snapshots in Redis. Provide SSE/WebSocket live-state to the Vue Match Center.
8. Feed tracking coordinates into the existing Three.js/TresJS pitch renderer. Interpolate between points without asserting historical authenticity. The pitch should show virtual live playback at any hour.
9. Expose complete competition, division, teams/squads, player, standings, ranking, scouting, calendar, news, transfer, fantasy, prediction and simulation pages. Do not invent functionality merely because a fixture JSON exists; implement actual Rust services and persistence for users and scoring.
10. For the AI voice analyst, ground answers in `ai-context` data, make real model calls only when credentials are present, and use a transparent deterministic fact-lookup fallback otherwise. Do not present canned generated commentary as actual live AI.
11. Test Friday–Sunday domestic slots, Tuesday–Wednesday UCL slots, Thursday UEL/UECL slots and the always-on rotation across time zones and month/year boundaries.
12. Surface `data_mode`, provenance and `SIMULATED DEMO` indicators to the frontend and README; never fabricate real live football activity.
13. Implement meaningful rating, fantasy and prediction engines and validate against deterministic fixtures. Existing lists are illustrative examples, not computed products.
14. Run unit, integration, load and end-to-end tests; update `ROADMAP.md` and `ARCHITECTURE.md` with the implemented adapter and boundary decisions.

## Acceptance checks

- Visitors see at least one active simulated fixture at any server time.
- Two future weekends and two UEFA midweeks can be browsed.
- All competition categories listed in the main README are discoverable.
- A match page has synced clock, score, goals, substitutions, stats, squads, tracking and event replay.
- Every generated fixture yields coordinate samples when requested, without pre-creating massive tracking JSON blobs.
- Mock/real adapter switching doesn't change frontend contracts.
- No user is misled that fictional incidents or transfer rumours occurred in real life.
- The demo is usable without a football API key or model key (AI generation remains unavailable without a model or documented local alternative).
