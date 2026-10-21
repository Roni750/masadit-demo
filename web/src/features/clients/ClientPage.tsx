import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/react';
import { pencil } from 'ionicons/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import type { DocumentStatus, DocumentType } from '../../domain/documents';
import { pages } from '../../pages';
import { DocumentFeed } from '../history/DocumentFeed';
import { ClientDetails } from './ClientDetails';
import { LedgerView } from './LedgerView';
import { useClient } from './queries';
import '../documents/documents.css';
import './clients.css';

type Tab = 'details' | 'documents' | 'ledger';
type StatusFilter = 'all' | DocumentStatus;

const ClientPage: React.FC = () => {
  const id = Number(useParams().id);
  const { t } = useTranslation();
  const router = useIonRouter();
  const client = useClient(id);
  const [tab, setTab] = useState<Tab>('details');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedType, setSelectedType] = useState<DocumentType>();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/history" text="" />
          </IonButtons>
          <IonTitle>{t('clients.title')}</IonTitle>
          <IonButtons slot="end">
            <IonButton
              data-action="edit"
              aria-label={t('clients.edit')}
              onPointerDown={() => void pages.clientEdit.preload()}
              onClick={() => router.push(`/clients/${id}/edit`)}
            >
              <IonIcon slot="icon-only" icon={pencil} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar className="client-tabs">
          <IonSegment value={tab} onIonChange={(event) => setTab(event.detail.value as Tab)}>
            {(['details', 'documents', 'ledger'] as const).map((value) => (
              <IonSegmentButton key={value} value={value}>
                <IonLabel>{t(`clients.tabs.${value}`)}</IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
        </IonToolbar>
        {tab === 'documents' && (
          <IonToolbar className="client-tabs">
            <IonSegment value={statusFilter} onIonChange={(event) => setStatusFilter(event.detail.value as StatusFilter)}>
              {(['all', 'open', 'closed'] as const).map((value) => (
                <IonSegmentButton key={value} value={value}>
                  <IonLabel>{t(`clients.filter.${value}`)}</IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>
          </IonToolbar>
        )}
      </IonHeader>

      <IonContent className="doc-content">
        {tab === 'details' &&
          (client.isError ? (
            <div className="doc-empty">
              <p>{t('clients.loadError')}</p>
              <IonButton fill="outline" onClick={() => void client.refetch()}>
                {t('common.retry')}
              </IonButton>
            </div>
          ) : (
            <ClientDetails client={client.data} />
          ))}

        {tab === 'documents' && (
          <DocumentFeed
            filter={{ clientId: id, status: statusFilter === 'all' ? undefined : statusFilter }}
            selectedType={selectedType}
            onSelectedTypeChange={setSelectedType}
          />
        )}

        {tab === 'ledger' && <LedgerView clientId={id} />}
      </IonContent>
    </IonPage>
  );
};

export default ClientPage;
