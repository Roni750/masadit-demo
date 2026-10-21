import { useIonAlert } from '@ionic/react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// Asks before an irreversible action; resolves to true only on "yes"
export const useConfirm = () => {
  const [present] = useIonAlert();
  const { t } = useTranslation();

  return useCallback(
    (header: string) =>
      new Promise<boolean>((resolve) => {
        void present({
          header,
          buttons: [
            { text: t('document.no'), role: 'cancel' },
            { text: t('document.yes'), role: 'destructive' },
          ],
          onDidDismiss: (event) => resolve(event.detail.role === 'destructive'),
        });
      }),
    [present, t],
  );
};
