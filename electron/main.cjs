const { app, BaseWindow, WebContentsView, ipcMain } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const http = require('node:http');

const isDevelopment = process.argv.includes('--dev');
const devServerUrl = 'http://127.0.0.1:5173';
const projectRoot = path.resolve(__dirname, '..');
const rendererPreload = path.join(__dirname, 'preload.cjs');
const providerPreload = path.join(__dirname, 'provider-preload.cjs');

app.commandLine.appendSwitch('disable-gpu');
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
    mainWindow.contentView.addChildView(providerView, 0);
    focusAppView();
  } else {
    mainWindow.contentView.addChildView(providerView);
    focusProviderView();
  }
  return true;
}

function removeProviderView(reason = 'closed') {
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
    sendProviderState({ ...(providerState || {}), status: 'player', reason });
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
  if (pending?.providerId !== 'recordplus' || !pending.channelUrl || !pending.channelUrl.includes('/player/') || pending.status === 'player') return;

  let parsedUrl;
  try {
    parsedUrl = new URL(navigatedUrl);
  } catch {
    return;
  }

  if (parsedUrl.origin !== 'https://www.recordplus.com' || !['/', '/home'].includes(parsedUrl.pathname)) return;

  const targetUrl = pending.channelUrl;
  sendProviderState({ ...pending, status: 'loading', currentUrl: navigatedUrl });
  setTimeout(() => {
    if (!providerView || providerState?.channelUrl !== targetUrl) return;
    providerView.webContents.loadURL(targetUrl);
  }, 0);
}

function attachProviderView({ providerId, url, channelUrl, channelName }) {
  if (!mainWindow || !url) return { status: 'error', reason: 'missing-url' };

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
    mainWindow.contentView.addChildView(providerView);
    applyProviderBounds({ visible: false });
    providerView.webContents.setWindowOpenHandler(() => {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
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
        },
      };
    });
    providerView.webContents.on('did-create-window', (childWindow, details) => {
      childWindow.setMenuBarVisibility(false);
      childWindow.show();
      childWindow.focus();
      console.log(`[recordplus] OAuth window opened: ${details.url}`);
      childWindow.webContents.on('did-navigate', (_event, navigatedUrl) => {
        sendProviderState({ ...(providerState || {}), providerId, oauthUrl: navigatedUrl });
      });
      childWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
        if (!isMainFrame || errorCode === -3) return;
        console.error(`[recordplus] OAuth window failed: ${errorCode} ${errorDescription} ${validatedUrl}`);
      });
    });
    providerView.webContents.on('console-message', (_event, _level, message, line, sourceId) => {
      console.log(`[recordplus] ${sourceId}:${line} ${message}`);
    });
    providerView.webContents.on('did-start-loading', () => {
      sendProviderState({ ...(providerState || {}), providerId, status: 'loading' });
    });
    providerView.webContents.on('did-stop-loading', () => {
      const currentUrl = providerView.webContents.getURL();
      const isLogin = currentUrl.includes('recordplus.com/login');
      const isPlayer = currentUrl.includes('/player/');
      sendProviderState({
        ...(providerState || {}),
        providerId,
        status: isLogin ? 'auth-required' : isPlayer || providerState?.status === 'player' ? 'player' : 'open',
        currentUrl,
      });
    });
    const handleProviderNavigation = (_event, navigatedUrl) => {
      const isPlayer = navigatedUrl.includes('/player/');
      let isHome = false;
      let isLogin = false;
      try {
        const pathname = new URL(navigatedUrl).pathname;
        isHome = ['/', '/home'].includes(pathname);
        isLogin = pathname.startsWith('/login');
      } catch { /* provider navigations are expected to be absolute URLs */ }
      sendProviderState({
        ...(providerState || {}),
        providerId,
        status: isPlayer ? 'player' : isLogin ? 'auth-required' : isHome ? 'ready' : providerState?.status || 'open',
        currentUrl: navigatedUrl,
      });
      if (!isPlayer) continuePendingProviderChannel(navigatedUrl);
    };
    providerView.webContents.on('did-navigate', handleProviderNavigation);
    providerView.webContents.on('did-navigate-in-page', handleProviderNavigation);
    providerView.webContents.on('did-redirect-navigation', (_event, navigatedUrl) => {
      sendProviderState({ ...(providerState || {}), providerId, currentUrl: navigatedUrl });
    });
    providerView.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
      if (!isMainFrame || errorCode === -3) return;
      sendProviderState({ ...(providerState || {}), providerId, status: 'error', errorCode, errorDescription, currentUrl: validatedUrl });
    });
    providerView.webContents.on('render-process-gone', (_event, details) => {
      sendProviderState({ ...(providerState || {}), providerId, status: 'error', reason: `render-process-gone:${details.reason}` });
    });
    providerView.webContents.on('before-input-event', (event, input) => {
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
  providerState = { providerId, channelUrl, channelName, status: url.includes('/player/') ? 'player' : 'open' };
  providerView.webContents.loadURL(url);
  focusProviderView();
  sendProviderState(providerState);
  return providerState;
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

ipcMain.handle('provider:open', (_event, payload) => attachProviderView(payload));
ipcMain.handle('provider:close', () => {
  return hideProviderView('app-request');
});
ipcMain.handle('provider:set-bounds', (_event, bounds) => {
  applyProviderBounds(bounds);
  return lastProviderBounds;
});
ipcMain.handle('provider:set-layer', (_event, layer) => setProviderLayer(layer));
ipcMain.handle('provider:set-audio-muted', (_event, muted) => {
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
