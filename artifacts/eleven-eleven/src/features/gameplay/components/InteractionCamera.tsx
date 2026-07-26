import {
  useMemo,
  type MutableRefObject,
} from 'react';
import {
  useFrame,
  useThree,
} from '@react-three/fiber';
import {
  MathUtils,
  Vector3,
  type Group,
} from 'three';
import type {
  Vector3 as GameplayVector3,
} from '../types/gameplay.types';

interface InteractionCameraProps {
  playerRef: MutableRefObject<Group | null>;
  target: GameplayVector3 | null;
  active: boolean;
  paused: boolean;
}

export function InteractionCamera({
  playerRef,
  target,
  active,
  paused,
}: InteractionCameraProps) {
  const { camera } = useThree();
  const playerPosition = useMemo(() => new Vector3(), []);
  const interactionPosition = useMemo(() => new Vector3(), []);
  const approach = useMemo(() => new Vector3(), []);
  const desired = useMemo(() => new Vector3(), []);

  useFrame((_, frameDelta) => {
    const player = playerRef.current;
    if (!active || paused || !player || !target) return;

    player.getWorldPosition(playerPosition);
    interactionPosition.set(target.x, target.y, target.z);
    approach.set(
      playerPosition.x - interactionPosition.x,
      0,
      playerPosition.z - interactionPosition.z,
    );
    if (approach.lengthSq() < 0.01) approach.set(0, 0, 1);
    approach.normalize();

    desired.copy(interactionPosition).addScaledVector(approach, 1.55);
    desired.y = MathUtils.clamp(
      interactionPosition.y + 0.72,
      1.35,
      2.55,
    );
    camera.position.lerp(
      desired,
      1 - Math.exp(-7.5 * Math.min(frameDelta, 0.05)),
    );
    camera.lookAt(interactionPosition);
  });

  return null;
}
