import { z } from 'zod';
import cinematicsJson from '../../../data/cinematics/index.json';
import cinematicAssetsJson from '../../../data/assets/index.json';
import type {
  CinematicAssetId,
  CinematicAssetDefinition,
  CinematicCueId,
  CinematicEpisodeDefinition,
  CinematicEpisodeId,
  CharacterId,
  ExpressionId,
} from '../../domain/cinematics/contracts';
import type {
  ChapterId,
  ContentCondition,
  ContentEffect,
  MemoryFragmentId,
  MemoryId,
  PuzzleId,
  SceneId,
} from '../../domain/content/contracts';
import {
  CHAPTER_DEFINITIONS,
  CONTENT_MANIFEST,
  MEMORY_DEFINITIONS,
  PUZZLE_DEFINITIONS,
  conditionSchema,
  effectSchema,
  localizedTextSchema,
  visitConditionReferences,
  visitEffectReferences,
} from './contentRegistry';

const normalizedPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

const cameraFrameSchema = z.object({
  focus: normalizedPointSchema,
  zoom: z.number().min(0.25).max(4),
  rotation: z.number().min(-180).max(180),
});

const cueBase = {
  id: z.custom<CinematicCueId>((value) => (
    typeof value === 'string' && /^cue_.+/.test(value)
  )),
  atMs: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
};

const timelineCueSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('camera'),
    ...cueBase,
    movement: z.enum([
      'cut',
      'pan',
      'push',
      'pull',
      'track',
      'shake',
      'focus',
    ]),
    from: cameraFrameSchema,
    to: cameraFrameSchema,
    easing: z.enum([
      'linear',
      'easeIn',
      'easeOut',
      'easeInOut',
      'cinematic',
    ]),
  }),
  z.object({
    kind: z.literal('character'),
    ...cueBase,
    characterId: z.custom<CharacterId>((value) => (
      typeof value === 'string' && /^character_.+/.test(value)
    )),
    action: z.enum(['enter', 'exit', 'move', 'pose', 'expression']),
    expressionId: z.custom<ExpressionId>((value) => (
      typeof value === 'string' && /^expression_.+/.test(value)
    )).optional(),
    poseAssetId: z.custom<CinematicAssetId>((value) => (
      typeof value === 'string' && /^asset_.+/.test(value)
    )).optional(),
    position: normalizedPointSchema.optional(),
    scale: z.number().positive().max(4).optional(),
    layer: z.number().int().optional(),
  }),
  z.object({
    kind: z.literal('dialogue'),
    ...cueBase,
    speakerId: z.custom<CharacterId>((value) => (
      typeof value === 'string' && /^character_.+/.test(value)
    )),
    voice: z.object({
      locale: z.literal('ja-JP'),
      assetId: z.custom<CinematicAssetId>((value) => (
        typeof value === 'string' && /^asset_.+/.test(value)
      )),
      gain: z.number().min(0).max(2),
    }),
    subtitles: z.object({
      ar: z.string().min(1),
      en: z.string().min(1).optional(),
    }),
    expressionId: z.custom<ExpressionId>((value) => (
      typeof value === 'string' && /^expression_.+/.test(value)
    )).optional(),
  }),
  z.object({
    kind: z.literal('audio'),
    ...cueBase,
    channel: z.enum(['music', 'ambience', 'sfx']),
    action: z.enum(['play', 'stop', 'fadeIn', 'fadeOut']),
    assetId: z.custom<CinematicAssetId>((value) => (
      typeof value === 'string' && /^asset_.+/.test(value)
    )).optional(),
    gain: z.number().min(0).max(2),
    loop: z.boolean(),
    duckForVoice: z.boolean(),
  }),
  z.object({
    kind: z.literal('effect'),
    ...cueBase,
    effect: z.enum([
      'memoryFlash',
      'desaturate',
      'chromaticShift',
      'glitch',
      'vignette',
      'fadeToBlack',
    ]),
    intensity: z.number().min(0).max(1),
  }),
]);

const backgroundLayerSchema = z.object({
  id: z.string().min(1),
  assetId: z.custom<CinematicAssetId>((value) => (
    typeof value === 'string' && /^asset_.+/.test(value)
  )),
  depth: z.number(),
  focalPoint: normalizedPointSchema,
  opacity: z.number().min(0).max(1),
  blendMode: z.enum(['normal', 'screen', 'multiply', 'add']),
});

const sceneIdSchema = z.custom<SceneId>((value) => (
  typeof value === 'string' && /^scene_.+/.test(value)
));

