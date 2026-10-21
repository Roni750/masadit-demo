import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

// Connectivity as TanStack Query sees it (fed by Capacitor's Network plugin, see api/queryClient.ts)
export const useIsOnline = () =>
  useSyncExternalStore(onlineManager.subscribe.bind(onlineManager), () => onlineManager.isOnline());
