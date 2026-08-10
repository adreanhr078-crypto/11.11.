import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  createEchoStatusReadModel,
} from '../application/ui/echoStatusReadModel';
import { EchoStatusPanel } from '../components/echo/EchoStatusPanel';
import type {
  EchoEvolutionStageDefinition,
} from '../core/echoEvolutionTypes';
import type {
  RuntimeKnowledgeNodeDefinition,
} from '../domain/narrative/knowledgeRegistry';
import {
  mergeGameState,
  partializeGameState,
} from '../infrastructure/persistence/gamePersistence';
import { buildInitialState } from '../stores/gameStoreHelpers';

const HIDDEN_STAGE_ID = 'identity_displaced_internal';

function renderStatusPanel(
  model: ReturnType<typeof createEchoStatusReadModel>,
): string {
  const testRuntime = globalThis as typeof globalThis & {
    React?: typeof React;
  };
  const previousReact = testRuntime.React;
  testRuntime.React = React;
  try {
    return renderToStaticMarkup(
      React.createElement(EchoStatusPanel, { model }),
    );
  } finally {
    testRuntime.React = previousReact;
  }
}

describe('canon-safe Echo status read model', () => {
  it('exposes the published awakening stage and canonical metrics', () => {
    const state = buildInitialState();
    state.progressionState.echo = {
      ...state.progressionState.echo,
      humanity: 74.5,
      fear: 31.25,
      trust: 42,
      anger: 8,
      memoryStability: 67.75,
      corruption: 4,
    };

    const model = createEchoStatusReadModel(
      state.progressionState,
      { locale: 'en' },
    );

    assert.equal(model.stage.stageId, 'awakening_fragile');
    assert.equal(model.stage.label, 'Echo');
    assert.equal(model.stage.visible, true);
    assert.deepEqual(model.metrics, {
      humanity: 74.5,
      fear: 31.25,
      trust: 42,
      anger: 8,
      memoryStability: 67.75,
      corruption: 4,
    });
  });

  it('cannot change when legacy Echo fields change', () => {
    const state = buildInitialState();
    const before = createEchoStatusReadModel(
      state.progressionState,
      { locale: 'en' },
    );

    state.echo.personality.humanity = 0;
    state.echo.personality.anger = 100;
    state.echo.hope = 100;
    state.echo.ragePoints = 100;
    state.echo.transformationStage = 'vengeful';

    const after = createEchoStatusReadModel(
      state.progressionState,
      { locale: 'en' },
    );

    assert.deepEqual(after, before);
  });

  it('replaces unknown and unpublished stages without leaking their IDs', () => {
    const state = buildInitialState();
    state.progressionState.evolution.currentStageId = HIDDEN_STAGE_ID;
    state.progressionState.evolution.reachedStageIds.push(HIDDEN_STAGE_ID);
    const hiddenDefinition: EchoEvolutionStageDefinition = {
      stageId: HIDDEN_STAGE_ID,
      order: 2,
      chapterId: 'chapter_3',
      requiredStoryEventId: 'hidden_story_event',
      previousStageId: 'awakening_fragile',
      visualFormId: 'hidden_visual_form',
      isPermanent: false,
      published: false,
      playerVisible: false,
      safePlayerLabel: {
        ar: 'سر غير منشور',
        en: 'Unpublished secret',
      },
      knowledgeBoundary: 'story-event-revealed',
    };

    const model = createEchoStatusReadModel(state.progressionState, {
      locale: 'en',
      stageDefinitions: [hiddenDefinition],
    });
    const serialized = JSON.stringify(model);

    assert.deepEqual(model.stage, {
      stageId: null,
      label: 'Unknown',
      visible: false,
    });
    assert.equal(serialized.includes(HIDDEN_STAGE_ID), false);
    assert.equal(serialized.includes('Unpublished secret'), false);
    assert.equal(serialized.includes('hidden_visual_form'), false);
  });

  it('counts Echo knowledge only when a server-issued Canon receipt exists', () => {
    const state = buildInitialState();
    state.progressionState.story.narrative.knowledgeNodeIds = [
      'echo_knowledge_black_coronation',
      'echo_knowledge_black_echo_protocol',
    ];
    state.progressionState.story.authoritative.completedChapterIds = [
      'chapter_3',
    ];
    state.progressionState.story.authoritative.canonEventReceipts = [{
      eventId: 'manhwa_chapter_04_black_coronation',
      eventVersion: 1,
      sourceType: 'manhwa',
      sourceId: 'chapter_4',
      sourcePageId: 'manhwa_ch04_page_02',
      sourcePageNumber: 56,
      reachedAt: '2026-08-09T11:11:00.000Z',
    }];
    const definitions: RuntimeKnowledgeNodeDefinition[] = [
      {
        nodeId: 'echo_knowledge_black_coronation',
        audience: 'echo',
        published: true,
        playerVisible: true,
      },
      {
        nodeId: 'echo_knowledge_black_echo_protocol',
        audience: 'echo',
        published: true,
        playerVisible: true,
      },
    ];

    const model = createEchoStatusReadModel(state.progressionState, {
      locale: 'en',
      knowledgeDefinitions: definitions,
    });
    const serialized = JSON.stringify(model);

    assert.equal(model.knowledge.player.visibleCount, 0);
    assert.equal(model.knowledge.echo.visibleCount, 1);
    assert.equal(serialized.includes('echo_knowledge_black_coronation'), false);
    assert.equal(serialized.includes('echo_knowledge_black_echo_protocol'), false);
  });

  it('renders an accessible, keyboard-focusable, spoiler-safe panel', () => {
    const state = buildInitialState();
    state.progressionState.evolution.currentStageId = HIDDEN_STAGE_ID;
    const model = createEchoStatusReadModel(
      state.progressionState,
      { locale: 'en' },
    );
    const markup = renderStatusPanel(model);

    assert.ok(markup.includes('aria-live="polite"'));
    assert.ok(markup.includes('aria-atomic="true"'));
    assert.ok(markup.includes('tabindex="0"'));
    assert.ok(markup.includes('role="progressbar"'));
    assert.ok(markup.includes('Player knowledge'));
    assert.ok(markup.includes('Echo knowledge'));
    assert.ok(markup.includes('Echo'));
    assert.equal(markup.includes(HIDDEN_STAGE_ID), false);
    assert.equal(markup.includes('hope'), false);
    assert.equal(markup.includes('ragePoints'), false);
    assert.equal(markup.includes('transformationStage'), false);

    const publishedMarkup = renderStatusPanel(
      createEchoStatusReadModel(
        buildInitialState().progressionState,
        { locale: 'en' },
      ),
    );
    assert.ok(publishedMarkup.includes('awakening_fragile'));
  });

  it('keeps the Canon-safe display stable across persistence reload', () => {
    const state = buildInitialState();
    state.progressionState.echo = {
      ...state.progressionState.echo,
      humanity: 61.5,
      fear: 73,
      trust: 27.25,
      anger: 11,
      memoryStability: 58.75,
      corruption: 9.5,
    };
    const before = createEchoStatusReadModel(
      state.progressionState,
      { locale: 'en' },
    );
    const reloaded = mergeGameState(
      partializeGameState(state),
      buildInitialState(),
    );
    const after = createEchoStatusReadModel(
      reloaded.progressionState,
      { locale: 'en' },
    );

    assert.deepEqual(after, before);
  });

  it('keeps active UI wiring canonical and honors reduced motion', () => {
    const dashboardSource = readFileSync(
      resolve(process.cwd(), 'src/features/screens/DashboardScreen.tsx'),
      'utf8',
    );
    const componentSource = readFileSync(
      resolve(process.cwd(), 'src/components/echo/EchoStatusPanel.tsx'),
      'utf8',
    );
    const styles = readFileSync(
      resolve(process.cwd(), 'src/features/screens/core-five-screens.css'),
      'utf8',
    );

    assert.ok(dashboardSource.includes('<EchoStatusPanel'));
    assert.ok(dashboardSource.includes('model.echoStatus.metrics'));
    assert.equal(dashboardSource.includes('state.echo'), false);
    assert.equal(dashboardSource.includes('model.personality'), false);
    assert.ok(componentSource.includes('tabIndex={0}'));
    assert.ok(componentSource.includes('aria-live="polite"'));
    assert.match(
      styles,
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.echo-status-panel/,
    );
    assert.match(
      styles,
      /\[data-gds-motion="reduced"\][\s\S]*\.echo-status-panel/,
    );
  });
});
