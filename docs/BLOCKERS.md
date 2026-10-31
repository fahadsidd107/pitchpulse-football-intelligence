# Outstanding acceptance items

## Step 01 — Clean-tree acceptance

The toolchain and Docker readiness checks passed on macOS on 2026-10-31 after selecting the pinned tools. Rust also compiled and executed a temporary smoke program.

- Resolved: installed extension manifests verified for rust-lang.rust-analyzer 0.3.3097, Vue.volar 3.3.14 and bradlc.vscode-tailwindcss 0.16.0. The optional `code` shell launcher still points to a missing temporary application; extension installation was verified directly and does not depend on that shortcut.
- The working tree is not clean: the session began with a modified tracked `.DS_Store`. Configuration files and that metadata change were committed externally during this session (`b6e9230`); the remaining documentation edits still need review/commit before strict acceptance. No user changes were reset.
- A genuinely separate fresh-machine installation has not been performed. The local checker and isolated diagnostic scenarios were exercised; Linux/WSL instructions have not been executed on those operating systems.

Step 01 remains IN PROGRESS rather than claiming its acceptance criteria passed. Next command after resolving these items: `bash scripts/check-prerequisites --strict-git` with the documented pinned-tool PATH active.

Live provider credentials and paid ball-tracking access are not blockers for subsequent mock development. No runtime or deployment is claimed.
