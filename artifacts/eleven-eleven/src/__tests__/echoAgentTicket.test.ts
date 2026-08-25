import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ECHO_AGENT_TICKET_TTL_SECONDS,
  deriveEchoAgentSubject,
  echoAgentTicketAllowsOrigin,
  issueEchoAgentTicket,
  verifyEchoAgentTicket,
} from '../domain/echo/echoAgentTicket';

const secret = 'echo-agent-ticket-test-secret-that-is-longer-than-thirty-two-characters';
const issuedAt = 1_780_000_000;

test('Echo Agent ticket is short-lived, origin-bound, and contains no Firebase UID', async () => {
  const uid = 'firebase-user-private-123';
  const token = await issueEchoAgentTicket(secret, {
    uid,
    origin: 'https://game.example',
    issuedAt,
    jti: 'echo-agent-ticket-test-0001',
  });
  const ticket = await verifyEchoAgentTicket(secret, token, issuedAt + 10);

  assert.ok(ticket);
  assert.equal(token.includes(uid), false);
  assert.equal(ticket!.origin, 'https://game.example');
  assert.equal(ticket!.exp - ticket!.iat, ECHO_AGENT_TICKET_TTL_SECONDS);
  assert.match(ticket!.sub, /^[a-f0-9]{64}$/);
  assert.equal(echoAgentTicketAllowsOrigin(ticket!, 'https://game.example'), true);
  assert.equal(echoAgentTicketAllowsOrigin(ticket!, 'https://other.example'), false);
});

test('Echo Agent subject is stable per player but tickets reject tampering, wrong secrets, and expiry', async () => {
  const token = await issueEchoAgentTicket(secret, {
    uid: 'player-a',
    origin: 'https://game.example',
    issuedAt,
    jti: 'echo-agent-ticket-test-0002',
  });
  const [body, signature] = token.split('.');
  assert.ok(body && signature);
  const tampered = `${body!.slice(0, -1)}${body!.endsWith('a') ? 'b' : 'a'}.${signature}`;

  assert.equal(await verifyEchoAgentTicket(secret, tampered, issuedAt), null);
  assert.equal(await verifyEchoAgentTicket(`${secret}-wrong`, token, issuedAt), null);
  assert.equal(await verifyEchoAgentTicket(secret, token, issuedAt + 121), null);
  assert.equal(
    await deriveEchoAgentSubject(secret, 'player-a'),
    await deriveEchoAgentSubject(secret, 'player-a'),
  );
  assert.notEqual(
    await deriveEchoAgentSubject(secret, 'player-a'),
    await deriveEchoAgentSubject(secret, 'player-b'),
  );
});

test('Echo Agent tickets reject public HTTP origins and cannot be stretched past two minutes', async () => {
  await assert.rejects(
    issueEchoAgentTicket(secret, {
      uid: 'player-a',
      origin: 'http://game.example',
      issuedAt,
    }),
  );
  const token = await issueEchoAgentTicket(secret, {
    uid: 'player-a',
    origin: 'http://192.168.1.42:3000',
    issuedAt,
    ttlSeconds: 999,
    jti: 'echo-agent-ticket-test-0003',
  });
  const ticket = await verifyEchoAgentTicket(secret, token, issuedAt);
  assert.ok(ticket);
  assert.equal(ticket!.exp - ticket!.iat, ECHO_AGENT_TICKET_TTL_SECONDS);
});
