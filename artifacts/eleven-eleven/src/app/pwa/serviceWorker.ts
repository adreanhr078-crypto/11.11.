export type ServiceWorkerRegistrationOutcome =
  | 'registered'
  | 'unsupported'
  | 'failed';

export function serviceWorkerIsSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

/**
 * The worker caches interface and archive assets only. It never caches player
 * API responses or authoritative rewards.
 */
export async function registerElevenServiceWorker(
  production: boolean,
): Promise<ServiceWorkerRegistrationOutcome> {
  if (!production || !serviceWorkerIsSupported()) return 'unsupported';
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return 'registered';
  } catch {
    return 'failed';
  }
}
