import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  MathUtils,
  type PointLight,
  type SpotLight,
} from 'three';
import type { QualityTier } from '../../../ui/design-system';
import {
  OPENING_ROOM_PALETTE,
  OPENING_ROOM_VISUAL_QUALITY,
  type RoomVisualEvent,
} from '../data/openingRoom.visuals';

interface RoomLightingProps {
  quality: QualityTier;
  doorUnlocked: boolean;
  focusedInteractionId?: string | null;
  visualEvent?: RoomVisualEvent | null;
}

export function RoomLighting({
  quality,
  doorUnlocked,
  focusedInteractionId,
  visualEvent,
}: RoomLightingProps) {
  const overheadRef = useRef<PointLight>(null);
  const memoryRef = useRef<PointLight>(null);
  const doorRef = useRef<PointLight>(null);
  const deskSpotRef = useRef<SpotLight>(null);
  const lastNonceRef = useRef(-1);
  const eventStartedAtRef = useRef(-100);
  const doorTargetColor = useMemo(
    () => new Color(
      doorUnlocked
        ? OPENING_ROOM_PALETTE.memory
        : OPENING_ROOM_PALETTE.danger,
    ),
    [doorUnlocked],
  );
  const qualityConfig = OPENING_ROOM_VISUAL_QUALITY[quality];

  useFrame(({ clock }, delta) => {
    const overhead = overheadRef.current;
    const memory = memoryRef.current;
    const door = doorRef.current;
    const deskSpot = deskSpotRef.current;

    if (
      visualEvent
      && visualEvent.nonce !== lastNonceRef.current
    ) {
      lastNonceRef.current = visualEvent.nonce;
      eventStartedAtRef.current = clock.elapsedTime;
    }

    const time = clock.elapsedTime;
    const eventElapsed = time - eventStartedAtRef.current;
    const memoryPulse = visualEvent?.memoryGranted
      && eventElapsed >= 0
      && eventElapsed < 1.2
      ? Math.sin((eventElapsed / 1.2) * Math.PI)
      : 0;
    const lockedPulse = visualEvent?.interactionId === 'opening-door'
      && visualEvent.outcome === 'locked'
      && eventElapsed >= 0
      && eventElapsed < 0.65
      ? Math.max(0, Math.sin(eventElapsed * 31))
      : 0;

    const electricalNoise = 0.94
      + Math.sin(time * 17.7) * 0.025
      + Math.sin(time * 3.1) * 0.035;
    if (overhead) {
      overhead.intensity = (
        quality === 'mobile' ? 4.6 : 6.4
      ) * electricalNoise;
    }
    if (memory) {
      memory.intensity = MathUtils.damp(
        memory.intensity,
        2.3
          + memoryPulse * 8
          + (focusedInteractionId === 'opening-clock' ? 1.25 : 0),
        8,
        delta,
      );
    }
    if (door) {
      door.color.lerp(doorTargetColor, 1 - Math.exp(-delta * 6));
      door.intensity = MathUtils.damp(
        door.intensity,
        (doorUnlocked ? 5.2 : 2.1)
          + lockedPulse * 7
          + (focusedInteractionId === 'opening-door' ? 1.4 : 0),
        11,
        delta,
      );
    }
    if (deskSpot) {
      deskSpot.intensity = MathUtils.damp(
        deskSpot.intensity,
        3.4 + (focusedInteractionId === 'opening-photo' ? 1.2 : 0),
        6,
        delta,
      );
    }
  });

  return (
    <group name="opening-room-light-rig">
      <ambientLight intensity={0.11} color="#76b7c2" />
      <hemisphereLight
        color="#5fcbd9"
        groundColor="#010204"
        intensity={0.18}
      />
      <pointLight
        ref={overheadRef}
        position={[0.15, 3.18, 0.35]}
        intensity={quality === 'mobile' ? 4.6 : 6.4}
        distance={9.5}
        decay={2}
        color="#83dce8"
        castShadow={qualityConfig.dynamicShadows}
        shadow-mapSize-width={quality === 'high' ? 1024 : 512}
        shadow-mapSize-height={quality === 'high' ? 1024 : 512}
        shadow-bias={-0.0004}
      />
      <pointLight
        ref={memoryRef}
        position={[0.65, 1.65, -2.9]}
        intensity={2.3}
        distance={4.6}
        decay={2}
        color={OPENING_ROOM_PALETTE.memory}
      />
      {quality !== 'mobile' && (
        <spotLight
          ref={deskSpotRef}
          position={[2.25, 3.15, -0.45]}
          intensity={3.4}
          distance={7}
          decay={2}
          angle={0.52}
          penumbra={0.92}
          color="#83d7e2"
          castShadow={quality === 'high'}
        />
      )}
      <pointLight
        ref={doorRef}
        position={[-2.3, 1.48, -2.96]}
        intensity={doorUnlocked ? 5.2 : 2.1}
        distance={3.4}
        decay={2}
        color={
          doorUnlocked
            ? OPENING_ROOM_PALETTE.memory
            : OPENING_ROOM_PALETTE.danger
        }
      />
      {quality !== 'mobile' && (
        <pointLight
          position={[-4.08, 1.3, 1.15]}
          intensity={2.3}
          distance={3.8}
          decay={2}
          color="#2bc5df"
        />
      )}
    </group>
  );
}
