import { z } from 'zod';
import manifestJson from '../../../data/manifest.json';
import chaptersJson from '../../../data/chapters/index.json';
import puzzlesJson from '../../../data/puzzles/index.json';
import memoriesJson from '../../../data/memories/index.json';
import dialoguesJson from '../../../data/dialogues/index.json';
import endingsJson from '../../../data/endings/index.json';
import type {
  ChapterDefinition,
  ChapterId,
  ContentCondition,
  ContentEffect,
  ContentManifest,
  DialogueDefinition,
  DialogueId,
  EndingDefinition,
  EndingId,
  MemoryDefinition,
  MemoryFragmentId,
  MemoryId,
  PuzzleDefinition,
  PuzzleId,
  SceneId,
} from '../../domain/content/contracts';
import {
  STORY_PUZZLE_COUNTS,
} from '../../content/puzzles/storyPuzzleCatalog';
import { FINAL_MANHWA_PAGES } from '../../content/manhwa/finalManhwa';

export const localizedTextSchema = z.object({
  ar: z.string(),
  en: z.string(),
});

const manifestSchema = z.object({
  schemaVersion: z.number().int().positive(),
  contentVersion: z.string().min(1),
  defaultLocale: z.string().min(2),
  supportedLocales: z.array(z.string().min(2)).min(1),
  capacity: z.object({
    puzzles: z.number().int().positive(),
    memories: z.number().int().positive(),
    chapters: z.number().int().positive(),
    dialogues: z.number().int().positive(),
    endings: z.number().int().positive(),
    cinematics: z.number().int().positive(),
    assets: z.number().int().positive(),
  }),
  collections: z.object({
    chapters: z.string().min(1),
    puzzles: z.string().min(1),
    memories: z.string().min(1),
    dialogues: z.string().min(1),
    endings: z.string().min(1),
    cinematics: z.string().min(1),
    assets: z.string().min(1),
  }),
});

const chapterSchema = z.object({
  id: z.custom<ChapterId>((value) => (
    typeof value === 'string' && /^chapter_\d+$/.test(value)
  )),
  order: z.number().int().positive(),
  title: localizedTextSchema,
  description: localizedTextSchema,
  glyph: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  puzzleRange: z.tuple([
    z.number().int().positive(),
    z.number().int().positive(),
  ]),
});

export const conditionSchema: z.ZodTypeAny = z.lazy(() => z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('all'), conditions: z.array(conditionSchema) }),
  z.object({ kind: z.literal('any'), conditions: z.array(conditionSchema) }),
  z.object({ kind: z.literal('not'), condition: conditionSchema }),
  z.object({
    kind: z.literal('statAtLeast'),
    stat: z.enum([
      'humanity',
      'trust',
      'fear',
      'anger',
      'sadness',
      'corruption',
      'memoriesRecovered',
    ]),
    value: z.number(),
  }),
  z.object({
    kind: z.literal('statAtMost'),
    stat: z.enum([
      'humanity',
      'trust',
      'fear',
      'anger',
      'sadness',
      'corruption',
      'memoriesRecovered',
    ]),
    value: z.number(),
  }),
  z.object({
    kind: z.literal('puzzleSolved'),
    puzzleId: z.custom<PuzzleId>((value) => (
      typeof value === 'string' && /^puzzle_\d+$/.test(value)
    )),
  }),
  z.object({
    kind: z.literal('memoryCollected'),
    memoryId: z.custom<MemoryId>((value) => (
      typeof value === 'string' && /^memory_.+/.test(value)
    )),
  }),
  z.object({
    kind: z.literal('memoryFragmentUnlocked'),
    fragmentId: z.custom((value) => (
      typeof value === 'string' && /^fragment_.+/.test(value)
    )),
  }),
  z.object({
    kind: z.literal('choiceIs'),
    decisionId: z.string().min(1),
    choiceId: z.string().min(1),
  }),
  z.object({
    kind: z.literal('decisionMade'),
    decisionId: z.string().min(1),
  }),
  z.object({
    kind: z.literal('flagIs'),
    flag: z.string().min(1),
    value: z.boolean(),
  }),
  z.object({
    kind: z.literal('chapterComplete'),
    chapterId: z.custom<ChapterId>((value) => (
      typeof value === 'string' && /^chapter_\d+$/.test(value)
    )),
  }),
]));

