import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ECHO_REACTIONS,
  ECHO_STATES,
  createEchoPresenceReadModel,
} from '../domain/echo/echoPresence';
import {
  createEchoKnowledgeTopicReadModels,
} from '../domain/echo/echoKnowledgeGates';
import {
  CHARACTER_KNOWLEDGE_GATES,
  getCharacterMomentReadModels,
} from '../domain/characters/characterAttachment';
import type { StoryPuzzleSnapshot } from '../domain/story-puzzles/storyPuzzleContracts';
import { buildInitialState } from '../stores/gameStoreHelpers';

const RECEIPT_SOURCE = {
  manhwa_chapter_04_black_coronation: {
    pageId: 'manhwa_ch04_page_02',
    pageNumber: 56,
  },
  manhwa_chapter_04_lina_protocol: {
    pageId: 'manhwa_ch04_page_04',
    pageNumber: 58,
  },
  manhwa_chapter_04_black_echo_protocol: {
    pageId: 'manhwa_ch04_page_08',
    pageNumber: 62,
  },
} as const;

function snapshot(shardCount = 0): StoryPuzzleSnapshot {
  return {
    coinBalance: 0,
    shardCount,
    mainCompletedCount: 0,
    totalCompletedCount: 0,
    entries: [],
    discoverableSecretPuzzleIds: [],
    echoResonance: {
      total: 0,
      byAxis: { clarity: 0, memory: 0, trust: 0, resolve: 0, stability: 0, anomaly: 0 },
      lastPuzzleId: null,
    },
    syncedAt: '2026-08-09T11:11:00.000Z',
  };
}

function addReceipt(
  state: ReturnType<typeof buildInitialState>,
  eventId: keyof typeof RECEIPT_SOURCE,
) {
  state.progressionState.story.authoritative.completedChapterIds = ['chapter_3'];
  state.progressionState.story.authoritative.canonEventReceipts.push({
    eventId,
    eventVersion: 1,
    sourceType: 'manhwa',
    sourceId: 'chapter_4',
    sourcePageId: RECEIPT_SOURCE[eventId].pageId,
    sourcePageNumber: RECEIPT_SOURCE[eventId].pageNumber,
    reachedAt: '2026-08-09T11:11:00.000Z',
  });
}

describe('Phase 4 Echo presence and attachment boundaries', () => {
  it('uses only the approved base and three published Echo states', () => {
    assert.deepEqual(
      ECHO_STATES.map((state) => state.stageId),
      [
        'awakening_fragile',
        'black_coronation',
        'second_contract_marked',
        'black_echo_protocol',
      ],
    );
    assert.equal(ECHO_STATES.some((state) => state.stageId.includes('final')), false);
    assert.equal(ECHO_REACTIONS.every((reaction) => reaction.dialogueRef === null), true);
  });

  it('starts stable and reacts to verified puzzle activity only inside its window', () => {
    const state = buildInitialState();
    const stable = createEchoPresenceReadModel({
      progressionState: state.progressionState,
      now: 10_000,
    });
    assert.equal(stable.stage.stageId, 'awakening_fragile');
    assert.equal(stable.reaction, null);

    const perfect = createEchoPresenceReadModel({
      progressionState: state.progressionState,
      activity: {
        kind: 'perfect-solve',
        puzzleId: 'story_puzzle_03_torn_memory',
        occurredAt: 10_000,
      },
      now: 10_500,
    });
    assert.equal(perfect.reaction?.trigger, 'perfect_solve');
    assert.equal(perfect.memorySignals.lastPuzzleWasPerfect, true);

    const expired = createEchoPresenceReadModel({
      progressionState: state.progressionState,
      activity: {
        kind: 'perfect-solve',
        occurredAt: 1,
      },
      now: 20_000,
    });
    assert.equal(expired.reaction, null);
  });

  it('gives transformation and complete-shard reactions higher priority', () => {
    const state = buildInitialState();
    addReceipt(state, 'manhwa_chapter_04_black_coronation');
    const transformation = createEchoPresenceReadModel({
      progressionState: state.progressionState,
      activity: { kind: 'main-puzzle-solved', occurredAt: 10_000 },
      now: 10_100,
    });
    assert.equal(transformation.stage.stageId, 'black_coronation');
    assert.equal(transformation.reaction?.trigger, 'echo_transformation');

    const allShards = createEchoPresenceReadModel({
      progressionState: buildInitialState().progressionState,
      activity: { kind: 'all-20-shards-found', occurredAt: 10_000 },
      puzzleSnapshot: snapshot(20),
      now: 10_100,
    });
    assert.equal(allShards.reaction?.trigger, 'all_20_shards_found');
  });

  it('never unlocks a transformation or knowledge topic from client-only state', () => {
    const state = buildInitialState();
    state.progressionState.story.narrative.echoKnowledgeNodeIds.push(
      'echo_knowledge_black_echo_protocol',
    );
    const topics = createEchoKnowledgeTopicReadModels(state.progressionState);
    assert.equal(topics.find((topic) => topic.topicId === 'echo_knowledge_black_echo_protocol')?.status, 'locked');
    assert.equal(createEchoPresenceReadModel({
      progressionState: state.progressionState,
    }).stage.stageId, 'awakening_fragile');
  });

  it('unlocks the partial Lina moment only after its canonical event chain', () => {
    const state = buildInitialState();
    assert.equal(getCharacterMomentReadModels(state.progressionState)[0]?.unlocked, false);
    addReceipt(state, 'manhwa_chapter_04_black_coronation');
    addReceipt(state, 'manhwa_chapter_04_lina_protocol');
    const moment = getCharacterMomentReadModels(state.progressionState)[0];
    assert.equal(moment?.unlocked, true);
    assert.equal(moment?.contentReference, 'character_lina_partial_file');
    assert.equal(CHARACTER_KNOWLEDGE_GATES.every((gate) => gate.ownerContentRequired), true);
  });
});
