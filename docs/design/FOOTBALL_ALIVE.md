# Football, Alive — experience contract

This work follows the supplied immersive experience directive. Stadium Noir tokens and existing routes/service contracts are retained. The goal is progressive spatial interaction with authoritative data, not a new backend or a second source of match outcomes.

## Motion rules

- Initial page content, navigation and actions must be usable immediately.
- The iconic revision presents the football and stadium immediately. The earlier tunnel entrance has been superseded by a direct pitch view so the dimensional identity is visible on the first frame.
- Pointer effects are clamped and confined to supporting surfaces. They must not move form controls under the pointer or intercept touch scrolling.
- Reduced-motion users get equivalent static information and controls. Media preference changes apply while the page is open.
- Hidden/offscreen scenes stop rendering. Component unmount releases animation frames, timers, listeners, Three resources, microphone tracks and audio contexts.
- A real source state transition may animate a goal or point change; initial snapshots, replay seeks and unrelated fixtures must not trigger a fake score event.
- Charts retain fixed scales. Decorative motion never changes ratings, rankings, points, timestamps or simulation results.
- Microphone acquisition is user-triggered. Waveform reflects actual audio samples only. Speech generation/transcription remains unavailable unless an actual configured implementation exists.

## Content and media

Inter and Space Grotesk are served from local font packages. Synthetic players use schematic avatars rather than invented licensed photos. Club identity falls back to name/initial marks where licensed crest assets are absent. All kit football records retain visible simulated/fictional provenance.

## Feature scope

Motion may visualize existing fixture, event and simulation data. A tactical editor can manipulate local hypothetical formations without implying saved backend tactics. A simulation illustration must identify its algorithm/output boundary. Dynamic leaderboard transitions animate actual fetched values only.

See IMMERSIVE_INVENTORY.md for starting-state audit, interaction checklist and measured observations. The redesign is marked complete only after keyboard, reduced-motion, mobile, scene lifecycle and data-preservation checks pass.

## Iconic football revision

The homepage now uses a procedural truncated-icosahedron football with twelve dark pentagonal plates and twenty ivory hexagonal plates, lit above the stadium. Orbital linework and a fixed perspective field extend the spatial identity beyond the hero. A native Kick the ball button provides a bounded illustrative impulse; it never creates a fixture event or score. Links, buttons, summaries and feature cards expose shared hover, focus and press states. A delegated pointer highlight and short-lived click ring preserve native actions and clean up on unmount. Reduced motion retains a sculptural static football without loading the Three scene or playing feedback pulses.

Mouse-hover refinement: fine-pointer movement tilts feature cards by at most 3.5 degrees using a cached entry rectangle, moves a cyan spotlight across supporting surfaces, and draws lime/cyan link underlines. The hero football enlarges subtly and turns toward the pointer while its rings and key light intensify. Coarse pointers and reduced-motion preferences suppress directional transforms. Leaving the surface, leaving the window, blur, hiding the document, changing preferences or navigating clears pointer state; pause keeps the Three scene frozen.
