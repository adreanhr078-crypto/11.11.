import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  deriveExperienceEntitlements,
  resolveExperienceRoute,
  type RolloutPolicy,
} from '../application/player-journey/playerExperienceEntitlements';

const ENABLED_TEST_ROLLOUT: RolloutPolicy = {
  version: 1,
  expiresAt: '2099-01-01T00:00:00.000Z',
  dailyEnabled: true,
  weeklyEnabled: true,
  networkEnabled: true,
  communityEnabled: false,
  forgeSubmissionEnabled: false,
  echoAgentEnabled: false,
  part2WorldEnabled: false,
};

function entitlementInput(overrides: {
  signedIn?: boolean;
  online?: boolean;
  puzzleStatus?: 'hidden' | 'locked' | 'available' | 'in_progress' | 'completed';
  totalCompletedCount?: number;
  completedChapterIds?: Array<'chapter_1' | 'chapter_2' | 'chapter_3' | 'chapter_4'>;
  networkProgress?: {
    chessTrainingCompleted: boolean;
    casualChessCompleted: number;
    rankedChessUnlocked: boolean;
  };
  rollout?: Partial<RolloutPolicy>;
} = {}) {
  const puzzleStatus = overrides.puzzleStatus ?? 'hidden';
  return deriveExperienceEntitlements({
    authStatus: overrides.signedIn === false ? 'signed-out' : 'signed-in',
    storyStatus: 'ready',
    online: overrides.online ?? true,
    storyPuzzleSnapshot: {
      coinBalance: 0,
      shardCount: 0,
      mainCompletedCount: overrides.totalCompletedCount ?? 0,
      totalCompletedCount: overrides.totalCompletedCount ?? 0,
      entries: [{
        puzzleId: 'signal_tuning',
        status: puzzleStatus,
        discovered: puzzleStatus !== 'hidden',
        completedAt: puzzleStatus === 'completed'
          ? '2026-08-25T00:00:00.000Z'
          : null,
        perfectSolve: false,
        unlockedHintIndexes: [],
        hintCosts: [4, 8, 14],
        draft: null,
      }],
      discoverableSecretPuzzleIds: [],
      echoResonance: {
        total: 0,
        byAxis: {
          clarity: 0,
          memory: 0,
          trust: 0,
          resolve: 0,
          stability: 0,
          anomaly: 0,
        },
        lastPuzzleId: null,
      },
      syncedAt: '2026-08-25T00:00:00.000Z',
    },
    authoritativeStoryState: {
      canonEventReceipts: [],
      completedChapterIds: overrides.completedChapterIds ?? [],
      discoveredMemoryFragmentIds: [],
      syncedAt: '2026-08-25T00:00:00.000Z',
    },
    authoritativeNetworkProgress: overrides.networkProgress,
    rollout: { ...ENABLED_TEST_ROLLOUT, ...overrides.rollout },
  });
}

