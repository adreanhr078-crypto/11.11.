import type { RoomConfig } from '../types/gameplay.types';

export const OPENING_ROOM_CONFIG: RoomConfig = {
  id: 'opening-room',
  dimensions: {
    width: 9,
    height: 3.6,
    depth: 7,
  },
  bounds: {
    min: { x: -4.5, y: 0, z: -3.5 },
    max: { x: 4.5, y: 3.6, z: 3.5 },
  },
  spawnPosition: { x: 0, y: 0.85, z: 0.65 },
  camera: {
    positionOffset: { x: 0, y: 2.15, z: 2.45 },
    targetOffset: { x: 0, y: 0.75, z: 0 },
    followSharpness: 8,
    rotationSharpness: 10,
    collisionPadding: 0.18,
  },
  movement: {
    walkSpeed: 1.9,
    sprintSpeed: 3.1,
    halfExtents: { x: 0.32, y: 0.85, z: 0.32 },
  },
  obstacles: [
    {
      id: 'opening-bed',
      min: { x: -3.9, y: 0, z: -0.1 },
      max: { x: -1.45, y: 0.72, z: 2.75 },
    },
    {
      id: 'opening-desk',
      min: { x: 1.65, y: 0, z: -2.65 },
      max: { x: 3.65, y: 1.05, z: -1.55 },
    },
  ],
};
