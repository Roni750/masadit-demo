import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';

// See DECISIONS.md #4: data is shown from cache instantly and refetched in the background
// once stale. The user's own writes invalidate the affected queries directly.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
    },
  },
});

// Connectivity comes from Capacitor's Network plugin: the OS's real network state on Android/iOS,
// the browser's online/offline events on the web. While offline, TanStack pauses requests instead of
// failing them, and on reconnect it resumes them and refetches stale data. The offline notice
// (state/NetworkNotice.tsx) reads the same state, so the UI and the data layer always agree.
onlineManager.setEventListener((setOnline) => {
  void Network.getStatus().then((status) => setOnline(status.connected));
  const listener = Network.addListener('networkStatusChange', (status) => setOnline(status.connected));
  return () => {
    void listener.then((handle) => handle.remove());
  };
});

// In the native app, "focus" means the app returning to the foreground.
// The browser's visibilitychange (TanStack's default) doesn't fire reliably inside the WebView.
if (Capacitor.isNativePlatform()) {
  focusManager.setEventListener((setFocused) => {
    const listener = App.addListener('appStateChange', ({ isActive }) => setFocused(isActive));
    return () => {
      void listener.then((handle) => handle.remove());
    };
  });
}