describe('player experience entitlements', () => {
  it('keeps a signed-out player on the safe identity surfaces', () => {
    const entitlements = entitlementInput({ signedIn: false });

    assert.deepEqual(entitlements.accessibleScreens, ['main-menu', 'settings']);
    assert.deepEqual(entitlements.visibleNavigation, []);
    assert.equal(resolveExperienceRoute('echo-network', entitlements).screen, 'main-menu');
    assert.equal(resolveExperienceRoute('echo-network', entitlements).reason, 'sign-in-required');
  });

  it('keeps Manhwa reachable while a signed-in player record synchronizes', () => {
    const entitlements = deriveExperienceEntitlements({
      authStatus: 'signed-in',
      storyStatus: 'loading',
      storyPuzzleSnapshot: null,
      authoritativeStoryState: null,
      online: true,
    });

    assert.equal(entitlements.snapshot.authority, 'syncing');
    assert.ok(entitlements.accessibleScreens.includes('psychological-state'));
    assert.ok(entitlements.accessibleScreens.includes('memories'));
    assert.equal(resolveExperienceRoute('puzzles', entitlements).reason, 'progress-syncing');
  });

  it('does not throw away a Home or Manhwa deep link during the initial auth check', () => {
    const entitlements = deriveExperienceEntitlements({
      authStatus: 'checking',
      storyStatus: 'idle',
      storyPuzzleSnapshot: null,
      authoritativeStoryState: null,
      online: true,
    });

    assert.equal(entitlements.snapshot.authority, 'syncing');
    assert.equal(resolveExperienceRoute('psychological-state', entitlements).allowed, true);
    assert.equal(resolveExperienceRoute('memories', entitlements).allowed, true);
    assert.equal(resolveExperienceRoute('echo-network', entitlements).reason, 'progress-syncing');
  });

  it('reveals only Home and the Manhwa objective before the first verified clue', () => {
    const entitlements = entitlementInput({ puzzleStatus: 'hidden' });

    assert.deepEqual(entitlements.visibleNavigation, ['story']);
    assert.equal(entitlements.accessibleScreens.includes('puzzles'), false);
    assert.equal(resolveExperienceRoute('puzzles', entitlements).screen, 'psychological-state');
    assert.equal(resolveExperienceRoute('puzzles', entitlements).reason, 'first-clue-required');
    assert.equal(entitlements.accessibleScreens.includes('echo-network'), false);
  });

  it('opens Story Puzzles only after a server-issued puzzle status allows it', () => {
    const entitlements = entitlementInput({ puzzleStatus: 'available' });

    assert.deepEqual(entitlements.visibleNavigation, ['story', 'puzzles']);
    assert.ok(entitlements.accessibleScreens.includes('puzzles'));
    assert.deepEqual(entitlements.puzzleModes, ['story']);
    assert.equal(entitlements.accessibleScreens.includes('progress'), false);
  });

  it('unlocks rewards and Chapter 1 surfaces without prematurely exposing Network', () => {
    const entitlements = entitlementInput({
      puzzleStatus: 'completed',
      totalCompletedCount: 1,
      completedChapterIds: ['chapter_1'],
    });

    assert.ok(entitlements.visibleNavigation.includes('memory'));
    assert.ok(entitlements.accessibleScreens.includes('progress'));
    assert.ok(entitlements.accessibleScreens.includes('echo-mind'));
    assert.ok(entitlements.accessibleScreens.includes('characters'));
    assert.deepEqual(entitlements.puzzleModes, ['story', 'daily']);
    assert.equal(entitlements.visibleNavigation.includes('network'), false);
    assert.equal(resolveExperienceRoute('echo-network', entitlements).reason, 'chapter-two-required');
  });

  it('opens Play Together and Weekly only at Chapter 2, with ranked still closed', () => {
    const entitlements = entitlementInput({
      puzzleStatus: 'completed',
      totalCompletedCount: 4,
      completedChapterIds: ['chapter_1', 'chapter_2'],
    });

    assert.ok(entitlements.visibleNavigation.includes('network'));
    assert.ok(entitlements.accessibleScreens.includes('echo-network'));
    assert.deepEqual(entitlements.networkModes, ['casual-chess', 'coop-training']);
    assert.deepEqual(entitlements.puzzleModes, ['story', 'daily', 'weekly']);
    assert.equal(resolveExperienceRoute('leaderboard', entitlements).reason, 'chapter-three-required');
  });

  it('opens Ranked display only after Chapter 3 and a server Network snapshot confirms every prerequisite', () => {
    const beforeChapterThree = entitlementInput({
      puzzleStatus: 'completed',
      totalCompletedCount: 8,
      completedChapterIds: ['chapter_1', 'chapter_2'],
      networkProgress: {
        chessTrainingCompleted: true,
        casualChessCompleted: 3,
        rankedChessUnlocked: true,
      },
    });
    assert.equal(beforeChapterThree.networkModes.includes('ranked'), false);

    const verified = entitlementInput({
      puzzleStatus: 'completed',
      totalCompletedCount: 12,
      completedChapterIds: ['chapter_1', 'chapter_2', 'chapter_3'],
      networkProgress: {
        chessTrainingCompleted: true,
        casualChessCompleted: 3,
        rankedChessUnlocked: true,
      },
    });
    assert.ok(verified.networkModes.includes('ranked'));
    assert.ok(verified.accessibleScreens.includes('leaderboard'));

    const inconsistent = entitlementInput({
      puzzleStatus: 'completed',
      totalCompletedCount: 12,
      completedChapterIds: ['chapter_1', 'chapter_2', 'chapter_3'],
      networkProgress: {
        chessTrainingCompleted: true,
        casualChessCompleted: 2,
        rankedChessUnlocked: true,
      },
    });
    assert.equal(inconsistent.networkModes.includes('ranked'), false);
    assert.equal(resolveExperienceRoute('leaderboard', inconsistent).reason, 'verified-chess-training-required');
  });

  it('fails closed when the rollout policy expires or the browser is offline', () => {
    const expired = entitlementInput({
      puzzleStatus: 'completed',
      totalCompletedCount: 4,
      completedChapterIds: ['chapter_1', 'chapter_2'],
      rollout: { expiresAt: '2020-01-01T00:00:00.000Z' },
    });
    const offline = entitlementInput({
      online: false,
      puzzleStatus: 'completed',
      totalCompletedCount: 4,
      completedChapterIds: ['chapter_1', 'chapter_2'],
    });

    assert.deepEqual(expired.puzzleModes, ['story']);
    assert.equal(expired.visibleNavigation.includes('network'), false);
    assert.equal(resolveExperienceRoute('echo-network', expired).reason, 'rollout-disabled');
    assert.equal(offline.snapshot.authority, 'syncing');
    assert.equal(resolveExperienceRoute('echo-network', offline).reason, 'progress-syncing');
  });

  it('keeps optional channels closed until a validated server rollout arrives', () => {
    const entitlements = deriveExperienceEntitlements({
      authStatus: 'signed-in',
      storyStatus: 'ready',
      online: true,
      storyPuzzleSnapshot: {
        coinBalance: 0,
        shardCount: 0,
        mainCompletedCount: 4,
        totalCompletedCount: 4,
        entries: [{
          puzzleId: 'signal_tuning',
          status: 'completed',
          discovered: true,
          completedAt: '2026-08-25T00:00:00.000Z',
          perfectSolve: false,
          unlockedHintIndexes: [],
          hintCosts: [4, 8, 14],
          draft: null,
        }],
        discoverableSecretPuzzleIds: [],
        echoResonance: { total: 0, byAxis: { clarity: 0, memory: 0, trust: 0, resolve: 0, stability: 0, anomaly: 0 }, lastPuzzleId: null },
        syncedAt: '2026-08-25T00:00:00.000Z',
      },
      authoritativeStoryState: {
        canonEventReceipts: [],
        completedChapterIds: ['chapter_1', 'chapter_2'],
        discoveredMemoryFragmentIds: [],
        syncedAt: '2026-08-25T00:00:00.000Z',
      },
    });

    assert.deepEqual(entitlements.puzzleModes, ['story']);
    assert.equal(entitlements.accessibleScreens.includes('echo-network'), false);
    assert.equal(resolveExperienceRoute('echo-network', entitlements).reason, 'rollout-disabled');
  });

  it('does not claim that Part 2 is available without both verified completion and rollout', () => {
    const closed = entitlementInput({
      puzzleStatus: 'completed',
      totalCompletedCount: 20,
      completedChapterIds: ['chapter_1', 'chapter_2', 'chapter_3', 'chapter_4'],
    });
    const open = entitlementInput({
      puzzleStatus: 'completed',
      totalCompletedCount: 20,
      completedChapterIds: ['chapter_1', 'chapter_2', 'chapter_3', 'chapter_4'],
      rollout: { part2WorldEnabled: true },
    });

    assert.equal(closed.part2Eligible, false);
    assert.equal(open.part2Eligible, true);
    assert.equal(resolveExperienceRoute('play', open).reason, 'part-two-required');
  });
});
