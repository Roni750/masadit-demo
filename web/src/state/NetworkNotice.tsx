import { useIonToast } from '@ionic/react';
import { cloudDoneOutline, cloudOfflineOutline } from 'ionicons/icons';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsOnline } from './network';

// The header of the screen on top of Ionic's navigation stack (Home has none).
// Scoped to the router outlet: <ion-app> carries the ion-page class too.
const visibleHeader = () =>
  [...document.querySelectorAll<HTMLElement>('ion-router-outlet > .ion-page:not(.ion-page-hidden) ion-header')].at(-1);

// Tells the user when the connection drops and when it's back
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
        // Just below the current screen's header, so toolbar buttons (back, Save) stay reachable
        positionAnchor: visibleHeader(),
        duration: 5000,
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
          positionAnchor: visibleHeader(),
          color: 'success',
          duration: 2500,
          cssClass: 'network-toast',
        }),
      );
    }
  }, [isOnline, presentOffline, dismissOffline, presentOnline, t]);

  return null;
};
