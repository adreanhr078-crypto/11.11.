import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import {
  createContractChessState,
  applyContractChessMove,
  type ContractChessState,
} from '../domain/echo-network/chessRules';
import {
  COOP_CASES,
  COOP_CASE_BY_ID,
} from '../domain/echo-network/coopCaseCatalog';
import { updateGlicko2 } from '../domain/echo-network/glicko2';
import {
  signRealtimeTicket,
  verifyRealtimeTicket,
} from '../domain/echo-network/realtimeTicket';
import { recommendActivity } from '../domain/echo-network/activityDirector';
import {
  AD_FREQUENCY_CAP_MS,
  canShowAdvertisement,
} from '../domain/echo-network/adPolicy';
import { moderateCommunityText } from '../domain/echo-network/communitySafety';
import {
  ECHO_SEASON_DURATION_DAYS,
  seasonAt,
  seasonWeekAt,
} from '../domain/echo-network/seasonCatalog';
import {
  coopAnswer,
  isReviewedCoopCase,
} from '../../workers/realtime/src/coopServerCatalog';

describe('Echo Network foundation', () => {
  it('signs, verifies, expires, and rejects tampered one-use ticket material', async () => {
    const secret = 'echo-network-test-secret-contains-more-than-thirty-two-characters';
    const payload = {
      v: 1 as const,
      iss: 'eleven-eleven-pages' as const,
      aud: 'eleven-eleven-realtime' as const,
      purpose: 'queue' as const,
      target: 'matchmaking' as const,
      uid: 'player-1',
      displayName: 'Player One',
      mode: 'chess_casual' as const,
      region: 'me',
      iat: 1_800_000_000,
      exp: 1_800_000_060,
      jti: 'f2f57f54-826a-4f8f-bf1d-39c033ea5b31',
    };
    const token = await signRealtimeTicket(secret, payload);
    assert.deepEqual(await verifyRealtimeTicket(secret, token, 1_800_000_030), payload);
    assert.equal(await verifyRealtimeTicket(secret, token, 1_800_000_061), null);
    const tampered = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`;
    assert.equal(await verifyRealtimeTicket(secret, tampered, 1_800_000_030), null);
  });

  it('implements standard clocks and the two deterministic anomaly win rules', () => {
    const initial = createContractChessState('standard', 'blitz', 1_000);
    const afterE4 = applyContractChessMove(initial, {
      from: 'e2',
      to: 'e4',
      now: 2_000,
    });
    assert.equal(afterE4.clock.whiteMs, 181_000);
    assert.equal(afterE4.version, 1);
    assert.throws(() => applyContractChessMove(afterE4, {
      from: 'e4',
      to: 'e5',
      now: 2_100,
    }));

    const threeSignal: ContractChessState = {
      ...createContractChessState('three-signal', 'rapid', 1_000),
      fen: '4k3/8/8/8/8/8/8/R3K3 w - - 0 1',
      checkCounts: { white: 2, black: 0 },
    };
    const thirdCheck = applyContractChessMove(threeSignal, {
      from: 'a1',
      to: 'a8',
      now: 1_100,
    });
    assert.equal(thirdCheck.status, 'white-won');
    assert.equal(thirdCheck.reason, 'three-check');

    const core: ContractChessState = {
      ...createContractChessState('core-control', 'rapid', 1_000),
      fen: '7k/8/8/8/8/3K4/8/8 w - - 0 1',
    };
    const coreWin = applyContractChessMove(core, {
      from: 'd3',
      to: 'd4',
      now: 1_100,
    });
    assert.equal(coreWin.reason, 'core-control');
    assert.equal(coreWin.status, 'white-won');
  });

  it('matches the published Glicko-2 worked example within rounding tolerance', () => {
    const result = updateGlicko2(
      { rating: 1500, deviation: 200, volatility: 0.06, gamesPlayed: 0 },
      [
        { rating: 1400, deviation: 30, score: 1 },
        { rating: 1550, deviation: 100, score: 0 },
        { rating: 1700, deviation: 300, score: 0 },
      ],
    );
    assert.ok(Math.abs(result.rating - 1464.06) < 0.1, String(result.rating));
    assert.ok(Math.abs(result.deviation - 151.52) < 0.1, String(result.deviation));
    assert.ok(Math.abs(result.volatility - 0.059996) < 0.00001, String(result.volatility));
    assert.equal(result.gamesPlayed, 3);
  });

  it('ships twelve reviewed co-op cases with unique server-only fingerprints', () => {
    assert.equal(COOP_CASES.length, 12);
    assert.deepEqual(
      [1, 2, 3, 4].map((chapter) => COOP_CASES.filter(
        (definition) => definition.chapterId === `chapter_${chapter}`,
      ).length),
      [3, 3, 3, 3],
    );
    const fingerprints = COOP_CASES.map((definition) => {
      assert.equal(definition.stages.length, 3);
      assert.equal(isReviewedCoopCase(definition.id), true, definition.id);
      assert.equal('clues' in definition.stages[0]!, false);
      return definition.stages.map((_, index) => coopAnswer(definition.id, index)).join('|');
    });
    assert.equal(new Set(fingerprints).size, fingerprints.length);
    assert.equal(Object.keys(COOP_CASE_BY_ID).length, 12);

    const publicSource = readFileSync(
      resolve(process.cwd(), 'src/domain/echo-network/coopCaseCatalog.ts'),
      'utf8',
    );
    assert.doesNotMatch(publicSource, /COOP_CASE_SOLUTION|routeAnswer|signalAnswer/);
  });

  it('directs short sessions ethically and gates ads away from gameplay', () => {
    const recommendation = recommendActivity({
      budgetMinutes: 5,
      storyCompleted: 3,
      storyTotal: 20,
      dailyCompleted: false,
      weeklyCompletedStages: 0,
      weeklyTotalStages: 3,
      onlineAvailable: true,
      friendsOnline: 2,
      recentActivities: [],
    });
    assert.equal(recommendation.activity, 'daily');
    assert.equal(canShowAdvertisement({
      placement: 'echo-network-hub',
      consent: 'contextual',
      providerReady: true,
      online: true,
      lastShownAt: null,
    }), true);
    assert.equal(canShowAdvertisement({
      placement: 'contract-chess',
      consent: 'contextual',
      providerReady: true,
      online: true,
      lastShownAt: null,
    }), false);
    assert.equal(canShowAdvertisement({
      placement: 'community-board',
      consent: 'contextual',
      providerReady: true,
      online: true,
      lastShownAt: 100,
      now: 100 + AD_FREQUENCY_CAP_MS - 1,
    }), false);
  });

  it('blocks links and personal data while keeping normal Arabic and English messages', () => {
    assert.equal(moderateCommunityText('جاهز لفريق التعاون').allowed, true);
    assert.equal(moderateCommunityText('Ready for co-op').allowed, true);
    assert.equal(moderateCommunityText('visit https://example.com').reason, 'link');
    assert.equal(moderateCommunityText('call +962 79 123 4567').reason, 'personal-data');
  });

  it('keeps eight-week seasons deterministic and archive-safe', () => {
    const atStart = seasonAt(Date.parse('2026-08-10T11:11:00.000Z'));
    assert.equal(ECHO_SEASON_DURATION_DAYS, 56);
    assert.equal(atStart.activities.length, 8);
    assert.equal(seasonWeekAt(Date.parse('2026-08-10T11:11:00.000Z')), 1);
    assert.equal(seasonWeekAt(Date.parse('2026-09-28T11:11:00.000Z')), 8);
    const next = seasonAt(Date.parse(atStart.endsAt) + 1);
    assert.notEqual(next.id, atStart.id);
  });
});
