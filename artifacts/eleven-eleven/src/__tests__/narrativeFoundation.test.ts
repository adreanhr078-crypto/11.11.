import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  DialogueDefinition,
  EndingDefinition,
  MemoryDefinition,
} from '../domain/content/contracts';
import {
  createInitialEchoPersonality,
} from '../domain/echo/echoPersonality';
import {
  createInitialNarrativeState,
} from '../domain/narrative/narrativeState';
import { unlockEligibleMemories } from '../domain/narrative/memorySystem';
import {
  chooseDialogueOption,
  startDialogue,
} from '../domain/narrative/dialogueGraph';
import {
  evaluateEndingEligibility,
} from '../domain/narrative/endingEngine';
import {
  CHAPTER_DEFINITIONS,
  CONTENT_MANIFEST,
} from '../infrastructure/content/contentRegistry';
import {
  createInitialProgression,
} from '../domain/progression/progression';
import { migrateGameState } from '../infrastructure/persistence/gamePersistence';

const progression = createInitialProgression(
  CONTENT_MANIFEST.contentVersion,
  CHAPTER_DEFINITIONS,
);

describe('Phase 2 narrative foundation', () => {
  it('unlocks memories and fragments from data conditions', () => {
    const memory: MemoryDefinition = {
      id: 'memory_test',
      chapterId: 'chapter_1',
      title: { ar: 'اختبار', en: 'Test' },
      description: { ar: 'وصف', en: 'Description' },
      fragments: [
        {
          id: 'fragment_test_01',
          title: { ar: 'جزء', en: 'Fragment' },
          text: { ar: 'نص', en: 'Text' },
          unlockCondition: {
            kind: 'memoryCollected',
            memoryId: 'memory_test',
          },
          emotionalImpact: { memoriesRecovered: 5 },
          order: 0,
        },
      ],
      emotionalImpact: { trust: 10 },
      relatedCharacterIds: ['echo'],
      unlockCondition: {
        kind: 'statAtLeast',
        stat: 'trust',
        value: 15,
      },
    };

    const result = unlockEligibleMemories([memory], {
      echo: createInitialEchoPersonality(),
      progression,
      narrative: createInitialNarrativeState(),
    });

    assert.deepEqual(result.unlockedMemoryIds, ['memory_test']);
    assert.deepEqual(result.unlockedFragmentIds, ['fragment_test_01']);
    assert.equal(result.echo.trust, 25);
    assert.equal(result.echo.memoriesRecovered, 5);
  });

  it('advances dialogue graphs and persists player decisions', () => {
    const dialogue: DialogueDefinition = {
      id: 'dialogue_test',
      chapterId: 'chapter_1',
      entryNodeId: 'start',
      nodes: [
        {
          id: 'start',
          speakerId: 'echo',
          text: { ar: 'مرحبا', en: 'Hello' },
          conditions: [],
          choices: [
            {
              id: 'kind',
              text: { ar: 'أثق بك', en: 'I trust you' },
              conditions: [],
              effects: [
                { kind: 'setFlag', flag: 'echo_comforted', value: true },
              ],
            },
          ],
        },
      ],
    };
    const initial = startDialogue(dialogue, {
      echo: createInitialEchoPersonality(),
      progression,
      narrative: createInitialNarrativeState(),
    });

    assert.equal(initial.node?.choices.length, 1);

    const next = chooseDialogueOption(dialogue, 'kind', {
      echo: initial.echo,
      progression,
      narrative: initial.narrative,
      createdAt: 1000,
    });

    assert.equal(next.completed, true);
    assert.equal(next.narrative.activeFlags.echo_comforted, true);
    assert.equal(
      next.narrative.latestDecisions['dialogue_test:start'],
      'kind',
    );
    assert.equal(next.narrative.decisionHistory[0]?.createdAt, 1000);
  });

  it('evaluates data-driven endings from personality and decisions', () => {
    const ending: EndingDefinition = {
      id: 'ending_test',
      title: { ar: 'نهاية', en: 'Ending' },
      description: { ar: 'وصف', en: 'Description' },
      resultSceneId: 'scene_test',
      conditions: [
        { kind: 'statAtLeast', stat: 'trust', value: 15 },
        { kind: 'flagIs', flag: 'echo_comforted', value: true },
      ],
    };
    const narrative = {
      ...createInitialNarrativeState(),
      activeFlags: { echo_comforted: true },
    };

    const result = evaluateEndingEligibility([ending], {
      echo: createInitialEchoPersonality(),
      progression,
      narrative,
    });

    assert.deepEqual(result.eligibleEndingIds, ['ending_test']);
    assert.equal(result.eligibility[0]?.eligible, true);
  });

  it('migrates older saves into the V7 narrative state', () => {
    const migrated = migrateGameState({
      echo: { trust: 15 },
    }, 6);

    assert.deepEqual(migrated.narrative?.unlockedMemoryIds, []);
    assert.deepEqual(migrated.narrative?.decisionHistory, []);
    assert.deepEqual(migrated.narrative?.activeFlags, {});
  });
});

