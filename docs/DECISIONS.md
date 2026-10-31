# Engineering decisions

## 2026-10-31 — Environment baseline

Pin Rust 1.99.1 in `rust-toolchain.toml`, Node 24.22.1 in `.nvmrc`, and pnpm 11.25.0 in `package.json`. These are available versions verified for the setup work. Node 24 is an LTS line; this is a reproducible baseline, not a claim that these are the latest patches. Upgrade pins deliberately and rerun checks.

Use rustup's minimal profile with rustfmt, Clippy, rust-analyzer and rust-src. Use an exact pnpm installation as the documented alternative to Corepack. Keep application dependencies and workspace scaffolding for Step 02.

The prerequisite script diagnoses the active PATH rather than changing the user's global defaults. macOS Bash 3.2, Linux Bash and WSL2 Bash are supported. Docker must have a reachable engine, not merely an installed CLI. GitHub authentication is not required for local development.

## 2026-10-31 — License

Retain default copyright protection: no open-source grant, package marked `UNLICENSED`. Do not choose a permissive license on behalf of the owner. This is an explicit interim license decision; a public release requires the owner's choice. Never assume a code license covers football data or news content.

## 2026-10-31 — Scope and configuration

Step 01 provided setup only. Step 02 implements and validates the API configuration from `.env.example`; credentials and public frontend settings remain separated. No secrets or paid accounts are needed for the planned mock mode. Editor recommendations are portable configuration, not evidence that extensions are installed.

## 2026-10-31 — Workspace boundaries

See [ADR-0001](adr/0001-step-02-workspace.md) for the implementation boundaries, health semantics, worker bootstrap scope, and local infrastructure choices. All direct Rust/frontend versions and transitive lockfiles are committed for reproducibility.
