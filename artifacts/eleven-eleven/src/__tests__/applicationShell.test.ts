import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createDashboardReadModel,
  createDialogueScreenReadModel,
  createMemoryScreenReadModel,
  createPuzzleScreenReadModel,
} from '../application/ui/gameUiReadModels';
import {
  GAME_SCREEN_REGISTRY,
  PRIMARY_GAME_SCREENS,
} from '../app/shell/screenRegistry';
import { useGameStore } from '../stores/gameStore';

describe('Application Shell', () => {
  it('registers each screen once and keeps the priority flow available', () => {
    const screens = Object.values(GAME_SCREEN_REGISTRY);
    assert.equal(
      new Set(screens.map((screen) => screen.id)).size,
      screens.length,
    );
    assert.deepEqual(
      PRIMARY_GAME_SCREENS.map((screen) => screen.id),
      ['dashboard', 'cinematic', 'memories', 'puzzles', 'dialogue'],
    );
  });

  it('derives the dashboard from canonical domain state', () => {
    const state = useGameStore.getState();
    const model = createDashboardReadModel(state);

    assert.equal(model.chapter.id, state.progression.currentChapterId);
    assert.equal(model.personality, state.echo.personality);
    assert.equal(
      model.decisions.length,
      state.narrative.decisionHistory.slice(-5).length,
    );
    assert.equal(
      model.cinematic.completedEpisodes,
      state.cinematic.completedEpisodeIds.length,
    );
  });

  it('keeps empty authored content as a valid editor-ready state', () => {
    const state = useGameStore.getState();
    const memories = createMemoryScreenReadModel(state);
    const dialogue = createDialogueScreenReadModel(state);

    assert.equal(memories.isAuthoredContentEmpty, true);
    assert.deepEqual(memories.items, []);
    assert.deepEqual(dialogue.availableDefinitions, []);
    assert.equal(dialogue.node, null);
  });

  it('adapts the existing puzzle runtime without creating content in UI', () => {
    const state = useGameStore.getState();
    const puzzlesBefore = state.puzzles.length;
    const model = createPuzzleScreenReadModel(state);

    assert.equal(useGameStore.getState().puzzles.length, puzzlesBefore);
    assert.equal(
      model.chapterPuzzles.every(
        (puzzle) => puzzle.chapterId === state.progression.currentChapterId,
      ),
      true,
    );
  });
});

