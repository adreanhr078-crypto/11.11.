import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import {
  createDashboardReadModel,
  createDialogueScreenReadModel,
  createMemoryScreenReadModel,
  createPuzzleScreenReadModel,
} from '../application/ui/gameUiReadModels';
import {
  createPsychologicalStateReadModel,
} from '../application/ui/psychologicalStateReadModel';
import {
  createEchoPresentationReadModel,
  ECHO_CORRUPTED_FORM_FLAG,
} from '../application/ui/echoPresentationReadModel';
import {
  GAME_SCREEN_DEFINITIONS,
  GAME_SCREEN_REGISTRY,
} from '../app/shell/screenRegistry';
import {
  getCategoryScreens,
  NAVIGATION_CATEGORIES,
  PRIMARY_NAVIGATION_CATEGORIES,
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

  it('uses six primary navigation categories and keeps settings as utility only', () => {
    assert.deepEqual(
      PRIMARY_NAVIGATION_CATEGORIES.map(({ id }) => id),
      [
        'story',
        'memory',
        'puzzles',
        'echo-mind',
        'characters',
        'progress',
      ],
    );

    assert.equal(
      NAVIGATION_CATEGORIES.some(
        (category) => category.id === 'settings' && category.primary === false,
      ),
      true,
    );

    const navigableScreens = PRIMARY_NAVIGATION_CATEGORIES.flatMap((category) => (
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
    assert.deepEqual(
      getCategoryScreens('story').map(({ id }) => id),
      ['psychological-state'],
    );
  });

  it('keeps the legacy night runtime out of the active application boot path', () => {
    const appSource = readFileSync(
      resolve(process.cwd(), 'src', 'App.tsx'),
      'utf8',
    );
    const runtimeSource = readFileSync(
      resolve(
        process.cwd(),
        'src',
        'app',
        'shell',
        'GameRuntimeBridge.tsx',
      ),
      'utf8',
    );

    for (const legacyImport of [
      'eleven-theme.css',
      'dashboard.css',
      'backgrounds.css',
      'EchoPortrait.css',
    ]) {
      assert.equal(appSource.includes(legacyImport), false);
    }
    for (const legacyRuntime of [
      'AnimationSystem',
      'AchievementToast',
      'CinematicMode',
      'advanceTime()',
      'useAudioSystem',
    ]) {
      assert.equal(runtimeSource.includes(legacyRuntime), false);
    }
  });

  it('derives the psychological state screen from canonical Echo values', () => {
    const state = useGameStore.getState();
    const model = createPsychologicalStateReadModel(state, 'trust');

    assert.equal(model.dominantLabel, 'الثقة');
    assert.equal(model.channels.length, 6);
    assert.equal(
      model.channels.find(({ id }) => id === 'trust')?.value,
      state.echo.personality.trust,
    );
  });

  it('reveals the corrupted Echo form only through narrative state', () => {
    const state = useGameStore.getState();
    assert.equal(createEchoPresentationReadModel(state).form, 'normal');

    const transformedState = {
      ...state,
      narrative: {
        ...state.narrative,
        activeFlags: {
          ...state.narrative.activeFlags,
          [ECHO_CORRUPTED_FORM_FLAG]: true,
        },
      },
    };
    assert.equal(
      createEchoPresentationReadModel(transformedState).form,
      'corrupted',
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
    assert.equal(memories.totalFragmentCount, 0);
    assert.deepEqual(dialogue.availableDefinitions, []);
    assert.equal(dialogue.node, null);
    assert.equal(dialogue.hasAuthoredContent, false);
    assert.equal(dialogue.speakerName, 'Echo');
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
    for (const asset of [
      ECHO_PRESENTATION_ASSETS.portrait,
      ECHO_PRESENTATION_ASSETS.fullBodyNormal,
      ECHO_PRESENTATION_ASSETS.fullBodyCorrupted,
    ]) {
      assert.equal(
        existsSync(resolve(
          process.cwd(),
          'public',
          asset.replace(/^\//, ''),
        )),
        true,
      );
    }
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
