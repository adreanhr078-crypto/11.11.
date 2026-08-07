import type {
  AwakeningWardSaveState,
  WardInteractionId,
  WardPoint,
} from '../domain/awakeningWardTypes';

export interface WardRuntimeMetrics {
  fps: number;
  quality: 'low' | 'medium';
  drawObjects: number;
  loadTimeMs: number;
}

export interface WardRuntimeCallbacks {
  onNearbyInteraction: (interactionId: WardInteractionId | null) => void;
  onInteractionRequested: (interactionId: WardInteractionId) => void;
  onRuntimeSnapshot: (snapshot: {
    position: WardPoint;
    stamina: number;
  }) => void;
  onMetrics: (metrics: WardRuntimeMetrics) => void;
  onKeyboardActivity: () => void;
}

export interface WardSceneApi {
  setTouchMovement: (x: number, y: number) => void;
  setTouchRunning: (running: boolean) => void;
  requestInteraction: () => void;
  setLocked: (locked: boolean) => void;
  setPaused: (paused: boolean) => void;
  setProgress: (state: AwakeningWardSaveState) => void;
  setQuality: (quality: 'low' | 'medium') => void;
  destroy: () => void;
}

export class WardSceneBridge {
  private scene: WardSceneApi | null = null;
  private movement = { x: 0, y: 0 };
  private running = false;
  private locked = false;
  private paused = false;
  private progress: AwakeningWardSaveState | null = null;
  private quality: 'low' | 'medium' | null = null;

  constructor(readonly callbacks: WardRuntimeCallbacks) {}

  attach(scene: WardSceneApi): void {
    this.scene = scene;
    scene.setTouchMovement(this.movement.x, this.movement.y);
    scene.setTouchRunning(this.running);
    if (this.progress) scene.setProgress(this.progress);
    if (this.quality) scene.setQuality(this.quality);
    scene.setLocked(this.locked);
    if (this.paused) scene.setPaused(true);
  }

  detach(scene: WardSceneApi): void {
    if (this.scene === scene) this.scene = null;
  }

  setTouchMovement(x: number, y: number): void {
    this.movement = { x, y };
    this.scene?.setTouchMovement(x, y);
  }

  setTouchRunning(running: boolean): void {
    this.running = running;
    this.scene?.setTouchRunning(running);
  }

  requestInteraction(): void {
    this.scene?.requestInteraction();
  }

  setLocked(locked: boolean): void {
    this.locked = locked;
    this.scene?.setLocked(locked);
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    this.scene?.setPaused(paused);
  }

  setProgress(state: AwakeningWardSaveState): void {
    this.progress = state;
    this.scene?.setProgress(state);
  }

  setQuality(quality: 'low' | 'medium'): void {
    this.quality = quality;
    this.scene?.setQuality(quality);
  }

  destroy(): void {
    this.scene?.destroy();
    this.scene = null;
  }
}
