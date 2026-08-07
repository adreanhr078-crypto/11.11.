import type { WardObjectKind } from '../domain/awakeningWardTypes';

export const WARD_ART_KEYS = {
  floor: 'ward-floor-atlas-v2',
  items: 'ward-items-atlas-v2',
  playerNorthEast: 'ward-player-north-east-atlas-v3',
  playerSouthWest: 'ward-player-south-west-atlas-v3',
  props: 'ward-props-atlas-v2',
  walls: 'ward-wall-atlas-v2',
} as const;

export const WARD_ART_PATHS = {
  cosmos: '/assets/awakening-ward/art-pass-v2/void-cosmos.webp',
  floor: '/assets/awakening-ward/art-pass-v2/floor-atlas.webp',
  items: '/assets/awakening-ward/art-pass-v2/items-atlas.webp',
  playerNorthEast:
    '/assets/awakening-ward/art-pass-v2/player-north-east-atlas.webp',
  playerSouthWest:
    '/assets/awakening-ward/art-pass-v2/player-south-west-atlas.webp',
  props: '/assets/awakening-ward/art-pass-v2/props-atlas.webp',
  walls: '/assets/awakening-ward/art-pass-v2/wall-atlas.webp',
} as const;

export const WARD_ART_FRAMES = {
  floor: 627,
  item: 627,
  playerWidth: 314,
  playerHeight: 314,
  prop: 418,
  wall: 627,
} as const;

export const WARD_FLOOR_FRAMES = {
  accessPanel: 0,
  serviceVent: 1,
  warningPlate: 2,
  corridorGuide: 3,
} as const;

export const WARD_ITEM_FRAMES = {
  keycard: 0,
  medicalPatch: 1,
  battery: 2,
  clueNote: 3,
} as const;

interface WardPropVisual {
  frame: number;
  scale: number;
  originX: number;
  originY: number;
  shadowWidth: number;
  shadowHeight: number;
  offsetX?: number;
  offsetY?: number;
  emissive?: 'cyan' | 'red';
}

export const WARD_PROP_VISUALS: Partial<Record<WardObjectKind, WardPropVisual>> = {
  capsule: {
    frame: 0,
    scale: 0.66,
    originX: 0.544,
    originY: 0.88,
    shadowWidth: 235,
    shadowHeight: 62,
    emissive: 'red',
  },
  'power-panel': {
    frame: 1,
    scale: 0.46,
    originX: 0.538,
    originY: 0.904,
    shadowWidth: 108,
    shadowHeight: 34,
    emissive: 'red',
  },
  'monitor-bank': {
    frame: 2,
    scale: 0.66,
    originX: 0.441,
    originY: 0.926,
    shadowWidth: 225,
    shadowHeight: 47,
    emissive: 'cyan',
  },
  storage: {
    frame: 3,
    scale: 0.5,
    originX: 0.499,
    originY: 0.876,
    shadowWidth: 122,
    shadowHeight: 34,
    emissive: 'red',
  },
  'exit-door': {
    frame: 4,
    scale: 0.55,
    originX: 0.463,
    originY: 0.897,
    shadowWidth: 136,
    shadowHeight: 30,
    emissive: 'red',
  },
  'medical-console': {
    frame: 5,
    scale: 0.43,
    originX: 0.361,
    originY: 0.885,
    shadowWidth: 92,
    shadowHeight: 31,
    emissive: 'cyan',
  },
  'side-table': {
    frame: 6,
    scale: 0.42,
    originX: 0.502,
    originY: 0.758,
    shadowWidth: 112,
    shadowHeight: 34,
  },
  crate: {
    frame: 7,
    scale: 0.39,
    originX: 0.413,
    originY: 0.78,
    shadowWidth: 105,
    shadowHeight: 34,
    emissive: 'red',
  },
  chair: {
    frame: 8,
    scale: 0.38,
    originX: 0.34,
    originY: 0.811,
    shadowWidth: 72,
    shadowHeight: 25,
  },
};

