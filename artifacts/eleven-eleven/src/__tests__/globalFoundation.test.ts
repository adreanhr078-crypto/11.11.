import assert from 'node:assert/strict';
import {
  existsSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import {
  documentTitle,
  formatLocaleNumber,
  localeDirection,
  resolveLocale,
  translate,
} from '../app/i18n/runtime';
import {
  canUseServerOwnedAction,
  offlineCapabilityForScreen,
} from '../app/pwa/offlineCapabilities';
import { registerElevenServiceWorker } from '../app/pwa/serviceWorker';
import {
  createFeatureFlags,
} from '../app/config/featureFlags';
import {
  presentLiveChallengeReward,
  presentNetworkMatchReward,
  presentStoryPuzzleReward,
} from '../domain/rewards/rewardPresentation';
import {
  canEmitTelemetry,
  telemetryEventSchema,
  toTelemetryDataPoint,
} from '../domain/telemetry/telemetryContracts';
import type { LiveCompletionReceipt } from '../domain/live-challenges/liveChallengeContracts';
import type { MatchReceipt } from '../domain/echo-network/contracts';
import type { StoryPuzzleRewardReceipt } from '../domain/story-puzzles/storyPuzzleContracts';
import {
  onRequestPost as postTelemetry,
} from '../../functions/api/player/telemetry';
import { telemetrySurfaceForScreen } from '../app/telemetry/TelemetryBridge';
import type { AnalyticsEngineDataPoint } from '../domain/telemetry/telemetryContracts';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function authenticatedFetch(): void {
  globalThis.fetch = async () => Response.json({
    users: [{
      localId: 'foundation-player',
      createdAt: '1700000000000',
      lastLoginAt: '1700000001000',
      providerUserInfo: [{ providerId: 'anonymous' }],
    }],
  });
}

function telemetryRequest(body: unknown, authorized = true): Request {
  return new Request('https://game.example/api/player/telemetry', {
    method: 'POST',
    headers: {
      Origin: 'https://game.example',
      'Content-Type': 'application/json',
      ...(authorized ? { Authorization: 'Bearer valid-token' } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe('Global foundation contracts', () => {
  it('uses one locale runtime with deterministic RTL/LTR and title fallback', () => {
    assert.equal(resolveLocale('en'), 'en');
    assert.equal(resolveLocale('invalid'), 'ar');
    assert.equal(localeDirection('ar'), 'rtl');
    assert.equal(localeDirection('en'), 'ltr');
    assert.equal(translate('en', 'screen.echo-network'), 'Echo Network');
    assert.equal(documentTitle('en', 'echo-network'), 'Echo Network | 11.11 — Memory Journey');
    assert.equal(documentTitle('ar', 'unknown'), '11.11 — رحلة الذاكرة');
    assert.ok(formatLocaleNumber('en', 1111).includes('1'));
  });

  it('fails moderation-sensitive flags closed and preserves explicit archive behavior', () => {
    const defaults = createFeatureFlags({});
    assert.equal(defaults.communityFreeText, false);
    assert.equal(defaults.puzzleForgePublishing, false);
    assert.equal(defaults.telemetry, false);
    assert.equal(defaults.legacyPuzzleArchive, true);

    const configured = createFeatureFlags({
      VITE_AWAKENING_WARD_ENABLED: 'true',
      VITE_LEGACY_PUZZLE_ARCHIVE_ENABLED: 'false',
      VITE_COMMUNITY_FREE_TEXT_ENABLED: 'TRUE',
      VITE_PUZZLE_FORGE_PUBLISHING_ENABLED: 'invalid',
    });
    assert.equal(configured.awakeningWard, true);
    assert.equal(configured.legacyPuzzleArchive, false);
    assert.equal(configured.communityFreeText, true);
    assert.equal(configured.puzzleForgePublishing, false);
  });

  it('keeps offline access honest about server-owned progress and rewards', async () => {
    assert.deepEqual(offlineCapabilityForScreen('memories'), {
      availability: 'available',
      allowsServerProgress: false,
      allowsVerifiedRewards: false,
      fallback: 'local-archive',
    });
    assert.equal(offlineCapabilityForScreen('puzzles').availability, 'limited');
    assert.equal(offlineCapabilityForScreen('chess').availability, 'unavailable');
    assert.equal(canUseServerOwnedAction(false), false);
    assert.equal(canUseServerOwnedAction(true), true);
    assert.equal(await registerElevenServiceWorker(false), 'unsupported');
    assert.equal(telemetrySurfaceForScreen('memories'), 'manhwa');
    assert.equal(telemetrySurfaceForScreen('echo-network'), 'echo-network');
  });

  it('ships a lightweight, decorative, and accessible privacy visual contract', () => {
    const asset = resolve(
      process.cwd(),
      'public',
      'assets',
      'ui',
      'settings',
      'privacy-signal-contract-v1.webp',
    );
    assert.equal(existsSync(asset), true);
    assert.ok(statSync(asset).size > 10_000);
    assert.ok(statSync(asset).size < 80_000);

    const source = readFileSync(resolve(
      process.cwd(),
      'src',
      'features',
      'screens',
      'SettingsScreen.tsx',
    ), 'utf8');
    assert.ok(source.includes('privacy-signal-contract-v1.webp'));
    assert.ok(source.includes('loading="lazy"'));
    assert.ok(source.includes('aria-pressed={preferences.telemetryConsent'));
  });

  it('converts authoritative receipts into presentation-only data without a grant path', () => {
    const story = presentStoryPuzzleReward({
      awarded: true,
      puzzleId: 'puzzle_01',
      xpGranted: 80,
      coinsGranted: 12,
      perfectBonusCoins: 4,
      shardId: 'memory_01',
      echoImpact: { axis: 'memory', amount: 1, label: { ar: 'ذاكرة', en: 'Memory' } },
      snapshot: {},
    } as StoryPuzzleRewardReceipt);
    assert.equal(story.status, 'awarded');
    assert.equal(story.coinAmount, 16);
    assert.equal(story.memoryShardId, 'memory_01');

    const live = presentLiveChallengeReward({
      kind: 'weekly',
      challengeId: 'weekly_01',
      awarded: false,
      perfectSolve: false,
      xpGranted: 0,
      coinsGranted: 0,
      live: { weekly: { status: 'in_progress' } },
    } as LiveCompletionReceipt);
    assert.equal(live.status, 'progress-only');
    assert.equal(live.xpAmount, 0);

    const receipt = {
      receiptId: 'ec6ec744-a952-46a2-b872-ab2673ae1a74',
      rewards: [{ uid: 'player-a', rewardKey: 'match:1', xpAmount: 22, cosmeticIds: ['frame_red'] }],
    } as MatchReceipt;
    assert.equal(presentNetworkMatchReward(receipt, 'player-b'), null);
    assert.deepEqual(presentNetworkMatchReward(receipt, 'player-a')?.cosmeticIds, ['frame_red']);
  });

  it('rejects arbitrary telemetry fields and emits only bounded aggregate columns', () => {
    const event = {
      version: 1,
      event: 'screen_viewed',
      surface: 'echo-network',
      locale: 'ar',
      platform: 'web',
      networkState: 'online',
      durationMs: 1200,
    } as const;
    assert.equal(telemetryEventSchema.safeParse({ ...event, message: 'do not collect me' }).success, false);
    assert.equal(canEmitTelemetry({
      featureEnabled: true,
      serverEnabled: true,
      consent: 'unset',
      signedIn: true,
      online: true,
    }), false);
    assert.equal(canEmitTelemetry({
      featureEnabled: true,
      serverEnabled: true,
      consent: 'granted',
      signedIn: true,
      online: true,
    }), true);
    assert.deepEqual(toTelemetryDataPoint(event), {
      blobs: ['screen_viewed', 'echo-network', 'ar', 'web', 'online'],
      doubles: [1200],
      indexes: ['screen_viewed'],
    });
  });
});

describe('Telemetry gateway', () => {
  it('authenticates requests and writes the approved aggregate event only', async () => {
    authenticatedFetch();
    const points: AnalyticsEngineDataPoint[] = [];
    const response = await postTelemetry({
      request: telemetryRequest({
        version: 1,
        event: 'application_started',
        surface: 'app',
        locale: 'en',
        platform: 'pwa',
        networkState: 'online',
      }),
      env: {
        FIREBASE_PROJECT_ID: 'test-project',
        FIREBASE_WEB_API_KEY: 'test-key',
        PLAYER_TELEMETRY_ENABLED: 'true',
        PLAYER_ANALYTICS: { writeDataPoint: (point) => points.push(point) },
      },
    });
    assert.equal(response.status, 204);
    assert.deepEqual(points, [{
      blobs: ['application_started', 'app', 'en', 'pwa', 'online'],
      doubles: [0],
      indexes: ['application_started'],
    }]);
  });

  it('rejects unauthenticated, malformed, and unconfigured telemetry safely', async () => {
    const unauthenticated = await postTelemetry({
      request: telemetryRequest({}, false),
      env: {
        FIREBASE_PROJECT_ID: 'test-project',
        FIREBASE_WEB_API_KEY: 'test-key',
        PLAYER_TELEMETRY_ENABLED: 'true',
      },
    });
    assert.equal(unauthenticated.status, 401);

    authenticatedFetch();
    const malformed = await postTelemetry({
      request: telemetryRequest({ version: 1, event: 'screen_viewed', message: 'raw text' }),
      env: {
        FIREBASE_PROJECT_ID: 'test-project',
        FIREBASE_WEB_API_KEY: 'test-key',
        PLAYER_TELEMETRY_ENABLED: 'true',
        PLAYER_ANALYTICS: { writeDataPoint: () => {} },
      },
    });
    assert.equal(malformed.status, 400);

    const unavailable = await postTelemetry({
      request: telemetryRequest({
        version: 1,
        event: 'screen_viewed',
        surface: 'app',
        locale: 'en',
        platform: 'web',
        networkState: 'online',
      }),
      env: {
        FIREBASE_PROJECT_ID: 'test-project',
        FIREBASE_WEB_API_KEY: 'test-key',
        PLAYER_TELEMETRY_ENABLED: 'true',
      },
    });
    assert.equal(unavailable.status, 503);

    const disabled = await postTelemetry({
      request: telemetryRequest({}),
      env: {
        FIREBASE_PROJECT_ID: 'test-project',
        FIREBASE_WEB_API_KEY: 'test-key',
        PLAYER_TELEMETRY_ENABLED: 'false',
      },
    });
    assert.equal(disabled.status, 503);
  });
});
