import { z } from 'zod';

export const hintTierIdSchema = z.enum([
  'observation',
  'connection',
  'assistance',
]);
export type HintTierId = z.infer<typeof hintTierIdSchema>;

export const puzzleDifficultySchema = z.enum([
  'tutorial',
  'easy',
  'medium',
  'hard',
  'page_finale',
]);
export type CampaignPuzzleDifficulty = z.infer<
  typeof puzzleDifficultySchema
>;

export const puzzleTemplateIdSchema = z.enum([
  'visual_sequence',
  'corrupted_text',
  'file_reconstruction',
  'mirror_matching',
  'spatial_logic',
  'evidence_matching',
  'authentic_memory_detection',
  'grid_path',
  'seven_segment',
  'multi_stage_reconstruction',
  'sorting',
  'letter_path',
  'network_connection',
  'silhouette_analysis',
  'memory_trail',
  'document_jigsaw',
  'memory_clustering',
  'sentence_reconstruction',
  'rotating_clock',
  'page_reconstruction',
]);
export type PuzzleTemplateId = z.infer<typeof puzzleTemplateIdSchema>;

export const localizedTextSchema = z.object({
  ar: z.string().min(1),
  en: z.string().min(1),
});
export type CampaignLocalizedText = z.infer<typeof localizedTextSchema>;

export const echoMindDeltaSchema = z.object({
  emotions: z.object({
    fear: z.number().optional(),
    trust: z.number().optional(),
    hope: z.number().optional(),
    loneliness: z.number().optional(),
    awareness: z.number().optional(),
    memoryStability: z.number().optional(),
    rage: z.number().optional(),
    forgiveness: z.number().optional(),
    corruption: z.number().optional(),
  }).default({}),
  beliefsAdded: z.array(z.string().min(1)).default([]),
  questionsAdded: z.array(z.string().min(1)).default([]),
  knowledgeNodesAdded: z.array(z.string().min(1)).default([]),
});
export type EchoMindDelta = z.infer<typeof echoMindDeltaSchema>;

export const hintTierSchema = z.object({
  id: hintTierIdSchema,
  cost: z.number().int().nonnegative(),
  text: localizedTextSchema,
  effect: z.enum([
    'text_only',
    'highlight_relevant',
    'remove_decoys',
    'lock_correct_element',
    'complete_one_step',
  ]),
});
export type CampaignHintTier = z.infer<typeof hintTierSchema>;

export const interactionOptionSchema = z.object({
  id: z.string().min(1),
  label: localizedTextSchema,
  meta: localizedTextSchema.optional(),
});
export type CampaignInteractionOption = z.infer<
  typeof interactionOptionSchema
>;

const interactionStageBaseSchema = z.object({
  id: z.string().min(1),
  prompt: localizedTextSchema,
  options: z.array(interactionOptionSchema).min(2),
});

export const interactionStageSchema = z.discriminatedUnion('mode', [
  interactionStageBaseSchema.extend({
    mode: z.literal('sequence'),
    solution: z.array(z.string().min(1)).min(2),
  }),
  interactionStageBaseSchema.extend({
    mode: z.literal('single'),
    solution: z.tuple([z.string().min(1)]),
  }),
  interactionStageBaseSchema.extend({
    mode: z.literal('multi'),
    solution: z.array(z.string().min(1)).min(1),
  }),
  interactionStageBaseSchema.extend({
    mode: z.literal('path'),
    solution: z.array(z.string().min(1)).min(2),
  }),
  interactionStageBaseSchema.extend({
    mode: z.literal('match'),
    targets: z.array(interactionOptionSchema).min(2),
    solution: z.record(z.string(), z.string()),
  }),
  z.object({
    id: z.string().min(1),
    mode: z.literal('rings'),
    prompt: localizedTextSchema,
    rings: z.array(z.object({
      id: z.string().min(1),
      values: z.array(z.string().min(1)).min(2),
    })).min(2),
    solution: z.array(z.string().min(1)).min(2),
  }),
]);
export type CampaignInteractionStage = z.infer<
  typeof interactionStageSchema
