const { app, BaseWindow, WebContentsView, ipcMain } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const http = require('node:http');
const { isAllowedProviderUrl, validateProviderRequest } = require('./providers/registry.cjs');
const recordPlusProvider = require('./providers/recordplus.cjs');
const globoplayProvider = require('./providers/globoplay.cjs');

const isDevelopment = process.argv.includes('--dev');
const devServerUrl = 'http://127.0.0.1:5173';
const projectRoot = path.resolve(__dirname, '..');
const rendererPreload = path.join(__dirname, 'preload.cjs');
const providerPreload = path.join(__dirname, 'provider-preload.cjs');

// Keep Chromium's normal graphics/media path for Globoplay's protected player.
// Set BRASILTVLIVE_DISABLE_GPU=1 only as a local fallback for machines with a
// known GPU driver problem.
if (process.env.BRASILTVLIVE_DISABLE_GPU === '1') app.commandLine.appendSwitch('disable-gpu');
// RecordPlus renders Google Identity Services in a cross-origin iframe. FedCM
// can be unavailable in that embedded context, leaving the social button inert;
// use the provider's regular OAuth popup flow instead.
app.commandLine.appendSwitch('disable-features', 'FedCm');
if (process.env.BRASILTVLIVE_REMOTE_DEBUG_PORT) {
  app.commandLine.appendSwitch('remote-debugging-port', process.env.BRASILTVLIVE_REMOTE_DEBUG_PORT);
}

let mainWindow;
let appView;
let viteProcess;
let providerView;
let providerState = null;
let lastProviderBounds = null;
let providerLayer = 'foreground';
let providerFullscreenTimer = null;
let providerRequestId = 0;

function sendProviderState(nextState) {
  providerState = nextState;
  if (appView && !appView.webContents.isDestroyed()) appView.webContents.send('provider:state', nextState);
}

function focusAppView() {
  if (appView && !appView.webContents.isDestroyed()) appView.webContents.focus();
}

function focusProviderView() {
  if (providerView && !providerView.webContents.isDestroyed()) providerView.webContents.focus();
}

function clearProviderFullscreenTimer() {
  if (providerFullscreenTimer) {
    clearTimeout(providerFullscreenTimer);
    providerFullscreenTimer = null;
  }
}

function applyProviderVideoPresentation() {
  if (!providerView || providerView.webContents.isDestroyed()) return;
  if (providerState?.providerId === 'globoplay') {
    globoplayProvider.applyVideoPresentation(providerView.webContents);
  }
}

function requestGloboplayPlayerFullscreen(attempt = 0) {
  if (!providerView || providerView.webContents.isDestroyed()) return;
  if (providerState?.providerId !== 'globoplay' || !['watch', 'player'].includes(providerState?.mode)) return;
  globoplayProvider.requestPlayerFullscreen(providerView.webContents, providerState, (nextAttempt) => {
    providerFullscreenTimer = setTimeout(() => requestGloboplayPlayerFullscreen(nextAttempt), 350);
  }, attempt);
}

function scheduleProviderPlayerFullscreen() {
  clearProviderFullscreenTimer();
  if (providerState?.providerId !== 'globoplay' || !['watch', 'player'].includes(providerState?.mode)) return;
  providerFullscreenTimer = setTimeout(() => requestGloboplayPlayerFullscreen(), 250);
}

function sendAppState(nextState) {
  if (appView && !appView.webContents.isDestroyed()) appView.webContents.send('provider:state', nextState);
}

function applyProviderBounds(bounds) {
  if (!providerView || !mainWindow || mainWindow.isDestroyed()) return;

  const [contentWidth, contentHeight] = mainWindow.getContentSize();
  const isVisible = bounds?.visible !== false;
  if (!isVisible) {
    providerView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    lastProviderBounds = { visible: false };
    focusAppView();
    return;
  }

  const x = Math.max(0, Math.min(Math.round(bounds?.x || 0), contentWidth));
  const y = Math.max(0, Math.min(Math.round(bounds?.y || 0), contentHeight));
  const width = Math.max(0, Math.min(Math.round(bounds?.width || 0), contentWidth - x));
  const height = Math.max(0, Math.min(Math.round(bounds?.height || 0), contentHeight - y));
  providerView.setBounds({ x, y, width, height });
  lastProviderBounds = { visible: width > 0 && height > 0, x, y, width, height };
  if (width > 0 && height > 0) {
    if (providerLayer === 'foreground') focusProviderView();
    else focusAppView();
  }
}

