import type {
  AudioCue,
  CinematicAssetDefinition,
  CinematicAssetId,
  CinematicSceneDefinition,
} from '../../domain/cinematics/contracts';
import type {
  CinematicFrameState,
} from '../../domain/cinematics/cinematicTimeline';

/**
 * Platform boundary for Android/Web asset packs.
 * The domain only knows stable asset IDs; URI resolution and decoding live here.
 */
export interface CinematicAssetLoaderPort {
  preload(
    assetIds: readonly CinematicAssetId[],
  ): Promise<readonly CinematicAssetDefinition[]>;
  release(assetIds: readonly CinematicAssetId[]): void;
}

/**
 * Platform boundary for voice, music, ambience and SFX mixing.
 * Implementations are responsible for voice ducking and Android audio focus.
 */
export interface CinematicAudioPort {
  dispatch(cues: readonly AudioCue[]): void;
  pause(): void;
  resume(): void;
  stopAll(): void;
}

/**
 * Rendering boundary. A future Canvas/WebGL/native player consumes immutable
 * frame snapshots without reading or writing Zustand every animation frame.
 */
export interface CinematicRendererPort {
  mount(scene: CinematicSceneDefinition): void;
  render(frame: CinematicFrameState): void;
  unmount(): void;
}

export interface CinematicPlayerPorts {
  assets: CinematicAssetLoaderPort;
  audio: CinematicAudioPort;
  renderer: CinematicRendererPort;
}

