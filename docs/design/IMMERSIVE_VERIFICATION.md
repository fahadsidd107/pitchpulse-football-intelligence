# Football, Alive — verification

## Implemented experience

- Brief tunnel-to-pitch camera sequence, once per tab session, skip/pause controls, pointer-linked lights and scroll depth. The homepage overlay uses the Match Center's fetched fixture rather than inventing another match.
- Source-event score/status effects with guards against initial state, fixture changes, backwards time, replay seeks and stopped playback. Goal trails use recorded synthetic samples; penalty highlighting requires a source coordinate. Lineups apply source substitution IDs up to the shared playback cursor.
- Local microphone analyser, explicit start/stop and permission error path; contextual evidence requests and timestamp links. No audio recording, model call or speech transcription is claimed.
- Synthetic player attribute comparison on a fixed 0–100 scale; formation dragging/keyboard arrows/sliders and optional Three preview; simulation animation consumes one deterministic event ledger, with skip-to-final/static alternatives.
- Source-valued fantasy sorting/delta transitions; fiction-labeled editorial/transfer styling and a user-editable hypothetical competition bracket. Bracket choices are local hypotheses, not official competition results.
- Locally bundled Inter/Space Grotesk, shared motion timing, visibility/reduced-motion cleanup and responsive provenance wrapping.

## Measurements and checks

Measured on local development Chromium, not a production SLA: desktop first-contentful-paint 96 ms, reduced-motion mobile 88 ms in one warm local sample; no page errors; no horizontal overflow. Desktop rendered one 3D canvas and completed arrival; reduced-motion mobile rendered no canvas and retained a static pitch. No 60 FPS or low-end-device guarantee is inferred from these readings.

Build before redesign loaded 3,002.80 KB raw entry JS. Section-lazy dataset optimization reduced the entry to approximately 165 KB raw / 63 KB gzip with the new motion features. Three/Tres remains separately loaded (~209 KB gzip), and the large synthetic player dataset remains a separate on-demand section chunk. Device profiles beyond local Chromium emulation remain unverified.

First run: 76/78 passed; fixed tablet overflow. Expanded run: 84/87 passed; fixed formation control accessible name, then all 3 formation cases passed. Unit suite: 20 passed; lint/typecheck/build passed. Final combined rerun results recorded in the session update.

## Existing product limits preserved

This is a frontend experience upgrade. It does not replace current backend contracts, introduce voice transcription, validate real-world squads, turn illustrative fantasy into settled user contests, or upgrade the browser demo simulator to a production Rust engine. All such boundaries remain visible. User-generated tactical markers, hypothetical brackets and demo scores remain labeled.

## Final acceptance result

Final complete browser suite: **87/87 passed** across desktop/tablet/mobile, including accessibility audits on every major route, microphone denial, source-preserving replay seeks, formation keyboard editing, deterministic simulation results and fantasy point-preserving sorting. Desktop/mobile screenshots were visually inspected. Independent design evaluation was requested separately; its verdict is not assumed by the automated result.

## Continuation verification — 2026-11-26

The earlier 87/87 result above is historical. Fresh checks passed ESLint, TypeScript, all 20 unit tests and the production build. A frontend-only browser run passed 70/75 checks; the fantasy checks lacked a running provider, and search checks encountered local storage exhaustion. A subsequent serial search run reported `ENOSPC` while saving browser artifacts. After recovering space, all three search checks passed across desktop/tablet/mobile. Fresh desktop and mobile screenshots were captured; the desktop WebGL stadium rendered correctly. These results do not establish a fresh full-stack acceptance pass.

The local startup attempt failed inside Docker with an input/output error writing `/var/lib/docker/network/files/local-kv.db`. The host reported only 137 MiB available. Removing the redundant full Chromium browser downloaded during this check recovered roughly 366 MiB; the headless test browser was retained. No application data or Docker volumes were deleted. Free additional host disk space and restore Docker health before rerunning full-stack acceptance with `npm run dev` and `pnpm --dir apps/web test:e2e`.

Use the installed nvm Node 24 (`nvm use 24`); the current Homebrew Node executable has a missing simdjson library. Corepack shims were enabled for nvm Node 24.22.2 and pnpm 11.25.0 was verified. Independent design evaluation could not be completed; no independent PASS is claimed.

## Iconic football revision — 2026-11-26

User feedback required a more obvious three-dimensional identity. The homepage now opens directly on a large procedural football with pentagonal/hexagonal panels above the stadium. Camera and lighting respond to the pointer; a native keyboard/touch-accessible kick action animates the illustrative ball. The earlier tunnel entrance was replaced by this immediate view. A perspective field and orbital background extend behind the site. Shared link/button hover, focus, press and bounded click pulses retain native navigation and actions; feature cards lift on hover/focus.

The implementation passed lint, TypeScript, production build, 20 unit tests and 36 focused desktop/tablet/mobile browser checks. Root smoke checks observed no page errors or mobile overflow; ordinary clicks emitted feedback, and reduced-motion navigation loaded zero PitchScene modules and emitted zero animated pulses. Reduced-motion/WebGL fallback retains a sculptural football. These are frontend results; they do not constitute new Kafka/database/live-provider acceptance. Decorative actions never create fixture incidents or scores.

Independent design review returned PASS after fresh 1440/768/390-width browser captures and kick/pause/reduced-motion checks. It confirmed visible three-dimensional identity, readable typography, fitting controls and no observed overflow/page errors. This is an independent review using an available OpenAI model; a different-provider evaluator was unavailable. The offline backend remains outside that verdict.

### Mouse-hover follow-up

Fine-pointer movement now drives a clamped 3.5-degree feature-card tilt, surface spotlights, link underlines and enhanced football/ring lighting, scale and rotation. Effects reset on leave, scroll, blur, hidden state, navigation and motion preference changes. Touch/coarse pointers and reduced-motion users retain static feedback without card tilt. Lint, TypeScript, build and 20 unit tests passed; 8 focused browser checks passed with 1 deliberate fine-pointer-only mobile skip. Fresh desktop hover and mobile screenshots were captured.

Independent hover review returned PASS after verifying visible card tilt/spotlight and reset, animated link underlines, native navigation, reduced-motion suppression and mobile kick usability without observed overflow or page errors.
