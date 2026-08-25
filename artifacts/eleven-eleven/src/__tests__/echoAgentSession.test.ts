import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
  echoAgentBaseUrl,
  onRequestPost,
} from '../../functions/api/echo/session';
import { verifyEchoAgentTicket } from '../domain/echo/echoAgentTicket';

const originalFetch = globalThis.fetch;
const secret = 'echo-agent-session-test-secret-that-is-longer-than-thirty-two-characters';

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function environment(overrides: Record<string, string | undefined> = {}) {
  return {
    FIREBASE_PROJECT_ID: 'eleven-test',
    FIREBASE_WEB_API_KEY: 'web-api-key',
    ECHO_AGENT_ENABLED: 'true',
    ECHO_AGENT_TICKET_SECRET: secret,
    ECHO_AGENT_URL: 'wss://echo.example',
    ECHO_AGENT_ALLOWED_ORIGINS: 'https://game.example',
    ...overrides,
  };
}

function request(origin = 'https://game.example'): Request {
  return new Request('https://game.example/api/echo/session', {
    method: 'POST',
    headers: {
      Origin: origin,
      Authorization: 'Bearer valid-id-token',
    },
  });
}

function authenticatePlayerFetch(): void {
  globalThis.fetch = async () => Response.json({
    users: [{
      localId: 'firebase-private-player-id',
      createdAt: '1700000000000',
      lastLoginAt: '1700000100000',
      providerUserInfo: [{ providerId: 'password' }],
    }],
  });
}

test('Echo Agent session endpoint gives an opaque origin-bound ticket with no provider or Firebase secret in the URL', async () => {
  authenticatePlayerFetch();
  const response = await onRequestPost({ request: request(), env: environment() });
  const body = await response.json() as {
    ticket: string;
    webSocketUrl: string;
    protocol: string;
    transport: string;
  };

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://game.example');
  assert.equal(body.protocol, 'echo-agent-v1');
  assert.equal(body.transport, 'deterministic-cues');
  assert.equal(body.webSocketUrl, 'wss://echo.example/v1/session');
  assert.equal(body.webSocketUrl.includes('ticket='), false);
  assert.equal(body.webSocketUrl.includes('firebase-private-player-id'), false);
  assert.equal(JSON.stringify(body).includes('firebase-private-player-id'), false);
  const ticket = await verifyEchoAgentTicket(secret, body.ticket);
  assert.ok(ticket);
  assert.equal(ticket!.origin, 'https://game.example');
});

test('Echo Agent session endpoint fails closed before authentication for disabled or untrusted origins', async () => {
  globalThis.fetch = async () => {
    throw new Error('authentication must not be requested');
  };
  const disabled = await onRequestPost({
    request: request(),
    env: environment({ ECHO_AGENT_ENABLED: 'false' }),
  });
  assert.equal(disabled.status, 503);
  assert.equal((await disabled.json() as { code: string }).code, 'echo_agent_unavailable');

  const untrusted = await onRequestPost({
    request: request('https://untrusted.example'),
    env: environment(),
  });
  assert.equal(untrusted.status, 403);
  assert.equal((await untrusted.json() as { code: string }).code, 'origin_not_allowed');
});

test('Echo Agent endpoint mirrors an explicitly admitted private LAN host only for local WS development', () => {
  const url = echoAgentBaseUrl(environment({
    ECHO_AGENT_URL: 'ws://127.0.0.1:8791',
    ECHO_AGENT_ALLOWED_ORIGINS: 'http://192.168.1.42:3000',
  }), new Request('http://127.0.0.1:8788/api/echo/session', {
    headers: { Origin: 'http://192.168.1.42:3000' },
  }));
  assert.equal(url.toString(), 'ws://192.168.1.42:8791/v1/session');
});
