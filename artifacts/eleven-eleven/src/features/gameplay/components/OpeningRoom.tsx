import {
  useMemo,
  useRef,
} from 'react';
import { useFrame } from '@react-three/fiber';
import {
  DoubleSide,
  MathUtils,
  type Group,
  type Mesh,
} from 'three';
import type { QualityTier } from '../../../ui/design-system';
import { OPENING_ROOM_CONFIG } from '../data/openingRoom.config';
import type {
  OpeningRoomNarrativeFlags,
} from '../systems/puzzleSystem';

interface OpeningRoomProps {
  flags: OpeningRoomNarrativeFlags;
  quality: QualityTier;
}

function InteractionBeacon({
  position,
  visible,
  color = '#57e7ff',
  rotation = [Math.PI / 2, 0, 0],
}: {
  position: [number, number, number];
  visible: boolean;
  color?: string;
  rotation?: [number, number, number];
}) {
  const meshRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current || !visible) return;
    const phase = clock.elapsedTime * 2.2;
    const scale = 0.92 + Math.sin(phase) * 0.08;
    meshRef.current.scale.setScalar(scale);
    meshRef.current.rotation.z = phase * 0.08;
  });

  if (!visible) return null;

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <torusGeometry args={[0.25, 0.012, 8, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.58}
      />
    </mesh>
  );
}

function StoppedClock({ inspected }: { inspected: boolean }) {
  const minuteAngle = -(11 / 60) * Math.PI * 2;
  const hourAngle = -((11 + 11 / 60) / 12) * Math.PI * 2;

  return (
    <group position={[0.65, 1.82, -3.32]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.1, 32]} />
        <meshStandardMaterial
          color="#071015"
          emissive={inspected ? '#0d7381' : '#042d36'}
          emissiveIntensity={inspected ? 0.24 : 0.42}
          metalness={0.72}
          roughness={0.32}
        />
      </mesh>
      <mesh position={[0, 0, 0.061]}>
        <ringGeometry args={[0.365, 0.405, 32]} />
        <meshBasicMaterial color="#79efff" opacity={0.72} transparent />
      </mesh>
      {Array.from({ length: 11 }, (_, index) => {
        const angle = (index / 11) * Math.PI * 2;
        return (
          <mesh
            key={index}
            position={[
              Math.sin(angle) * 0.315,
              Math.cos(angle) * 0.315,
              0.068,
            ]}
          >
            <boxGeometry args={[0.018, 0.045, 0.012]} />
            <meshBasicMaterial color="#70ddea" />
          </mesh>
        );
      })}
      <mesh
        position={[0, 0, 0.081]}
        rotation={[0, 0, minuteAngle]}
      >
        <boxGeometry args={[0.025, 0.31, 0.018]} />
        <meshBasicMaterial color="#e5fcff" />
      </mesh>
      <mesh
        position={[0, 0, 0.086]}
        rotation={[0, 0, hourAngle]}
      >
        <boxGeometry args={[0.034, 0.22, 0.022]} />
        <meshBasicMaterial color="#ff6573" />
      </mesh>
      <mesh position={[0, 0, 0.1]}>
        <circleGeometry args={[0.045, 16]} />
        <meshBasicMaterial color="#57e7ff" />
      </mesh>
      <InteractionBeacon
        position={[0, 0, 0.13]}
        visible={!inspected}
        rotation={[0, 0, 0]}
      />
    </group>
  );
}

function TornPhoto({ inspected }: { inspected: boolean }) {
  return (
    <group
      position={[2.55, 1.08, -1.5]}
      rotation={[-0.38, 0.05, 0.02]}
    >
      <mesh castShadow>
        <boxGeometry args={[0.82, 0.56, 0.035]} />
        <meshStandardMaterial
          color="#b8c3be"
          emissive={inspected ? '#123b40' : '#09191c'}
          emissiveIntensity={0.25}
          roughness={0.86}
        />
      </mesh>
      <mesh position={[-0.16, 0.02, 0.022]}>
        <circleGeometry args={[0.13, 18]} />
        <meshBasicMaterial color="#26373c" opacity={0.65} transparent />
      </mesh>
      <mesh position={[0.18, -0.12, 0.024]} rotation={[0, 0, -0.25]}>
        <planeGeometry args={[0.38, 0.025]} />
        <meshBasicMaterial color="#31525a" />
      </mesh>
      <mesh position={[0.06, 0.04, 0.027]} rotation={[0, 0, 0.7]}>
        <planeGeometry args={[0.032, 0.66]} />
        <meshBasicMaterial color="#061014" />
      </mesh>
      <InteractionBeacon
        position={[0, 0, 0.08]}
        visible={!inspected}
        rotation={[0, 0, 0]}
      />
    </group>
  );
}