const sceneSchema = z.object({
  id: sceneIdSchema,
  type: z.enum([
    'opening',
    'dialogue',
    'action',
    'flashback',
    'choice',
    'transition',
    'ending',
  ]),
  advanceMode: z.enum(['timeline', 'voice', 'input', 'choice']),
  durationMs: z.number().int().positive(),
  allowSkip: z.boolean(),
  conditions: z.array(conditionSchema),
  backgroundLayers: z.array(backgroundLayerSchema),
  timeline: z.array(timelineCueSchema),
  branches: z.array(z.object({
    id: z.string().min(1),
    conditions: z.array(conditionSchema),
    nextSceneId: sceneIdSchema,
  })),
  choice: z.object({
    decisionId: z.string().min(1),
    prompt: localizedTextSchema,
    choices: z.array(z.object({
      id: z.string().min(1),
      text: localizedTextSchema,
      conditions: z.array(conditionSchema),
      effects: z.array(effectSchema),
      nextSceneId: sceneIdSchema.optional(),
    })).min(2),
  }).optional(),
  memoryId: z.custom<MemoryId>((value) => (
    typeof value === 'string' && /^memory_.+/.test(value)
  )).optional(),
  completionEffects: z.array(effectSchema),
});

export const cinematicEpisodeSchema = z.object({
  id: z.custom<CinematicEpisodeId>((value) => (
    typeof value === 'string' && /^episode_.+/.test(value)
  )),
  chapterId: z.custom<ChapterId>((value) => (
    typeof value === 'string' && /^chapter_\d+$/.test(value)
  )),
  episodeNumber: z.number().int().positive(),
  title: localizedTextSchema,
  description: localizedTextSchema,
  entrySceneId: sceneIdSchema,
  defaultVoiceLocale: z.literal('ja-JP'),
  defaultSubtitleLocale: z.enum(['ar', 'en']),
  unlockConditions: z.array(conditionSchema),
  scenes: z.array(sceneSchema).min(1),
});

const cinematicIndexSchema = z.object({
  schemaVersion: z.number().int().positive(),
  items: z.array(cinematicEpisodeSchema),
});

const cinematicAssetSchema = z.object({
  id: z.custom<CinematicAssetId>((value) => (
    typeof value === 'string' && /^asset_.+/.test(value)
  )),
  kind: z.enum([
    'background',
    'characterPose',
    'voice',
    'music',
    'ambience',
    'sfx',
  ]),
  sources: z.object({
    android: z.string().min(1),
    web: z.string().min(1).optional(),
  }),
  mimeType: z.enum([
    'image/avif',
    'image/webp',
    'audio/ogg',
    'audio/mp4',
  ]),
  byteSize: z.number().int().nonnegative(),
  durationMs: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  preloadGroup: z.string().min(1),
});

const cinematicAssetIndexSchema = z.object({
  schemaVersion: z.number().int().positive(),
  items: z.array(cinematicAssetSchema),
});

export const CINEMATIC_EPISODE_DEFINITIONS = cinematicIndexSchema
  .parse(cinematicsJson).items as CinematicEpisodeDefinition[];
export const CINEMATIC_ASSET_DEFINITIONS = cinematicAssetIndexSchema
  .parse(cinematicAssetsJson).items as CinematicAssetDefinition[];

export const CINEMATIC_COUNTS = Object.freeze({
  cinematicEpisodes: CINEMATIC_EPISODE_DEFINITIONS.length,
  cinematicScenes: CINEMATIC_EPISODE_DEFINITIONS.reduce(
    (count, episode) => count + episode.scenes.length,
    0,
  ),
  cinematicCues: CINEMATIC_EPISODE_DEFINITIONS.reduce(
    (count, episode) => count + episode.scenes.reduce(
      (sceneCount, scene) => sceneCount + scene.timeline.length,
      0,
    ),
    0,
  ),
  cinematicAssets: CINEMATIC_ASSET_DEFINITIONS.length,
});