export interface WardGroundedVisual {
  originX: number;
  originY: number;
  shadowWidth: number;
  shadowHeight: number;
}

export const WARD_ITEM_VISUALS: Readonly<Record<number, WardGroundedVisual>> = {
  [WARD_ITEM_FRAMES.keycard]: {
    originX: 0.52,
    originY: 0.857,
    shadowWidth: 38,
    shadowHeight: 12,
  },
  [WARD_ITEM_FRAMES.medicalPatch]: {
    originX: 0.455,
    originY: 0.92,
    shadowWidth: 42,
    shadowHeight: 14,
  },
  [WARD_ITEM_FRAMES.battery]: {
    originX: 0.507,
    originY: 0.703,
    shadowWidth: 34,
    shadowHeight: 12,
  },
  [WARD_ITEM_FRAMES.clueNote]: {
    originX: 0.436,
    originY: 0.78,
    shadowWidth: 38,
    shadowHeight: 13,
  },
};

export const WARD_WALL_VISUALS: Readonly<Record<number, WardGroundedVisual>> = {
  0: { originX: 0.518, originY: 0.933, shadowWidth: 0, shadowHeight: 0 },
  1: { originX: 0.463, originY: 0.933, shadowWidth: 0, shadowHeight: 0 },
  2: { originX: 0.518, originY: 0.7, shadowWidth: 0, shadowHeight: 0 },
  3: { originX: 0.463, originY: 0.713, shadowWidth: 0, shadowHeight: 0 },
};

const FRONT_WALL_DEPTH_OFFSET = 2;
const BACK_WALL_DEPTH_OFFSET = -86;

export function resolveWardWallDepth(baseY: number, front: boolean): number {
  return baseY + (front ? FRONT_WALL_DEPTH_OFFSET : BACK_WALL_DEPTH_OFFSET);
}

export function resolveWardWallRenderDepth(
  authoredDepth: number,
  playerDepth: number,
  playerNearWall: boolean,
): number {
  if (!playerNearWall) return authoredDepth;
  return Math.min(authoredDepth, playerDepth - 1);
}

export const WARD_PLAYER_DIRECTION_ROWS = [
  'north',
  'north-east',
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
  'north-west',
] as const;

export interface WardPlayerVisual {
  textureKey: typeof WARD_ART_KEYS.playerNorthEast
    | typeof WARD_ART_KEYS.playerSouthWest;
  frameRow: number;
  flipX: boolean;
}

// Symmetrical directions share authored poses so left/right movement reads cleanly.
export const WARD_PLAYER_VISUALS: readonly WardPlayerVisual[] = [
  { textureKey: WARD_ART_KEYS.playerNorthEast, frameRow: 0, flipX: false },
  { textureKey: WARD_ART_KEYS.playerNorthEast, frameRow: 1, flipX: false },
  { textureKey: WARD_ART_KEYS.playerNorthEast, frameRow: 2, flipX: false },
  { textureKey: WARD_ART_KEYS.playerNorthEast, frameRow: 3, flipX: false },
  { textureKey: WARD_ART_KEYS.playerSouthWest, frameRow: 0, flipX: false },
  { textureKey: WARD_ART_KEYS.playerNorthEast, frameRow: 3, flipX: true },
  { textureKey: WARD_ART_KEYS.playerNorthEast, frameRow: 2, flipX: true },
  { textureKey: WARD_ART_KEYS.playerNorthEast, frameRow: 1, flipX: true },
] as const;

export function resolveWardPlayerFacingRow(x: number, y: number): number {
  const angle = Math.atan2(y, x);
  const clockwiseFromNorth = Math.round(
    (angle + Math.PI / 2) / (Math.PI / 4),
  );
  return ((clockwiseFromNorth % 8) + 8) % 8;
}

export function resolveWardPlayerVisual(row: number): WardPlayerVisual {
  return WARD_PLAYER_VISUALS[row] ?? WARD_PLAYER_VISUALS[4]!;
}

export function resolveWardPlayerFrame(row: number, column: number): number {
  return resolveWardPlayerVisual(row).frameRow * 4 + column;
}
