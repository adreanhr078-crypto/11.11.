import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import type {
  PuzzleNode,
} from '../core/gameTypes';
import {
  projectCanonicalEchoCompatibility,
} from '../domain/echo/echoCompatibilityProjection';
import {
  applyLegacyEchoEffects,
  syncEchoPersonality,
} from '../application/game/echoCompatibility';
import {
  applyEchoPersonalitySourceTransition,
} from '../application/game/canonicalEchoSourceTransition';
import {
  createGameProgressionActions,
} from '../application/game/createGameProgressionActions';
import {
  createEchoActions,
} from '../application/game/createEchoActions';
import {
  createPuzzleActions,
} from '../application/game/createPuzzleActions';
import {
  createWorldActions,
} from '../application/game/createWorldActions';
import type {
  GameStateSetter,
} from '../application/game/statePorts';
import {
  migrateGameState,
  partializeGameState,
} from '../infrastructure/persistence/gamePersistence';
import { buildInitialState } from '../stores/gameStoreHelpers';

function createHarness(initialState = buildInitialState()) {
  let state = structuredClone(initialState);
  let setCallCount = 0;
  const set: GameStateSetter = (update) => {
    setCallCount += 1;
    const patch = typeof update === 'function' ? update(state) : update;
    state = { ...state, ...patch };
  };
  const get = () => state;
  const progression = createGameProgressionActions(
    set,
    get,
    () => '2026-07-29T09:00:00.000Z',
  );

  return {
    getState: get,
    getSetCallCount: () => setCallCount,
    progression,
    echo: createEchoActions(set, get, progression),
    puzzle: createPuzzleActions(set, get),
    worldAt(date: Date) {
      return createWorldActions(set, get, () => date);
    },
  };
}

function assertClose(actual: number, expected: number): void {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `expected ${actual} to equal ${expected}`,
  );
}

