export const PLAYER_REQUEST_TIMEOUT_MS = 15_000;

export class PlayerTransportError extends Error {
  constructor(
    readonly code: 'request_timeout' | 'network_failure',
    message: string,
  ) {
    super(message);
    this.name = 'PlayerTransportError';
  }
}

export async function fetchPlayerRequest(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = PLAYER_REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    timer = setTimeout(() => controller.abort(), timeoutMs);
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new PlayerTransportError(
        'request_timeout',
        'Player service request timed out.',
      );
    }
    throw new PlayerTransportError(
      'network_failure',
      'Player service could not be reached.',
    );
  } finally {
    if (timer) clearTimeout(timer);
  }
}
