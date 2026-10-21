import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { focusManager, QueryClient } from '@tanstack/react-query';

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
