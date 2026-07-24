import type {
  AudioCue,
  BackgroundLayerDefinition,
  CameraCue,
  CameraFrame,
  CharacterCue,
  CharacterId,
  CinematicAssetId,
  CinematicSceneDefinition,
  DialogueCue,
  ExpressionId,
  ScreenEffectCue,
  SubtitleLocale,
} from './contracts';

export interface CharacterFrameState {
  characterId: CharacterId;
  visible: boolean;
  expressionId?: ExpressionId;
  poseAssetId?: CinematicAssetId;
  position: { x: number; y: number };
  scale: number;
  layer: number;
}

export interface CinematicFrameState {
  elapsedMs: number;
  progress: number;
  camera: CameraFrame;
  backgrounds: readonly BackgroundLayerDefinition[];
  characters: CharacterFrameState[];
  dialogue: {
    speakerId: CharacterId;
    subtitle: string;
    voiceAssetId: CinematicAssetId;
  } | null;
  effects: ScreenEffectCue[];
}

const DEFAULT_CAMERA: CameraFrame = {
  focus: { x: 0.5, y: 0.5 },
  zoom: 1,
  rotation: 0,
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function ease(value: number, easing: CameraCue['easing']): number {
  const t = clamp01(value);
  switch (easing) {
    case 'linear':
      return t;
    case 'easeIn':
      return t * t;
    case 'easeOut':
      return 1 - (1 - t) * (1 - t);
    case 'easeInOut':
      return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
    case 'cinematic':
      return 1 - (1 - t) ** 3;
    default:
      return t;
  }
}

function mix(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function interpolateCamera(cue: CameraCue, elapsedMs: number): CameraFrame {
  if (cue.movement === 'cut' || cue.durationMs === 0) return cue.to;
  const amount = ease(
    (elapsedMs - cue.atMs) / cue.durationMs,
    cue.easing,
  );
  return {
    focus: {
      x: mix(cue.from.focus.x, cue.to.focus.x, amount),
      y: mix(cue.from.focus.y, cue.to.focus.y, amount),
    },
    zoom: mix(cue.from.zoom, cue.to.zoom, amount),
    rotation: mix(cue.from.rotation, cue.to.rotation, amount),
  };
}

function resolveCamera(
  scene: CinematicSceneDefinition,
  elapsedMs: number,
): CameraFrame {
  const cues = scene.timeline
    .filter((cue): cue is CameraCue => cue.kind === 'camera')
    .filter((cue) => cue.atMs <= elapsedMs)
    .sort((left, right) => left.atMs - right.atMs);
  const active = cues.at(-1);
  return active ? interpolateCamera(active, elapsedMs) : DEFAULT_CAMERA;
}

function resolveCharacters(
  scene: CinematicSceneDefinition,
  elapsedMs: number,
): CharacterFrameState[] {
  const states = new Map<CharacterId, CharacterFrameState>();
  const cues = scene.timeline
    .filter((cue): cue is CharacterCue => cue.kind === 'character')
    .filter((cue) => cue.atMs <= elapsedMs)
    .sort((left, right) => left.atMs - right.atMs);

  for (const cue of cues) {
    const current = states.get(cue.characterId) ?? {
      characterId: cue.characterId,
      visible: false,
      position: { x: 0.5, y: 1 },
      scale: 1,
      layer: 0,
    };
    states.set(cue.characterId, {
      ...current,
      visible: cue.action === 'exit' ? false : true,
      expressionId: cue.expressionId ?? current.expressionId,
      poseAssetId: cue.poseAssetId ?? current.poseAssetId,
      position: cue.position ?? current.position,
      scale: cue.scale ?? current.scale,
      layer: cue.layer ?? current.layer,
    });
  }

  return [...states.values()]
    .filter((state) => state.visible)
    .sort((left, right) => left.layer - right.layer);
}

function resolveDialogue(
  scene: CinematicSceneDefinition,
  elapsedMs: number,
  locale: SubtitleLocale,
): CinematicFrameState['dialogue'] {
  const cue = scene.timeline
    .filter((item): item is DialogueCue => item.kind === 'dialogue')
    .find((item) => (
      elapsedMs >= item.atMs
      && elapsedMs < item.atMs + item.durationMs
    ));
  if (!cue) return null;

  return {
    speakerId: cue.speakerId,
    subtitle: locale === 'en'
      ? cue.subtitles.en ?? cue.subtitles.ar
      : cue.subtitles.ar,
    voiceAssetId: cue.voice.assetId,
  };
}

export function compileCinematicFrame(
  scene: CinematicSceneDefinition,
  elapsedMs: number,
  subtitleLocale: SubtitleLocale,
): CinematicFrameState {
  const boundedElapsed = Math.min(
    scene.durationMs,
    Math.max(0, elapsedMs),
  );

  return {
    elapsedMs: boundedElapsed,
    progress: boundedElapsed / scene.durationMs,
    camera: resolveCamera(scene, boundedElapsed),
    backgrounds: scene.backgroundLayers,
    characters: resolveCharacters(scene, boundedElapsed),
    dialogue: resolveDialogue(scene, boundedElapsed, subtitleLocale),
    effects: scene.timeline.filter((cue): cue is ScreenEffectCue => (
      cue.kind === 'effect'
      && boundedElapsed >= cue.atMs
      && boundedElapsed < cue.atMs + cue.durationMs
    )),
  };
}

export function getAudioCuesBetween(
  scene: CinematicSceneDefinition,
  previousElapsedMs: number,
  elapsedMs: number,
): AudioCue[] {
  const start = Math.max(0, previousElapsedMs);
  const end = Math.max(start, elapsedMs);
  return scene.timeline.filter((cue): cue is AudioCue => (
    cue.kind === 'audio'
    && cue.atMs >= start
    && cue.atMs <= end
  ));
}

export function collectCinematicSceneAssetIds(
  scene: CinematicSceneDefinition,
): CinematicAssetId[] {
  const assetIds: CinematicAssetId[] = scene.backgroundLayers.map(
    (layer) => layer.assetId,
  );

  for (const cue of scene.timeline) {
    if (cue.kind === 'dialogue') assetIds.push(cue.voice.assetId);
    if (cue.kind === 'character' && cue.poseAssetId) {
      assetIds.push(cue.poseAssetId);
    }
    if (cue.kind === 'audio' && cue.assetId) assetIds.push(cue.assetId);
  }

  return [...new Set(assetIds)];
}

