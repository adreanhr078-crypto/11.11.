import { useEffect } from 'react';
import { useAuthStore } from '../auth/authStore';
import {
  startPlayerSync,
  stopPlayerSync,
} from './playerSyncCoordinator';

/** The single application owner for authenticated player readiness. */
export function PlayerSyncBootstrap() {
  const authStatus = useAuthStore((state) => state.status);
  const uid = useAuthStore((state) => state.user?.uid ?? null);

  useEffect(() => {
    if (authStatus !== 'signed-in' || !uid) {
      stopPlayerSync();
      return;
    }

    void startPlayerSync(uid);
    return () => stopPlayerSync();
  }, [authStatus, uid]);

  return null;
}
