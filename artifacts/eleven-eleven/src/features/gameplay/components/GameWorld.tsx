import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas } from '@react-three/fiber';
import type { Group } from 'three';
import type { QualityTier } from '../../../ui/design-system';
import { OPENING_ROOM_CONFIG } from '../data/openingRoom.config';
import {
  OPENING_ROOM_INTERACTIONS,
} from '../data/openingRoom.interactions';
import { useGameplayAudio } from '../audio/useGameplayAudio';
import { useOpeningRoomProgress } from '../hooks/useOpeningRoomProgress';
import { usePlayerControls } from '../hooks/usePlayerControls';
import { EchoPlayer } from './EchoPlayer';
import { GameplayHUD } from './GameplayHUD';
import {
  NarrativeOverlay,
  type NarrativeOverlayContent,
} from './NarrativeOverlay';
import { OpeningRoom } from './OpeningRoom';
import {
  ThirdPersonCamera,
  type ThirdPersonCameraConfig,
} from './ThirdPersonCamera';

interface GameWorldProps {
  paused: boolean;
  quality: QualityTier;
  onPause: () => void;
}

const PUZZLE_STAGE_COPY = {
  locked: {
    objective: 'افحص الغرفة وابحث عن أثر عند 11:11',
    progress: 'الإشارة غير مكتملة',
  },
  clueFound: {
    objective: 'هناك أثر ثانٍ ما زال مخفيًا في الغرفة',
    progress: 'تم العثور على أول خيط',
  },
  memoryRecovered: {
    objective: 'دع الذاكرة تستقر',
    progress: 'شظية ذاكرة قيد الاستعادة',
  },
  solved: {
    objective: 'عد إلى باب الخروج',
    progress: 'اكتملت الإشارة · القفل ينتظر',
  },
  exitUnlocked: {
    objective: 'الباب مفتوح',
    progress: 'اكتملت الغرفة الافتتاحية',
  },
} as const;

function narrationForExecution(
  interactionId: string,
  outcome: string,
  message: string,
  memoryGranted: boolean,
): NarrativeOverlayContent {
  if (interactionId === 'opening-clock') {
    return {
      eyebrow: 'OBJECT // SYNCH POINT',
      title: 'الساعة المتوقفة',
      body: message,
      memoryFragment: memoryGranted
        ? 'لا أتذكر الوجه… فقط أنني لم أكن وحدي.'
        : undefined,
    };
  }
  if (interactionId === 'opening-photo') {
    return {
      eyebrow: memoryGranted
        ? 'MEMORY LINK // PARTIAL'
        : 'OBJECT // TORN RECORD',
      title: 'الصورة الممزقة',
      body: message,
      memoryFragment: memoryGranted
        ? 'لا أتذكر الوجه… فقط أنني لم أكن وحدي.'
        : undefined,
    };
  }
  if (outcome === 'locked') {
    return {
      eyebrow: 'EXIT // LOCKED',
      title: 'الباب لا يستجيب',
      body: message,
    };
  }
  return {
    eyebrow: 'EXIT // CHANNEL OPEN',
    title: 'استجاب القفل',
    body: message,
  };
}

