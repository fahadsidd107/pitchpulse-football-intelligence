# Football, Alive — implementation inventory

## Starting audit

The original hero rendered an on-demand miniature stadium, updating its group rotation via a 30 Hz interval. Geometry/material disposal, visibility unmount, reduced-motion SVG and pause controls existed. The same page loaded a full bundled catalogue (~3 MB uncompressed entry, ~316 KB gzip before this phase) and dynamically imported Three/Tres (~209 KB gzip). Match Center already shared a single replay clock across score, incident timeline and normalized 2D/3D tracking; socket snapshots and HTTP fallback were implemented. Catalogue sections shared one generic list/detail layout. Fonts used a system stack.

## Directive and authority

This is a frontend-only enhancement. API snapshots, event logs and simulation output remain authoritative. Motion cannot invent a goal, player coordinate, rating, leaderboard point or AI answer. The user's supplied motion directive authorizes a larger cinematic treatment than the roadmap's initial subtle hero; the palette and service boundaries stay fixed.

## Interaction acceptance inventory

1. Once-per-session tunnel-to-pitch camera arrival, immediately usable content, static fallback.
2. Bounded pointer camera/lighting response; touch/keyboard independent controls.
3. Intersection-based reveal and restrained scroll depth; no scroll locking.
4. Event-driven score/goal state transitions; initial snapshots and seeking do not fabricate a goal celebration.
5. Existing shared replay timeline and coordinate normalization preserved in the refined pitch.
6. Opt-in microphone waveform with real analyser input, resource cleanup, permission-denied path; evidence remains grounded and generation unavailable unless configured.
7. Player comparisons derived from supplied kit records, identical numeric scales and explicit synthetic labels.
8. Formation marker manipulation with drag and keyboard alternatives.
9. Simulation kickoff/whistle follows the same deterministic outcome; visuals cannot reroll its result.
10. Fantasy list transition animates actual record/order changes; motion does not alter points.

Every item requires reduced-motion or static fallback, keyboard controls, route-unmount cleanup and mobile fit. Final test/performance observations are recorded after implementation, not assumed here.

## Initial optimization measurement

Before: entry JavaScript 3,002.80 KB raw / 316.45 KB gzip, including the entire catalogue. After splitting catalogue fallbacks by section: 158.73 KB raw / 60.39 KB gzip entry (~95% less raw entry JavaScript). Player and rating datasets remain complete, asynchronously loaded. This measures bundle transfer, not FPS or a device-wide speed guarantee. Homepage rails may still request their sections after mount.
