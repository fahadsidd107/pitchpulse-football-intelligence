# Rolling provider integration — increment 1

The kit in `pitchpulse-data` is a local reference provider, not an implementation of the application's ratings, fantasy or simulation engines. The Rust API owns the boundary `/api/v1/football/*` and permits explicit read resources only; upstream remains loopback port 8089, redirects are disabled, request duration is bounded, and response provenance is validated. Vue must not call Python directly.

`APP_DATA_MODE=mock` selects the rolling synthetic service. Other values fail explicitly at this boundary until a compatible real adapter exists. `npm run dev` starts the reference service as a child and waits for health. It is bound to loopback. The legacy football-data.org matchday endpoint remains a separate earlier implementation pending full unification; it is not treated as equivalent tracking coverage.

Reference generator tests passed: 9 cases for calendar coverage, midnight/year/leap-day boundaries, score/event agreement, full tracking availability and deterministic replay. The ISO-week parser was corrected for Python versions that do not accept trailing Z in datetime.fromisoformat.

## Outstanding processing increments

Kafka publication and consumer idempotency, PostgreSQL import/projections, Redis snapshots and WebSocket resynchronization are not yet implemented by this bridge. They must replace transient reference-provider reads before this is described as the complete event architecture. The presence of kit fantasy/ratings/news lists does not establish settlement, scoring, AI generation or persistence. Those must pass their roadmap milestones independently.

## Match Center increment

`/matches` now uses the Rust boundary for active fixtures, UTC calendar filtering, events, lineups/squads, statistics, tracking and AI context. Replay controls seek a deterministic coordinate sequence and rebuild score from goal events; the optional 3D view consumes the same normalized points as the static pitch. Statistics are explicitly full-fixture examples, not time-window observations. Evidence retrieval is a deterministic lookup, not a model-generated answer.

Current transport polls every five seconds; Kafka/Redis/WebSocket delivery is still an outstanding increment. Verified: the local HTTP reference service returns an active simulated fixture; 9 kit tests and 8 Rust API tests passed. Final frontend checks and browser acceptance remain pending.

## Event pipeline implementation update

The Rust ingest worker now publishes keyed fixture, event, tracking and computed envelopes to `pitchpulse.football.v1`. The consumer uses `football_messages.event_id` uniqueness and transactional snapshot updates, persists computed output, updates expiring Redis snapshots, then commits Kafka offsets. Duplicate delivery repairs Redis without duplicating PostgreSQL messages. WebSockets send full committed snapshots and monotonic revisions; Vue validates fixture identity/revisions, reconnects and uses HTTP fallback visibly. The gateway currently reads canonical PostgreSQL snapshots; Redis is maintained as an expendable active-state cache. Reference data is still used for full deterministic replay details.

Verified locally: populated event/snapshot/computed tables, active Redis keys, actual browser WebSocket transport, 42 passing browser acceptance tests and 17 frontend unit tests. Workspace compilation and tests passed. CMake was installed for the Kafka native client. Fixed IPv4 Kafka resolution and launcher conflicts with already-running provider/API/web ports.

## Scoring limits

`demo-event-v1` computes position-weighted goal/assist/card point contributions and shrunk event-based ratings. Minutes are an illustrative clock-based proxy, explicitly unverified; no appearance/clean-sheet fantasy points are awarded by this preview. Prediction scores use 5 for exact result and 2 for correct outcome and are previews until a terminal fixture. This does not implement user-entry deadlines, validated fantasy rosters, captain rules, append-only correction settlement or full position-specific statistical models. Those remain unfinished business-engine work, not implied complete by the transport integration.

## Kit catalogue wiring fix

The homepage previously still mounted the older Founders Cup matchday board and the general catalogue used a separate small fictional seed. Both have been replaced: homepage now mounts the rolling Match Center; catalogue rows are generated from pitchpulse-data using scripts/sync-kit-catalogue.py. That sync runs on npm run dev. Bundled fallback and Rust catalogue responses share these same rows, including all 43 competitions, 734 clubs and 19,818 synthetic players. The UI rejects legacy MOCK responses without the kit source marker, so a stale API cannot replace kit rows with the old league. Search covers the full collection; list rendering is paged in increments of 50.

Verified: 17 frontend tests, TypeScript/build and Rust API compilation passed.
