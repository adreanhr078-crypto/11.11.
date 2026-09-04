import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import type {
  RuntimeStoryEventDefinition,
} from '../core/echoEvolutionTypes';
import type {
  CanonicalEchoEffect,
} from '../core/echoEventTypes';
import {
  createInitialGameProgressionState,
} from '../core/gameProgressionDefaults';
import type {
  NarrativeEffectPlan,
} from '../core/narrativeEventTypes';
import {
  createInitialNarrativeState,
} from '../domain/narrative/narrativeState';
import {
  applyNarrativeEventTransaction,
  type NarrativeEventTransactionContext,
} from '../domain/narrative/narrativeEventTransaction';
import {
  createNarrativeEffectFingerprint,
} from '../domain/narrative/narrativeEffectPlan';
import {
  RUNTIME_NARRATIVE_KNOWLEDGE_NODES,
  type RuntimeKnowledgeNodeDefinition,
} from '../domain/narrative/knowledgeRegistry';
import {
  RUNTIME_ECHO_EVOLUTION_STAGES,
  RUNTIME_ECHO_STORY_EVENTS,
} from '../domain/echo/echoEvolutionDefinitions';
import {
  createInitialProgression,
} from '../domain/progression/progression';
import {
  CHAPTER_DEFINITIONS,
  CONTENT_MANIFEST,
  DIALOGUE_DEFINITIONS,
  MEMORY_DEFINITIONS,
} from '../infrastructure/content/contentRegistry';
import {
  CINEMATIC_EPISODE_DEFINITIONS,
} from '../infrastructure/content/cinematicContentRegistry';
import {
  GAME_SAVE_VERSION,
  migrateGameState,
  partializeGameState,
} from '../infrastructure/persistence/gamePersistence';
import { useGameStore } from '../stores/gameStore';
import {
  createDialogueNarrativeEffectPlan,
  createMemoryNarrativeEffectPlan,
} from '../application/narrative/narrativeSourceAdapters';
import type {
  DialogueDefinition,
  MemoryDefinition,
} from '../domain/content/contracts';

const knowledgeNodes: readonly RuntimeKnowledgeNodeDefinition[] = [
  {
    nodeId: 'memory.safe_player_fact',
    audience: 'player',
    published: true,
    playerVisible: true,
  },
  {
    nodeId: 'memory.safe_echo_fact',
    audience: 'echo',
    published: true,
    playerVisible: false,
  },
];

const publishedStoryEvents: readonly RuntimeStoryEventDefinition[] = [{
  eventId: 'story_fixture_reveal',
  eventVersion: 1,
  chapterId: 'chapter_1',
  published: true,
}];

const unpublishedStoryEvents: readonly RuntimeStoryEventDefinition[] = [{
  eventId: 'story_fixture_hidden',
  eventVersion: 1,
  chapterId: 'chapter_1',
  published: false,
}];

const context: NarrativeEventTransactionContext = {
  knowledgeNodes,
  storyEvents: RUNTIME_ECHO_STORY_EVENTS,
  evolutionStages: RUNTIME_ECHO_EVOLUTION_STAGES,
};

function initialState() {
  return createInitialGameProgressionState({
    journey: createInitialProgression(
      CONTENT_MANIFEST.contentVersion,
      CHAPTER_DEFINITIONS,
    ),
    narrative: createInitialNarrativeState(),
  });
}

type PlanWithoutEnvelope = Omit<
  NarrativeEffectPlan,
  'fingerprint' | 'timestamp'
>;

function plan(
  input: PlanWithoutEnvelope,
  timestamp = '2026-07-29T12:00:00.000Z',
): NarrativeEffectPlan {
  return {
    ...input,
    fingerprint: createNarrativeEffectFingerprint(input),
    timestamp,
  };
}

