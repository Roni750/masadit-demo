import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  useIonActionSheet,
  useIonToast,
  type RefresherEventDetail,
} from '@ionic/react';
import { useQueryClient } from '@tanstack/react-query';
import { addCircle, filter as filterIcon, optionsOutline } from 'ionicons/icons';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { documentKeys } from '../../api/queryKeys';
import type { DocumentType } from '../../domain/documents';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useErrorToast } from '../../hooks/useErrorToast';
import { useWipAlert } from '../../hooks/useWipAlert';
import { whenIdle } from '../../lib/lazyPage';
import { pages } from '../../pages';
import { directionAtom } from '../../state/locale';
import { DocumentFeed } from './DocumentFeed';
import { exportDocuments } from './exportDocuments';
import './HistoryPage.css';

const HistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showWip = useWipAlert();
  const [presentActionSheet] = useIonActionSheet();
  // Separate hooks: each owns one toast, and one can't be re-presented right after being dismissed
  const [presentProgress, dismissProgress] = useIonToast();
  const [presentResult] = useIonToast();
  const showError = useErrorToast();
  const direction = useAtomValue(directionAtom);

  const [searchInput, setSearchInput] = useState('');
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedType, setSelectedType] = useState<DocumentType>();
  const [exporting, setExporting] = useState(false);
  const search = useDebouncedValue(searchInput.trim(), 300) || undefined;

  // A document is the likely next screen
  useEffect(() => whenIdle(() => void pages.document.preload()), []);

  const refresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await queryClient.invalidateQueries({ queryKey: documentKeys.all });
    event.detail.complete();
  };

  // Exports what's on screen: the current search and document type, across all pages
  const runExport = async (detailed: boolean) => {
    if (exporting) return;
    setExporting(true);
    // Stays up until the export finishes
    await presentProgress({ message: t('export.preparing'), position: 'bottom' });
    try {
      const count = await exportDocuments({
        filter: { search, type: selectedType },
        detailed,
        t,
        rightToLeft: direction === 'rtl',
      });
      await dismissProgress();
      void presentResult({ message: t('export.done', { count }), duration: 2500, position: 'bottom' });
    } catch (error) {
      await dismissProgress();
      showError(error);
    } finally {
      setExporting(false);
    }
  };

  const openActions = () =>
    presentActionSheet({
      header: t('history.actions'),
      buttons: [
        { text: t('history.exportExcel'), handler: () => void runExport(false) },
        { text: t('history.exportExcelDetailed'), handler: () => void runExport(true) },
        { text: t('history.cancel'), role: 'cancel' },
      ],
    });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="" />
          </IonButtons>
          <IonTitle>{t('history.title')}</IonTitle>
          <IonButtons slot="end">
            <IonButton
              aria-label={t('history.filter')}
              aria-pressed={panelOpen}
              onClick={() => setPanelOpen((open) => !open)}
            >
              <IonIcon slot="icon-only" icon={filterIcon} />
            </IonButton>
            <IonButton data-action="actions" aria-label={t('history.actions')} onClick={() => void openActions()}>
              <IonIcon slot="icon-only" icon={optionsOutline} />
            </IonButton>
            <IonButton aria-label={t('history.newDocument')} onClick={() => void showWip()}>
              <IonIcon slot="icon-only" icon={addCircle} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar className="history-search">
          <IonSearchbar
            value={searchInput}
            placeholder={t('history.searchPlaceholder')}
            onIonInput={(event) => setSearchInput(event.detail.value ?? '')}
          />
        </IonToolbar>
      </IonHeader>

      <IonContent className="history-content">
        <IonRefresher slot="fixed" onIonRefresh={refresh}>
          <IonRefresherContent />
        </IonRefresher>

        <DocumentFeed
          filter={{ search }}
          selectedType={selectedType}
          onSelectedTypeChange={setSelectedType}
          showTotals={panelOpen}
        />
      </IonContent>
    </IonPage>
  );
};

export default HistoryPage;
