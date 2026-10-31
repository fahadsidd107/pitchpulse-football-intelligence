# Architecture

## Implemented at Step 01

The repository contains toolchain pins, editor conventions, a placeholder-only environment template, installation instructions and a read-only prerequisite checker. The package manifest is private tooling metadata, not a Vue application.

There are no running project services, API contracts, database migrations, event schemas or deployment artifacts yet. The architecture diagrams in [ROADMAP.md](ROADMAP.md#21-component-architecture) describe the target, not implemented components.

## Next boundary: Step 02

Create the Rust workspace (Axum API and workers plus shared crates), Vue client and local Docker Compose infrastructure. The first executable slice is a backend health endpoint fetched by Vue, with configuration, tracing and validation scripts.

Longer term, PostgreSQL owns durable records; Kafka transports normalized fixture events; Redis holds rebuildable snapshots; RabbitMQ dispatches retryable jobs. Vue consumes versioned REST/WebSocket contracts. Every football record must preserve provenance, timestamps and capability metadata; AI receives only authorized evidence.

Deployment requires persistent Rust/worker hosting and durable infrastructure. A static frontend host alone cannot run the complete system. No runtime port is opened by the Step 01 scaffold.