function memoryPlan(
  overrides: Partial<PlanWithoutEnvelope> = {},
): NarrativeEffectPlan {
  return plan({
    source: {
      kind: 'memory',
      memoryId: 'memory_fixture',
    },
    eventVersion: 1,
    replayPolicy: 'once',
    echoEffect: {
      trust: 5,
      memoriesRecovered: 1,
    },
    storyFlags: {
      memory_fixture_recovered: true,
    },
    knowledgeGrants: [
      {
        nodeId: 'memory.safe_player_fact',
        audience: 'player',
      },
      {
        nodeId: 'memory.safe_echo_fact',
        audience: 'echo',
      },
    ],
    ...overrides,
  });
}

function dialoguePlan(
  replayPolicy: 'once' | 'repeatable' = 'once',
): NarrativeEffectPlan {
  return plan({
    source: {
      kind: 'dialogue',
      dialogueId: 'dialogue_fixture',
      nodeId: 'opening',
      choiceId: 'listen',
    },
    eventVersion: 1,
    replayPolicy,
    echoEffect: { trust: 1 },
    storyFlags: {},
    knowledgeGrants: [],
    dialogueTransition: {
      nextNodeId: null,
      completed: true,
    },
  });
}

describe('Phase 3F canonical narrative event integration', () => {
  it('applies a Memory event atomically with source-owned idempotency', () => {
    const before = initialState();
    const result = applyNarrativeEventTransaction(
      before,
      memoryPlan(),
      context,
    );

    assert.equal(result.success, true);
    assert.equal(result.applied, true);
    assert.equal(result.state.echo.trust, before.echo.trust + 5);
    assert.equal(
      result.state.echo.memoriesRecovered,
      before.echo.memoriesRecovered + 1,
    );
    assert.deepEqual(
      result.state.story.narrative.unlockedMemoryIds,
      ['memory_fixture'],
    );
    assert.equal(
      result.state.story.narrative.activeFlags
        .memory_fixture_recovered,
      true,
    );
    assert.deepEqual(
      result.state.story.narrative.knowledgeNodeIds,
      ['memory.safe_player_fact'],
    );
    assert.deepEqual(
      result.state.story.narrative.echoKnowledgeNodeIds,
      ['memory.safe_echo_fact'],
    );
    assert.deepEqual(
      Object.keys(result.state.echoEvents.standaloneReceiptsByKey),
      [],
    );

    const repeated = applyNarrativeEventTransaction(
      result.state,
      memoryPlan(),
      context,
    );
    assert.equal(repeated.success, true);
    assert.equal(repeated.alreadyApplied, true);
    assert.equal(repeated.state, result.state);
  });

  it('rejects a conflicting Memory receipt without partial changes', () => {
    const applied = applyNarrativeEventTransaction(
      initialState(),
      memoryPlan(),
      context,
    );
    const conflicting = memoryPlan({
      echoEffect: {
        trust: 6,
        memoriesRecovered: 1,
      },
    });
    const result = applyNarrativeEventTransaction(
      applied.state,
      conflicting,
      context,
    );

    assert.equal(result.success, false);
    assert.equal(result.conflict, true);
    assert.equal(
      result.failureReason,
      'narrative-event-conflict',
    );
    assert.equal(result.state, applied.state);
  });

  it('records a Memory fragment under the Memory-owned receipt', () => {
    const fragment = memoryPlan({
      source: {
        kind: 'memory',
        memoryId: 'memory_fixture',
        fragmentId: 'fragment_fixture_01',
      },
    });
    const result = applyNarrativeEventTransaction(
      initialState(),
      fragment,
      context,
    );

    assert.equal(result.success, true);
    assert.equal(
      result.receiptKey,
      'memory:memory_fixture:fragment_fixture_01:1',
    );
    assert.deepEqual(
      result.state.story.narrative.unlockedMemoryIds,
      ['memory_fixture'],
    );
    assert.deepEqual(
      result.state.story.narrative.unlockedMemoryFragmentIds,
      ['fragment_fixture_01'],
    );
  });

  it('rejects an invalid Echo metric before changing any source field', () => {
    const before = initialState();
    const invalidEffect = {
      trust: 5,
      hope: 50,
    } as unknown as CanonicalEchoEffect;
    const input: PlanWithoutEnvelope = {
      source: {
        kind: 'memory',
        memoryId: 'memory_fixture',
      },
      eventVersion: 1,
      replayPolicy: 'once',
      echoEffect: invalidEffect,
      storyFlags: { should_not_apply: true },
      knowledgeGrants: [],
    };
    const invalid: NarrativeEffectPlan = {
      ...input,
      fingerprint: 'narrative-v1-00000000',
      timestamp: '2026-07-29T12:00:00.000Z',
    };
    const result = applyNarrativeEventTransaction(
      before,
      invalid,
      context,
    );

    assert.equal(result.success, false);
    assert.equal(result.failureReason, 'invalid-echo-effect');
    assert.equal(result.state, before);
  });

  it('rejects an invalid Story flag before applying Echo or Memory state', () => {
    const before = initialState();
    const input: PlanWithoutEnvelope = {
      source: {
        kind: 'memory',
        memoryId: 'memory_fixture',
      },
      eventVersion: 1,
      replayPolicy: 'once',
      echoEffect: { trust: 5 },
      storyFlags: { 'invalid flag': true },
      knowledgeGrants: [],
    };
    const invalid: NarrativeEffectPlan = {
      ...input,
      fingerprint: createNarrativeEffectFingerprint(input),
      timestamp: '2026-07-29T12:00:00.000Z',
    };
    const result = applyNarrativeEventTransaction(
      before,
      invalid,
      context,
    );

    assert.equal(result.success, false);
    assert.equal(result.failureReason, 'invalid-story-flag');
    assert.equal(result.state, before);
  });

  it('keeps a permanent Dialogue choice idempotent', () => {
    const before = initialState();
    const applied = applyNarrativeEventTransaction(
      before,
      dialoguePlan(),
      context,
    );
    const repeated = applyNarrativeEventTransaction(
      applied.state,
      dialoguePlan(),
      context,
    );

    assert.equal(applied.success, true);
    assert.equal(applied.state.echo.trust, before.echo.trust + 1);
    assert.equal(
      applied.state.story.narrative.decisionHistory.length,
      1,
    );
    assert.equal(repeated.alreadyApplied, true);
    assert.equal(repeated.state, applied.state);
  });

  it('adapts authored Memory and Dialogue data without legacy metrics', () => {
    const memory: MemoryDefinition = {
      id: 'memory_adapter_fixture',
      chapterId: 'chapter_1',
      title: { ar: 'اختبار', en: 'Fixture' },
      description: { ar: 'اختبار', en: 'Fixture' },
      fragments: [],
      emotionalImpact: { trust: 2 },
      relatedCharacterIds: ['echo'],
      unlockCondition: {
        kind: 'statAtLeast',
        stat: 'trust',
        value: 0,
      },
    };
    const memoryEffect = createMemoryNarrativeEffectPlan(
      { kind: 'memory', definition: memory },
      '2026-07-29T12:00:00.000Z',
    );
    assert.deepEqual(memoryEffect?.echoEffect, { trust: 2 });

    const dialogue: DialogueDefinition = {
      id: 'dialogue_adapter_fixture',
      chapterId: 'chapter_1',
      entryNodeId: 'opening',
      nodes: [{
        id: 'opening',
        speakerId: 'echo',
        text: { ar: 'اختبار', en: 'Fixture' },
        conditions: [],
        choices: [{
          id: 'listen',
          text: { ar: 'استمع', en: 'Listen' },
          conditions: [],
          effects: [
            { kind: 'adjustStat', stat: 'trust', amount: 2 },
            { kind: 'setFlag', flag: 'dialogue_fixture_seen', value: true },
          ],
        }],
      }],
    };
    const dialogueEffect = createDialogueNarrativeEffectPlan(
      dialogue,
      dialogue.nodes[0]!,
      'listen',
      { nextNodeId: null, completed: true },
      '2026-07-29T12:00:00.000Z',
    );
    assert.deepEqual(dialogueEffect?.echoEffect, { trust: 2 });
    assert.deepEqual(dialogueEffect?.storyFlags, {
      dialogue_fixture_seen: true,
    });
  });

  it('does not incorrectly block an authored repeatable Dialogue choice', () => {
    const before = initialState();
    const first = applyNarrativeEventTransaction(
      before,
      dialoguePlan('repeatable'),
      context,
    );
    const second = applyNarrativeEventTransaction(
      first.state,
      dialoguePlan('repeatable'),
      context,
    );

    assert.equal(first.applied, true);
    assert.equal(second.applied, true);
    assert.equal(second.alreadyApplied, false);
    assert.equal(second.state.echo.trust, before.echo.trust + 2);
    assert.equal(
      second.state.story.narrative.decisionHistory.length,
      2,
    );
    assert.deepEqual(
      second.state.narrativeEvents.claimedSourceReceiptKeys,
      [],
    );
  });

  it('validates Knowledge audience without equating player and Echo', () => {
    const result = applyNarrativeEventTransaction(
      initialState(),
      memoryPlan(),
      context,
    );
    assert.notDeepEqual(
      result.state.story.narrative.knowledgeNodeIds,
      result.state.story.narrative.echoKnowledgeNodeIds,
    );

    const unknown = memoryPlan({
      knowledgeGrants: [{
        nodeId: 'memory.unknown_node',
        audience: 'player',
      }],
    });
    const rejected = applyNarrativeEventTransaction(
      initialState(),
      unknown,
      context,
    );
    assert.equal(rejected.success, false);
    assert.equal(rejected.failureReason, 'invalid-knowledge-node');
    assert.deepEqual(
      rejected.state.story.narrative.knowledgeNodeIds,
      [],
    );
  });

  it('rejects missing and unpublished Story Events atomically', () => {
    const missing = plan({
      source: {
        kind: 'story',
        eventId: 'story_fixture_missing',
      },
      eventVersion: 1,
      replayPolicy: 'once',
      echoEffect: { humanity: 2 },
      storyFlags: { should_not_apply: true },
      knowledgeGrants: [],
      storyEvent: {
        eventId: 'story_fixture_missing',
        eventVersion: 1,
      },
    });
    const missingResult = applyNarrativeEventTransaction(
      initialState(),
      missing,
      context,
    );
    assert.equal(missingResult.failureReason, 'story-event-not-found');
    assert.equal(missingResult.state.echo.humanity, 35);

    const hidden = plan({
      source: {
        kind: 'story',
        eventId: 'story_fixture_hidden',
      },
      eventVersion: 1,
      replayPolicy: 'once',
      echoEffect: { humanity: 2 },
      storyFlags: { should_not_apply: true },
      knowledgeGrants: [],
      storyEvent: {
        eventId: 'story_fixture_hidden',
        eventVersion: 1,
      },
    });
    const hiddenResult = applyNarrativeEventTransaction(
      initialState(),
      hidden,
      {
        ...context,
        storyEvents: unpublishedStoryEvents,
      },
    );
    assert.equal(hiddenResult.failureReason, 'story-event-unpublished');
    assert.equal(hiddenResult.state.echo.humanity, 35);
  });

  it('detects a conflicting independent Story Event payload', () => {
    const base = plan({
      source: {
        kind: 'story',
        eventId: 'story_fixture_reveal',
      },
      eventVersion: 1,
      replayPolicy: 'once',
      echoEffect: { humanity: 2 },
      storyFlags: { fixture_revealed: true },
      knowledgeGrants: [],
      storyEvent: {
        eventId: 'story_fixture_reveal',
        eventVersion: 1,
      },
    });
    const applied = applyNarrativeEventTransaction(
      initialState(),
      base,
      {
        ...context,
        storyEvents: publishedStoryEvents,
      },
    );
    const changed = plan({
      ...base,
      echoEffect: { humanity: 3 },
    });
    const conflict = applyNarrativeEventTransaction(
      applied.state,
      changed,
      {
        ...context,
        storyEvents: publishedStoryEvents,
      },
    );

    assert.equal(applied.success, true);
    assert.equal(conflict.success, false);
    assert.equal(conflict.conflict, true);
    assert.equal(conflict.state, applied.state);
  });

  it('supports future Cinematic source ownership without Runtime content', () => {
    const cinematic = plan({
      source: {
        kind: 'cinematic',
        episodeId: 'episode_fixture',
        narrativeEventId: 'choice_listen',
      },
      eventVersion: 1,
      replayPolicy: 'once',
      echoEffect: { trust: 2 },
      storyFlags: { cinematic_fixture_seen: true },
      knowledgeGrants: [],
    });
    const result = applyNarrativeEventTransaction(
      initialState(),
      cinematic,
      context,
    );

    assert.equal(result.success, true);
    assert.equal(
      result.receiptKey,
      'cinematic:episode_fixture:choice_listen:1',
    );
    assert.equal(result.state.echo.trust, 17);
    assert.equal(
      result.state.story.narrative.activeFlags.cinematic_fixture_seen,
      true,
    );
  });

  it('records a fixture Story Event without inventing an Evolution stage', () => {
    const authored = plan({
      source: {
        kind: 'story',
        eventId: 'story_fixture_reveal',
      },
      eventVersion: 1,
      replayPolicy: 'once',
      echoEffect: { humanity: 2 },
      storyFlags: { fixture_revealed: true },
      knowledgeGrants: [],
      storyEvent: {
        eventId: 'story_fixture_reveal',
        eventVersion: 1,
      },
    });
    const result = applyNarrativeEventTransaction(
      initialState(),
      authored,
      {
        ...context,
        storyEvents: publishedStoryEvents,
      },
    );

    assert.equal(result.success, true);
    assert.equal(
      result.state.evolution.currentStageId,
      'awakening_fragile',
    );
    assert.deepEqual(result.state.evolution.reachedStageIds, [
      'awakening_fragile',
    ]);
  });

  it('never projects Narrative effects into legacy semantic aliases', () => {
    const before = initialState();
    const result = applyNarrativeEventTransaction(
      before,
      memoryPlan({
        echoEffect: {
          humanity: 10,
          anger: 10,
          memoryStability: 10,
          memoriesRecovered: 1,
        },
      }),
      context,
    );

    assert.equal(result.state.echo.humanity, before.echo.humanity + 10);
    assert.equal(result.state.echo.hope, before.echo.hope);
    assert.equal(result.state.echo.anger, before.echo.anger + 10);
    assert.equal(result.state.echo.ragePoints, before.echo.ragePoints);
    assert.equal(
      result.state.echo.memoryStability,
      before.echo.memoryStability + 10,
    );
    assert.equal(
      result.state.echo.memoriesRecovered,
      before.echo.memoriesRecovered + 1,
    );
    assert.equal(
      readFileSync(
        new URL(
          '../domain/narrative/narrativeEventTransaction.ts',
          import.meta.url,
        ),
        'utf8',
      ).includes('transformationStage'),
      false,
    );
  });

  it('keeps legacy source receipts protected without inventing metadata', () => {
    const before = initialState();
    before.narrativeEvents.claimedSourceReceiptKeys = [
      'memory:memory_fixture:1',
    ];
    const result = applyNarrativeEventTransaction(
      before,
      memoryPlan(),
      context,
    );

    assert.equal(result.success, true);
    assert.equal(result.alreadyApplied, true);
    assert.equal(result.state, before);
    assert.deepEqual(
      result.state.narrativeEvents.sourceFingerprintsByReceiptKey,
      {},
    );
    assert.deepEqual(
      result.state.narrativeEvents.sourceAppliedAtByReceiptKey,
      {},
    );
  });

  it('migrates legacy evidence, round-trips receipts, and preserves unknown IDs', () => {
    const migrated = migrateGameState({
      narrative: {
        unlockedMemoryIds: ['memory_legacy'],
        unlockedMemoryFragmentIds: ['fragment_legacy_01'],
        latestDecisions: {
          'dialogue_legacy:opening': 'listen',
        },
        knowledgeNodeIds: ['knowledge.future_unknown'],
        echoKnowledgeNodeIds: ['knowledge.echo_future_unknown'],
      },
      progressionState: {
        narrativeEvents: {
          claimedSourceReceiptKeys: [
            'future-source:opaque-id:9',
          ],
        },
      },
    }, 17);
    const progressionState = migrated.progressionState!;

    assert.ok(
      progressionState.narrativeEvents.claimedSourceReceiptKeys
        .includes('memory:memory_legacy:1'),
    );
    assert.ok(
      progressionState.narrativeEvents.claimedSourceReceiptKeys
        .includes('memory-fragment:fragment_legacy_01:1'),
    );
    assert.ok(
      progressionState.narrativeEvents.claimedSourceReceiptKeys
        .includes('dialogue:dialogue_legacy:opening:listen:1'),
    );
    assert.ok(
      progressionState.narrativeEvents.claimedSourceReceiptKeys
        .includes('future-source:opaque-id:9'),
    );
    assert.deepEqual(
      progressionState.narrativeEvents
        .sourceFingerprintsByReceiptKey,
      {},
    );
    assert.deepEqual(
      progressionState.story.narrative.knowledgeNodeIds,
      ['knowledge.future_unknown'],
    );
    assert.deepEqual(
      progressionState.story.narrative.echoKnowledgeNodeIds,
      ['knowledge.echo_future_unknown'],
    );

    const current = useGameStore.getState();
    const persisted = partializeGameState({
      ...current,
      progressionState,
      narrative: progressionState.story.narrative,
    });
    const reloaded = migrateGameState(
      persisted,
      GAME_SAVE_VERSION,
    ).progressionState!;
    assert.deepEqual(
      reloaded.narrativeEvents,
      progressionState.narrativeEvents,
    );
    assert.deepEqual(
      reloaded.story.narrative.knowledgeNodeIds,
      progressionState.story.narrative.knowledgeNodeIds,
    );
  });

  it('keeps runtime narrative registries limited to approved final-Manhwa gates', () => {
    assert.equal(MEMORY_DEFINITIONS.length, 0);
    assert.equal(DIALOGUE_DEFINITIONS.length, 0);
    assert.equal(CINEMATIC_EPISODE_DEFINITIONS.length, 0);
    assert.deepEqual(
      RUNTIME_NARRATIVE_KNOWLEDGE_NODES.map(({ nodeId }) => nodeId),
      [
        'echo_knowledge_black_coronation',
        'echo_knowledge_lina_protocol',
        'echo_knowledge_black_echo_protocol',
      ],
    );
    assert.ok(RUNTIME_NARRATIVE_KNOWLEDGE_NODES.every((node) => (
      node.published && !node.playerVisible && node.audience === 'echo'
    )));
    assert.deepEqual(
      RUNTIME_ECHO_STORY_EVENTS.map(({ eventId }) => eventId),
      [],
    );

    const runtimeFiles = [
      '../domain/narrative/knowledgeRegistry.ts',
      '../domain/narrative/narrativeEventTransaction.ts',
      '../domain/narrative/narrativeEffectPlan.ts',
    ];
    for (const path of runtimeFiles) {
      const source = readFileSync(new URL(path, import.meta.url), 'utf8');
      assert.equal(source.includes('docs/internal'), false);
      assert.equal(source.includes('canonRegistry'), false);
    }
    const activeActions = readFileSync(
      new URL(
        '../application/narrative/createNarrativeActions.ts',
        import.meta.url,
      ),
      'utf8',
    );
    assert.ok(activeActions.includes('applyNarrativeEventTransaction'));
    assert.equal(
      activeActions.includes('applyEchoPersonalitySourceTransition'),
      false,
    );
  });
});
