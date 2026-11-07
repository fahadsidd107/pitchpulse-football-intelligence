# Step 04 local database

Start Compose then run `bash scripts/database`. The initial migration uses a transaction, advisory lock and schema version record; the deterministic demo seed runs in a separate transaction and can be repeated safely. Run `python3 scripts/verify-database.py` for an isolated-schema migrate/seed/query/constraint/down/up/reseed check; its transaction rolls back without affecting application data.

Foreign keys enforce relationships, times are timestamptz in UTC, fixture/event revision constraints preserve corrections, and provider IDs have a composite uniqueness constraint. Future mutations and their event_outbox rows must share one transaction; broker publishing will mark published_at only after acknowledgment. The outbox index covers unpublished rows. No event publisher is claimed yet.

The seed contains two competitions, eight clubs, 120 player-season rows, twenty fixtures and representative lineups/events/statistics. Additional seeded catalogue sections demonstrate future ratings, fantasy, news, scouting and notifications. They are fictional examples, not production engines or authenticated accounts.

With FOOTBALL_DATA_API_KEY in root .env and the API restarted, matchday and supported competitions/clubs/scorers sections fetch real delayed provider rows; sample rows are excluded from those responses. Other domains retain explicit MOCK provenance because the free source does not implement AI, fantasy or simulations. A provider failure is shown as a failure, never replaced with disguised mock data.
