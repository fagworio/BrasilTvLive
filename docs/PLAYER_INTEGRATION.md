# BrasilTvLive — Player integration guide

This is the project reference for integrating official live players and validating them across PC, TV and mobile.

## Integration rules

- Prefer the broadcaster's official HLS when it is publicly available.
- When the official source is an embed, keep it inside the existing player surface. Do not extract private HLS URLs, tokens or sessions.
- Cross-origin iframe DOM cannot be styled or controlled directly from BrasilTvLive.
- Do not render a second volume control that only changes app state. If the provider exposes a supported `postMessage` API, bridge the app control to the provider; otherwise keep the provider's native audio control visible.
- Use the provider's control allowlist when available to remove duplicated controls. For the Band Spalla player, `controls=play,fullscreen` keeps the minimal native surface while the app owns mute and volume through supported messages.
- The iframe must keep only the permissions it needs, normally `autoplay; encrypted-media; fullscreen`. Add picture-in-picture or casting only when the product acceptance requires it.
- Keep loading, error, channel selection, fullscreen and remote-navigation behavior in the existing player flow. Do not create a provider framework or a new player state machine for one integration.

## Spalla bridge used by Band

The official Spalla embed accepts these parent-to-iframe messages:

```js
iframe.contentWindow.postMessage({ action: 'volume', volume: 0.35 }, '*');
iframe.contentWindow.postMessage({ action: 'mute' }, '*');
iframe.contentWindow.postMessage({ action: 'unmute' }, '*');
```

The `volume` value is normalized from `0` to `1`. Send the current volume and mute state after the iframe loads and whenever the app control changes. Keep the provider's origin in mind if a future integration adds origin validation.

## Required validation matrix

Every player integration must be exercised in the actual running app, not only by a build:

### PC / large browser

- open the channel from the EPG;
- see the loading transition and then real video;
- activate and mute audio;
- change volume with the app slider and confirm the media volume changes;
- enter and exit fullscreen;
- switch to another channel without returning to the home screen;
- confirm no duplicated or provider-specific controls remain when they were intentionally removed.

### TV / remote

- move focus with the D-pad and select with OK;
- use channel up/down and Arrow Up/Down to zap;
- use volume up/down and mute;
- use Back/Escape to exit fullscreen;
- confirm focus and navigation remain usable around an iframe.

### Mobile

- validate portrait layout at both narrow and wide phone widths;
- open the player, activate audio from an explicit gesture and enter landscape fullscreen;
- use device volume controls;
- swipe vertically to change channels;
- exit fullscreen and confirm the channel list remains scrollable;
- repeat with a second channel and confirm loading/error states recover.

## Evidence and stop condition

For UI/player tasks, collect at least one visual runtime capture for the tested surface and run the targeted production build. Stop when the current acceptance criteria work; defer provider catalogs, health checks, telemetry, abstractions and unrelated platform work.
