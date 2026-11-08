# Football, Alive — experience contract

This work follows the supplied immersive experience directive. Stadium Noir tokens and existing routes/service contracts are retained. The goal is progressive spatial interaction with authoritative data, not a new backend or a second source of match outcomes.

## Motion rules

- Initial page content, navigation and actions must be usable immediately.
- Tunnel arrival is brief, skippable and remembered for the tab session; ordinary navigation does not replay it.
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
