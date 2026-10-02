# BrasilTvLive - Initial MVP Roadmap

## Product premise

BrasilTvLive is a television-first live-channel application that should also run on Android and iOS smartphones. The initial experience follows the approved mockup in `docs/references/brasiltvlive-mockup.png`.

The first goal is not streaming infrastructure. The first goal is to make the approved product interface real and runnable.

## Technology direction

- TypeScript
- React Native
- `react-native-tvos` for Android TV / Google TV and future Apple TV support
- Android and iOS mobile from the shared React Native codebase
- React/Web TV adaptation for Samsung Tizen and LG webOS later, after the core product works

Avoid scaffolding Samsung/LG platform code during the first UI milestone unless it is directly required to render the current screen.

## Development order

### MVP 0.1 - TV interface

Build the 1920x1080 TV screen from the approved mockup using local mock data.

Required visible areas:

- BrasilTvLive brand/header
- left navigation sidebar
- selected `Ao vivo` state
- hero/current-program area
- `AO VIVO` badge
- current channel and program metadata
- background artwork with dark gradients
- EPG/program grid
- channel rows and logos/placeholders
- current-time marker
- focused/selected visual states

No real streaming or backend is required.

### MVP 0.2 - Mobile interface

After the TV UI is visually accepted, build the mobile composition shown in the same mockup.

Required visible areas:

- mobile header
- video/player placeholder
- live badge and playback controls placeholder
- current channel/program information
- category chips
- channel list
- bottom navigation

Use shared theme, channel data and reusable components where natural. Do not force TV and mobile to have the same layout component.

### MVP 0.3 - TV remote navigation

After the interface is accepted:

- D-pad focus movement
- Up/Down channel navigation where appropriate
- Right opens channel navigation panel/list when designed
- Back/Left closes overlays
- OK selects/opens
- Channel +/- support when the device exposes those events

### MVP 0.4 - Player

Add a working local/test stream, then HLS playback.

Do not introduce backend work before a player is visibly working in the app.

### MVP 0.5 - First real channels

Integrate a small number of legally usable live channels and verify channel switching end to end.

### MVP 0.6 - Channel API and EPG

Only after the client experience works:

- remote channel catalog
- stream metadata
- EPG/current/next program
- health/fallback behavior if required by real failures

### Later targets

- regionalization
- production Android/iOS releases
- Samsung Tizen packaging/integration
- LG webOS packaging/integration

## Explicitly out of scope for MVP 0.1

Do not implement:

- real streaming
- backend
- authentication
- database
- remote EPG
- geolocation
- analytics
- ads/monetization
- Samsung APIs
- LG APIs
- canary deployment
- CI/CD expansion
- telemetry stack
- generalized provider architecture
- large automated visual-regression infrastructure

## Product milestones

A milestone must change something the user can see or do.

Examples that count:

- TV screen matches the approved design
- mobile screen matches the approved design
- remote control changes focus
- a video plays
- channel switching works
- real channel metadata appears

Examples that do not count as standalone product milestones:

- more tests
- a new pipeline
- a provider abstraction
- telemetry
- a healthcheck
- a canary system
- deployment documentation
