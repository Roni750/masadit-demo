import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App';
import { setUpStatusBar } from './lib/native';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

void setUpStatusBar();

// Service worker for the web / installed PWA only. In the native app every file already ships
// inside the APK, and a service worker there would just add a second cache to keep in sync.
if (!Capacitor.isNativePlatform()) {
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
}
