import { IonIcon, IonRippleEffect, IonSkeletonText } from '@ionic/react';
import { chevronForward, document as documentIcon } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import type { DocumentType, TypeTotal } from '../../domain/documents';
import { formatMoney } from '../../lib/format';
import { useIntlLocale } from '../../state/locale';
import './TypeTotalsPanel.css';

interface TypeTotalsPanelProps {
  totals: TypeTotal[] | undefined;
  selectedType: DocumentType | undefined;
  onSelect: (type: DocumentType | undefined) => void;
  /** Fired on touch-down, before the tap completes, so the data can start loading early */
  onIntent: (type: DocumentType | undefined) => void;
}

// The legacy app's "group by" panel: one row per document type with its total.
// Tapping a row filters the feed; the totals themselves don't change with the filter, so they stay cached.
export const TypeTotalsPanel: React.FC<TypeTotalsPanelProps> = ({ totals, selectedType, onSelect, onIntent }) => {
  const { t } = useTranslation();
  const locale = useIntlLocale();

  const visible = selectedType ? totals?.filter((total) => total.type === selectedType) : totals;

  return (
    <section className="type-totals" aria-label={t('history.filter')}>
      <button
        type="button"
        className={`type-totals__all ion-activatable ${selectedType ? '' : 'type-totals__all--selected'}`}
        aria-pressed={!selectedType}
        onPointerDown={() => onIntent(undefined)}
        onClick={() => onSelect(undefined)}
      >
        {t('history.all')}
        <IonRippleEffect />
      </button>

      <div className="type-totals__rows">
        {!visible &&
          [0, 1, 2].map((key) => (
            <div key={key} className="type-totals__row">
              <IonSkeletonText animated style={{ width: '40%' }} />
            </div>
          ))}

        {visible?.map((total) => (
          <button
            key={total.type}
            type="button"
            className="type-totals__row ion-activatable"
            aria-pressed={total.type === selectedType}
            onPointerDown={() => onIntent(total.type)}
            onClick={() => onSelect(total.type)}
          >
            <IonIcon icon={documentIcon} className="type-totals__icon" aria-hidden="true" />
            <span className="type-totals__name">{t(`documentType.${total.type}`)}</span>
            <span className="type-totals__amount">{formatMoney(total.totalIls, locale)}</span>
            {!selectedType && <IonIcon icon={chevronForward} className="type-totals__chevron" flipRtl aria-hidden="true" />}
            <IonRippleEffect />
          </button>
        ))}

        {selectedType && (
          <button
            type="button"
            className="type-totals__show-all"
            onPointerDown={() => onIntent(undefined)}
            onClick={() => onSelect(undefined)}
          >
            {t('history.showAll')}
          </button>
        )}
      </div>
    </section>
  );
};
