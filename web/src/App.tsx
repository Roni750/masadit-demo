import { Suspense } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { PageFallback } from './components/PageFallback';
import HomePage from './features/home/HomePage';
import type { PreloadablePage } from './lib/lazyPage';
import { pages } from './pages';
import { LocaleSync } from './state/LocaleSync';
import { NetworkNotice } from './state/NetworkNotice';
import './i18n';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

// Each lazy screen gets its own Suspense boundary, so loading one never blanks the others in the stack
const lazyRoute = (Page: PreloadablePage) => (
  <Suspense fallback={<PageFallback />}>
    <Page />
  </Suspense>
);

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <LocaleSync />
    <IonApp>
      <NetworkNotice />
      <IonReactRouter>
        <IonRouterOutlet>
          <Route path="/home" element={<HomePage />} />
          <Route path="/history" element={lazyRoute(pages.history)} />
          <Route path="/documents/:id" element={lazyRoute(pages.document)} />
          <Route path="/documents/:id/status" element={lazyRoute(pages.status)} />
          <Route path="/documents/:id/close-other" element={lazyRoute(pages.closeOther)} />
          <Route path="/clients/:id" element={lazyRoute(pages.client)} />
          <Route path="/clients/:id/edit" element={lazyRoute(pages.clientEdit)} />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  </QueryClientProvider>
);

export default App;
