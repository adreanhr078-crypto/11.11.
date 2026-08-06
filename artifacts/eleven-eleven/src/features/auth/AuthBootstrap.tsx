import { useEffect } from 'react';
import { useAuthStore } from './authStore';

export function AuthBootstrap() {
  const initialize = useAuthStore((state) => state.actions.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return null;
}