export function GameWorld({
  paused,
  quality,
  onPause,
}: GameWorldProps) {
  const playerRef = useRef<Group | null>(null);
  const cameraYawRef = useRef(0);
  const [canvasReady, setCanvasReady] = useState(false);
  const [nearestInteractionId, setNearestInteractionId] = useState<
    string | null
  >(null);
  const [narrative, setNarrative] = useState<
    NarrativeOverlayContent | null
  >(null);
  const {
    flags,
    puzzle,
    enterRoom,
    executeInteraction,
    markControlsSeen,
    controlsSeen,
  } = useOpeningRoomProgress();
  const { playCue } = useGameplayAudio();
  const showTutorial = !controlsSeen;

  useEffect(() => {
    enterRoom();
    playCue('ambient', { loop: true, volume: 0.28 });
  }, [enterRoom, playCue]);

  const handleInteract = useCallback(() => {
    if (
      paused
      || showTutorial
      || narrative
      || !nearestInteractionId
    ) {
      return;
    }
    const execution = executeInteraction(nearestInteractionId);
    if (!execution) return;

    if (execution.interaction.id === 'opening-clock') {
      playCue('clock', { volume: 0.45 });
    } else if (execution.interaction.id === 'opening-door') {
      playCue('door', { volume: 0.5 });
    }
    if (execution.memoryGranted) {
      playCue('memoryGlitch', { volume: 0.5 });
    }

    setNarrative(narrationForExecution(
      execution.interaction.id,
      execution.result.outcome,
      execution.result.message,
      execution.memoryGranted,
    ));
  }, [
    executeInteraction,
    narrative,
    nearestInteractionId,
    paused,
    playCue,
    showTutorial,
  ]);

  const controls = usePlayerControls({
    enabled: !paused && !showTutorial && narrative === null,
    pauseEnabled: !paused,
    onInteract: handleInteract,
    onPause,
  });

  const interactionPrompt = useMemo(() => {
    const interaction = OPENING_ROOM_INTERACTIONS.find(
      ({ id }) => id === nearestInteractionId,
    );
    return interaction?.prompt.replace(/^E\s*—\s*/, '') ?? null;
  }, [nearestInteractionId]);

  const cameraConfig = useMemo<ThirdPersonCameraConfig>(() => {
    const padding = OPENING_ROOM_CONFIG.camera.collisionPadding;
    return {
      distance: OPENING_ROOM_CONFIG.camera.positionOffset.z,
      height: OPENING_ROOM_CONFIG.camera.positionOffset.y,
      lookHeight: OPENING_ROOM_CONFIG.camera.targetOffset.y,
      followSmoothing: OPENING_ROOM_CONFIG.camera.followSharpness,
      pointerSensitivity: 0.003,
      minPitch: -0.18,
      maxPitch: 0.28,
      bounds: {
        minX: OPENING_ROOM_CONFIG.bounds.min.x + padding,
        maxX: OPENING_ROOM_CONFIG.bounds.max.x - padding,
        minZ: OPENING_ROOM_CONFIG.bounds.min.z + padding,
        maxZ: OPENING_ROOM_CONFIG.bounds.max.z - padding,
        minY: 0.9,
        maxY: OPENING_ROOM_CONFIG.dimensions.height - 0.18,
      },
    };
  }, []);

  const stageCopy = PUZZLE_STAGE_COPY[puzzle.stage];
  const inputEnabled = !paused && !showTutorial && narrative === null;
  const dpr: [number, number] = quality === 'high'
    ? [1, 2]
    : quality === 'mobile'
      ? [0.75, 1]
      : [1, 1.5];

  return (
    <div
      className="gameplay-screen"
      data-canvas-ready={canvasReady}
      data-puzzle-stage={puzzle.stage}
    >
      {!canvasReady && (
        <div className="gameplay-loading" role="status">
          <span>CONNECTING TO OPENING ROOM</span>
          <i />
          <small>11:11</small>
        </div>
      )}

      <Canvas
        className="gameplay-canvas"
        shadows={quality !== 'mobile'}
        dpr={dpr}
        camera={{
          fov: 54,
          near: 0.08,
          far: 42,
          position: [0, 2.9, 3.1],
        }}
        gl={{
          antialias: quality !== 'mobile',
          powerPreference: 'high-performance',
        }}
        onCreated={() => setCanvasReady(true)}
        aria-label="الغرفة الافتتاحية ثلاثية الأبعاد"
      >
        <color attach="background" args={['#010407']} />
        <fog
          attach="fog"
          args={[
            '#01070a',
            quality === 'mobile' ? 6.5 : 5.4,
            quality === 'mobile' ? 14 : 12,
          ]}
        />
        <Suspense fallback={null}>
          <OpeningRoom flags={flags} quality={quality} />
          <EchoPlayer
            playerRef={playerRef}
            inputRef={controls.inputRef}
            cameraYawRef={cameraYawRef}
            flags={flags}
            enabled={inputEnabled}
            onNearestInteractionChange={setNearestInteractionId}
            onFootstep={() => playCue('footstep', { volume: 0.18 })}
          />
          <ThirdPersonCamera
            targetRef={playerRef}
            yawRef={cameraYawRef}
            enabled={inputEnabled}
            config={cameraConfig}
          />
        </Suspense>
      </Canvas>

      <GameplayHUD
        prompt={inputEnabled ? interactionPrompt : null}
        objective={stageCopy.objective}
        puzzleProgress={stageCopy.progress}
        showTutorial={showTutorial}
        onDismissTutorial={markControlsSeen}
        onInteract={handleInteract}
        onPause={onPause}
        setTouchDirection={controls.setTouchDirection}
      />

      <NarrativeOverlay
        content={narrative}
        onClose={() => setNarrative(null)}
      />
    </div>
  );
}
