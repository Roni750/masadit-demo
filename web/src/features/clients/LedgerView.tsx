import { IonButton, IonIcon, IonSkeletonText, useIonActionSheet, useIonRouter } from '@ionic/react';
import { ellipsisVertical } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import type { LedgerEntry } from '../../domain/clients';
import { useWipAlert } from '../../hooks/useWipAlert';
import { formatDate, formatMoney } from '../../lib/format';
import { useIntlLocale } from '../../state/locale';
import { useLedger } from './queries';
import './clients.css';

export const LedgerView: React.FC<{ clientId: number }> = ({ clientId }) => {
  const { t } = useTranslation();
  const locale = useIntlLocale();
  const router = useIonRouter();
  const showWip = useWipAlert();
  const [presentActionSheet] = useIonActionSheet();
  const ledger = useLedger(clientId);

  const balance = ledger.data?.balance.amount ?? 0;
  const balanceNote =
    balance > 0 ? t('clients.ledger.creditBalance') : balance < 0 ? t('clients.ledger.debitBalance') : t('clients.ledger.settled');

  const entryLabel = (entry: LedgerEntry) => {
    if (entry.kind === 'openingBalance') return t('clients.ledger.openingBalance');
    const document = entry.document ? `${t(`documentType.${entry.document.type}`)} # ${entry.document.number}` : '';
    return entry.kind === 'payment' ? `${t('clients.ledger.payment')} · ${document}` : document;
  };

  const openMenu = () =>
    presentActionSheet({
      buttons: [
        { text: t('clients.ledger.title'), role: 'selected' },
        { text: t('clients.ledger.dealLedger'), handler: () => void showWip() },
        { text: t('document.close'), role: 'cancel' },
      ],
    });

  return (
    <>
      <section className="doc-section ledger-header">
        <IonButton fill="clear" className="ledger-header__menu" aria-label={t('document.menu')} onClick={() => void openMenu()}>
          <IonIcon slot="icon-only" icon={ellipsisVertical} />
        </IonButton>
        <h2>{t('clients.ledger.title')}</h2>
        {ledger.data ? (
          <>
            <div className={`ledger-balance ${balance >= 0 ? 'ledger-balance--credit' : 'ledger-balance--debit'}`}>
              {t('clients.ledger.balance')}: {formatMoney(ledger.data.balance, locale)}
            </div>
            <div className="doc-muted">{balanceNote}</div>
          </>
        ) : (
          <IonSkeletonText animated style={{ width: '40%', margin: '8px auto' }} />
        )}
      </section>

      {ledger.isPending &&
        [0, 1, 2].map((key) => (
          <div key={key} className="doc-section ledger-entry" aria-hidden="true">
            <IonSkeletonText animated style={{ width: '70%' }} />
          </div>
        ))}

      {ledger.data?.entries.length === 0 && <p className="doc-empty">{t('clients.ledger.empty')}</p>}

      {ledger.data?.entries.map((entry, index) => {
        const content = (
          <>
            <div className="ledger-entry__main">
              <span className="doc-muted">{formatDate(entry.date, locale)}</span>
              <strong>{entryLabel(entry)}</strong>
            </div>
            <div className="ledger-entry__amounts">
              {entry.debit.amount > 0 && (
                <span className="ledger-amount ledger-amount--debit">
                  {formatMoney(entry.debit, locale)} {t('clients.ledger.debit')}
                </span>
              )}
              {entry.credit.amount > 0 && (
                <span className="ledger-amount ledger-amount--credit">
                  {formatMoney(entry.credit, locale)} {t('clients.ledger.credit')}
                </span>
              )}
            </div>
            <div className="ledger-entry__balance">
              <span>{formatMoney(entry.balance, locale)}</span>
              <span className="doc-muted">{t('clients.ledger.balance')}</span>
            </div>
          </>
        );

        return entry.document ? (
          <button
            key={index}
            type="button"
            className="doc-section ledger-entry ledger-entry--link"
            onClick={() => router.push(`/documents/${entry.document!.id}`)}
          >
            {content}
          </button>
        ) : (
          <div key={index} className="doc-section ledger-entry">
            {content}
          </div>
        );
      })}
    </>
  );
};
