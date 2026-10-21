import {
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonRippleEffect,
} from '@ionic/react';
import { useRef } from 'react';
import { briefcase, flagOutline, person, shareSocialOutline, timeOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { isForeignCurrency, type DocumentSummary } from '../../domain/documents';
import { formatDate, formatMoney } from '../../lib/format';
import { tapFeedback } from '../../lib/native';
import { pages, useAppRouter } from '../../pages';
import { useIntlLocale } from '../../state/locale';
import { useShareDocument } from '../documents/useShareDocument';
import { StatusPill } from './StatusPill';
import './DocumentCard.css';

interface DocumentCardProps {
  document: DocumentSummary;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document }) => {
  const { t } = useTranslation();
  const locale = useIntlLocale();
  const router = useAppRouter();
  const foreign = isForeignCurrency(document);
  const shareDocument = useShareDocument();
  const sliding = useRef<HTMLIonItemSlidingElement>(null);

  // Runs a swipe action, then slides the card closed again
  const swipeAction = (action: () => unknown) => () => {
    void tapFeedback();
    void sliding.current?.close();
    action();
  };

  return (
    // Swiping the card reveals quick actions; Ionic mirrors the swipe direction in RTL
    <IonItemSliding ref={sliding} className="document-card-sliding" data-document-id={document.id}>
      <IonItem lines="none" className="document-card-item">
        {/* Two sibling buttons (card body and status pill) instead of nesting one inside the other */}
        <article className="document-card">
      <button
        type="button"
        className="document-card__body ion-activatable"
        onPointerDown={() => void pages.document.preload()}
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
        <StatusPill
          document={document}
          onPointerDown={() => void pages.status.preload()}
          onClick={() => router.push(`/documents/${document.id}/status`)}
        />
      </div>
        </article>
      </IonItem>

      <IonItemOptions side="end">
        <IonItemOption color="primary" onClick={swipeAction(() => shareDocument(document))}>
          <IonIcon slot="top" icon={shareSocialOutline} aria-hidden="true" />
          {t('document.share')}
        </IonItemOption>
        <IonItemOption color="medium" onClick={swipeAction(() => router.push(`/documents/${document.id}/status`))}>
          <IonIcon slot="top" icon={flagOutline} aria-hidden="true" />
          {t('document.editStatus')}
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
  );
};
