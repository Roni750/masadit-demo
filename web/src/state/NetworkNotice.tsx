import { useIonToast } from '@ionic/react';
import { cloudDoneOutline, cloudOfflineOutline } from 'ionicons/icons';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsOnline } from './network';

// Tells the user when the connection drops (staying up until it returns) and when it's back
export const NetworkNotice: React.FC = () => {
  const isOnline = useIsOnline();
  const { t } = useTranslation();
  // Two hooks: each owns one toast, and one can't be re-presented right after being dismissed
  const [presentOffline, dismissOffline] = useIonToast();
  const [presentOnline] = useIonToast();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline && !wasOffline.current) {
      wasOffline.current = true;
      void presentOffline({
        message: t('network.offline'),
        icon: cloudOfflineOutline,
        position: 'top',
        color: 'dark',
        cssClass: 'network-toast',
        buttons: [{ text: t('common.ok'), role: 'cancel' }],
      });
    } else if (isOnline && wasOffline.current) {
      wasOffline.current = false;
      void dismissOffline().then(() =>
        presentOnline({
          message: t('network.backOnline'),
          icon: cloudDoneOutline,
          position: 'top',
          color: 'success',
          duration: 2500,
          cssClass: 'network-toast',
        }),
      );
    }
  }, [isOnline, presentOffline, dismissOffline, presentOnline, t]);

  return null;
};
