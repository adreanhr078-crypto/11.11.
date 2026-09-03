import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deriveCorePlayerObjective } from '../application/player-journey/corePlayerLoop';
import { STORY_PUZZLES } from '../content/puzzles/storyPuzzleCatalog';
import type { StoryPuzzleSnapshot } from '../domain/story-puzzles/storyPuzzleContracts';

function snapshot(
  statuses: Record<string, 'locked' | 'available' | 'in_progress' | 'completed'>,
  discoverableSecretPuzzleIds: readonly string[] = [],
): StoryPuzzleSnapshot {
  return {
    coinBalance: 0,
    shardCount: 0,
    mainCompletedCount: 0,
    totalCompletedCount: 0,
    discoverableSecretPuzzleIds: [...discoverableSecretPuzzleIds],
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
    syncedAt: new Date(0).toISOString(),
    entries: STORY_PUZZLES.map((puzzle) => ({
      puzzleId: puzzle.id,
      status: statuses[puzzle.id] ?? 'locked',
      discovered: puzzle.classification === 'main',
      completedAt: null,
      perfectSolve: false,
      unlockedHintIndexes: [],
      hintCosts: [4, 8, 14],
      draft: null,
    })),
  };
}

describe('Core Player Loop', () => {
  it('gives a first-time player one readable published objective instead of a menu choice', () => {
    const objective = deriveCorePlayerObjective(null);

    assert.equal(objective.kind, 'read');
    assert.equal(objective.screen, 'memories');
    assert.match(objective.title, /7/);
  });

  it('moves from the Chapter 1 evidence page to its puzzle and then to the next published evidence page', () => {
    const available = deriveCorePlayerObjective(snapshot({
      story_puzzle_01_echo_network_signal_sync: 'available',
    }));
    assert.deepEqual([available.kind, available.screen], ['solve', 'puzzles']);

    const afterFirst = deriveCorePlayerObjective(snapshot({
      story_puzzle_01_echo_network_signal_sync: 'completed',
    }));
    assert.deepEqual([afterFirst.kind, afterFirst.screen], ['read', 'memories']);
    assert.match(afterFirst.title, /9/);
  });

  it('ignores stale secret identifiers that are not part of the published Chapter 1 route', () => {
    const objective = deriveCorePlayerObjective(snapshot({
      story_puzzle_01_echo_network_signal_sync: 'completed',
    }, ['story_puzzle_03_torn_memory']), 'en');

    assert.equal(objective.kind, 'read');
    assert.equal(objective.screen, 'memories');
    assert.equal(objective.secretPuzzleId, undefined);
    assert.match(objective.title, /9/);
  });

  it('keeps only the two published puzzle solutions out of the public catalog and client readiness path', async () => {
    const { readFile } = await import('node:fs/promises');
    const catalog = await readFile(new URL('../content/puzzles/storyPuzzleCatalog.ts', import.meta.url), 'utf8');
    const screen = await readFile(new URL('../features/screens/PuzzleScreen.tsx', import.meta.url), 'utf8');

    assert.equal(STORY_PUZZLES.length, 2);
    assert.doesNotMatch(catalog, /targetFrequency|targetChannel|targetSequence|signal_calibration|broken_sequence|torn_memory/);
    assert.doesNotMatch(screen, /TARGET WINDOW|data-target|pieceId === `piece-\$\{index\}`/);
    assert.match(screen, /readSignalSelection/);
  });

  it('keeps mandatory first-time identity setup inside an accessible modal focus boundary', async () => {
    const { readFile } = await import('node:fs/promises');
    const onboarding = await readFile(
      new URL('../features/onboarding/FirstTimeOnboarding.tsx', import.meta.url),
      'utf8',
    );

    assert.match(onboarding, /role="dialog"/);
    assert.match(onboarding, /aria-modal="true"/);
    assert.match(onboarding, /ONBOARDING_FOCUSABLE_SELECTOR/);
    assert.match(onboarding, /document\.getElementById\('app'\)/);
    assert.match(onboarding, /application\.inert = true/);
    assert.match(onboarding, /event\.key !== 'Tab'/);
    assert.match(onboarding, /event\.preventDefault\(\);\s*dialog\.focus\(\);/);
    assert.match(onboarding, /previousFocus\?\.isConnected/);
  });

  it('lands a newly authenticated player in Mission Control before any Manhwa route', async () => {
    const { readFile } = await import('node:fs/promises');
    const [menu, onboarding, shell, objectiveCard, puzzle] = await Promise.all([
      readFile(new URL('../features/screens/MainMenuScreen.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../features/onboarding/FirstTimeOnboarding.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../app/shell/ApplicationShell.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../features/player-journey/CoreObjectiveCard.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../features/screens/PuzzleScreen.tsx', import.meta.url), 'utf8'),
    ]);

    assert.match(menu, /<AuthPanel open=\{authOpen\}/);
    assert.match(menu, /enterMissionControl/);
    assert.match(menu, /navigate\('psychological-state'\)/);
    assert.doesNotMatch(menu, /requestManhwaReader/);
    assert.doesNotMatch(menu, /requestStoryPuzzleDiscovery/);
    assert.match(onboarding, /navigate\('main-menu'\)/);
    assert.match(shell, /<CoreObjectiveCard/);
    assert.match(objectiveCard, /requestManhwaReader/);
    assert.match(puzzle, /playPuzzleCompletionSound/);
  });

  it('does not expose developer configuration keys to a player when sign-in is unavailable', async () => {
    const { readFile } = await import('node:fs/promises');
    const authPanel = await readFile(new URL('../features/auth/AuthPanel.tsx', import.meta.url), 'utf8');

    assert.match(authPanel, /shouldCloseAuthPanelAfterAuthentication/);
    assert.doesNotMatch(authPanel, /missingConfigKeys\.join/);
  });
});
