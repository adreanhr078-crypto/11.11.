import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PlayerApiError, readJsonBody } from '../../functions/api/player/_shared';

const options = {
  maxBytes: 32,
  tooLargeCode: 'body_too_large',
  tooLargeMessage: 'Body too large.',
  invalidMessage: 'Body invalid.',
};

describe('bounded JSON request bodies', () => {
  it('accepts a valid body when Content-Length is absent', async () => {
    const body = await readJsonBody<{ action: string }>(
      new Request('https://example.test', {
        method: 'POST',
        body: JSON.stringify({ action: 'ping' }),
      }),
      options,
    );
    assert.deepEqual(body, { action: 'ping' });
  });

  it('rejects oversized bodies before route parsing', async () => {
    await assert.rejects(
      () => readJsonBody(new Request('https://example.test', {
        method: 'POST',
        body: JSON.stringify({ payload: 'x'.repeat(100) }),
      }), options),
      (error: unknown) => error instanceof PlayerApiError && error.status === 413 && error.code === 'body_too_large',
    );
  });

  it('returns a structured error for malformed JSON', async () => {
    await assert.rejects(
      () => readJsonBody(new Request('https://example.test', {
        method: 'POST',
        body: '{invalid',
      }), options),
      (error: unknown) => error instanceof PlayerApiError && error.status === 400 && error.code === 'invalid_request',
    );
  });
});
