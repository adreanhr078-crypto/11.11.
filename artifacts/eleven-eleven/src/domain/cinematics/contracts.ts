import type {
  ChapterId,
  ContentCondition,
  ContentEffect,
  LocalizedText,
  MemoryId,
  SceneId,
} from '../content/contracts';

export type CinematicEpisodeId = `episode_${string}`;
export type CinematicCueId = `cue_${string}`;
export type CinematicAssetId = `asset_${string}`;
export type CharacterId = `character_${string}`;
export type ExpressionId = `expression_${string}`;
export type JapaneseVoiceLocale = 'ja-JP';
export type SubtitleLocale = 'ar' | 'en';

export interface CinematicAssetDefinition {
  id: CinematicAssetId;
  kind:
    | 'background'
    | 'characterPose'
    | 'voice'
    | 'music'
    | 'ambience'
    | 'sfx';
  sources: {
    android: string;
    web?: string;
  };
  mimeType:
    | 'image/avif'
    | 'image/webp'
    | 'audio/ogg'
    | 'audio/mp4';
  byteSize: number;
  durationMs?: number;
  width?: number;
  height?: number;
  preloadGroup: string;
}

export interface NormalizedPoint {
  /** Normalized horizontal coordinate. 0 is left and 1 is right. */
  x: number;
  /** Normalized vertical coordinate. 0 is top and 1 is bottom. */
  y: number;
}

export interface CameraFrame {
  focus: NormalizedPoint;
  zoom: number;
  rotation: number;
}

export interface BackgroundLayerDefinition {
  id: string;
  assetId: CinematicAssetId;
  depth: number;
  focalPoint: NormalizedPoint;
  opacity: number;
  blendMode: 'normal' | 'screen' | 'multiply' | 'add';
}

export interface CameraCue {
  kind: 'camera';
  id: CinematicCueId;
  atMs: number;
  durationMs: number;
  movement:
    | 'cut'
    | 'pan'
    | 'push'
    | 'pull'
    | 'track'
    | 'shake'
    | 'focus';
  from: CameraFrame;
  to: CameraFrame;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'cinematic';
}

export interface CharacterCue {
  kind: 'character';
  id: CinematicCueId;
  atMs: number;
  durationMs: number;
  characterId: CharacterId;
  action: 'enter' | 'exit' | 'move' | 'pose' | 'expression';
  expressionId?: ExpressionId;
  poseAssetId?: CinematicAssetId;
  position?: NormalizedPoint;
  scale?: number;
  layer?: number;
}

export interface DialogueCue {
  kind: 'dialogue';
  id: CinematicCueId;
  atMs: number;
  durationMs: number;
  speakerId: CharacterId;
  voice: {
    locale: JapaneseVoiceLocale;
    assetId: CinematicAssetId;
    gain: number;
  };
  subtitles: {
    ar: string;
    en?: string;
  };
  expressionId?: ExpressionId;
}

export interface AudioCue {
  kind: 'audio';
  id: CinematicCueId;
  atMs: number;
  durationMs: number;
  channel: 'music' | 'ambience' | 'sfx';
  action: 'play' | 'stop' | 'fadeIn' | 'fadeOut';
  assetId?: CinematicAssetId;
  gain: number;
  loop: boolean;
  duckForVoice: boolean;
}

export interface ScreenEffectCue {
  kind: 'effect';
  id: CinematicCueId;
  atMs: number;
  durationMs: number;
  effect:
    | 'memoryFlash'
    | 'desaturate'
    | 'chromaticShift'
    | 'glitch'
    | 'vignette'
    | 'fadeToBlack';
  intensity: number;
}

export type CinematicTimelineCue =
  | CameraCue
  | CharacterCue
  | DialogueCue
  | AudioCue
  | ScreenEffectCue;

export interface CinematicBranch {
  id: string;
  conditions: ContentCondition[];
  nextSceneId: SceneId;
}

export interface CinematicChoice {
  id: string;
  text: LocalizedText;
  conditions: ContentCondition[];
  effects: ContentEffect[];
  nextSceneId?: SceneId;
}

export interface CinematicChoicePoint {
  decisionId: string;
  prompt: LocalizedText;
  choices: CinematicChoice[];
}

export interface CinematicSceneDefinition {
  id: SceneId;
  type:
    | 'opening'
    | 'dialogue'
    | 'action'
    | 'flashback'
    | 'choice'
    | 'transition'
    | 'ending';
  advanceMode: 'timeline' | 'voice' | 'input' | 'choice';
  durationMs: number;
  allowSkip: boolean;
  conditions: ContentCondition[];
  backgroundLayers: BackgroundLayerDefinition[];
  timeline: CinematicTimelineCue[];
  branches: CinematicBranch[];
  choice?: CinematicChoicePoint;
  memoryId?: MemoryId;
  completionEffects: ContentEffect[];
}

export interface CinematicEpisodeDefinition {
  id: CinematicEpisodeId;
  chapterId: ChapterId;
  episodeNumber: number;
  title: LocalizedText;
  description: LocalizedText;
  entrySceneId: SceneId;
  defaultVoiceLocale: JapaneseVoiceLocale;
  defaultSubtitleLocale: SubtitleLocale;
  unlockConditions: ContentCondition[];
  scenes: CinematicSceneDefinition[];
}