describe('legacy Echo write isolation', () => {
  it('keeps all formerly merged channels independent at runtime', () => {
    const harness = createHarness();
    const initial = structuredClone(harness.getState().progressionState.echo);

    assert.equal(
      harness.progression.applyEchoEffects({ humanity: 8 }),
      true,
    );
    assert.equal(
      harness.getState().progressionState.echo.humanity,
      initial.humanity + 8,
    );
    assert.equal(
      harness.getState().progressionState.echo.hope,
      initial.hope,
    );

    assert.equal(harness.progression.applyEchoEffects({ anger: 7 }), true);
    assert.equal(
      harness.getState().progressionState.echo.ragePoints,
      initial.ragePoints,
    );
    assert.equal(
      harness.progression.applyEchoEffects({ memoryStability: 11 }),
      true,
    );
    assert.equal(
      harness.getState().progressionState.echo.memoriesRecovered,
      initial.memoriesRecovered,
    );
    assert.equal(
      harness.progression.applyEchoEffects({ memoriesRecovered: 2 }),
      true,
    );
    assert.equal(
      harness.getState().progressionState.echo.memoryStability,
      initial.memoryStability + 11,
    );
  });

  it('keeps deprecated helpers same-semantic and projection one-way', () => {
    const initial = buildInitialState();
    const legacyOnly = applyLegacyEchoEffects(initial.echo, {
      hope: 9,
      ragePoints: 8,
      memoryStability: 7,
    });
    assert.equal(
      legacyOnly.personality.humanity,
      initial.echo.personality.humanity,
    );
    assert.equal(
      legacyOnly.personality.anger,
      initial.echo.personality.anger,
    );
    assert.equal(
      legacyOnly.personality.memoriesRecovered,
      initial.echo.personality.memoriesRecovered,
    );

    const synced = syncEchoPersonality(legacyOnly, {
      ...legacyOnly.personality,
      humanity: 91,
      anger: 73,
      memoriesRecovered: 12,
    });
    assert.equal(synced.hope, legacyOnly.hope);
    assert.equal(synced.ragePoints, legacyOnly.ragePoints);
    assert.equal(synced.memoryStability, legacyOnly.memoryStability);

    const canonical = {
      ...initial.progressionState.echo,
      humanity: 62,
      hope: 24,
      anger: 31,
      ragePoints: 6,
      memoryStability: 48,
      memoriesRecovered: 5,
    };
    const currentSnapshot = {
      ...initial.echo,
      hope: 99,
      ragePoints: 98,
      memoryStability: 97,
    };
    const projection = projectCanonicalEchoCompatibility(
      canonical,
      currentSnapshot,
    );
    assert.equal(projection.personality.humanity, 62);
    assert.equal(projection.hope, 24);
    assert.equal(projection.personality.anger, 31);
    assert.equal(projection.ragePoints, 6);
    assert.equal(projection.memoryStability, 48);
    assert.equal(projection.personality.memoriesRecovered, 5);
    assert.equal(currentSnapshot.hope, 99);
  });

  it('partializes canonical Echo authority and projects the saved snapshot', () => {
    const state = buildInitialState();
    state.progressionState.echo.humanity = 44.5;
    state.progressionState.echo.hope = 21.25;
    state.progressionState.echo.anger = 19.75;
    state.progressionState.echo.ragePoints = 4.5;
    state.progressionState.echo.memoryStability = 63.25;
    state.progressionState.echo.memoriesRecovered = 8.5;
    state.echo = {
      ...state.echo,
      hope: 99,
      ragePoints: 98,
      memoryStability: 97,
      personality: {
        ...state.echo.personality,
        humanity: 96,
        anger: 95,
        memoriesRecovered: 94,
      },
    };

    const saved = partializeGameState(state);
    assert.equal(saved.progressionState?.echo.humanity, 44.5);
    assert.equal(saved.progressionState?.echo.hope, 21.25);
    assert.equal(saved.progressionState?.echo.anger, 19.75);
    assert.equal(saved.progressionState?.echo.ragePoints, 4.5);
    assert.equal(saved.progressionState?.echo.memoryStability, 63.25);
    assert.equal(saved.progressionState?.echo.memoriesRecovered, 8.5);
    assert.equal(saved.echo?.personality.humanity, 44.5);
    assert.equal(saved.echo?.hope, 21.25);
    assert.equal(saved.echo?.ragePoints, 4.5);
    assert.equal(saved.echo?.memoryStability, 63.25);

    const reloaded = migrateGameState(saved, 14);
    assert.equal(reloaded.progressionState?.echo.humanity, 44.5);
    assert.equal(reloaded.progressionState?.echo.hope, 21.25);
    assert.equal(reloaded.progressionState?.echo.anger, 19.75);
    assert.equal(reloaded.progressionState?.echo.ragePoints, 4.5);
    assert.equal(reloaded.progressionState?.echo.memoryStability, 63.25);
    assert.equal(reloaded.progressionState?.echo.memoriesRecovered, 8.5);
  });

  it('still migrates independent legacy values without losing them', () => {
    const migrated = migrateGameState({
      echo: {
        hope: 81.4,
        ragePoints: 37.6,
        memoryStability: 62.4,
        personality: {
          humanity: 45.2,
          anger: 22.4,
          memoriesRecovered: 7.4,
        },
      },
    }, 13);
    const echo = migrated.progressionState?.echo;

    assert.equal(echo?.humanity, 45);
    assert.equal(echo?.hope, 81);
    assert.equal(echo?.anger, 22);
    assert.equal(echo?.ragePoints, 38);
    assert.equal(echo?.memoryStability, 62);
    assert.equal(echo?.memoriesRecovered, 7);
  });
});

