import { useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface PWAState {
  needRefresh: boolean;
  offlineReady: boolean;
  isUpdateAvailable: boolean;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    needRefresh: false,
    offlineReady: false,
    isUpdateAvailable: false,
  });

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('SW registered:', registration);

      // Check for updates periodically
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
    onNeedRefresh() {
      setState((prev) => ({ ...prev, needRefresh: true, isUpdateAvailable: true }));
    },
    onOfflineReady() {
      setState((prev) => ({ ...prev, offlineReady: true }));
    },
  });

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      needRefresh,
      offlineReady,
    }));
  }, [needRefresh, offlineReady]);

  const acceptUpdate = useCallback(() => {
    updateServiceWorker(true);
    setNeedRefresh(false);
    setState((prev) => ({ ...prev, needRefresh: false, isUpdateAvailable: false }));
  }, [updateServiceWorker, setNeedRefresh]);

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
    setState((prev) => ({ ...prev, needRefresh: false }));
  }, [setNeedRefresh]);

  const dismissOfflineReady = useCallback(() => {
    setOfflineReady(false);
    setState((prev) => ({ ...prev, offlineReady: false }));
  }, [setOfflineReady]);

  return {
    ...state,
    acceptUpdate,
    dismissUpdate,
    dismissOfflineReady,
  };
}
