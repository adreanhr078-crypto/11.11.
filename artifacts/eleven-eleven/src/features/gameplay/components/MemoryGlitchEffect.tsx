import {
  useMemo,
  useRef,
} from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  type Group,
  type MeshBasicMaterial,
  type PointsMaterial,
} from 'three';
import type { RoomVisualEvent } from '../data/openingRoom.visuals';

interface MemoryGlitchEffectProps {
  event?: RoomVisualEvent | null;
  interactionId: string;
  position: [number, number, number];
  radius?: number;
  particleCount?: number;
}

function seededUnit(index: number, salt: number) {
  const value = Math.sin(index * 91.17 + salt * 17.31) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * One-shot memory response. Timing lives entirely in refs so the effect never
 * schedules React updates from the render loop.
 */
export function MemoryGlitchEffect({
  event,
  interactionId,
  position,
  radius = 0.6,
  particleCount = 18,
}: MemoryGlitchEffectProps) {
  const groupRef = useRef<Group>(null);
  const pointMaterialRef = useRef<PointsMaterial>(null);
  const stripMaterialRefs = useRef<(MeshBasicMaterial | null)[]>([]);
  const lastNonceRef = useRef(-1);
  const startedAtRef = useRef(-100);

  const particlePositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      positions[index * 3] = (seededUnit(index, 1) - 0.5) * radius * 1.8;
      positions[index * 3 + 1] = (seededUnit(index, 2) - 0.5) * radius * 1.5;
      positions[index * 3 + 2] = (seededUnit(index, 3) - 0.5) * radius * 0.7;
    }
    return positions;
  }, [particleCount, radius]);

  const isTargetEvent = event?.interactionId === interactionId;
  const effectColor = event?.outcome === 'locked'
    ? '#ff4058'
    : event?.memoryGranted
      ? '#74f2ff'
      : '#4fd8eb';

  useFrame(({ clock }) => {
    const group = groupRef.current;
    const pointsMaterial = pointMaterialRef.current;
    if (!group || !pointsMaterial) return;

    if (
      isTargetEvent
      && event
      && event.nonce !== lastNonceRef.current
    ) {
      lastNonceRef.current = event.nonce;
      startedAtRef.current = clock.elapsedTime;
    }

    const elapsed = clock.elapsedTime - startedAtRef.current;
    const duration = event?.memoryGranted ? 1.15 : 0.72;
    const active = elapsed >= 0 && elapsed < duration;
    group.visible = active;
    if (!active) return;

    const progress = Math.min(1, elapsed / duration);
    const envelope = Math.sin(progress * Math.PI);
    const stutter = 0.7 + Math.sin(elapsed * 61) * 0.3;
    group.scale.setScalar(0.7 + progress * 0.75);
    group.rotation.z = Math.sin(elapsed * 34) * 0.045;
    group.position.x = position[0] + Math.sin(elapsed * 73) * 0.018;
    group.position.y = position[1] + progress * 0.18;
    group.position.z = position[2];
    pointsMaterial.opacity = envelope * stutter * 0.78;
    pointsMaterial.size = 0.035 + envelope * 0.035;

    stripMaterialRefs.current.forEach((material, index) => {
      if (!material) return;
      const phase = Math.max(
        0,
        Math.sin((progress * 3.1 + index * 0.37) * Math.PI),
      );
      material.opacity = phase * envelope * 0.45;
    });
  });

  return (
    <group
      ref={groupRef}
      position={position}
      visible={false}
      name={`memory-glitch-${interactionId}`}
    >
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={pointMaterialRef}
          color={effectColor}
          size={0.045}
          transparent
          opacity={0}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </points>
      {[-0.22, -0.05, 0.16].map((y, index) => (
        <mesh
          key={y}
          position={[0, y, 0.03 + index * 0.005]}
          scale={[1 - index * 0.18, 1, 1]}
        >
          <planeGeometry args={[radius * 1.9, 0.025 + index * 0.012]} />
          <meshBasicMaterial
            ref={(material) => {
              stripMaterialRefs.current[index] = material;
            }}
            color={effectColor}
            transparent
            opacity={0}
            depthWrite={false}
            blending={AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