describe('isolated active Echo sources', () => {
  it('routes personality source output by same-semantic canonical metrics', () => {
    const state = buildInitialState().progressionState;
    const nextPersonality = {
      ...buildInitialState().echo.personality,
      humanity: 48,
      anger: 9,
      memoriesRecovered: 6,
    };
    const transition = applyEchoPersonalitySourceTransition(
      state,
      nextPersonality,
    );

    assert.equal(transition.success, true);
    assert.equal(transition.state.echo.humanity, 48);
    assert.equal(transition.state.echo.hope, state.echo.hope);
    assert.equal(transition.state.echo.anger, 9);
    assert.equal(transition.state.echo.ragePoints, state.echo.ragePoints);
    assert.equal(transition.state.echo.memoriesRecovered, 6);
    assert.equal(
      transition.state.echo.memoryStability,
      state.echo.memoryStability,
    );
    assert.deepEqual(
      transition.state.echoEvents,
      state.echoEvents,
    );
  });

  it('keeps the deprecated transformation command from writing metrics', () => {
    const harness = createHarness();
    const before = structuredClone(harness.getState().progressionState.echo);
    const stageBefore = harness.getState().echo.transformationStage;

    harness.echo.updateTransformation?.('rage', 100);
    harness.echo.updateTransformation?.('forgiveness', 100);

    assert.deepEqual(harness.getState().progressionState.echo, before);
    assert.equal(harness.getState().echo.transformationStage, stageBefore);
    assert.equal(harness.getSetCallCount(), 0);
  });

  it('applies recurring world effects canonically and preserves fractions', () => {
    const harness = createHarness();
    const world = harness.worldAt(new Date(2026, 6, 29, 12, 0, 0));

    world.advanceTime();
    world.advanceTime();

    const state = harness.getState();
    assertClose(state.progressionState.echo.fear, 69.6);
    assertClose(state.progressionState.echo.hope, 20);
    assertClose(state.progressionState.echo.loneliness, 80);
    assertClose(state.echo.fear, 69.6);
    assert.equal(
      Object.keys(
        state.progressionState.echoEvents.standaloneReceiptsByKey,
      ).length,
      0,
    );
    assert.equal(harness.getSetCallCount(), 2);
  });

  it('keeps the legacy puzzle source from writing transformationStage', () => {
    const initial = buildInitialState();
    const puzzle: PuzzleNode = {
      id: 'puzzle_001',
      chapterId: 'chapter_1',
      title: 'Legacy runtime isolation',
      question: 'Answer',
      answers: ['safe'],
      hint: 'safe',
      status: 'active',
      difficulty: 1,
      storyReveal: 'No stage transition',
      memoryUnlock: null,
      dependencies: [],
      act: 1,
      effects: {
        fear: 0.5,
        awareness: 100,
        rageEffect: 100,
      },
    };
    initial.puzzles = [puzzle];
    const stageBefore = initial.echo.transformationStage;
    const harness = createHarness(initial);

    const result = harness.puzzle.solve(puzzle.id, 'safe');
    const state = harness.getState();

    assert.equal(result.success, true);
    assert.equal(state.echo.transformationStage, stageBefore);
    assert.equal(state.progressionState.echo.ragePoints, 0);
    assert.equal(state.progressionState.echo.awareness, 3);
    assertClose(state.progressionState.echo.fear, 70.5);
    assert.equal(
      state.progressionState.evolution.currentStageId,
      'awakening_fragile',
    );
    assert.equal(
      Object.keys(
        state.progressionState.echoEvents.standaloneReceiptsByKey,
      ).length,
      0,
    );
  });

  it('leaves no active application import or stage assignment behind', () => {
    const activeFiles = [
      'src/application/game/createWorldActions.ts',
      'src/application/game/createPuzzleActions.ts',
      'src/application/game/createEchoActions.ts',
      'src/application/narrative/createNarrativeActions.ts',
      'src/application/cinematics/createCinematicActions.ts',
    ];
    const sources = activeFiles.map((file) => readFileSync(file, 'utf8'));

    for (const source of sources) {
      assert.doesNotMatch(source, /applyLegacyEchoEffects/);
      assert.doesNotMatch(source, /syncEchoPersonality/);
      assert.doesNotMatch(source, /transformationStage\s*=/);
    }
  });

  it('keeps Puzzle source adapters free of compatibility Echo writes', () => {
    const puzzleSources = [
      'src/application/game/chapter01RewardAdapter.ts',
      'src/application/game/createPuzzleActions.ts',
      'src/application/game/createPuzzleCampaignActions.ts',
    ].map((file) => readFileSync(file, 'utf8'));

    for (const source of puzzleSources) {
      assert.doesNotMatch(source, /addEffect\([^)]*['"]hope['"]/);
      assert.doesNotMatch(source, /addEffect\([^)]*['"]ragePoints['"]/);
      assert.doesNotMatch(source, /transformationStage\s*=/);
      assert.doesNotMatch(source, /applyStandaloneEchoEvent/);
    }
    assert.match(
      puzzleSources[1] ?? '',
      /applyCanonicalEchoSourceTransition/,
    );
  });
});
