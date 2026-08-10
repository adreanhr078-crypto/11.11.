import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import type {
  EchoEvolutionProgressState,
  EchoEvolutionStageDefinition,
  ProvenStoryEvent,
  RuntimeStoryEventDefinition,
} from '../core/echoEvolutionTypes';
import {
  INITIAL_ECHO_EVOLUTION_STAGE_ID,
} from '../core/echoEvolutionTypes';
import { CANON_REGISTRY } from '../core/canonRegistry';
import {
  RUNTIME_ECHO_EVOLUTION_STAGES,
  RUNTIME_ECHO_STORY_EVENTS,
} from '../domain/echo/echoEvolutionDefinitions';
import {
  evaluateEchoEvolution,
  validateEchoEvolutionDefinitions,
} from '../domain/echo/echoEvolutionEngine';
import {
  createInitialEchoEvolutionProgressState,
} from '../core/gameProgressionDefaults';

const FIRST_TRANSITION_AT = '2026-07-29T11:11:00.000Z';
const SECOND_TRANSITION_AT = '2026-07-29T11:12:00.000Z';

function stage(
  stageId: string,
  order: number,
  previousStageId: string | null,
  requiredStoryEventId: string | null,
  overrides: Partial<EchoEvolutionStageDefinition> = {},
): EchoEvolutionStageDefinition {
  return {
    stageId,
    order,
    chapterId: 'chapter_1',
    requiredStoryEventId,
    previousStageId,
    visualFormId: `visual_${order}`,
    isPermanent: false,
    published: true,
    playerVisible: true,
    safePlayerLabel: {
      ar: `مرحلة ${order}`,
      en: `Stage ${order}`,
    },
    knowledgeBoundary: order === 1
      ? 'runtime-public'
      : 'story-event-revealed',
    ...overrides,
  };
}

function storyEvent(
  eventId: string,
  overrides: Partial<RuntimeStoryEventDefinition> = {},
): RuntimeStoryEventDefinition {
  return {
    eventId,
    eventVersion: 1,
    chapterId: 'chapter_1',
    published: true,
    ...overrides,
  };
}

function proof(
  eventId: string,
  timestamp = FIRST_TRANSITION_AT,
  overrides: Partial<ProvenStoryEvent> = {},
): ProvenStoryEvent {
  return {
    eventId,
    eventVersion: 1,
    fingerprint: 'deadbeef',
    timestamp,
    ...overrides,
  };
}

function fixtures() {
  const stages = [
    stage('stage_test_initial', 1, null, null),
    stage(
      'stage_test_revealed',
      2,
      'stage_test_initial',
      'story_event_test_reveal',
    ),
  ];
  const events = [storyEvent('story_event_test_reveal')];
  const progress: EchoEvolutionProgressState = {
    currentStageId: 'stage_test_initial',
    reachedStageIds: ['stage_test_initial'],
    stageReachedAt: {},
  };
  return { stages, events, progress };
}