>;

export const campaignPuzzleSchema = z.object({
  id: z.string().regex(/^puzzle_\d{3}_[a-z0-9_]+$/),
  order: z.number().int().min(1).max(2000),
  targetPageId: z.string().regex(/^manhwa_ch\d{2}_page_\d{2}$/),
  title: localizedTextSchema,
  description: localizedTextSchema,
  template: puzzleTemplateIdSchema,
  difficulty: puzzleDifficultySchema,
  prerequisites: z.array(z.string()),
  stages: z.array(interactionStageSchema).min(1),
  rewards: z.object({
    coins: z.number().int().nonnegative(),
    shardId: z.string().regex(/^page\d{2}_shard_\d{2}$/),
  }),
  echoMindDelta: echoMindDeltaSchema,
  narrativeFlags: z.array(z.string().min(1)).min(1),
  dialogue: localizedTextSchema,
  dialogueTriggers: z.array(z.string().min(1)).default([]),
  hints: z.array(hintTierSchema).length(3),
});
export type CampaignPuzzleDefinition = z.infer<
  typeof campaignPuzzleSchema
>;

export const campaignMemoryShardSchema = z.object({
  id: z.string().regex(/^page\d{2}_shard_\d{2}$/),
  pageId: z.string().regex(/^manhwa_ch\d{2}_page_\d{2}$/),
  shardIndex: z.number().int().min(1).max(10),
  sourcePuzzleId: z.string().regex(/^puzzle_\d{3}_[a-z0-9_]+$/),
});
export type CampaignMemoryShardDefinition = z.infer<
  typeof campaignMemoryShardSchema
>;

export interface CampaignMemoryShardRuntime {
  id: string;
  collectedAt?: string;
  integratedIntoPage: boolean;
}

export const manhwaMemoryPageSchema = z.object({
  id: z.string().regex(/^manhwa_ch\d{2}_page_\d{2}$/),
  chapterId: z.string().regex(/^chapter_\d+$/),
  pageNumber: z.number().int().positive(),
  title: localizedTextSchema,
  imageSrc: z.string().startsWith('/'),
  accessibleDescription: localizedTextSchema,
  // Deferred PDF pages deliberately have no authored transcript until their
  // future puzzle batch is defined; unlocked authored pages still provide one.
  transcript: z.array(localizedTextSchema),
  requiredShardIds: z.array(
    z.string().regex(/^page\d{2}_shard_\d{2}$/),
  ).superRefine((arr, ctx) => {
    if (arr.length !== 0 && arr.length !== 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Array must contain exactly 10 element(s)',
      });
    }
  }),
  prerequisitePageId: z.string().optional(),
  restoredStatus: z.enum(['restored', 'questioned']),
  echoMindDelta: echoMindDeltaSchema,
  narrativeFlags: z.array(z.string().min(1)),
  dialogue: localizedTextSchema,
  dialogueTriggers: z.array(z.string().min(1)),
  globalPageNumber: z.number().int().positive().optional(),
  pageKind: z.enum([
    'cover',
    'credits',
    'chapter-cover',
    'chapter-page',
    'teaser',
    'back-cover',
  ]).optional(),
});
export type ManhwaMemoryPageDefinition = z.infer<
  typeof manhwaMemoryPageSchema
>;

export interface CampaignPuzzleProgress {
  stageIndex: number;
  values: string[];
  matches: Record<string, string>;
}

export interface PuzzleRewardEvent {
  nonce: number;
  puzzleId: string;
  coins: number;
  shardId: string;
  restoredPageId?: string;
}

export interface CampaignCompletionResult {
  success: boolean;
  alreadyCompleted: boolean;
  message: string;
  restoredPageId?: string;
}

export interface HintPurchaseResult {
  success: boolean;
  alreadyUnlocked: boolean;
  message: string;
  hint?: CampaignHintTier;
}
