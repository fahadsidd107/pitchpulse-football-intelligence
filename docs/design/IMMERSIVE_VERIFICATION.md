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
