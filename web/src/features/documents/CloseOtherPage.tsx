import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { documentsOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useErrorToast } from '../../hooks/useErrorToast';
import { formatDate, formatMoney } from '../../lib/format';
import { useIntlLocale } from '../../state/locale';
import { ClosingRow } from './ClosingRow';
import { ClosingSummaryCard } from './ClosingSummaryCard';
import { useAllocate, useClosableDocuments, useDocument, useRemoveAllocation } from './queries';
import './documents.css';

// The reverse of the status page: which documents this one closes, and which it still could
const CloseOtherPage: React.FC = () => {
  const id = Number(useParams().id);
  const { t } = useTranslation();
  const locale = useIntlLocale();
  const showError = useErrorToast();

  const { data: document, summary } = useDocument(id);
  const closable = useClosableDocuments(id);
  const allocate = useAllocate();
  const removeAllocation = useRemoveAllocation();

  const busy = allocate.isPending || removeAllocation.isPending;
  const typeName = summary ? t(`documentType.${summary.type}`) : '';

  const rows = document && closable.data && [
    ...document.closes.map((allocation) => (
      <ClosingRow
        key={`allocation-${allocation.id}`}
        label={`${t(`documentType.${allocation.target.type}`)} # ${allocation.target.number}`}
        amount={formatMoney(allocation.amountIls, locale)}
        checked
        disabled={busy}
        pending={removeAllocation.isPending && removeAllocation.variables === allocation.id}
        onToggle={() => removeAllocation.mutate(allocation.id, { onError: showError })}
      />
    )),
    // Same as the status page: never list a target the document already shows as closed by this one
    ...closable.data
      .filter((target) => !document.closes.some((allocation) => allocation.target.id === target.id))
      .map((target) => (
      <ClosingRow
        key={`closable-${target.id}`}
        label={`${t(`documentType.${target.type}`)} # ${target.number}`}
        detail={formatDate(target.issuedAt, locale)}
        amount={formatMoney(target.openBalanceIls, locale)}
        checked={false}
        disabled={busy}
        pending={allocate.isPending && allocate.variables?.targetId === target.id}
        onToggle={() => allocate.mutate({ targetId: target.id, closerId: id }, { onError: showError })}
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
          <IonTitle>{t('closing.closeOtherTitle')}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="doc-content">
        <ClosingSummaryCard document={summary} balanceLabel={t('closing.balance')} showStatus={false} />

        {!rows && (
          <section className="doc-section" aria-hidden="true">
            {[0, 1].map((key) => (
              <div key={key} className="closing-row">
                <IonSkeletonText animated style={{ width: '60%' }} />
              </div>
            ))}
          </section>
        )}

        {rows && rows.length > 0 && <section className="doc-section">{rows}</section>}

        {rows?.length === 0 && (
          <div className="doc-empty">
            <IonIcon icon={documentsOutline} style={{ fontSize: 64 }} aria-hidden="true" />
            <h2>{t('closing.emptyTitle')}</h2>
            <p>{t('closing.emptyClosable', { type: typeName, number: summary?.number })}</p>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default CloseOtherPage;