function assertUnique(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

export function validateCinematicContentRegistry(): void {
  assertUnique(
    CINEMATIC_EPISODE_DEFINITIONS.map((episode) => episode.id),
    'cinematic episode id',
  );
  assertUnique(
    CINEMATIC_ASSET_DEFINITIONS.map((asset) => asset.id),
    'cinematic asset id',
  );
  assertUnique(
    CINEMATIC_EPISODE_DEFINITIONS.map((episode) => episode.chapterId),
    'cinematic chapter episode',
  );
  assertUnique(
    CINEMATIC_EPISODE_DEFINITIONS.map((episode) => String(episode.episodeNumber)),
    'cinematic episode number',
  );

  if (
    CINEMATIC_COUNTS.cinematicEpisodes
    > CONTENT_MANIFEST.capacity.cinematics
  ) {
    throw new Error('Cinematic episodes exceed configured capacity');
  }
  if (CINEMATIC_COUNTS.cinematicAssets > CONTENT_MANIFEST.capacity.assets) {
    throw new Error('Cinematic assets exceed configured capacity');
  }

  const chapterIds = new Set(CHAPTER_DEFINITIONS.map((chapter) => chapter.id));
  const puzzleIds = new Set(PUZZLE_DEFINITIONS.map((puzzle) => puzzle.id));
  const memoryIds = new Set(MEMORY_DEFINITIONS.map((memory) => memory.id));
  const fragmentIds = new Set(MEMORY_DEFINITIONS.flatMap((memory) => (
    memory.fragments.map((fragment) => fragment.id)
  )));
  const allSceneIds = new Set(CINEMATIC_EPISODE_DEFINITIONS.flatMap(
    (episode) => episode.scenes.map((scene) => scene.id),
  ));
  const assetIds = new Set(CINEMATIC_ASSET_DEFINITIONS.map((asset) => asset.id));

  const assertReference = (
    ownerId: string,
    reference: { kind: string; id: string },
  ) => {
    const known = (
      (reference.kind === 'chapter' && chapterIds.has(reference.id as ChapterId))
      || (
        reference.kind === 'puzzle'
        && puzzleIds.has(reference.id as PuzzleId)
      )
      || (reference.kind === 'memory' && memoryIds.has(reference.id as MemoryId))
      || (
        reference.kind === 'fragment'
        && fragmentIds.has(reference.id as MemoryFragmentId)
      )
      || (reference.kind === 'scene' && allSceneIds.has(reference.id as SceneId))
    );
    if (
      ['chapter', 'puzzle', 'memory', 'fragment', 'scene'].includes(reference.kind)
      && !known
    ) {
      throw new Error(
        `${ownerId} references unknown ${reference.kind} ${reference.id}`,
      );
    }
  };

  for (const episode of CINEMATIC_EPISODE_DEFINITIONS) {
    if (!chapterIds.has(episode.chapterId)) {
      throw new Error(`${episode.id} references unknown chapter`);
    }
    const sceneIds = episode.scenes.map((scene) => scene.id);
    assertUnique(sceneIds, `${episode.id} scene id`);
    const localSceneIds = new Set(sceneIds);
    if (!localSceneIds.has(episode.entrySceneId)) {
      throw new Error(`${episode.id} references missing entry scene`);
    }
    episode.unlockConditions.forEach((condition) => visitConditionReferences(
      condition,
      (reference) => assertReference(episode.id, reference),
    ));

    for (const scene of episode.scenes) {
      const isChoice = scene.type === 'choice';
      if (isChoice !== Boolean(scene.choice)) {
        throw new Error(`${scene.id} choice type and choice data disagree`);
      }
      if (isChoice && scene.advanceMode !== 'choice') {
        throw new Error(`${scene.id} must use choice advance mode`);
      }
      if (scene.memoryId && !memoryIds.has(scene.memoryId)) {
        throw new Error(`${scene.id} references unknown flashback memory`);
      }
      assertUnique(
        scene.timeline.map((cue) => cue.id),
        `${scene.id} timeline cue id`,
      );
      for (const layer of scene.backgroundLayers) {
        if (!assetIds.has(layer.assetId)) {
          throw new Error(`${scene.id} references unknown asset ${layer.assetId}`);
        }
      }
      for (const cue of scene.timeline) {
        if (cue.atMs + cue.durationMs > scene.durationMs) {
          throw new Error(`${scene.id}:${cue.id} exceeds scene duration`);
        }
        const cueAssetId = cue.kind === 'dialogue'
          ? cue.voice.assetId
          : cue.kind === 'character'
            ? cue.poseAssetId
            : cue.kind === 'audio'
              ? cue.assetId
              : undefined;
        if (cueAssetId && !assetIds.has(cueAssetId)) {
          throw new Error(
            `${scene.id}:${cue.id} references unknown asset ${cueAssetId}`,
          );
        }
      }
      scene.conditions.forEach((condition: ContentCondition) => (
        visitConditionReferences(
          condition,
          (reference) => assertReference(scene.id, reference),
        )
      ));
      scene.completionEffects.forEach((effect: ContentEffect) => (
        visitEffectReferences(
          effect,
          (reference) => assertReference(scene.id, reference),
        )
      ));
      scene.branches.forEach((branch) => {
        if (!localSceneIds.has(branch.nextSceneId)) {
          throw new Error(`${scene.id} branches outside its episode`);
        }
        branch.conditions.forEach((condition) => visitConditionReferences(
          condition,
          (reference) => assertReference(`${scene.id}:${branch.id}`, reference),
        ));
      });
      scene.choice?.choices.forEach((choice) => {
        if (choice.nextSceneId && !localSceneIds.has(choice.nextSceneId)) {
          throw new Error(`${scene.id}:${choice.id} targets an unknown scene`);
        }
        choice.conditions.forEach((condition) => visitConditionReferences(
          condition,
          (reference) => assertReference(`${scene.id}:${choice.id}`, reference),
        ));
        choice.effects.forEach((effect) => visitEffectReferences(
          effect,
          (reference) => assertReference(`${scene.id}:${choice.id}`, reference),
        ));
      });
    }
  }
}

validateCinematicContentRegistry();