export const effectSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('adjustStat'),
    stat: z.enum([
      'humanity',
      'trust',
      'fear',
      'anger',
      'sadness',
      'corruption',
      'memoriesRecovered',
    ]),
    amount: z.number(),
  }),
  z.object({
    kind: z.literal('collectMemory'),
    memoryId: z.custom<MemoryId>((value) => (
      typeof value === 'string' && /^memory_.+/.test(value)
    )),
  }),
  z.object({
    kind: z.literal('unlockMemoryFragment'),
    memoryId: z.custom<MemoryId>((value) => (
      typeof value === 'string' && /^memory_.+/.test(value)
    )),
    fragmentId: z.custom((value) => (
      typeof value === 'string' && /^fragment_.+/.test(value)
    )),
  }),
  z.object({
    kind: z.literal('queueScene'),
    sceneId: z.custom<SceneId>((value) => (
      typeof value === 'string' && /^scene_.+/.test(value)
    )),
  }),
  z.object({
    kind: z.literal('setFlag'),
    flag: z.string().min(1),
    value: z.boolean(),
  }),
  z.object({
    kind: z.literal('unlockPuzzle'),
    puzzleId: z.custom<PuzzleId>((value) => (
      typeof value === 'string' && /^puzzle_\d+$/.test(value)
    )),
  }),
  z.object({
    kind: z.literal('recordChoice'),
    decisionId: z.string().min(1),
    choiceId: z.string().min(1),
  }),
  z.object({
    kind: z.literal('awardCurrency'),
    currency: z.enum(['coins', 'crystals']),
    amount: z.number(),
  }),
]);

const puzzleSchema = z.object({
  id: z.custom<PuzzleId>((value) => (
    typeof value === 'string' && /^puzzle_\d+$/.test(value)
  )),
  chapterId: chapterSchema.shape.id,
  type: z.string().min(1),
  difficulty: z.number().int().min(1).max(10),
  prompt: localizedTextSchema,
  acceptedAnswers: z.array(z.string().min(1)).min(1),
  hints: z.array(localizedTextSchema),
  storyReveal: localizedTextSchema,
  prerequisites: z.array(conditionSchema),
  effects: z.array(effectSchema),
  memoryId: z.custom<MemoryId>().optional(),
  sceneId: z.custom<SceneId>().optional(),
});

const memorySchema = z.object({
  id: z.custom<MemoryId>((value) => (
    typeof value === 'string' && /^memory_.+/.test(value)
  )),
  chapterId: chapterSchema.shape.id,
  title: localizedTextSchema,
  description: localizedTextSchema,
  fragments: z.array(z.object({
    id: z.custom((value) => (
      typeof value === 'string' && /^fragment_.+/.test(value)
    )),
    title: localizedTextSchema,
    text: localizedTextSchema,
    unlockCondition: conditionSchema,
    emotionalImpact: z.record(z.number()),
    order: z.number().int().nonnegative(),
  })),
  imageAssetId: z.string().min(1).optional(),
  audioAssetId: z.string().min(1).optional(),
  emotionalImpact: z.record(z.number()),
  relatedCharacterIds: z.array(z.string().min(1)),
  unlockCondition: conditionSchema,
  nextStoryEventId: z.string().min(1).optional(),
});

const dialogueSchema = z.object({
  id: z.custom<DialogueId>((value) => (
    typeof value === 'string' && /^dialogue_.+/.test(value)
  )),
  chapterId: chapterSchema.shape.id,
  entryNodeId: z.string().min(1),
  nodes: z.array(z.object({
    id: z.string().min(1),
    speakerId: z.string().min(1),
    text: localizedTextSchema,
    conditions: z.array(conditionSchema),
    choices: z.array(z.object({
      id: z.string().min(1),
      text: localizedTextSchema,
      conditions: z.array(conditionSchema).default([]),
      effects: z.array(effectSchema),
      nextNodeId: z.string().min(1).optional(),
    })),
  })),
});

const endingSchema = z.object({
  id: z.custom<EndingId>((value) => (
    typeof value === 'string' && /^ending_.+/.test(value)
  )),
  title: localizedTextSchema,
  description: localizedTextSchema,
  conditions: z.array(conditionSchema),
  resultSceneId: z.custom<SceneId>((value) => (
    typeof value === 'string' && /^scene_.+/.test(value)
  )),
});

function contentIndexSchema(itemSchema: z.ZodTypeAny) {
  return z.object({
    schemaVersion: z.number().int().positive(),
    items: z.array(itemSchema),
  });
}

