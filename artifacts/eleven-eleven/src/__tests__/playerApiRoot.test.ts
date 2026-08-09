import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePlayerApiRoot } from '../infrastructure/player-api/apiRoot';

test('uses the same-origin player API when no URL is configured', () => {
  assert.equal(
    resolvePlayerApiRoot(undefined, 'https://eleven-eleven.pages.dev'),
    '/api/player',
  );
});

test('keeps the local API URL during local development', () => {
  assert.equal(
    resolvePlayerApiRoot(
      'http://127.0.0.1:8788/api/player/',
      'http://localhost:3000',
    ),
    'http://127.0.0.1:8788/api/player',
  );
});

test('does not send a hosted player to a local machine', () => {
  assert.equal(
    resolvePlayerApiRoot(
      'http://127.0.0.1:8788/api/player',
      'https://eleven-eleven.pages.dev',
    ),
    '/api/player',
  );
});

test('preserves a configured remote API URL', () => {
  assert.equal(
    resolvePlayerApiRoot(
      'https://api.example.com/api/player/',
      'https://eleven-eleven.pages.dev',
    ),
    'https://api.example.com/api/player',
  );
});
