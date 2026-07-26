export interface Vector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface RoomDimensions {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
}

export interface RoomBounds {
  readonly min: Vector3;
  readonly max: Vector3;
}

export interface Aabb {
  readonly min: Vector3;
  readonly max: Vector3;
}

export type AxisAlignedBoundingBox = Aabb;

export interface CollisionObstacle extends Aabb {
  readonly id: string;
}

export interface CameraConfig {
  readonly positionOffset: Vector3;
  readonly targetOffset: Vector3;
  readonly followSharpness: number;
  readonly rotationSharpness: number;
  readonly collisionPadding: number;
}

export interface PlayerMovementConfig {
  readonly walkSpeed: number;
  readonly sprintSpeed: number;
  readonly halfExtents: Vector3;
}

export interface PlayerMovementInput {
  readonly forward: boolean;
  readonly backward: boolean;
  readonly left: boolean;
  readonly right: boolean;
  readonly sprint: boolean;
}

export interface RoomConfig {
  readonly id: string;
  readonly dimensions: RoomDimensions;
  readonly bounds: RoomBounds;
  readonly spawnPosition: Vector3;
  readonly camera: CameraConfig;
  readonly movement: PlayerMovementConfig;
  readonly obstacles: readonly CollisionObstacle[];
}

export type InteractionType = 'inspect' | 'collect' | 'door';

export interface NarrativeEffect {
  readonly type: string;
}

export interface InteractionResult<
  TEffect extends NarrativeEffect = NarrativeEffect,
> {
  readonly outcome: 'narration' | 'memory' | 'locked' | 'unlocked';
  readonly message: string;
  readonly effects: readonly TEffect[];
}

export interface InteractionDefinition<
  TContext = unknown,
  TEffect extends NarrativeEffect = NarrativeEffect,
> {
  readonly id: string;
  readonly type: InteractionType;
  readonly position: Vector3;
  readonly interactionDistance: number;
  readonly prompt: string;
  readonly enabledCondition: (context: TContext) => boolean;
  readonly onInteract: (
    context: TContext,
  ) => InteractionResult<TEffect>;
  readonly memoryId?: string;
  readonly puzzleId?: string;
  readonly narrativeEffects?: readonly TEffect[];
}

export interface NearestInteraction<TInteraction = InteractionDefinition> {
  readonly interaction: TInteraction;
  readonly distance: number;
}
