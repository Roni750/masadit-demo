import { lazy, type ComponentType } from 'react';

export type PreloadablePage = ReturnType<typeof lazy<ComponentType>> & { preload: () => Promise<unknown> };

// React.lazy plus a `preload()` that starts downloading the page's chunk early (on touch-down,
// or when the app is idle), so by the time the user navigates the code is usually already there.
// The import runs once; preload() and the first render share the same promise.
export const lazyPage = (load: () => Promise<{ default: ComponentType }>): PreloadablePage => {
  let pending: Promise<{ default: ComponentType }> | undefined;
  const loadOnce = () => (pending ??= load());
  return Object.assign(lazy(loadOnce), { preload: loadOnce });
};

// Runs `task` when the browser is idle, so preloading never competes with the current screen's work
export const whenIdle = (task: () => void) => {
  if ('requestIdleCallback' in window) {
    const handle = window.requestIdleCallback(task, { timeout: 2000 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = setTimeout(task, 500);
  return () => clearTimeout(handle);
};
