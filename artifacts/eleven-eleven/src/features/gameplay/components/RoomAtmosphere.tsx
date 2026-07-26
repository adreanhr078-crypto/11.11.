import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  DoubleSide,
  type Group,
  type MeshBasicMaterial,
  type Points,
  type PointsMaterial,
} from 'three';
import type { QualityTier } from '../../../ui/design-system';
import {
  OPENING_ROOM_PALETTE,
  OPENING_ROOM_VISUAL_QUALITY,
  type RoomVisualEvent,
} from '../data/openingRoom.visuals';

interface RoomAtmosphereProps {
  quality: QualityTier;
  visualEvent?: RoomVisualEvent | null;
}

function seededUnit(index: number, salt: number) {
  const value = Math.sin(index * 78.233 + salt * 41.719) * 9283.731;
  return value - Math.floor(value);
}

export function RoomAtmosphere({
  quality,
  visualEvent,
}: RoomAtmosphereProps) {
  const dustRef = useRef<Points>(null);
  const dustMaterialRef = useRef<PointsMaterial>(null);
  const glitchGroupRef = useRef<Group>(null);
  const glitchMaterialRefs = useRef<(MeshBasicMaterial | null)[]>([]);
  const lastNonceRef = useRef(-1);
  const eventStartedAtRef = useRef(-100);
  const qualityConfig = OPENING_ROOM_VISUAL_QUALITY[quality];

  const dustPositions = useMemo(() => {
    const positions = new Float32Array(
      qualityConfig.dustParticles * 3,
    );
    for (
      let index = 0;
      index < qualityConfig.dustParticles;
      index += 1
    ) {
      positions[index * 3] = (seededUnit(index, 1) - 0.5) * 8.3;
      positions[index * 3 + 1] = 0.2 + seededUnit(index, 2) * 3.1;
      positions[index * 3 + 2] = (seededUnit(index, 3) - 0.5) * 6.2;
    }
    return positions;
  }, [qualityConfig.dustParticles]);

  useFrame(({ clock }, delta) => {
    const dust = dustRef.current;
    const dustMaterial = dustMaterialRef.current;
    const glitchGroup = glitchGroupRef.current;
    if (!dust || !dustMaterial || !glitchGroup) return;

    if (
      visualEvent
      && visualEvent.nonce !== lastNonceRef.current
    ) {
      lastNonceRef.current = visualEvent.nonce;
      eventStartedAtRef.current = clock.elapsedTime;
    }

    const time = clock.elapsedTime;
    dust.rotation.y += delta * 0.008;
    dust.position.y = Math.sin(time * 0.19) * 0.035;
    dustMaterial.opacity = 0.18 + Math.sin(time * 0.43) * 0.035;

    const eventElapsed = time - eventStartedAtRef.current;
    const active = eventElapsed >= 0 && eventElapsed < 0.78;
    glitchGroup.visible = active;
    if (!active) return;

    const envelope = Math.sin((eventElapsed / 0.78) * Math.PI);
    glitchGroup.position.x = Math.sin(eventElapsed * 59) * 0.05;
    glitchMaterialRefs.current.forEach((material, index) => {
      if (!material) return;
      const scan = Math.max(
        0,
        Math.sin(eventElapsed * 29 + index * 1.7),
      );
      material.opacity = envelope * scan * 0.11;
    });
  });

  return (
    <group name="opening-room-atmosphere">
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dustPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={dustMaterialRef}
          color="#8fe9f2"
          size={quality === 'mobile' ? 0.025 : 0.032}
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </points>
      <group ref={glitchGroupRef} visible={false}>
        {Array.from(
          { length: qualityConfig.glitchStrips },
          (_, index) => (
            <mesh
              key={index}
              position={[
                0,
                0.5 + index * (2.5 / qualityConfig.glitchStrips),
                2.72 + index * 0.02,
              ]}
              rotation={[0, 0, (index % 2 ? -1 : 1) * 0.012]}
            >
              <planeGeometry
                args={[
                  8.4 - index * 0.38,
                  0.025 + (index % 2) * 0.028,
                ]}
              />
              <meshBasicMaterial
                ref={(material) => {
                  glitchMaterialRefs.current[index] = material;
                }}
                color={
                  visualEvent?.outcome === 'locked'
                    ? OPENING_ROOM_PALETTE.danger
                    : OPENING_ROOM_PALETTE.memory
                }
                transparent
                opacity={0}
                depthWrite={false}
                blending={AdditiveBlending}
                side={DoubleSide}
                toneMapped={false}
              />
            </mesh>
          ),
        )}
      </group>
    </group>
  );
}
