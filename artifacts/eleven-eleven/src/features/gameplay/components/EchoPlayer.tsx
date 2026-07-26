import {
  useRef,
  type MutableRefObject,
} from 'react';
import { useFrame } from '@react-three/fiber';
import {
  MathUtils,
  type Group,
} from 'three';
import { OPENING_ROOM_CONFIG } from '../data/openingRoom.config';
import type {
  OpeningRoomNarrativeFlags,
} from '../systems/puzzleSystem';
import { movePlayer } from '../systems/playerMovementSystem';
import { useInteraction } from '../hooks/useInteraction';
import type {
  PlayerControlsSnapshot,
} from '../hooks/usePlayerControls';
import { EchoAvatar } from './EchoAvatar';

interface EchoPlayerProps {
  playerRef: MutableRefObject<Group | null>;
  inputRef: MutableRefObject<PlayerControlsSnapshot>;
  cameraYawRef: MutableRefObject<number>;
  flags: OpeningRoomNarrativeFlags;
  enabled: boolean;
  onNearestInteractionChange: (interactionId: string | null) => void;
  onFootstep: () => void;
}

export function EchoPlayer({
  playerRef,
  inputRef,
  cameraYawRef,
  flags,
  enabled,
  onNearestInteractionChange,
  onFootstep,
}: EchoPlayerProps) {
  const movingRef = useRef(false);
  const footstepElapsedRef = useRef(0);

  useInteraction({
    playerRef,
    context: { flags },
    enabled,
    onNearestChange: onNearestInteractionChange,
  });

  useFrame((_, frameDelta) => {
    const player = playerRef.current;
    if (!player || !enabled) {
      movingRef.current = false;
      footstepElapsedRef.current = 0;
      return;
    }

    const delta = Math.min(frameDelta, 0.05);
    const current = player.position;
    const next = movePlayer({
      position: {
        x: current.x,
        y: current.y,
        z: current.z,
      },
      input: inputRef.current,
      deltaSeconds: delta,
      facingYawRadians: cameraYawRef.current,
      roomBounds: OPENING_ROOM_CONFIG.bounds,
      obstacles: OPENING_ROOM_CONFIG.obstacles,
      movement: OPENING_ROOM_CONFIG.movement,
    });

    const deltaX = next.x - current.x;
    const deltaZ = next.z - current.z;
    const isMoving = Math.abs(deltaX) + Math.abs(deltaZ) > 0.00001;
    movingRef.current = isMoving;

    if (isMoving) {
      player.position.set(next.x, next.y, next.z);
      const desiredRotation = Math.atan2(deltaX, deltaZ);
      player.rotation.y = MathUtils.damp(
        player.rotation.y,
        desiredRotation,
        13,
        delta,
      );

      footstepElapsedRef.current += delta;
      const cadence = inputRef.current.sprint ? 0.28 : 0.43;
      if (footstepElapsedRef.current >= cadence) {
        footstepElapsedRef.current = 0;
        onFootstep();
      }
    } else {
      footstepElapsedRef.current = 0;
    }
  });

  const spawn = OPENING_ROOM_CONFIG.spawnPosition;
  const playerCenterHeight = OPENING_ROOM_CONFIG.movement.halfExtents.y;

  return (
    <group
      ref={playerRef}
      position={[spawn.x, spawn.y, spawn.z]}
      name="echo-player"
    >
      <group position={[0, -playerCenterHeight, 0]}>
        <EchoAvatar movingRef={movingRef} />
      </group>
    </group>
  );
}
