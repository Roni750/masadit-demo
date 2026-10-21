import { useIonRouter } from '@ionic/react';
import { useCallback } from 'react';
import { lazyPage, type PreloadablePage } from './lib/lazyPage';

// Every screen except Home (the entry screen) is code-split into its own chunk.
// Components import these to preload the next likely screen before the user taps.
export const pages = {
  history: lazyPage(() => import('./features/history/HistoryPage')),
  document: lazyPage(() => import('./features/documents/DocumentPage')),
  status: lazyPage(() => import('./features/documents/StatusPage')),
  closeOther: lazyPage(() => import('./features/documents/CloseOtherPage')),
  client: lazyPage(() => import('./features/clients/ClientPage')),
  clientEdit: lazyPage(() => import('./features/clients/ClientEditPage')),
};

const ROUTES: [RegExp, PreloadablePage][] = [
  [/^\/history$/, pages.history],
  [/^\/documents\/\d+$/, pages.document],
  [/^\/documents\/\d+\/status$/, pages.status],
  [/^\/documents\/\d+\/close-other$/, pages.closeOther],
  [/^\/clients\/\d+$/, pages.client],
  [/^\/clients\/\d+\/edit$/, pages.clientEdit],
];

/**
 * router.push that first makes sure the target screen's code is loaded.
 * Ionic animates the page element that exists when navigation starts: if the screen were still
 * loading, it would animate the Suspense fallback, and the real page would stay hidden once it
 * replaced it. Screens are usually preloaded on touch-down already, so the wait is near zero.
 */
export const useAppRouter = () => {
  const router = useIonRouter();
  const push = useCallback(
    async (path: string, direction?: 'forward' | 'back' | 'root' | 'none', action?: 'push' | 'replace' | 'pop') => {
      const page = ROUTES.find(([pattern]) => pattern.test(path))?.[1];
      await page?.preload();
      router.push(path, direction, action);
    },
    [router],
  );
  return { ...router, push };
};
