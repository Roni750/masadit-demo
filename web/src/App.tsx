import { Navigate, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import ClientEditPage from './features/clients/ClientEditPage';
import ClientPage from './features/clients/ClientPage';
import CloseOtherPage from './features/documents/CloseOtherPage';
import DocumentPage from './features/documents/DocumentPage';
import StatusPage from './features/documents/StatusPage';
import HistoryPage from './features/history/HistoryPage';
import HomePage from './features/home/HomePage';
import { LocaleSync } from './state/LocaleSync';
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

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <LocaleSync />
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route path="/home" element={<HomePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/documents/:id" element={<DocumentPage />} />
          <Route path="/documents/:id/status" element={<StatusPage />} />
          <Route path="/documents/:id/close-other" element={<CloseOtherPage />} />
          <Route path="/clients/:id" element={<ClientPage />} />
          <Route path="/clients/:id/edit" element={<ClientEditPage />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  </QueryClientProvider>
);

export default App;
