import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchPlayerRequest,
  PlayerTransportError,
} from '../infrastructure/player-api/playerRequest';

test('player request timeout settles a stalled network operation', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = ((_input, init) => new Promise<Response>((_, reject) => {
    init?.signal?.addEventListener('abort', () => {
      reject(new DOMException('aborted', 'AbortError'));
    });
  })) as typeof fetch;

  try {
    await assert.rejects(
      fetchPlayerRequest('/api/player/profile', {}, 5),
      (error: unknown) => (
        error instanceof PlayerTransportError
        && error.code === 'request_timeout'
      ),
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('player request converts a network rejection into a settled transport error', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = (() => Promise.reject(new TypeError('offline'))) as typeof fetch;

  try {
    await assert.rejects(
      fetchPlayerRequest('/api/player/profile', {}, 5),
      (error: unknown) => (
        error instanceof PlayerTransportError
        && error.code === 'network_failure'
      ),
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});
