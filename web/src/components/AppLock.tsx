import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { IonButton, IonIcon } from '@ionic/react';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { fingerPrint } from 'ionicons/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import './AppLock.css';

// Re-lock when the app comes back after this long in the background
const RELOCK_AFTER_MS = 60_000;

// Financial data stays behind the device's fingerprint / face unlock (or its PIN as a fallback)
// in the native app. Devices without biometrics or a screen lock aren't locked; the web isn't either.
export const AppLock: React.FC = () => {
  const { t } = useTranslation();
  const [locked, setLocked] = useState(false);
  const backgroundedAt = useRef<number | null>(null);
  const verifying = useRef(false);

  const unlock = useCallback(async () => {
    if (verifying.current) return;
    verifying.current = true;
    try {
      await NativeBiometric.verifyIdentity({
        title: t('lock.title'),
        reason: t('lock.reason'),
        useFallback: true,
      });
      setLocked(false);
    } catch {
      // Cancelled or not recognized: stay locked, the button lets the user try again
    } finally {
      verifying.current = false;
    }
  }, [t]);

  const lockIfAvailable = useCallback(async () => {
    const { isAvailable } = await NativeBiometric.isAvailable({ useFallback: true }).catch(() => ({ isAvailable: false }));
    if (!isAvailable) return;
    setLocked(true);
    void unlock();
  }, [unlock]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void lockIfAvailable();

    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        backgroundedAt.current = Date.now();
      } else if (backgroundedAt.current && Date.now() - backgroundedAt.current > RELOCK_AFTER_MS) {
        void lockIfAvailable();
      }
    });
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [lockIfAvailable]);

  if (!locked) return null;

  return (
    <div className="app-lock" role="dialog" aria-modal="true" aria-label={t('lock.title')}>
      <Logo size={96} />
      <h1>{t('lock.title')}</h1>
      <IonButton shape="round" onClick={() => void unlock()}>
        <IonIcon slot="start" icon={fingerPrint} />
        {t('lock.unlock')}
      </IonButton>
    </div>
  );
};
