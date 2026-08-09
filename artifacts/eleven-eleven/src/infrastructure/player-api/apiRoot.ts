const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

function isLoopbackHost(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(hostname.toLowerCase());
}

export function resolvePlayerApiRoot(
  configuredValue: string | undefined,
  currentOrigin?: string,
): string {
  const fallback = '/api/player';
  const configured = configuredValue?.trim();
  if (!configured) return fallback;

  const origin = currentOrigin?.trim();
  if (!origin) return configured.replace(/\/$/, '');

  try {
    const configuredUrl = new URL(configured, origin);
    const currentUrl = new URL(origin);
    if (
      isLoopbackHost(configuredUrl.hostname)
      && !isLoopbackHost(currentUrl.hostname)
    ) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return configured.replace(/\/$/, '');
}

export function playerApiRoot(
  configuredValue: string | undefined,
): string {
  const currentOrigin = typeof window === 'undefined'
    ? undefined
    : window.location.origin;
  return resolvePlayerApiRoot(configuredValue, currentOrigin);
}
