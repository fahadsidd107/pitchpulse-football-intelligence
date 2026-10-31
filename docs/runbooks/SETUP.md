# Developer setup — Step 01

## Pinned baseline

| Tool | Project baseline |
|---|---|
| Rust | 1.99.1 via rustup; rustfmt, Clippy, rust-analyzer, rust-src |
| Node.js | 24.22.1 (LTS line), `.nvmrc` |
| pnpm | 11.25.0, `package.json` |
| Git / GitHub CLI | Verified with Git 2.50.1 / gh 2.88.1 |
| Docker / Compose | Verified with Engine 28.3.2 / Compose 2.38.2 |
| PostgreSQL client | Verified with psql 14.20; select server/client major together in Step 02 |
| Shell | Bash 3.2+; Windows uses WSL2 |

Git, gh, Docker and psql versions above are observations, not exact constraints. PostgreSQL backup tools should match the eventual server major. No database server is required until Step 02.

Official references: [Rust installation](https://rust-lang.org/tools/install/), [rustup toolchain files](https://rust-lang.github.io/rustup/overrides.html#the-toolchain-file), [Node release support](https://github.com/nodejs/Release#release-schedule), [pnpm installation](https://pnpm.io/installation), [Docker installation](https://docs.docker.com/engine/install/), [PostgreSQL downloads](https://www.postgresql.org/download/), [GitHub CLI](https://cli.github.com/).

## macOS

1. Install Xcode Command Line Tools with `xcode-select --install` if absent (Rust needs a linker).
2. Install rustup using the official installer, then activate it:

   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs -o /tmp/rustup-init.sh
   sh /tmp/rustup-init.sh -y --profile minimal --no-modify-path
   . "$HOME/.cargo/env"
   rustup toolchain install 1.99.1 --profile minimal --component rustfmt,clippy,rust-analyzer,rust-src
   ```

3. Install Node 24.22.1 using your existing Node version manager. For nvm, run `nvm install` then `nvm use` from the repository. With Homebrew Node 24 already installed, `export PATH="$(brew --prefix node@24)/bin:$PATH"` selects it; verify the exact version against `.nvmrc` (Homebrew may supply a newer patch).
4. With the selected Node active, run `npm install --global pnpm@11.25.0`. This exact install is the supported alternative to Corepack; do not install an unpinned `latest`.
5. Install Git, GitHub CLI and PostgreSQL clients (for example Homebrew `git`, `gh`, `libpq`). If libpq is keg-only: `export PATH="$(brew --prefix libpq)/bin:$PATH"`.
6. Install and launch Docker Desktop. Finish any first-launch setup, then verify `docker info` and `docker compose version`.

Shell exports apply to the current terminal only. Add the appropriate rustup/Node activation to your shell profile yourself if desired. Avoid replacing other projects' Node defaults.

## Linux

1. Install Git, curl, CA certificates and a C build toolchain with your distribution package manager (Debian/Ubuntu: `git curl ca-certificates build-essential`).
2. Install rustup and the pinned components using the macOS commands above; select Node with nvm or the official versioned Node distribution, and install the pinned pnpm.
3. Install gh using its official distribution instructions, and PostgreSQL client packages (`postgresql-client` on Debian/Ubuntu).
4. Install Docker Engine and the Compose plugin following Docker's instructions for your distribution. Start the daemon; use rootless Docker or an appropriately authorized user. Docker socket/group access grants significant host privileges; never make the socket world-writable.

## Windows

Use WSL2 with Ubuntu for this repository's Bash scripts and Rust/Node tools. Install Docker Desktop on Windows and enable integration with that WSL distribution. Follow the Linux instructions **inside WSL**, and keep the clone in its Linux filesystem for file permissions and performance. Do not mix Windows Node installations with WSL pnpm or Rust. Native Windows is not verified by this script; native Rust additionally requires the MSVC C++ build tools.

## Editor and optional GUI

Open this folder in a VS Code-compatible editor and install the workspace recommendations: `rust-lang.rust-analyzer`, `Vue.volar`, `bradlc.vscode-tailwindcss`, and `EditorConfig.EditorConfig`. In VS Code these can be installed with:

```bash
code --install-extension rust-lang.rust-analyzer
code --install-extension Vue.volar
code --install-extension bradlc.vscode-tailwindcss
code --install-extension EditorConfig.EditorConfig
code --list-extensions
```

Other editors can use the rustup-provided rust-analyzer and Vue/Tailwind language servers. Rust workspace diagnostics and Vue/Tailwind integration become usable once Step 02 creates their manifests. A PostgreSQL GUI such as DBeaver or pgAdmin is optional; `psql` is the required client.

## Fresh-machine acceptance checklist

- [ ] Clone the repository and verify `main` exists (`git show-ref --verify refs/heads/main`).
- [ ] Install/select pinned Rust, Node and pnpm, plus Git, gh, psql and Docker Compose.
- [ ] Start Docker and confirm `docker info` succeeds in your terminal.
- [ ] Install/verify applicable editor recommendations.
- [ ] Run `bash scripts/check-prerequisites --strict-git`; all required checks pass.
- [ ] Copy `.env.example` to `.env`; replace placeholders before starting future services. Keep AI/provider keys blank in mock mode.
- [ ] Verify `git check-ignore .env` reports `.env`; never commit local credentials.

The checker is read-only and reports all failures instead of stopping at the first. It does not authenticate accounts, install tools, print `.env` content or launch containers. Credential filename checking is a guardrail, not a complete secret scan. Without `--strict-git`, intentional working changes produce a warning rather than an environment failure.

## Troubleshooting

- **Node 18 or an unexpected pnpm:** inspect `command -v node` and `command -v pnpm`; activate the pinned Node and reopen the terminal or run `hash -r`.
- **Rust command not found:** source `$HOME/.cargo/env`. If an override selects another compiler, inspect `rustup show`; the checker requires the repository pin.
- **Docker installed but unavailable:** start Docker Desktop/Engine, inspect `docker context show`, and check socket permissions. A sandbox may need explicit permission even when Docker is healthy.
- **pnpm/Corepack signature errors:** use the documented exact npm install or update Corepack through its official instructions, then verify the pnpm pin.
- **psql missing:** add the PostgreSQL client's bin directory to PATH; a GUI is not a CLI replacement.
- **Broken `code` shortcut:** reinstall the editor's shell command from its command palette, or install recommended extensions through its UI.
- **Corporate proxy/network errors:** configure approved proxy/CA settings; do not disable TLS verification.
- **Dirty Git tree:** inspect `git status --short`, review changes and commit only intended files. The checker never deletes or resets your work.

There is no application demo yet. `docker compose up`, Cargo workspace checks and Vue builds belong to Step 02 and will fail until that implementation exists.