function ExitDoor({
  unlocked,
}: {
  unlocked: boolean;
}) {
  const doorRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!doorRef.current) return;
    doorRef.current.rotation.y = MathUtils.damp(
      doorRef.current.rotation.y,
      unlocked ? -1.42 : 0,
      5.2,
      delta,
    );
  });

  return (
    <group>
      <mesh position={[-2.3, 1.48, -3.47]}>
        <planeGeometry args={[1.76, 2.96]} />
        <meshBasicMaterial color="#000205" side={DoubleSide} />
      </mesh>
      <group
        ref={doorRef}
        position={[-3.15, 0, -3.31]}
      >
        <mesh
          position={[0.85, 1.48, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1.7, 2.96, 0.16]} />
          <meshStandardMaterial
            color={unlocked ? '#10282d' : '#13191d'}
            emissive={unlocked ? '#0d8390' : '#230b10'}
            emissiveIntensity={unlocked ? 0.42 : 0.18}
            metalness={0.82}
            roughness={0.35}
          />
        </mesh>
        <mesh position={[1.45, 1.45, 0.11]}>
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshStandardMaterial
            color={unlocked ? '#7af0ff' : '#7a2631'}
            emissive={unlocked ? '#30cadd' : '#4a0c16'}
            emissiveIntensity={0.8}
          />
        </mesh>
      </group>
      <InteractionBeacon
        position={[-2.3, 1.1, -3.2]}
        visible={!unlocked}
        color="#ff6573"
        rotation={[0, 0, 0]}
      />
      <InteractionBeacon
        position={[-2.3, 1.1, -3.2]}
        visible={unlocked}
        color="#57e7ff"
        rotation={[0, 0, 0]}
      />
    </group>
  );
}

function Bed() {
  return (
    <group>
      <mesh position={[-2.68, 0.27, 1.33]} castShadow receiveShadow>
        <boxGeometry args={[2.42, 0.32, 2.82]} />
        <meshStandardMaterial color="#11191f" roughness={0.88} />
      </mesh>
      <mesh position={[-2.68, 0.54, 1.33]} castShadow>
        <boxGeometry args={[2.32, 0.24, 2.67]} />
        <meshStandardMaterial
          color="#26343b"
          emissive="#0a2e35"
          emissiveIntensity={0.16}
          roughness={0.95}
        />
      </mesh>
      <mesh position={[-2.68, 0.74, 2.24]} castShadow>
        <boxGeometry args={[1.05, 0.22, 0.58]} />
        <meshStandardMaterial color="#34434a" roughness={1} />
      </mesh>
    </group>
  );
}

function Desk() {
  return (
    <group>
      <mesh position={[2.65, 0.92, -2.1]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.15, 1.1]} />
        <meshStandardMaterial
          color="#172126"
          metalness={0.48}
          roughness={0.55}
        />
      </mesh>
      {([
        [1.78, 0.43, -2.5],
        [3.52, 0.43, -2.5],
        [1.78, 0.43, -1.7],
        [3.52, 0.43, -1.7],
      ] as const).map(([x, y, z], index) => (
        <mesh key={index} position={[x, y, z]} castShadow>
          <boxGeometry args={[0.12, 0.86, 0.12]} />
          <meshStandardMaterial color="#10171b" metalness={0.62} />
        </mesh>
      ))}
      <mesh position={[3.2, 1.23, -2.35]} rotation={[0, -0.18, 0]}>
        <boxGeometry args={[0.72, 0.52, 0.06]} />
        <meshStandardMaterial
          color="#071115"
          emissive="#0b6470"
          emissiveIntensity={0.32}
          metalness={0.5}
        />
      </mesh>
    </group>
  );
}

