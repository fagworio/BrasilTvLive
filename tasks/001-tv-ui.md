# Task 001 - TV UI

Use the `$product-first-delivery` skill.

## Product outcome

When the Android TV/TV app is launched at 1920x1080, the user sees a real React Native interface closely matching `docs/references/brasiltvlive-mockup.png`.

## Before coding

1. Read `AGENTS.md`.
2. Open `docs/references/brasiltvlive-mockup.png` and inspect it visually.
3. Read `docs/UI_SPEC.md`.
4. Inspect the existing repository before choosing or changing project structure.

## Implement only

- TV screen shell/background
- sidebar and selected `Ao vivo` state
- hero/current-program area
- EPG timeline/grid
- five mocked channel rows
- current-time marker
- static focus/selection visual state
- minimal shared theme/tokens needed by this screen

Use local mock data.

## Acceptance criteria

- app/screen renders at 1920x1080 without layout breakage;
- sidebar, hero and EPG are present in the same overall proportions as the mockup;
- typography hierarchy and spacing are visibly close to the reference;
- hero has a full-bleed background and dark gradients, not a simple thumbnail;
- EPG includes the five requested channels and a red current-time marker;
- selected/focused elements are clearly visible;
- implementation uses real React/React Native components;
- final result is demonstrated with a screenshot of the running implementation.

## Out of scope

Do not implement:

- player/streaming
- API/backend/database
- remote-control behavior
- authentication
- geolocation
- real EPG
- analytics
- Samsung/LG integration
- CI/CD/canary/telemetry
- new test frameworks
- generalized future-platform architecture

## Stop condition

When the acceptance criteria above are visibly satisfied, stop and report the product result. Do not expand the architecture.
