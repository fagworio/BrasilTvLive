import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The same web application is loaded by Electron and by the Android WebView.
// Relative asset URLs keep the packaged Android build self-contained, while
// the ES2018 target remains compatible with Android TV 9's WebView runtime.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2018',
  },
});
