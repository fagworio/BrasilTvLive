---
name: recordplus-integration
description: Integrate RECORD/RecordPlus channels into BrasilTvLive across web, Electron desktop, Android and Android TV. Use when implementing Record login, channel redirects, authenticated playback, native WebView surfaces, provider controls, fullscreen, Back/Esc, CH+/CH- or accessibility navigation.
---

# RecordPlus Integration

## Product contract

The user selects a RECORD channel in BrasilTvLive, authenticates on the official RecordPlus surface if required, returns to that same channel, and watches the official live player inside the target app surface.

Keep this flow separate from SBT and Globo. Do not redirect a Record selection to another broadcaster or another Record channel.

Supported Record targets:

- RECORD Nacional
- RECORD Minas
- RECORD News
- future regional Record channels using their official `/player/` URL

## Non-negotiable provider rules

- Use the official RecordPlus login/player URL. Do not extract private HLS URLs, DRM data, tokens or cookies.
- Do not use an iframe when RecordPlus blocks embedding with CSP or `X-Frame-Options`.
- Do not change the User-Agent, intercept OAuth, bypass CSP, or copy browser cookies into app storage.
- Keep provider authentication and playback in the provider-owned surface.
- Keep volume, mute, fullscreen, advertisements and playback controls provider-owned unless RecordPlus exposes an official control API.
- Google social login is a provider restriction: WebView may return `disallowed_useragent` or require the official browser/Custom Tab. Do not simulate success or claim that the WebView session shares browser cookies.
- Never store RecordPlus credentials, cookies or tokens in BrasilTvLive `localStorage`, a backend, or app-owned account state.

## Channel and login routing

Use the selected channel's exact URL as the destination. For a direct player URL, build the official login URL with the same path as `redirectTo`:

```js
const login = new URL('https://www.recordplus.com/login?redirectTo=%2F');
login.searchParams.set('redirectTo', `${new URL(channelUrl).pathname}${new URL(channelUrl).search}`);
```

Only treat the session as ready after the provider actually navigates to the selected `/player/` URL. A login page, home page, profile picker, or an arbitrary provider redirect is not proof that the selected channel is playable.

## Web and Electron

### Browser fallback

RecordPlus remains an external provider surface in a normal browser. Open the official login/player in a popup or new tab and explain that cookies and playback remain there when the browser blocks incorporation.

### Electron surface

Use the existing `BaseWindow` and two-`WebContentsView` composition:

1. Keep the BrasilTvLive renderer in `appView`.
2. Keep one persistent RecordPlus `providerView` with `partition: 'persist:recordplus'`.
3. Load login/player URLs only in `providerView`.
4. During preview, place `providerView` behind `appView`, mute its audio, and size it to the hero area. The provider video must fill that area with `object-fit: cover` so it is not letterboxed or compacted.
5. During watch, place `providerView` in front and size it to the full window. Let RecordPlus render its native controls.
6. On Back/Esc, return to the BrasilTvLive guide, keep the selected channel and restore the muted preview. On Arrow Up/Down, send channel-step events back to the shell.
7. Guard every `focus`, `send`, bounds update and close operation against missing or destroyed `appView`, `providerView` and `WebContents`.

Use the existing preload bridge for surface lifecycle, bounds, layer and mute state. Do not expose cookies or provider page content through IPC.

For Google login, allow the official provider OAuth popup/window. Do not alter its User-Agent or copy the resulting browser session into the WebView.

## Android and Android TV native surface

The native surface is the integration point for the future Android shell. The shell launches `MainActivity` with the selected Record channel:

```java
Intent intent = new Intent(context, MainActivity.class)
        .putExtra(MainActivity.EXTRA_CHANNEL_URL, recordChannelUrl)
        .putExtra(MainActivity.EXTRA_CHANNEL_NAME, recordChannelName);
startActivityForResult(intent, RECORDPLUS_REQUEST_CODE);
```