function setProviderLayer(layer = 'foreground') {
  if (!providerView || !mainWindow || mainWindow.isDestroyed()) return false;
  providerLayer = layer === 'background' ? 'background' : 'foreground';
  if (providerLayer === 'background') {
    // BaseWindow/WebContentsView stacking is explicit: reinsert both views so
    // the official player is below the BrasilTvLive shell in preview mode.
    mainWindow.contentView.removeChildView(providerView);
    mainWindow.contentView.addChildView(providerView);
    mainWindow.contentView.removeChildView(appView);
    mainWindow.contentView.addChildView(appView);
    focusAppView();
  } else {
    mainWindow.contentView.removeChildView(providerView);
    mainWindow.contentView.addChildView(providerView);
    focusProviderView();
  }
  return true;
}

function removeProviderView(reason = 'closed') {
  clearProviderFullscreenTimer();
  if (providerView) {
    mainWindow.contentView.removeChildView(providerView);
    providerView.webContents.close();
    providerView = null;
  }
  lastProviderBounds = null;
  sendProviderState({ ...(providerState || {}), status: 'closed', reason });
}

function hideProviderView(reason = 'hidden') {
  if (!providerView) return providerState;
  if (reason === 'back') {
    const isLoginSurface = providerState?.mode === 'login';
    if (isLoginSurface) applyProviderBounds({ visible: false });
    sendProviderState({
      ...(providerState || {}),
      mode: isLoginSurface ? 'login' : 'player',
      status: isLoginSurface ? 'hidden' : 'player',
      reason,
    });
    focusAppView();
    return providerState;
  }
  applyProviderBounds({ visible: false });
  sendProviderState({ ...(providerState || {}), status: 'hidden', reason });
  focusAppView();
  return providerState;
}

function continuePendingProviderChannel(navigatedUrl) {
  const pending = providerState;
  if (!recordPlusProvider.shouldContinuePendingChannel(pending, navigatedUrl)) return;

  const targetUrl = pending.channelUrl;
  sendProviderState({ ...pending, status: 'loading', currentUrl: navigatedUrl });
  setTimeout(() => {
    if (!providerView || providerState?.channelUrl !== targetUrl) return;
    providerView.webContents.loadURL(targetUrl);
  }, 0);
}

function isProviderPlayerUrl(providerId, navigatedUrl, targetUrl = providerState?.channelUrl) {
  if (providerId === 'recordplus') return recordPlusProvider.isPlayerUrl(navigatedUrl);
  if (providerId === 'globoplay') return globoplayProvider.isPlayerUrl(navigatedUrl, targetUrl);
  return false;
}

function isProviderHomeUrl(providerId, navigatedUrl) {
  if (providerId === 'recordplus') return recordPlusProvider.isHomeUrl(navigatedUrl);
  if (providerId === 'globoplay') return globoplayProvider.isHomeUrl(navigatedUrl);
  return false;
}

function isProviderLoginUrl(providerId, navigatedUrl) {
  if (providerId === 'recordplus') return recordPlusProvider.isLoginUrl(navigatedUrl);
  if (providerId === 'globoplay') return globoplayProvider.isLoginUrl(navigatedUrl);
  return false;
}

