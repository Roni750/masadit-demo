import { useIonToast } from '@ionic/react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { DocumentSummary } from '../../domain/documents';
import { formatDate, formatMoney } from '../../lib/format';
import { shareText } from '../../lib/native';
import { useIntlLocale } from '../../state/locale';

// Shares a short, readable summary of a document through the system share sheet
export const useShareDocument = () => {
  const { t } = useTranslation();
  const locale = useIntlLocale();
  const [presentToast] = useIonToast();

  return useCallback(
    async (document: DocumentSummary) => {
      const title = `${t(`documentType.${document.type}`)} #${document.number}`;
      const text = [
        title,
        document.client.name,
        formatDate(document.issuedAt, locale),
        `${t('document.totalToPay')}: ${formatMoney(document.totalIls, locale)}`,
        `${t('export.status')}: ${t(`status.${document.isCancelled ? 'cancelled' : document.status}`)}`,
      ].join('\n');

      const result = await shareText(title, text).catch(() => 'cancelled' as const);
      if (result === 'copied') {
        void presentToast({ message: t('document.copied'), duration: 2000, position: 'bottom' });
      }
    },
    [t, locale, presentToast],
  );
};
