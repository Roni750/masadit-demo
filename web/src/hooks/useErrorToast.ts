import { useIonToast } from '@ionic/react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../api/http';

// Shows a failed write as a translated toast. The API's error codes map to messages in the
// `errors` namespace; anything unknown falls back to a generic message.
export const useErrorToast = () => {
  const [present] = useIonToast();
  const { t, i18n } = useTranslation();

  return useCallback(
    (error: unknown) => {
      const key = error instanceof ApiError ? `errors.${error.code}` : 'errors.generic';
      void present({
        message: i18n.exists(key) ? t(key) : t('errors.generic'),
        duration: 3000,
        color: 'danger',
        position: 'bottom',
      });
    },
    [present, t, i18n],
  );
};
