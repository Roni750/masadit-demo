import { Capacitor } from '@capacitor/core';
import { useCallback, useEffect, useState } from 'react';

// Chromium's install event; not in TypeScript's DOM types yet
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Offers "install app" from inside the PWA. Browsers fire `beforeinstallprompt` only when the app
 * is installable and not installed yet (Chrome, Edge, Samsung Internet; Safari never fires it),
 * so `canInstall` is false in the native app, in an installed PWA, and on unsupported browsers.
 */
export const useInstallPrompt = () => {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const onPrompt = (event: Event) => {
      // Keep the browser's own mini-infobar from showing; the app offers its own button instead
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setPromptEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    // The event can be used once
    setPromptEvent(null);
  }, [promptEvent]);

  return { canInstall: promptEvent !== null, install };
};
