# ADR-0002: Stadium Noir shell and optional pitch rendering

Status: Accepted
Date: 2026-10-31
Related roadmap step: 03

## Context

The roadmap requires a recognizable application shell before football data is implemented. A decorative visualization must not imply that live tracking exists, and must not prevent navigation on constrained devices.

## Decision

Keep the homepage and destination pages honest about the unavailable data. Global search filters the site's navigation destinations only; it does not simulate player or club search. The working system-health feature remains at `/system`. Reusable primitives are demonstrated at `/design-system`.

Use the six Stadium Noir brand colors with accessible neutral text, explicit focus styles, semantic landmarks and responsive navigation. Use Vue component state for ephemeral menu/dialog controls and retain Pinia for API status. No duplicate state libraries are introduced.

A schematic pitch is a progressive enhancement: the baseline is a static SVG. Only a visible hero on a motion-enabled, WebGL-capable browser imports the TresJS/Three.js scene. Render on demand, cap device pixel ratio at 1.5, dispose geometries/materials and unmount the scene offscreen. Motion preference changes or context failure return to the static view. There is no ball, tracked player, result or provider claim.

## Alternatives

Loading Three.js in the main entry would increase the cost for users who cannot or do not want to render it. A continuous animation would consume resources without adding useful information. Invented scores would make the empty data platform look finished while violating provenance requirements.

## Consequences

The shell is navigable and useful for exploring the planned product, but catalogue, fixtures, search results, favourites, accounts and other domain functions remain later milestones. Accessible data wrappers show unknown/empty information instead of invented numbers. The 3D feature is optional and isolated from the API.

## Migration/rollback

Later features replace destination empty states behind existing routes. Step 11 will introduce observed/reconstructed/simulated frame contracts separately; this decorative hero must never become a source of football facts. Disable its dynamic import to roll back to the static pitch without affecting navigation.

## Validation

Desktop/tablet/mobile browser tests cover routes, search, focus, reduced motion, WebGL absence and accessibility. Unit tests cover primitive behavior; build output establishes initial and lazy-loaded bundle sizes. Rendering measurements are recorded in the Step 03 verification report and are local observations, not device-wide performance guarantees.
