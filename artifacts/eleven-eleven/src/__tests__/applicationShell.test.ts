import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import {
  createDashboardReadModel,
  createDialogueScreenReadModel,
  createMemoryScreenReadModel,
  createPuzzleScreenReadModel,
} from '../application/ui/gameUiReadModels';
import {
  GAME_SCREEN_DEFINITIONS,
  GAME_SCREEN_REGISTRY,
} from '../app/shell/screenRegistry';
import {
  getCategoryScreens,
  NAVIGATION_CATEGORIES,
} from '../app/shell/navigationRegistry';
import { useGameStore } from '../stores/gameStore';
import {
  GAME_ICON_REGISTRY,
} from '../ui/icons';
import {
  ECHO_PRESENTATION_ASSETS,
  ENVIRONMENT_PRESENTATION_ASSETS,
} from '../ui/presentation/visualAssets';

describe('Application Shell', () => {
  it('registers each screen once and keeps the priority flow available', () => {
    const screens = Object.values(GAME_SCREEN_REGISTRY);
    assert.equal(
      new Set(screens.map((screen) => screen.id)).size,
      screens.length,
    );
    assert.equal(screens.length, GAME_SCREEN_DEFINITIONS.length);
  });

  it('uses exactly six named navigation categories', () => {
    assert.deepEqual(
      NAVIGATION_CATEGORIES.map(({ id }) => id),
      [
        'story',
        'memory',
        'investigation',
        'characters',
        'progress',
        'settings',
      ],
    );

    const navigableScreens = NAVIGATION_CATEGORIES.flatMap((category) => (
      getCategoryScreens(category.id).map(({ id }) => id)
    ));
    assert.equal(
      new Set(navigableScreens).size,
      navigableScreens.length,
    );
    assert.equal(
      navigableScreens.includes('main-menu'),
      false,
    );
  });

  it('maps every screen icon to a system, action, and label', () => {
    for (const screen of GAME_SCREEN_DEFINITIONS) {
      const icon = GAME_ICON_REGISTRY[screen.iconId];
      assert.ok(icon, `Missing icon ${screen.iconId}`);
      assert.ok(icon.systemId);
      assert.ok(icon.actionId);
      assert.ok(icon.label.ar);
      assert.ok(icon.description.ar);
      assert.ok(icon.tooltip.ar);
      assert.equal(
        (icon.screenIds as readonly string[]).includes(screen.id),
        true,
        `${screen.iconId} is not linked to ${screen.id}`,
      );
    }

    const categoryActions = NAVIGATION_CATEGORIES.map((category) => (
      GAME_ICON_REGISTRY[category.iconId].actionId
    ));
    assert.equal(
      new Set(categoryActions).size,
      categoryActions.length,
      'Primary navigation actions must be unique',
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

  it('keeps Echo artwork as a replaceable presentation asset', () => {
    assert.equal(
      existsSync(resolve(
        process.cwd(),
        'public',
        ECHO_PRESENTATION_ASSETS.portrait.replace(/^\//, ''),
      )),
      true,
    );
    assert.equal(ECHO_PRESENTATION_ASSETS.fallbackLabel, 'Echo');
  });

  it('keeps cinematic environments outside narrative content data', () => {
    for (const asset of Object.values(ENVIRONMENT_PRESENTATION_ASSETS)) {
      assert.equal(
        existsSync(resolve(
          process.cwd(),
          'public',
          asset.replace(/^\//, ''),
        )),
        true,
      );
    }
  });
});
