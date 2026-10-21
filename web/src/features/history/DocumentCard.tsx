import { IonIcon, IonRippleEffect, useIonRouter } from '@ionic/react';
import { briefcase, person, timeOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { isForeignCurrency, type DocumentSummary } from '../../domain/documents';
import { formatDate, formatMoney } from '../../lib/format';
import { useIntlLocale } from '../../state/locale';
import { StatusPill } from './StatusPill';
import './DocumentCard.css';

interface DocumentCardProps {
  document: DocumentSummary;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document }) => {
  const { t } = useTranslation();
  const locale = useIntlLocale();
  const router = useIonRouter();
  const foreign = isForeignCurrency(document);

  return (
    // Two sibling buttons (card body and status pill) instead of nesting one inside the other
    <article className="document-card" data-document-id={document.id}>
      <button
        type="button"
        className="document-card__body ion-activatable"
        onClick={() => router.push(`/documents/${document.id}`)}
      >
        <div className="document-card__info">
          <h3 className="document-card__type">{t(`documentType.${document.type}`)}</h3>
          <div className="document-card__number"># {document.number}</div>
          {document.credits && (
            <div className="document-card__note">
              {t('document.creditFor', {
                type: t(`documentType.${document.credits.type}`),
                number: document.credits.number,
              })}
            </div>
          )}
          <div className="document-card__meta">
            <IonIcon icon={timeOutline} aria-hidden="true" />
            <span>{formatDate(document.issuedAt, locale)}</span>
          </div>
          <div className="document-card__meta">
            <IonIcon icon={person} aria-hidden="true" />
            <span>{document.client.name}</span>
            <span className="document-card__divider">|</span>
            <IonIcon icon={briefcase} aria-hidden="true" />
            <span>{document.branchNumber}</span>
          </div>
        </div>

        <div className="document-card__amounts">
          <div className="document-card__total">{formatMoney(document.totalIls, locale)}</div>
          {foreign && <div className="document-card__foreign">({formatMoney(document.total, locale)})</div>}
          {document.vatIls.amount > 0 && (
            <>
              <div className="document-card__vat">
                {formatMoney(document.vatIls, locale)} {t('document.vat')}
              </div>
              {foreign && (
                <div className="document-card__foreign">
                  ({formatMoney(document.vat, locale)}) {t('document.vat')}
                </div>
              )}
            </>
          )}
        </div>
        <IonRippleEffect />
      </button>

      <div className="document-card__status">
        <StatusPill document={document} onClick={() => router.push(`/documents/${document.id}/status`)} />
      </div>
    </article>
  );
};
