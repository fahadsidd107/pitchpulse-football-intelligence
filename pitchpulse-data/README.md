# PitchPulse — Always-On Two-Week Football Mock Data Kit

**Status: functional, self-contained simulated data API. No football-provider key required.**

This is a local development adapter, **not a source of real 2026–27 fixture results, squads, player identities, transfers, or live ball positions**. All generated match scores, match incidents, tracks, roster players and news are illustrative and clearly identified as simulated. Recognizable club names help test navigation but their 2026 league assignments are not verified.

## Quick start

```bash
cd pitchpulse-two-week-demo
python3 scripts/mock_server.py
```

Open **http://localhost:8089/demo** for a basic browser preview of the real HTTP data flow and animated 2D ball replay. The actual PitchPulse frontend should render this data through Vue + TresJS/Three.js.

Python 3.10+ standard library is sufficient. No pip installs, API credentials, or database setup required for the standalone mock service.

## Scale and date behavior

- 43 competitions; 734 club records; 19,818 synthetic player records sourced from the previous PitchPulse demonstration kit.
- 30 men's domestic divisions across ten European countries, plus five women's domestic leagues, Champions League, Europa League, Conference League, UEFA Women's Champions League, UEFA Super Cup, Saudi Pro League, Qatar Stars League and MLS.
- **Rolling calendar** covers last week, this week, next week and one more week, so two complete upcoming weekends and their UEFA midweeks are always available.
- Friday–Sunday domestic matches; Tuesday–Wednesday Champions League; Thursday Europa/Conference; Wednesday Women's Champions League.
- 90-minute **always-on** fantasy fixture rotation ensures that `GET /api/v1/live` returns simulated active fixtures at any hour, even during genuine match-free periods. This rotation is explicitly synthetic, not alleged real fixtures.
- **On-demand, five-second ball trajectories for every generated fixture**. Tracking is computed deterministically by fixture ID; no thousands of bulky coordinate JSON files. The path is **synthetic illustrative movement**, not realistic optical tracking or authentic event-level ball provenance.
- Realistic-ish generated match events include goals, shots, bookings, substitutions, fouls, halftime, and occasional penalty incidents; goal scores are consistent with generated goal events.
- Dataset stays useful throughout future dates: live status and scheduled dates derive from server UTC time, not a frozen JSON export.

## Main HTTP endpoints

| Endpoint | Description |
|---|---|
| `GET /health` | Mock server health |
| `GET /api/v1/mock/manifest` | Scope / provenance |
| `GET /api/v1/mock/clock` | Demonstration clock |
| `GET /api/v1/mock/showcase` | Always-on live demo fixtures |
| `GET /api/v1/home` | Aggregated homepage sections |
| `GET /api/v1/live` | Rotating active match feeds |
| `GET /api/v1/competitions` | Competitions / divisions |
| `GET /api/v1/competitions/:id/clubs` | Clubs in division |
| `GET /api/v1/competitions/:id/fixtures` | Competition fixtures |
| `GET /api/v1/competitions/:id/standings` | Simulated standings |
| `GET /api/v1/clubs` | Searchable clubs |
| `GET /api/v1/clubs/:id/squad` | Synthetic illustrative 2026–27-style roster |
| `GET /api/v1/clubs/:id/fixtures` | Club schedule |
| `GET /api/v1/players` | Searchable synthetic players |
| `GET /api/v1/fixtures?from=YYYY-MM-DD&to=YYYY-MM-DD` | Calendar-based fixture listing |
| `GET /api/v1/fixtures?status=live_demo` | Currently simulated active matches |
| `GET /api/v1/fixtures/:id/live-state` | Current clock, score, state |
| `GET /api/v1/fixtures/:id/events` | Full event timeline |
| `GET /api/v1/fixtures/:id/lineups` | Starting XI and bench |
| `GET /api/v1/fixtures/:id/statistics` | Simulated stats |
| `GET /api/v1/fixtures/:id/tracking?start=0&end=5400&step=5` | Timestamped synthetic normalized X/Y ball positions |
| `GET /api/v1/fixtures/:id/stream?speed=120` | Replay using Server-Sent Events |
| `GET /api/v1/fixtures/:id/ai-context` | Structured fixture/evidence payload for grounding the AI analyst |
| `GET /api/v1/rankings` | Illustrative player ratings |
| `GET /api/v1/scout` | Illustrative scouting attributes |
| `GET /api/v1/news` | Fictitious clearly labeled news entries |
| `GET /api/v1/transfers` | Fictitious clearly labeled transfer updates |
| `GET /api/v1/fantasy` | Illustrative fantasy teams / standings |
| `GET /api/v1/predictions` | Illustrative prediction picks |
| `GET /api/v1/simulations` | Illustrative saved simulation record |

Paginated list routes support `page` and `limit`; clubs/players support `q`. Some support `competition`, `club`, `gender` or `status`.

Example:

```bash
curl -s 'http://localhost:8089/api/v1/live' | python3 -m json.tool
curl -s 'http://localhost:8089/api/v1/fixtures?competition=uefa-ucl&limit=10' | python3 -m json.tool
curl -s 'http://localhost:8089/api/v1/clubs/eng-d1-1-01/squad' | python3 -m json.tool
```

Get a fixture ID from `/api/v1/live`, then:

```bash
FIXTURE_ID='REPLACE_WITH_ID_FROM_LIVE'
curl -s "http://localhost:8089/api/v1/fixtures/$FIXTURE_ID/tracking?start=0&end=180&step=5" | python3 -m json.tool
curl -N "http://localhost:8089/api/v1/fixtures/$FIXTURE_ID/stream?speed=180"
```

## Rust integration contract

Implement `FootballProvider` trait with `MockJsonProvider` or `MockHttpProvider`, behind the same domain-level methods as a future paid provider. Prefer **Rust ingestion -> normalization -> Kafka -> consumers -> PostgreSQL/Redis -> WebSocket -> Vue + Three.js**; do not connect this development server directly to all frontend components long-term.

The mock API exists to test integration, not replace:
- Rust rating engine
- Rust deterministic tactical match simulator
- PostgreSQL source-of-truth modeling
- Kafka event delivery and consumer recovery
- RabbitMQ work queues
- Redis live snapshots
- Real user accounts, user-generated predictions or fantasy scoring
- AI model calls and speech recognition

Keep provenance (`data_mode=simulated`, `is_real_live_data=false`) from ingestion to UI. Display a discreet but visible **SIMULATED DEMO** indication. A compelling, polished product is compatible with being transparent about data origin.

## Important limitations

1. Sample footballer names, club membership, standings and player attributes are fabricated. **Do not market this dataset as true 2026 squads.**
2. These data do not have commercial redistribution rights for official league logos or player photos. Provide such media only through properly licensed sources.
3. Event generation is illustrative. The coordinate generator does not prove actual tactical realism, player-level tracking, or measured xG.
4. Demo news and transfers must not be presented as verified breaking news.
5. The always-on matches intentionally include fictional kickoffs outside authentic league schedules to guarantee testable 'live' functionality around the clock.
6. The standalone demo API is a lightweight development service, not a hardened production web server. Production should use the Rust/Axum implementation described in `ARCHITECTURE.md`.

## Testing

```bash
python3 -m unittest discover -s tests -v
```

See `docs/CODEX_INTEGRATION.md` for recommended implementation steps.
