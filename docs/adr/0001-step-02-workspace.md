# ADR-0001: Step 02 workspace and local service boundaries

Status: Accepted
Date: 2026-10-31
Related roadmap step: 02

## Context

The roadmap requests API, ingestion, event-consumer and job-worker executables. The architecture's initial deployment sketch names three executables and uses different shared-crate names. Both require a modular monolith, explicit provenance and incremental implementation.

## Decision

Use the architecture's `domain`, `application` and `infrastructure` crate names, plus `shared` for config/telemetry. Scaffold all four executable targets requested by the roadmap; only the API serves traffic in this step. Worker targets validate configuration and respond to termination signals, explicitly logging `processing_enabled=false`. No Kafka consumer or job handler is claimed yet. Separate worker deployment is deferred until its corresponding event/job milestone, when a scaling or fault-isolation case can be assessed.

The working vertical slice is Vue → versioned system metadata/readiness → SQLx `SELECT 1` against PostgreSQL. `/health` and `/health/live` test process responsiveness only; readiness requires PostgreSQL. Kafka, RabbitMQ and Redis have Compose health checks but are not API dependencies before features consume them. Do not make the API unready for an unused broker.

Pinia owns the status request state. No Redux, Zustand, React, Three.js scene or football fixtures are introduced in Step 02. `MOCK` matches the architecture contract; future provider records will require explicit versioned schemas.

Compose uses exact image tags, named volumes and localhost-bound ports. PostgreSQL uses host port 5433 to avoid native installations on 5432. Credentials come from ignored `.env`; the committed example contains placeholders. This is a single-machine development environment, not production hosting.

## Alternatives

One deployed service per crate adds networking and operational complexity without a need. Omitting the event-consumer target would silently diverge from the roadmap. Making readiness require every planned component would cause unnecessary API outages.

## Consequences

The code remains small and buildable, with real database connectivity and a usable browser health check. Worker business processing, migrations, auth and event contracts remain explicit later milestones. Rust and frontend dependencies are locked; updates require the check suite.

## Migration/rollback

Future consumer logic can be embedded or deployed independently without changing the framework-free domain. Remove unused worker targets if a later ADR consolidates deployment. Compose teardown preserves named volumes unless an operator explicitly requests their deletion.

## Validation

Rust unit/router tests, frontend tests, real PostgreSQL readiness, browser connection/retry tests and Compose health checks verify this boundary. CI executes the same local check commands and real-service browser tests.
