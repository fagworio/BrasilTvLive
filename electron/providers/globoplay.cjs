const { URL } = require('node:url');

const GLOBOPLAY_ORIGIN = 'https://globoplay.globo.com';

function isGloboplayUrl(value, predicate) {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.origin === GLOBOPLAY_ORIGIN && predicate(parsedUrl);
  } catch {
    return false;
  }
}

function isPlayerUrl(value, targetUrl) {
  let target;
  try {
    target = targetUrl ? new URL(targetUrl) : null;
  } catch {
    target = null;
  }
  return isGloboplayUrl(value, (parsedUrl) => Boolean(target)
    && parsedUrl.pathname === target.pathname
    && parsedUrl.pathname.includes('/ao-vivo/'));
}

function isHomeUrl(value) {
  return isGloboplayUrl(value, (parsedUrl) => parsedUrl.pathname === '/');
}

function isLoginUrl(value) {
  try {
    const hostname = new URL(value).hostname;
    return hostname === 'goidc.globo.com'
      || hostname === 'authx.globoid.globo.com'
      || hostname === 'conta.globo.com';
  } catch {
    return false;
  }
}

function isLoginSurface(providerState, value) {
  return providerState?.providerId === 'globoplay'
    && providerState.mode === 'login'
    && !isLoginUrl(value)
    && !isPlayerUrl(value, providerState.channelUrl);
}

function applyVideoPresentation(webContents) {
  if (!webContents || webContents.isDestroyed()) return;
  webContents.insertCSS('video { object-fit: cover !important; }').catch(() => {});
}

function requestPlayerFullscreen(webContents, providerState, onRetry, attempt = 0) {
  if (!webContents || webContents.isDestroyed()) return;
  if (providerState?.providerId !== 'globoplay' || !['watch', 'player'].includes(providerState?.mode)) return;

  webContents.executeJavaScript(`(() => {
    const player = document.querySelector('#wp3-player-1');
    const fullscreenButton = player?.querySelector('[data-fullscreen]');
    if (!player || !fullscreenButton) return { ready: false, fullscreen: false };

    const isFullscreen = Boolean(document.fullscreenElement) || player.classList.contains('fullscreen');
    if (!isFullscreen) fullscreenButton.click();
    return { ready: true, fullscreen: Boolean(document.fullscreenElement) || player.classList.contains('fullscreen') };
  })()`, true).then((result) => {
    if (result?.fullscreen || attempt >= 12) return;
    onRetry(attempt + 1);
  }).catch(() => {
    if (attempt < 12) onRetry(attempt + 1);
  });
}

module.exports = {
  isPlayerUrl,
  isHomeUrl,
  isLoginUrl,
  isLoginSurface,
  applyVideoPresentation,
  requestPlayerFullscreen,
};
