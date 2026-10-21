import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useEffect } from 'react';
import { useAppRouter } from '../../pages';

// Opens the document a reminder is about when the user taps the notification.
// Rendered inside the router so it can navigate; works whether the app was open or cold-started.
export const NotificationRouter: React.FC = () => {
  const router = useAppRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
      const documentId = Number(notification.extra?.documentId);
      if (documentId) router.push(`/documents/${documentId}`);
    });
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [router]);

  return null;
};
