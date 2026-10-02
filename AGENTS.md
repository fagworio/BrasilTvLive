# BrasilTvLive - Product-First Development

## Primary objective

Deliver working user-facing product functionality.

Architecture, tests, tooling and infrastructure exist to support the product. They are not product deliverables by themselves.

## Canonical design reference

For UI work, always inspect this file before editing code:

`docs/references/brasiltvlive-mockup.png`

This image is the approved visual source of truth for the initial TV and mobile interfaces.

Do not redesign, reinterpret or replace the approved layout unless the current task explicitly requests a design change.

Do not use the complete mockup as a background image. Build the interface from real React/React Native components.

## Product-first rule

Before coding, identify:

1. What will the user be able to see or do when the task is complete?
2. What is the smallest implementation that delivers that outcome?
3. How will the result be demonstrated?

If the answer does not require new infrastructure, do not add it.

## Scope discipline

Implement only what the current task requires.

Do not proactively add:

- CI/CD pipelines
- canary deployments
- telemetry platforms
- observability stacks
- feature-flag frameworks
- generalized provider abstractions
- speculative adapters
- migration frameworks
- caching layers
- benchmarking systems
- large test harnesses
- unrelated refactors
- future platform integrations

Add one of these only when the current user-facing acceptance criteria cannot reasonably be delivered without it.

Do not solve hypothetical future requirements.

## Vertical slices

Prefer complete product slices:

`UI -> behavior -> required data -> verification`

Do not build several horizontal infrastructure layers before delivering the requested feature.

## Refactoring

Do not refactor unrelated code.

Refactor existing code only when it is required to implement the current task, fixes a blocker, or removes duplication introduced by the current task.

"Cleaner architecture" alone is not a reason to expand scope.

## Testing

Tests protect delivered behavior; they are not the deliverable.

For each task:

- run existing relevant tests;
- add only targeted tests that directly protect the new behavior;
- prefer the smallest useful validation;
- do not create a new test framework unless necessary.

Passing tests do not make an incomplete feature complete.

## UI validation

For visual tasks:

1. Inspect `docs/references/brasiltvlive-mockup.png`.
2. Implement the requested UI with real components.
3. Run the app at the requested viewport/device size.
4. Capture a screenshot of the implementation.
5. Compare it to the reference.
6. Correct visible mismatches before declaring the task complete.

Do not build an automated visual-regression pipeline unless explicitly requested.

## Player integration validation

For live-player or official-embed changes, read `docs/PLAYER_INTEGRATION.md` before editing. The runtime validation must cover PC/large browser, TV/remote mode and mobile, including audio activation, mute, volume, fullscreen, loading/error, channel switching, Back and mobile gestures/device volume. Cross-origin provider controls must be configured through the provider's supported API; do not access iframe DOM or add a duplicate control that cannot affect playback.

## Definition of done

A task is complete only when its user-visible acceptance criteria work.

For UI tasks, provide visual evidence.
For functional tasks, demonstrate the working user flow.

Do not report architectural groundwork as completion of a product feature.

## Stop condition

Once the requested acceptance criteria are satisfied, stop.

Do not use remaining time to add unrelated improvements. List useful future work separately as deferred work.
