import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  useIonActionSheet,
} from '@ionic/react';
import { ellipsisVertical } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useErrorToast } from '../../hooks/useErrorToast';
import { formatDate, formatMoney } from '../../lib/format';
import { pages, useAppRouter } from '../../pages';
import { useIntlLocale } from '../../state/locale';
import { ClosingRow } from './ClosingRow';
import { ClosingSummaryCard } from './ClosingSummaryCard';
import { useAllocate, useClosingCandidates, useDocument, useRemoveAllocation } from './queries';
import './documents.css';

// "Status" of a document: what closes it. Checked rows are existing closing links,
// unchecked rows are documents that could close it; toggling one creates or removes the link.
const StatusPage: React.FC = () => {
  const id = Number(useParams().id);
  const { t } = useTranslation();
  const locale = useIntlLocale();
  const router = useAppRouter();
  const showError = useErrorToast();
  const [presentActionSheet] = useIonActionSheet();

  const { data: document, summary } = useDocument(id);
  const candidates = useClosingCandidates(id);
  const allocate = useAllocate();
  const removeAllocation = useRemoveAllocation();

  // Disable the list while a change is in flight, so a double tap can't send two writes
  const busy = allocate.isPending || removeAllocation.isPending;
  const targetIsOpen = summary?.status === 'open' && !summary.isCancelled;
  const typeName = summary ? t(`documentType.${summary.type}`) : '';

  const openMenu = () => {
    void pages.closeOther.preload();
    return presentActionSheet({
      buttons: [
        {
          text: t('closing.closeOtherWith', { type: typeName, number: summary?.number }),
          handler: () => router.push(`/documents/${id}/close-other`),
        },
        { text: t('document.close'), role: 'cancel' },
      ],
    });
  };

  const rows = document && candidates.data && [
    ...document.closedBy.map((allocation) => (
      <ClosingRow
        key={`allocation-${allocation.id}`}
        label={
          allocation.closer
            ? `${t(`documentType.${allocation.closer.type}`)} # ${allocation.closer.number}`
            : t('closing.manualClose')
        }
        amount={formatMoney(allocation.amountIls, locale)}
        checked
        disabled={busy}
        pending={removeAllocation.isPending && removeAllocation.variables === allocation.id}
        onToggle={() => removeAllocation.mutate(allocation.id, { onError: showError })}
      />
    )),
    // The document and candidate queries refresh independently after a write; skip candidates
    // the (possibly fresher) document already shows as linked, so a row never appears twice
    ...candidates.data
      .filter((candidate) => !document.closedBy.some((allocation) => allocation.closer?.id === candidate.id))
      .map((candidate) => (
      <ClosingRow
        key={`candidate-${candidate.id}`}
        label={`${t(`documentType.${candidate.type}`)} # ${candidate.number}`}
        detail={formatDate(candidate.issuedAt, locale)}
        amount={formatMoney(candidate.openBalanceIls, locale)}
        checked={false}
        disabled={busy || !targetIsOpen}
        pending={allocate.isPending && allocate.variables?.closerId === candidate.id}
        onToggle={() => allocate.mutate({ targetId: id, closerId: candidate.id }, { onError: showError })}
      />
    )),
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/documents/${id}`} text="" />
          </IonButtons>
          <IonTitle>{t('closing.statusTitle', { type: typeName })}</IonTitle>
          <IonButtons slot="end">
            <IonButton aria-label={t('document.menu')} onClick={() => void openMenu()}>
              <IonIcon slot="icon-only" icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="doc-content">
        <ClosingSummaryCard
          document={summary}
          balanceLabel={t('closing.remainingOpen')}
          busy={busy}
          onManualClose={
            targetIsOpen
              ? () => allocate.mutate({ targetId: id, closerId: null }, { onError: showError })
              : undefined
          }
        />

        <section className="doc-section">
          {summary && (
            <h2 className="doc-section__title">
              {t('closing.closedBy', { type: typeName, number: summary.number })}
            </h2>
          )}
          {!rows &&
            [0, 1].map((key) => (
              <div key={key} className="closing-row" aria-hidden="true">
                <IonSkeletonText animated style={{ width: '60%' }} />
              </div>
            ))}
          {rows?.length === 0 && <p className="doc-empty">{t('closing.noCandidates')}</p>}
          {rows}
        </section>
      </IonContent>
    </IonPage>
  );
};

export default StatusPage;
