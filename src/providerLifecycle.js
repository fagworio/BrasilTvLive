const READY_STATUSES = new Set(['ready', 'player']);
const OPEN_STATUSES = new Set(['open', 'loading']);
const PREVIEW_MODES = new Set(['preview', 'watch', 'player']);

export function isCurrentProviderTarget(event, target) {
  if (!event?.providerId || !target?.providerId) return false;
  if (event.providerId !== target.providerId) return false;
  if (event.channelUrl && event.channelUrl !== target.channelUrl) return false;
  if (event.requestId && target.requestId && event.requestId !== target.requestId) return false;
  if (event.channelName && event.channelName !== target.channelName
    && !(event.requestId && target.requestId && event.requestId === target.requestId)) return false;
  return true;
}

export function normalizeProviderEvent({ event, target, handoff, isWatching }) {
  if (!isCurrentProviderTarget(event, target)) return null;

  const normalized = event.channelUrl && target.channelName
    ? { ...event, channelName: target.channelName }
    : event;
  const preservePreviewReady = !isWatching
    && OPEN_STATUSES.has(normalized.status)
    && READY_STATUSES.has(handoff?.status)
    && PREVIEW_MODES.has(handoff?.mode)
    && normalized.channelUrl === target.channelUrl;

  if (preservePreviewReady) {
    return { ...normalized, status: handoff.status, mode: handoff.mode };
  }
  return { ...normalized, mode: normalized.mode || handoff?.mode };
}

export function isVerifiedProviderPlayer(state, hasNativeBridge = false) {
  return state?.status === 'player'
    && (!hasNativeBridge || (state.sessionSurface === 'webview' && state.playerRouteStable === true));
}

export function getProviderPreviewStatus({ connected, channelUrl, handoff }) {
  const sameReadyTarget = connected
    && handoff?.channelUrl === channelUrl
    && READY_STATUSES.has(handoff.status)
    && PREVIEW_MODES.has(handoff.mode);
  return !connected ? 'auth-required' : sameReadyTarget ? 'playing' : 'loading';
}

export function getProviderLayer({ mode, isWatching }) {
  const isLoginSurface = mode === 'login';
  const isWatchSurface = mode === 'watch' || mode === 'player';
  return ((isLoginSurface || isWatchSurface) && isWatching) ? 'foreground' : 'background';
}

export function isProviderFullscreenMode(mode) {
  return mode === 'watch' || mode === 'player';
}

export function shouldResumeProviderChannel({ status, reason, channelUrl }) {
  return status === 'player' && reason === 'oauth-closed' && Boolean(channelUrl);
}