function SystemGlitches({ quality }: { quality: QualityTier }) {
  const strips = useMemo(() => (
    quality === 'mobile'
      ? [
          [-4.35, 1.55, -1.4, 0.02],
          [4.35, 2.4, 0.8, -0.03],
        ]
      : [
          [-4.35, 1.55, -1.4, 0.02],
          [4.35, 2.4, 0.8, -0.03],
          [1.2, 3.42, 1.4, 0.04],
          [-1.1, 0.02, -2.2, -0.05],
        ]
  ), [quality]);

  return (
    <>
      {strips.map(([x, y, z, rotation], index) => (
        <mesh
          key={index}
          position={[x, y, z]}
          rotation={[0, rotation, index < 2 ? Math.PI / 2 : 0]}
        >
          <planeGeometry args={[0.9, 0.018]} />
          <meshBasicMaterial
            color={index % 2 ? '#ff5668' : '#4fe8ff'}
            transparent
            opacity={0.32}
            side={DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
}

export function OpeningRoom({
  flags,
  quality,
}: OpeningRoomProps) {
  const { width, height, depth } = OPENING_ROOM_CONFIG.dimensions;
  const doorLeftEdge = -3.15;
  const doorRightEdge = -1.45;
  const leftBackWidth = doorLeftEdge + width / 2;
  const rightBackWidth = width / 2 - doorRightEdge;

  return (
    <group name="opening-room">
      <ambientLight intensity={0.22} color="#8bdde8" />
      <hemisphereLight
        color="#90f3ff"
        groundColor="#020407"
        intensity={0.25}
      />
      <pointLight
        position={[0.5, 3.15, 0.4]}
        intensity={quality === 'mobile' ? 6 : 9}
        distance={9}
        decay={2}
        color="#43dff2"
        castShadow={quality !== 'mobile'}
      />
      <spotLight
        position={[-3.2, 3.25, 2.2]}
        intensity={4.5}
        distance={8}
        angle={0.56}
        penumbra={0.9}
        color="#7ccfda"
      />
      <pointLight
        position={[-2.3, 1.5, -3.05]}
        intensity={flags.openingDoorUnlocked ? 4.2 : 1.7}
        distance={3}
        color={flags.openingDoorUnlocked ? '#42e3f4' : '#d72f47'}
      />

      <mesh position={[0, -0.08, 0]} receiveShadow>
        <boxGeometry args={[width, 0.16, depth]} />
        <meshStandardMaterial
          color="#071014"
          metalness={0.25}
          roughness={0.78}
        />
      </mesh>
      <gridHelper
        args={[Math.max(width, depth), 18, '#17444b', '#0b2025']}
        position={[0, 0.015, 0]}
      />

      <mesh position={[-width / 2, height / 2, 0]} receiveShadow>
        <boxGeometry args={[0.18, height, depth]} />
        <meshStandardMaterial color="#081116" roughness={0.72} />
      </mesh>
      <mesh position={[width / 2, height / 2, 0]} receiveShadow>
        <boxGeometry args={[0.18, height, depth]} />
        <meshStandardMaterial color="#081116" roughness={0.72} />
      </mesh>
      <mesh position={[0, height / 2, depth / 2]} receiveShadow>
        <boxGeometry args={[width, height, 0.18]} />
        <meshStandardMaterial color="#050b0f" roughness={0.82} />
      </mesh>

      <mesh
        position={[
          -width / 2 + leftBackWidth / 2,
          height / 2,
          -depth / 2,
        ]}
        receiveShadow
      >
        <boxGeometry args={[leftBackWidth, height, 0.18]} />
        <meshStandardMaterial color="#081116" roughness={0.72} />
      </mesh>
      <mesh
        position={[
          doorRightEdge + rightBackWidth / 2,
          height / 2,
          -depth / 2,
        ]}
        receiveShadow
      >
        <boxGeometry args={[rightBackWidth, height, 0.18]} />
        <meshStandardMaterial color="#081116" roughness={0.72} />
      </mesh>
      <mesh position={[-2.3, 3.3, -depth / 2]} receiveShadow>
        <boxGeometry args={[1.7, 0.6, 0.18]} />
        <meshStandardMaterial color="#081116" roughness={0.72} />
      </mesh>

      <mesh position={[0, height, 0]} receiveShadow>
        <boxGeometry args={[width, 0.12, depth]} />
        <meshStandardMaterial
          color="#061014"
          transparent
          opacity={0.84}
          roughness={0.7}
        />
      </mesh>

      <Bed />
      <Desk />
      <StoppedClock inspected={flags.openingClockInspected} />
      <TornPhoto inspected={flags.openingPhotoInspected} />
      <ExitDoor unlocked={flags.openingDoorUnlocked} />
      <SystemGlitches quality={quality} />
    </group>
  );
}
