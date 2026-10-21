import { createElement, use, type ComponentType } from 'react';

type PageModule = { default: ComponentType };

export type PreloadablePage = ComponentType & { preload: () => Promise<unknown> };

/**
 * A code-split page with a `preload()` that starts downloading its chunk early (on touch-down,
 * or when the app is idle).
 *
 * Not React.lazy: React.lazy suspends on its first render even when the chunk is already loaded,
 * because it learns of the resolved promise only after awaiting it. Ionic would then animate the
 * Suspense fallback page, and the real page would stay invisible once it replaced the fallback.
 * Here, once the module has loaded the page renders synchronously, so in-app navigation (which
 * waits for preload, see useAppRouter) never suspends. Only a cold deep link shows the fallback.
 */
export const lazyPage = (load: () => Promise<PageModule>): PreloadablePage => {
  let loaded: PageModule | undefined;
  let pending: Promise<PageModule> | undefined;
  const preload = () =>
    (pending ??= load().then((module) => {
      loaded = module;
      return module;
    }));

  const Page = () => createElement((loaded ?? use(preload())).default);
  return Object.assign(Page, { preload });
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