describe('runtime final Manhwa publication boundary', () => {
  it('publishes only approved final-Manhwa stages and Canon events', () => {
    assert.deepEqual(
      RUNTIME_ECHO_EVOLUTION_STAGES.map(({ stageId }) => stageId),
      [
        INITIAL_ECHO_EVOLUTION_STAGE_ID,
        'black_coronation',
        'second_contract_marked',
        'black_echo_protocol',
      ],
    );
    assert.deepEqual(
      RUNTIME_ECHO_STORY_EVENTS.map(({ eventId }) => eventId),
      [
        'manhwa_chapter_04_black_coronation',
        'manhwa_chapter_04_lina_protocol',
        'manhwa_chapter_04_black_echo_protocol',
      ],
    );
    assert.deepEqual(CANON_REGISTRY.runtimePublishedChapterIds, [
      'chapter_1',
      'chapter_2',
      'chapter_3',
      'chapter_4',
    ]);
    assert.ok(RUNTIME_ECHO_EVOLUTION_STAGES.every(
      ({ chapterId, published, playerVisible }) => (
        ['chapter_1', 'chapter_4'].includes(chapterId)
        && published
        && playerVisible
      ),
    ));
  });

  it('contains no unapproved future or final transformation in Runtime data', () => {
    const runtimePayload = JSON.stringify({
      stages: RUNTIME_ECHO_EVOLUTION_STAGES,
      events: RUNTIME_ECHO_STORY_EVENTS,
    }).toLowerCase();

    for (const forbidden of [
      'chapter_5',
      'zero',
      'full_transformation',
    ]) {
      assert.equal(runtimePayload.includes(forbidden), false);
    }
  });

  it('does not import author-only canon into the evolution Runtime', () => {
    const runtimeSources = [
      '../core/echoEvolutionTypes.ts',
      '../domain/echo/echoEvolutionDefinitions.ts',
      '../domain/echo/echoEvolutionEngine.ts',
    ].map((relativePath) => readFileSync(
      new URL(relativePath, import.meta.url),
      'utf8',
    ));

    for (const source of runtimeSources) {
      assert.doesNotMatch(
        source,
        /from\s+['"][^'"]*(?:docs\/internal|authorCanon)[^'"]*['"]/,
      );
    }
  });

  it('does not transition from metrics or legacy stage values', () => {
    const progress = createInitialEchoEvolutionProgressState();
    const result = evaluateEchoEvolution(
      progress,
      RUNTIME_ECHO_EVOLUTION_STAGES,
      RUNTIME_ECHO_STORY_EVENTS,
      [],
    );

    assert.equal(result.transitionAvailable, false);
    assert.equal(result.failureReason, 'story-event-not-proven');
    assert.equal(result.progress, progress);
  });
});

describe('pure Long Fall evolution engine', () => {
  it('requires a published event definition and its valid source proof', () => {
    const { stages, events, progress } = fixtures();

    const missingDefinition = evaluateEchoEvolution(
      progress,
      stages,
      [],
      [proof('story_event_test_reveal')],
    );
    assert.equal(
      missingDefinition.failureReason,
      'missing-story-event-definition',
    );

    const unpublished = evaluateEchoEvolution(
      progress,
      stages,
      [storyEvent('story_event_test_reveal', { published: false })],
      [proof('story_event_test_reveal')],
    );
    assert.equal(unpublished.failureReason, 'story-event-unpublished');

    const unproven = evaluateEchoEvolution(
      progress,
      stages,
      events,
      [],
    );
    assert.equal(unproven.failureReason, 'story-event-not-proven');
  });

  it('returns a deterministic plan without mutating progress', () => {
    const { stages, events, progress } = fixtures();
    const before = structuredClone(progress);
    const result = evaluateEchoEvolution(
      progress,
      stages,
      events,
      [proof('story_event_test_reveal')],
    );

    assert.equal(result.success, true);
    assert.equal(result.transitionAvailable, true);
    assert.deepEqual(progress, before);
    assert.deepEqual(result.plan?.nextProgress, {
      currentStageId: 'stage_test_revealed',
      reachedStageIds: ['stage_test_initial', 'stage_test_revealed'],
      stageReachedAt: {
        stage_test_revealed: FIRST_TRANSITION_AT,
      },
      transformationIntroSeen: [],
    });
  });

  it('cannot skip the immediately required previous stage', () => {
    const { stages, events, progress } = fixtures();
    const threeStages = [
      ...stages,
      stage(
        'stage_test_later',
        3,
        'stage_test_revealed',
        'story_event_test_later',
      ),
    ];
    const result = evaluateEchoEvolution(
      progress,
      threeStages,
      [...events, storyEvent('story_event_test_later')],
      [proof('story_event_test_later', SECOND_TRANSITION_AT)],
    );

    assert.equal(result.transitionAvailable, false);
    assert.equal(result.failureReason, 'story-event-not-proven');
    assert.equal(result.progress.currentStageId, 'stage_test_initial');
  });

  it('does not replay a reached stage or overwrite its timestamp', () => {
    const { stages, events } = fixtures();
    const progress: EchoEvolutionProgressState = {
      currentStageId: 'stage_test_initial',
      reachedStageIds: ['stage_test_initial', 'stage_test_revealed'],
      stageReachedAt: {
        stage_test_revealed: FIRST_TRANSITION_AT,
      },
      transformationIntroSeen: [],
    };
    const result = evaluateEchoEvolution(
      progress,
      stages,
      events,
      [proof('story_event_test_reveal', SECOND_TRANSITION_AT)],
    );

    assert.equal(result.transitionAvailable, false);
    assert.equal(result.failureReason, 'stage-already-reached');
    assert.equal(
      result.progress.stageReachedAt.stage_test_revealed,
      FIRST_TRANSITION_AT,
    );
  });

  it('keeps a current stage monotonic when future definitions are added', () => {
    const { stages, events } = fixtures();
    const reached: EchoEvolutionProgressState = {
      currentStageId: 'stage_test_revealed',
      reachedStageIds: ['stage_test_initial', 'stage_test_revealed'],
      stageReachedAt: {
        stage_test_revealed: FIRST_TRANSITION_AT,
      },
    };
    const expandedStages = [
      ...stages,
      stage(
        'stage_test_future',
        3,
        'stage_test_revealed',
        'story_event_test_future',
      ),
    ];
    const result = evaluateEchoEvolution(
      reached,
      expandedStages,
      [...events, storyEvent('story_event_test_future')],
      [],
    );

    assert.equal(result.transitionAvailable, false);
    assert.equal(result.failureReason, 'story-event-not-proven');
    assert.equal(result.progress.currentStageId, 'stage_test_revealed');
    assert.deepEqual(result.progress.stageReachedAt, reached.stageReachedAt);
  });

  it('never regresses after psychological metrics decrease', () => {
    const { stages, events } = fixtures();
    const reached: EchoEvolutionProgressState = {
      currentStageId: 'stage_test_revealed',
      reachedStageIds: ['stage_test_initial', 'stage_test_revealed'],
      stageReachedAt: {
        stage_test_revealed: FIRST_TRANSITION_AT,
      },
    };
    // No metric object is accepted by the engine: changing those values
    // elsewhere cannot provide evidence or select an earlier stage.
    const result = evaluateEchoEvolution(reached, stages, events, []);

    assert.equal(result.failureReason, 'no-next-stage');
    assert.equal(result.progress.currentStageId, 'stage_test_revealed');
    assert.deepEqual(result.progress, reached);
  });

  it('fails safely for unknown future and permanent current stages', () => {
    const { stages, events } = fixtures();
    const unknown: EchoEvolutionProgressState = {
      currentStageId: 'stage_from_newer_build',
      reachedStageIds: ['stage_from_newer_build'],
      stageReachedAt: {},
    };
    const unknownResult = evaluateEchoEvolution(
      unknown,
      stages,
      events,
      [],
    );
    assert.equal(unknownResult.failureReason, 'unknown-current-stage');
    assert.equal(unknownResult.progress, unknown);

    const permanentStages = [
      stage('stage_test_initial', 1, null, null, {
        isPermanent: true,
      }),
    ];
    const permanentResult = evaluateEchoEvolution(
      {
        currentStageId: 'stage_test_initial',
        reachedStageIds: ['stage_test_initial'],
        stageReachedAt: {},
      },
      permanentStages,
      [],
      [],
    );
    assert.equal(permanentResult.failureReason, 'current-stage-permanent');
  });

  it('rejects malformed, branching, and ambiguous definitions', () => {
    const { stages, progress } = fixtures();
    assert.equal(validateEchoEvolutionDefinitions(stages), true);
    assert.equal(validateEchoEvolutionDefinitions([
      ...stages,
      stage(
        'stage_test_branch',
        2,
        'stage_test_initial',
        'story_event_test_branch',
      ),
    ]), false);

    const result = evaluateEchoEvolution(
      progress,
      stages,
      [
        storyEvent('story_event_test_reveal'),
        storyEvent('story_event_test_reveal', { eventVersion: 2 }),
      ],
      [proof('story_event_test_reveal')],
    );
    assert.equal(result.success, false);
    assert.equal(result.failureReason, 'invalid-definitions');
  });
});