export function visitConditionReferences(
  condition: ContentCondition,
  visit: (reference: { kind: string; id: string }) => void,
): void {
  switch (condition.kind) {
    case 'all':
    case 'any':
      condition.conditions.forEach((item) => visitConditionReferences(
        item,
        visit,
      ));
      return;
    case 'not':
      visitConditionReferences(condition.condition, visit);
      return;
    case 'puzzleSolved':
      visit({ kind: 'puzzle', id: condition.puzzleId });
      return;
    case 'memoryCollected':
      visit({ kind: 'memory', id: condition.memoryId });
      return;
    case 'memoryFragmentUnlocked':
      visit({ kind: 'fragment', id: condition.fragmentId });
      return;
    case 'chapterComplete':
      visit({ kind: 'chapter', id: condition.chapterId });
      return;
    case 'statAtLeast':
    case 'statAtMost':
    case 'choiceIs':
    case 'decisionMade':
    case 'flagIs':
      return;
    default:
      assertNever(condition);
  }
}

export function visitEffectReferences(
  effect: ContentEffect,
  visit: (reference: { kind: string; id: string }) => void,
): void {
  switch (effect.kind) {
    case 'collectMemory':
      visit({ kind: 'memory', id: effect.memoryId });
      return;
    case 'unlockMemoryFragment':
      visit({ kind: 'memory', id: effect.memoryId });
      visit({ kind: 'fragment', id: effect.fragmentId });
      return;
    case 'queueScene':
      visit({ kind: 'scene', id: effect.sceneId });
      return;
    case 'unlockPuzzle':
      visit({ kind: 'puzzle', id: effect.puzzleId });
      return;
    case 'adjustStat':
    case 'setFlag':
    case 'recordChoice':
    case 'awardCurrency':
      return;
    default:
      assertNever(effect);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled content reference: ${JSON.stringify(value)}`);
}

const emptyContentIndexSchema = z.object({
  schemaVersion: z.number().int().positive(),
  items: z.array(z.unknown()),
});

export const CONTENT_MANIFEST = manifestSchema.parse(manifestJson) as ContentManifest;

export const CHAPTER_DEFINITIONS = z.object({
  schemaVersion: z.number().int().positive(),
  items: z.array(chapterSchema).min(1),
}).parse(chaptersJson).items
  .sort((left, right) => left.order - right.order) as ChapterDefinition[];

export const PUZZLE_DEFINITIONS = contentIndexSchema(puzzleSchema)
  .parse(puzzlesJson).items as PuzzleDefinition[];
export const MEMORY_DEFINITIONS = contentIndexSchema(memorySchema)
  .parse(memoriesJson).items as MemoryDefinition[];
export const DIALOGUE_DEFINITIONS = contentIndexSchema(dialogueSchema)
  .parse(dialoguesJson).items as DialogueDefinition[];
export const ENDING_DEFINITIONS = contentIndexSchema(endingSchema)
  .parse(endingsJson).items as EndingDefinition[];

emptyContentIndexSchema.parse(puzzlesJson);
emptyContentIndexSchema.parse(memoriesJson);
emptyContentIndexSchema.parse(dialoguesJson);
emptyContentIndexSchema.parse(endingsJson);

export const CONTENT_COUNTS = Object.freeze({
  chapters: CHAPTER_DEFINITIONS.length,
  puzzles: PUZZLE_DEFINITIONS.length + STORY_PUZZLE_COUNTS.total,
  memories: MEMORY_DEFINITIONS.length + FINAL_MANHWA_PAGES.length,
  dialogues: DIALOGUE_DEFINITIONS.length,
  endings: ENDING_DEFINITIONS.length,
});

export function validateContentRegistry(): void {
  const ids = new Set<string>();
  let previousEnd = 0;

  for (const chapter of CHAPTER_DEFINITIONS) {
    if (ids.has(chapter.id)) {
      throw new Error(`Duplicate chapter id: ${chapter.id}`);
    }
    ids.add(chapter.id);

    const [start, end] = chapter.puzzleRange;
    if (start > end) {
      throw new Error(`Invalid puzzle range for ${chapter.id}`);
    }
    if (start !== previousEnd + 1) {
      throw new Error(`Non-contiguous puzzle range before ${chapter.id}`);
    }
    previousEnd = end;
  }

  const chapterIds = new Set(CHAPTER_DEFINITIONS.map(({ id }) => id));
  const puzzleIds = new Set(PUZZLE_DEFINITIONS.map(({ id }) => id));
  const memoryIds = new Set(MEMORY_DEFINITIONS.map(({ id }) => id));
  const fragmentIds = new Set(
    MEMORY_DEFINITIONS.flatMap((memory) => (
      memory.fragments.map((fragment) => fragment.id)
    )),
  );
  const registries = [
    ['puzzle', PUZZLE_DEFINITIONS],
    ['memory', MEMORY_DEFINITIONS],
    ['dialogue', DIALOGUE_DEFINITIONS],
    ['ending', ENDING_DEFINITIONS],
  ] as const;
  for (const [name, definitions] of registries) {
    const definitionIds = new Set<string>();
    for (const definition of definitions) {
      if (definitionIds.has(definition.id)) {
        throw new Error(`Duplicate ${name} id: ${definition.id}`);
      }
      definitionIds.add(definition.id);
      if (
        'chapterId' in definition
        && !chapterIds.has(definition.chapterId)
      ) {
        throw new Error(`${definition.id} references an unknown chapter`);
      }
    }
  }

  function assertReference(
    ownerId: string,
    reference: { kind: string; id: string },
  ) {
    if (reference.kind === 'chapter' && !chapterIds.has(reference.id as ChapterId)) {
      throw new Error(`${ownerId} references unknown chapter ${reference.id}`);
    }
    if (reference.kind === 'puzzle' && !puzzleIds.has(reference.id as PuzzleId)) {
      throw new Error(`${ownerId} references unknown puzzle ${reference.id}`);
    }
    if (reference.kind === 'memory' && !memoryIds.has(reference.id as MemoryId)) {
      throw new Error(`${ownerId} references unknown memory ${reference.id}`);
    }
    if (reference.kind === 'fragment' && !fragmentIds.has(reference.id as MemoryFragmentId)) {
      throw new Error(`${ownerId} references unknown memory fragment ${reference.id}`);
    }
  }

  for (const puzzle of PUZZLE_DEFINITIONS) {
    puzzle.prerequisites.forEach((condition) => visitConditionReferences(
      condition,
      (reference) => assertReference(puzzle.id, reference),
    ));
    puzzle.effects.forEach((effect) => visitEffectReferences(
      effect,
      (reference) => assertReference(puzzle.id, reference),
    ));
  }

  for (const memory of MEMORY_DEFINITIONS) {
    visitConditionReferences(
      memory.unlockCondition,
      (reference) => assertReference(memory.id, reference),
    );
    memory.fragments.forEach((fragment) => {
      visitConditionReferences(
        fragment.unlockCondition,
        (reference) => assertReference(`${memory.id}:${fragment.id}`, reference),
      );
    });
  }

  for (const dialogue of DIALOGUE_DEFINITIONS) {
    const nodeIds = new Set(dialogue.nodes.map((node) => node.id));
    if (!nodeIds.has(dialogue.entryNodeId)) {
      throw new Error(`${dialogue.id} references missing entry node`);
    }
    dialogue.nodes.forEach((node) => {
      node.conditions.forEach((condition) => visitConditionReferences(
        condition,
        (reference) => assertReference(`${dialogue.id}:${node.id}`, reference),
      ));
      node.choices.forEach((choice) => {
        if (choice.nextNodeId && !nodeIds.has(choice.nextNodeId)) {
          throw new Error(
            `${dialogue.id}:${node.id}:${choice.id} references missing next node ${choice.nextNodeId}`,
          );
        }
        choice.conditions.forEach((condition) => visitConditionReferences(
          condition,
          (reference) => assertReference(`${dialogue.id}:${choice.id}`, reference),
        ));
        choice.effects.forEach((effect) => visitEffectReferences(
          effect,
          (reference) => assertReference(`${dialogue.id}:${choice.id}`, reference),
        ));
      });
    });
  }

  for (const ending of ENDING_DEFINITIONS) {
    ending.conditions.forEach((condition) => visitConditionReferences(
      condition,
      (reference) => assertReference(ending.id, reference),
    ));
  }

  for (const [collection, count] of Object.entries(CONTENT_COUNTS)) {
    const capacity = CONTENT_MANIFEST.capacity[
      collection as keyof typeof CONTENT_MANIFEST.capacity
    ];
    if (capacity !== undefined && count > capacity) {
      throw new Error(`${collection} exceeds configured capacity`);
    }
  }
}

validateContentRegistry();
