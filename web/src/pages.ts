import { lazyPage } from './lib/lazyPage';

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