function attachProviderView({ providerId, url, channelUrl, channelName, mode = 'player' } = {}) {
  if (!mainWindow) return { status: 'error', reason: 'window-unavailable' };
  const validation = validateProviderRequest({ providerId, url, channelUrl });
  if (!validation.ok) {
    console.warn(`[provider] blocked request for ${providerId || 'unknown'}: ${validation.reason}`);
    return { status: 'error', reason: validation.reason };
  }
  const requestId = ++providerRequestId;

  const isSameProvider = providerState?.providerId === providerId;
  if (!providerView || !isSameProvider) {
    if (providerView) removeProviderView('provider-changed');
    providerView = new WebContentsView({
      webPreferences: {
        partition: `persist:${providerId}`,
        preload: providerPreload,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    const view = providerView;
    mainWindow.contentView.addChildView(providerView);
    applyProviderBounds({ visible: false });
    const createProviderWindowOptions = () => ({
      width: 480,
      height: 720,
      minWidth: 360,
      minHeight: 520,
      show: true,
      parent: mainWindow,
      modal: false,
      backgroundColor: '#ffffff',
      webPreferences: {
        partition: `persist:${providerId}`,
        preload: providerPreload,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    const denyUntrustedNavigation = (event, navigatedUrl) => {
      if (isAllowedProviderUrl(providerId, navigatedUrl, { allowBlank: true })) return;
      event.preventDefault();
      console.warn(`[${providerId}] blocked navigation: ${navigatedUrl}`);
    };
    const allowProviderPopup = (details) => {
      if (!isAllowedProviderUrl(providerId, details.url, { allowBlank: true })) {
        console.warn(`[${providerId}] blocked popup: ${details.url}`);
        return { action: 'deny' };
      }
      return { action: 'allow', overrideBrowserWindowOptions: createProviderWindowOptions() };
    };
    providerView.webContents.on('will-navigate', denyUntrustedNavigation);
    providerView.webContents.on('will-redirect', denyUntrustedNavigation);
    providerView.webContents.setWindowOpenHandler(allowProviderPopup);
    providerView.webContents.on('did-create-window', (childWindow, details) => {
      childWindow.setMenuBarVisibility(false);
      childWindow.show();
      childWindow.focus();
      console.log(`[${providerId}] OAuth window opened: ${details.url}`);
      childWindow.webContents.on('will-navigate', denyUntrustedNavigation);
      childWindow.webContents.on('will-redirect', denyUntrustedNavigation);
      childWindow.webContents.setWindowOpenHandler(allowProviderPopup);
      childWindow.webContents.on('did-navigate', (_event, navigatedUrl) => {
        sendProviderState({ ...(providerState || {}), providerId, oauthUrl: navigatedUrl });
      });
      childWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
        if (!isMainFrame || errorCode === -3) return;
        console.error(`[${providerId}] OAuth window failed: ${errorCode} ${errorDescription} ${validatedUrl}`);
      });
      childWindow.on('closed', () => {
        if (providerState?.providerId !== providerId || providerState?.mode !== 'login') return;
        sendProviderState({ ...providerState, mode: 'player', status: 'player', reason: 'oauth-closed' });
      });
    });
    providerView.webContents.on('console-message', (_event, _level, message, line, sourceId) => {
      console.log(`[${providerId}] ${sourceId}:${line} ${message}`);
    });
    providerView.webContents.on('did-start-loading', () => {
      if (providerView !== view) return;
      sendProviderState({ ...(providerState || {}), providerId, status: 'loading' });
    });
    providerView.webContents.on('did-stop-loading', () => {
      if (providerView !== view) return;
      const currentUrl = providerView.webContents.getURL();
      const isLogin = isProviderLoginUrl(providerId, currentUrl);
      const isPlayer = isProviderPlayerUrl(providerId, currentUrl, providerState?.channelUrl);
      const isGloboLoginSurface = providerId === 'globoplay'
        && providerState?.mode === 'login'
        && !isLogin
        && !isPlayer;
      sendProviderState({
        ...(providerState || {}),
        providerId,
        status: isLogin ? 'auth-required' : isGloboLoginSurface ? 'open' : isPlayer || providerState?.status === 'player' ? 'player' : 'open',
        currentUrl,
      });
    });
    providerView.webContents.on('did-finish-load', () => {
      if (providerView !== view) return;
      applyProviderVideoPresentation();
      scheduleProviderPlayerFullscreen();
    });
    const handleProviderNavigation = (_event, navigatedUrl) => {
      if (providerView !== view) return;
      const isPlayer = isProviderPlayerUrl(providerId, navigatedUrl, providerState?.channelUrl);
      const isHome = isProviderHomeUrl(providerId, navigatedUrl);
      const isLogin = isProviderLoginUrl(providerId, navigatedUrl);
      const isGloboLoginSurface = providerId === 'globoplay'
        && providerState?.mode === 'login'
        && !isLogin
        && !isPlayer;
      sendProviderState({
        ...(providerState || {}),
        providerId,
        status: isGloboLoginSurface ? 'open' : isPlayer ? 'player' : isLogin ? 'auth-required' : isHome ? 'ready' : providerState?.status || 'open',
        currentUrl: navigatedUrl,
      });
      if (!isPlayer) continuePendingProviderChannel(navigatedUrl);
    };
    providerView.webContents.on('did-navigate', handleProviderNavigation);
    providerView.webContents.on('did-navigate-in-page', handleProviderNavigation);
    providerView.webContents.on('did-redirect-navigation', (_event, navigatedUrl) => {
      if (providerView !== view) return;
      sendProviderState({ ...(providerState || {}), providerId, currentUrl: navigatedUrl });
    });
    providerView.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
      if (providerView !== view) return;
      if (!isMainFrame || errorCode === -3) return;
      sendProviderState({ ...(providerState || {}), providerId, status: 'error', errorCode, errorDescription, currentUrl: validatedUrl });
    });
    providerView.webContents.on('render-process-gone', (_event, details) => {
      if (providerView !== view) return;
      sendProviderState({ ...(providerState || {}), providerId, status: 'error', reason: `render-process-gone:${details.reason}` });
    });
    providerView.webContents.on('before-input-event', (event, input) => {
      if (providerView !== view) return;
      const isBack = input.type === 'keyDown' && ['Escape', 'Backspace', 'BrowserBack', 'GoBack', 'Back'].includes(input.key);
      if (isBack) {
        event.preventDefault();
        hideProviderView('back');
        return;
      }
      if (input.type === 'keyDown' && input.key === 'ArrowUp') {
        event.preventDefault();
        sendAppState({ type: 'channel-step', direction: -1 });
      }
      if (input.type === 'keyDown' && input.key === 'ArrowDown') {
        event.preventDefault();
        sendAppState({ type: 'channel-step', direction: 1 });
      }
    });
  }

  applyProviderBounds({ visible: false });
  clearProviderFullscreenTimer();
  providerState = { providerId, channelUrl, channelName, mode, requestId, status: ['watch', 'player'].includes(mode) && isProviderPlayerUrl(providerId, url, channelUrl) ? 'player' : 'open' };
  setProviderLayer(mode === 'login' || ['watch', 'player'].includes(mode) ? 'foreground' : 'background');
  providerView.webContents.loadURL(url);
  if (providerId === 'globoplay' && ['watch', 'player'].includes(mode)) scheduleProviderPlayerFullscreen();
  sendProviderState(providerState);
  return providerState;
}

function isAuthorizedRenderer(event) {
  return Boolean(appView && !appView.webContents.isDestroyed() && event.sender === appView.webContents);
}

function waitForDevServer(url, attempts = 80) {
  return new Promise((resolve, reject) => {
    const check = (remaining) => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve();
          return;
        }
        retry(remaining);
      });
      request.on('error', () => retry(remaining));
      request.setTimeout(300, () => { request.destroy(); retry(remaining); });
    };
    const retry = (remaining) => {
      if (remaining <= 0) {
        reject(new Error(`Vite não respondeu em ${url}`));
        return;
      }
      setTimeout(() => check(remaining - 1), 250);
    };
    check(attempts);
  });
}