The surface must:

- open the official login URL with `redirectTo` for the selected channel;
- use a native WebView with JavaScript, DOM storage, media playback and third-party cookies enabled for the provider;
- keep cookies only in Android `CookieManager` and call `flush()` on page completion, pause, stop and destroy;
- occupy the whole screen in Android and Android TV, with immersive system UI and `video { object-fit: cover !important; }` presentation;
- preserve provider audio, ads, fullscreen and controls rather than creating duplicate app controls;
- return to the shell on Back/Esc once the player is open;
- return `EXTRA_CHANNEL_DIRECTION=next|previous` for CH+, CH-, MEDIA_NEXT and MEDIA_PREVIOUS;
- expose both `LAUNCHER` and optional `LEANBACK_LAUNCHER` categories, with touchscreen optional, so the same surface can run on phones and TV devices;
- send Google OAuth to the official browser/Custom Tab and report the provider restriction clearly.

The shell owns the channel list. The native surface owns the authenticated provider page. The result contract must never contain cookies, tokens or credentials.

## Accessibility and remote controls

- Preserve semantic channel names and live status in the BrasilTvLive shell.
- Use real buttons/links and visible `:focus-visible` states for login, account, channel and navigation actions.
- Keep focus on the app after returning from Electron provider preview.
- Ensure D-pad focus can reach provider controls when the provider is foreground.
- Map Back/Esc to the current surface state, not to an unsafe window reference.
- Map CH+/CH- and Arrow Up/Down to channel navigation without changing the selected provider destination unexpectedly.
- Do not add an app volume slider that only changes local state while the provider player remains unchanged.

## Implementation workflow

1. Read `AGENTS.md`, `docs/PLAYER_INTEGRATION.md`, and the relevant desktop/native documentation.
2. Identify the exact Record channel URL and preserve it through login.
3. Inspect the existing surface lifecycle before adding state or abstractions.
4. Implement the smallest vertical slice for the target platform.
5. Test login, return to the selected channel, real playback, audio, mute, fullscreen, ads, Back/Esc, channel switching and focus.
6. Capture a runtime screenshot for the visible player composition.
7. Run targeted checks:
   - Electron: `node --check electron/main.cjs` and `npm run build`.
   - Web: `npm run build`.
   - Android: `./gradlew :recordplus-poc:assembleDebug` when Gradle/SDK are available; otherwise report that device validation is pending.
8. Commit and push the completed slice incrementally when requested.

## Completion checklist

- [ ] The clicked Record channel is the channel that opens after login.
- [ ] No SBT or Globo route is involved.
- [ ] The official player occupies the intended full-width/fullscreen surface.
- [ ] Provider-native audio, fullscreen, ads and controls remain functional.
- [ ] Login/session state persists in the platform-owned provider store.
- [ ] Back/Esc returns to the BrasilTvLive shell without a main-process error.
- [ ] CH+/CH- and accessibility focus behavior are valid on the target platform.
- [ ] Google OAuth limitations are reported instead of bypassed.
- [ ] Runtime evidence and targeted validation are available before declaring completion.

## Relevant files

- `src/main.jsx` — Record channel catalog, selected-channel routing and desktop bridge lifecycle.
- `src/styles.css` — provider preview, full-width composition and focus states.
- `electron/main.cjs` — persistent RecordPlus `WebContentsView`, OAuth window, layer/focus lifecycle and provider video presentation.
- `electron/preload.cjs` — narrow provider-surface IPC bridge.
- `android/recordplus-poc/src/main/java/com/fagworio/brasiltvlive/recordpluspoc/MainActivity.java` — native Android/Android TV RecordPlus surface.
- `android/recordplus-poc/src/main/AndroidManifest.xml` — Android and Leanback launcher declarations.
- `docs/PLAYER_INTEGRATION.md` — player and validation policy.
- `docs/DESKTOP_RECORDPLUS.md` — current desktop behavior.
