import { IonButton, IonIcon, IonSkeletonText } from '@ionic/react';
import { person } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import type { DocumentSummary } from '../../domain/documents';
import { formatMoney } from '../../lib/format';
import { useIntlLocale } from '../../state/locale';
import { StatusPill } from '../history/StatusPill';
import './documents.css';

interface ClosingSummaryCardProps {
  document: DocumentSummary | undefined;
  balanceLabel: string;
  showStatus?: boolean;
  /** Rendered as a "close manually" button when provided */
  onManualClose?: () => void;
  busy?: boolean;
}

export const ClosingSummaryCard: React.FC<ClosingSummaryCardProps> = ({
  document,
  balanceLabel,
  showStatus = true,
  onManualClose,
  busy = false,
}) => {
  const { t } = useTranslation();
  const locale = useIntlLocale();

  if (!document) {
    return (
      <section className="doc-section closing-summary" aria-hidden="true">
        <IonSkeletonText animated style={{ width: '50%', height: 18 }} />
        <IonSkeletonText animated style={{ width: '30%' }} />
      </section>
    );
  }

  return (
    <section className="doc-section closing-summary">
      <div className="closing-summary__grid">
        <div>
          <strong>{t(`documentType.${document.type}`)}</strong>
          <div className="doc-muted"># {document.number}</div>
          <div className="doc-muted">{formatMoney(document.totalIls, locale)}</div>
          <div className="doc-muted doc-inline">
            <IonIcon icon={person} aria-hidden="true" />
            {document.client.name}
          </div>
        </div>
        <div className="closing-summary__balance">
          {balanceLabel}
          <strong>{formatMoney(document.openBalanceIls, locale)}</strong>
        </div>
        {showStatus && <StatusPill document={document} />}
      </div>
      {onManualClose && (
        <IonButton className="closing-summary__manual" fill="outline" disabled={busy} onClick={onManualClose}>
          {t('closing.manualClose')}
        </IonButton>
      )}
    </section>
  );
};
