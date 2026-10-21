import { useEffect, useRef } from 'react';

interface BackButtonEvent extends Event {
  detail: { register: (priority: number, handler: (processNextHandler: () => void) => void) => void };
}

// Intercepts Android's hardware back button while `active`. Ionic's own navigation handler is
// registered at priority 0, so priority 10 runs first and decides whether to let it continue.
export const useHardwareBackGuard = (active: boolean, onBack: () => void) => {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!active) return;
    const listener = (event: Event) => {
      (event as BackButtonEvent).detail.register(10, () => onBackRef.current());
    };
    document.addEventListener('ionBackButton', listener);
    return () => document.removeEventListener('ionBackButton', listener);
  }, [active]);
};
