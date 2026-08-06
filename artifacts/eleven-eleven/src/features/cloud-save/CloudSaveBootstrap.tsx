import { useEffect } from 'react';
import { useAuthStore } from '../auth/authStore';
import {
  startCloudSaveSync,
  stopCloudSaveSync,
} from './cloudSaveCoordinator';

export function CloudSaveBootstrap() {
  const status = useAuthStore((state) => state.status);
  const uid = useAuthStore((state) => state.user?.uid ?? null);

  useEffect(() => {
    if (status !== 'signed-in' || !uid) {
      stopCloudSaveSync();
      return;
    }

    void startCloudSaveSync(uid);
    return () => stopCloudSaveSync();
  }, [status, uid]);

  return null;
}