function startVite() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  viteProcess = spawn(npmCommand, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, BROWSER: 'none' },
  });
}

async function createWindow() {
  if (isDevelopment) {
    try {
      await waitForDevServer(devServerUrl, 3);
    } catch {
      startVite();
      await waitForDevServer(devServerUrl);
    }
  }

  mainWindow = new BaseWindow({
    title: 'BrasilTvLive — Ao vivo',
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    autoHideMenuBar: true,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: rendererPreload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow.setMenuBarVisibility(false);
  appView = new WebContentsView({
    webPreferences: {
      preload: rendererPreload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  appView.setBackgroundColor('#00000000');
  mainWindow.contentView.addChildView(appView);
  const syncAppBounds = () => {
    const [contentWidth, contentHeight] = mainWindow.getContentSize();
    appView.setBounds({ x: 0, y: 0, width: contentWidth, height: contentHeight });
  };
  syncAppBounds();

  mainWindow.on('resize', () => {
    syncAppBounds();
    if (lastProviderBounds?.visible) applyProviderBounds(lastProviderBounds);
  });
  mainWindow.on('closed', () => {
    appView?.webContents.close();
    appView = null;
    mainWindow = null;
  });
  await appView.webContents.loadURL(isDevelopment ? devServerUrl : `file://${path.join(projectRoot, 'dist', 'index.html')}`);
}

ipcMain.handle('provider:open', (event, payload) => {
  if (!isAuthorizedRenderer(event)) return { status: 'error', reason: 'unauthorized-sender' };
  return attachProviderView(payload);
});
ipcMain.handle('provider:close', (event) => {
  if (!isAuthorizedRenderer(event)) return { status: 'error', reason: 'unauthorized-sender' };
  return hideProviderView('app-request');
});
ipcMain.handle('provider:set-bounds', (event, bounds) => {
  if (!isAuthorizedRenderer(event)) return { status: 'error', reason: 'unauthorized-sender' };
  applyProviderBounds(bounds);
  return lastProviderBounds;
});
ipcMain.handle('provider:set-layer', (event, layer) => {
  if (!isAuthorizedRenderer(event)) return false;
  return setProviderLayer(layer);
});
ipcMain.handle('provider:set-audio-muted', (event, muted) => {
  if (!isAuthorizedRenderer(event)) return false;
  if (!providerView || providerView.webContents.isDestroyed()) return false;
  providerView.webContents.setAudioMuted(Boolean(muted));
  return true;
});

app.whenReady().then(createWindow).catch((error) => {
  console.error(error);
  app.quit();
});

app.on('before-quit', () => {
  if (viteProcess && !viteProcess.killed) viteProcess.kill();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BaseWindow.getAllWindows().length === 0) createWindow();
});
