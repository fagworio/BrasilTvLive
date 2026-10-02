const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('brasilTvLiveDesktop', {
  isDesktop: true,
  openProviderSurface: (payload) => ipcRenderer.invoke('provider:open', payload),
  closeProviderSurface: () => ipcRenderer.invoke('provider:close'),
  setProviderBounds: (bounds) => ipcRenderer.invoke('provider:set-bounds', bounds),
  setProviderAudioMuted: (muted) => ipcRenderer.invoke('provider:set-audio-muted', Boolean(muted)),
  onProviderState: (handler) => {
    const listener = (_event, state) => handler(state);
    ipcRenderer.on('provider:state', listener);
    return () => ipcRenderer.removeListener('provider:state', listener);
  },
});
