import assert from 'node:assert/strict';
import test from 'node:test';
import { realtimeBaseUrl } from '../../functions/api/player/network/ticket';
import type { PlayerApiEnv } from '../../functions/api/player/_shared';

const localEnv: PlayerApiEnv = {
  PLAYER_REALTIME_URL: 'http://127.0.0.1:8790',
  PLAYER_ALLOWED_ORIGINS: 'http://localhost:3000,http://192.168.1.42:3000',
};

test('a phone on an explicitly allow-listed private LAN receives the desktop realtime host', () => {
  const base = realtimeBaseUrl(localEnv, new Request('http://127.0.0.1:8788/api/player/network/ticket', {
    headers: { Origin: 'http://192.168.1.42:3000' },
  }));
  assert.equal(base.toString(), 'http://192.168.1.42:8790/');
});

test('a forged, public, or unconfigured Origin cannot rewrite a local realtime target', () => {
  for (const origin of ['http://203.0.113.42:3000', 'http://192.168.1.99:3000', 'not a url']) {
    const base = realtimeBaseUrl(localEnv, new Request('http://127.0.0.1:8788/api/player/network/ticket', {
      headers: { Origin: origin },
    }));
    assert.equal(base.toString(), 'http://127.0.0.1:8790/');
  }
});

test('a production HTTPS realtime origin stays configured even when a LAN origin is present', () => {
  const base = realtimeBaseUrl({
    PLAYER_REALTIME_URL: 'https://realtime.example.com',
    PLAYER_ALLOWED_ORIGINS: 'http://192.168.1.42:3000',
  }, new Request('https://game.example/api/player/network/ticket', {
    headers: { Origin: 'http://192.168.1.42:3000' },
  }));
  assert.equal(base.toString(), 'https://realtime.example.com/');
});
