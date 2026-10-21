import { useIonAlert } from '@ionic/react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// For actions outside the assignment's scope (DECISIONS.md #2): they stay tappable and explain why nothing happens
export const useWipAlert = () => {
  const [present] = useIonAlert();
  const { t } = useTranslation();

  return useCallback(
    () => present({ header: t('common.wipTitle'), message: t('common.wipMessage'), buttons: [t('common.ok')] }),
    [present, t],
  );
};
