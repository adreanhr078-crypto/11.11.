import {
  DoorOpen,
  NotebookTabs,
  RotateCcw,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  useShellStore,
  useUiPreferencesStore,
} from '../../app/shell/shellStore';
import { useGameStore } from '../../stores/gameStore';
import { useAuthStore } from '../auth/authStore';
import { AWAKENING_WARD_INTERACTION_BY_ID } from './data/awakeningWardMap';
import {
  applyAwakeningWardProgress,
  interactionRequirementsMet,
  updateAwakeningWardRuntime,
  type WardProgressEvent,
} from './domain/awakeningWardState';
import type {
  AwakeningWardSaveState,
  WardInteractionId,
  WardPuzzleId,
} from './domain/awakeningWardTypes';
import { InventoryPanel } from './components/InventoryPanel';
import { MobileControls } from './components/MobileControls';
import { WardHud } from './components/WardHud';
import { CircuitRoutingPuzzle } from './puzzles/CircuitRoutingPuzzle';
import { MirrorObservationPuzzle } from './puzzles/MirrorObservationPuzzle';
import { MonitorTuningPuzzle } from './puzzles/MonitorTuningPuzzle';
import { SymbolKeypadPuzzle } from './puzzles/SymbolKeypadPuzzle';
import {
  createAwakeningWardGame,
  type AwakeningWardGameHandle,
} from './runtime/createAwakeningWardGame';
import {
  WardSceneBridge,
  type WardRuntimeMetrics,
} from './runtime/wardSceneBridge';
import './awakeningWard.css';

type InputMode = 'touch' | 'keyboard';
type InventoryView = 'inventory' | 'clues' | null;

function detectQuality(preference: 'high' | 'balanced' | 'mobile'):
  'low' | 'medium' {
  const device = navigator as Navigator & { deviceMemory?: number };
  const weakDevice = (device.deviceMemory ?? 4) <= 4
    || (navigator.hardwareConcurrency ?? 4) <= 4;
  return preference === 'mobile' || weakDevice ? 'low' : 'medium';
}

function checkpointForPosition(x: number): AwakeningWardSaveState['lastCheckpointId'] {
  if (x >= 28) return 'exit';
  if (x >= 20) return 'corridor';
  if (x >= 8) return 'power';
  return 'capsule';
}

function playFeedback(frequency = 220, duration = 0.09): void {
  try {
    const AudioContextConstructor = window.AudioContext;
    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.025, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + duration,
    );
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
    oscillator.addEventListener('ended', () => void context.close(), {
      once: true,
    });
  } catch {
    // Audio feedback is best-effort on mobile browsers.
  }
}

function haptic(pattern: number | number[] = 14): void {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

function blockedMessage(
  state: AwakeningWardSaveState,
  interactionId: WardInteractionId,
): string {
  if (interactionId === 'awakening_power_panel') {
    return 'لا توجد مرجعية زمنية. افحص الساعة أولًا.';
  }
  if (interactionId === 'awakening_monitor') {
    return 'الشاشة بلا طاقة.';
  }
  if (interactionId === 'awakening_mirror') {
    return 'لا توجد إشارة يمكن مقارنتها بالانعكاس.';
  }
  if (interactionId === 'awakening_hidden_drawer') {
    return 'لوحة الرموز مقفلة حتى يتم تسجيل دليل المرآة.';
  }
  if (interactionId === 'awakening_keycard') {
    return 'البطاقة ما زالت داخل الدرج المقفل.';
  }
  if (
    interactionId === 'awakening_exit_reader'
    && !state.inventory.some((entry) => entry.id === 'keycard_a07')
  ) {
    return 'ACCESS DENIED // بطاقة A-07 غير موجودة.';
  }
  return 'التفاعل غير متاح في الحالة الحالية.';
}

export default function AwakeningWardScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<AwakeningWardGameHandle | null>(null);
  const requestHandlerRef = useRef<(id: WardInteractionId) => void>(() => {});
  const stateRef = useRef(useGameStore.getState().awakeningWard);
  const qualityPreference = useUiPreferencesStore((state) => state.quality);
  const showTelemetryPreference = useUiPreferencesStore(
    (state) => state.showTelemetry,
  );
  const pauseOpen = useShellStore((state) => state.pauseOpen);
  const openPause = useShellStore((state) => state.openPause);
  const navigate = useShellStore((state) => state.navigate);
  const wardState = useGameStore((state) => state.awakeningWard);
  const authUser = useAuthStore((state) => state.user);
  const [runtimeQuality] = useState(() => detectQuality(qualityPreference));
  const [nearbyInteraction, setNearbyInteraction] = useState<
    WardInteractionId | null
  >(null);
  const [activePuzzle, setActivePuzzle] = useState<WardPuzzleId | null>(null);
  const [inventoryView, setInventoryView] = useState<InventoryView>(null);
  const [inputMode, setInputMode] = useState<InputMode>('touch');
  const [message, setMessage] = useState<string | null>(
    'CONNECTION RESTORED // A-01 SIGNAL ACQUIRED',
  );
  const [metrics, setMetrics] = useState<WardRuntimeMetrics | null>(null);
  const [completionOpen, setCompletionOpen] = useState(
    wardState.awakeningWardCompleted,
  );
  const overlayRef = useRef(false);
  const pauseRef = useRef(pauseOpen);

  const bridgeRef = useRef<WardSceneBridge | null>(null);
  if (!bridgeRef.current) {
    bridgeRef.current = new WardSceneBridge({
      onNearbyInteraction: setNearbyInteraction,
      onInteractionRequested: (id) => requestHandlerRef.current(id),
      onRuntimeSnapshot: ({ position, stamina }) => {
        useGameStore.setState((game) => ({
          awakeningWard: updateAwakeningWardRuntime(
            game.awakeningWard,
            {
              playerPosition: position,
              stamina,
              lastCheckpointId: checkpointForPosition(position.x),
            },
          ),
        }));
      },
      onMetrics: setMetrics,
      onKeyboardActivity: () => setInputMode('keyboard'),
    });
  }
  const bridge = bridgeRef.current;

  const commitProgress = useCallback((event: WardProgressEvent) => {
    let changed = false;
    useGameStore.setState((game) => {
      const next = applyAwakeningWardProgress(game.awakeningWard, event);
      changed = next !== game.awakeningWard;
      return changed ? { awakeningWard: next } : {};
    });
    return changed;
  }, []);

  const closePuzzle = useCallback(() => setActivePuzzle(null), []);

  const solvePuzzle = useCallback((event: WardProgressEvent) => {
    const changed = commitProgress(event);
    if (changed) {
      playFeedback(event === 'restore-power' ? 330 : 260, 0.14);
      haptic([18, 30, 24]);
    }
    setMessage(
      event === 'restore-power'
        ? 'POWER RESTORED // MONITOR ARRAY AVAILABLE'
        : event === 'activate-monitor'
          ? 'SIGNAL RECONSTRUCTED // REFLECTION REQUIRED'
          : event === 'record-mirror-clue'
            ? 'CLUE SAVED // SYMBOL ORDER RECORDED'
            : 'DRAWER RELEASED // CONTENT EXPOSED',
    );
    closePuzzle();
  }, [closePuzzle, commitProgress]);

  const handleInteraction = useCallback((interactionId: WardInteractionId) => {
    const current = stateRef.current;
    const interaction = AWAKENING_WARD_INTERACTION_BY_ID[interactionId];
    haptic();
    if (!interactionRequirementsMet(current, interaction)) {
      setMessage(blockedMessage(current, interactionId));
      playFeedback(105, 0.12);
      return;
    }

    if (interaction.puzzleId) {
      setActivePuzzle(interaction.puzzleId);
      playFeedback(190, 0.07);
      return;
    }

    if (interactionId === 'awakening_clock') {
      commitProgress('inspect-clock');
      setMessage('11:11 // CLOCK SIGNAL LOGGED');
      playFeedback(280, 0.1);
      return;
    }
    if (interactionId === 'awakening_keycard') {
      const changed = commitProgress('take-keycard');
      setMessage(changed
        ? 'KEYCARD A-07 ADDED TO INVENTORY'
        : 'الحقيبة ممتلئة. حرر خانة قبل أخذ البطاقة.');
      playFeedback(changed ? 410 : 110, 0.1);
      return;
    }
    if (interactionId === 'awakening_exit_reader') {
      const changed = commitProgress('unlock-exit');
      if (changed) {
        setMessage('ACCESS GRANTED // A-07 OPEN');
        setCompletionOpen(true);
        playFeedback(520, 0.2);
        haptic([24, 35, 24, 35, 40]);
      } else {
        setMessage(blockedMessage(current, interactionId));
      }
      return;
    }
    if (interactionId === 'awakening_medical_patch') {
      const changed = commitProgress('collect-medical-patch');
      setMessage(changed
        ? 'MEDICAL PATCH STORED'
        : 'الحقيبة ممتلئة.');
      return;
    }
    if (interactionId === 'awakening_battery') {
      const changed = commitProgress('collect-battery');
      setMessage(changed
        ? 'PROTOTYPE BATTERY STORED'
        : 'الحقيبة ممتلئة.');
    }
  }, [commitProgress]);

  requestHandlerRef.current = handleInteraction;
  stateRef.current = wardState;

  useEffect(() => {
    if (!containerRef.current) return;
    gameRef.current = createAwakeningWardGame(
      containerRef.current,
      bridge,
      stateRef.current,
      runtimeQuality,
    );
    queueMicrotask(() => {
      bridge.setLocked(overlayRef.current || pauseRef.current);
    });
    return () => {
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [bridge, runtimeQuality]);

  useEffect(() => {
    bridge.setProgress(wardState);
  }, [bridge, wardState]);

  const overlayOpen = activePuzzle !== null
    || inventoryView !== null
    || completionOpen;
  overlayRef.current = overlayOpen;
  pauseRef.current = pauseOpen;
  useEffect(() => {
    bridge.setLocked(overlayOpen || pauseOpen);
  }, [bridge, overlayOpen, pauseOpen]);

  useEffect(() => {
    const syncVisibility = () => {
      bridge.setPaused(document.hidden || pauseOpen);
    };
    document.addEventListener('visibilitychange', syncVisibility);
    syncVisibility();
    return () => document.removeEventListener('visibilitychange', syncVisibility);
  }, [bridge, pauseOpen]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const preventGesture = (event: Event) => event.preventDefault();
    root.addEventListener('touchmove', preventGesture, { passive: false });
    root.addEventListener('gesturestart', preventGesture);
    return () => {
      root.removeEventListener('touchmove', preventGesture);
      root.removeEventListener('gesturestart', preventGesture);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setMessage(null), 3400);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const requested = new URLSearchParams(window.location.search).get(
      'wardPuzzle',
    );
    const allowed: WardPuzzleId[] = [
      'ward_power_circuit',
      'ward_monitor_tuning',
      'ward_mirror_observation',
      'ward_drawer_keypad',
    ];
    if (allowed.includes(requested as WardPuzzleId)) {
      setActivePuzzle(requested as WardPuzzleId);
    }
  }, []);

  const playerName = authUser?.displayName
    || authUser?.email?.split('@')[0]
    || 'LOCAL SUBJECT';
  const nearbyDefinition = nearbyInteraction
    ? AWAKENING_WARD_INTERACTION_BY_ID[nearbyInteraction]
    : null;
  const controlsVisible = inputMode === 'touch' && !overlayOpen && !pauseOpen;
  const showTelemetry = showTelemetryPreference
    || new URLSearchParams(window.location.search).has('telemetry');

  return (
    <div
      ref={rootRef}
      className="awakening-ward"
      data-input-mode={inputMode}
      data-quality={metrics?.quality ?? runtimeQuality}
      dir="rtl"
      onPointerDown={(event) => {
        if (event.pointerType === 'touch') setInputMode('touch');
      }}
    >
      <div
        ref={containerRef}
        className="awakening-ward__canvas"
        aria-label="مشهد Awakening Ward ثنائي ونصف الأبعاد"
      />
      <div className="awakening-ward__scanlines" aria-hidden="true" />

      <WardHud
        state={wardState}
        playerName={playerName}
        metrics={metrics}
        showTelemetry={showTelemetry}
      />

      <button
        type="button"
        className="ward-clue-log-button"
        onClick={() => setInventoryView('clues')}
        aria-label="فتح سجل الأدلة"
        title="سجل الأدلة"
      >
        <NotebookTabs />
        <b>{wardState.collectedClues.length}</b>
      </button>

      {nearbyDefinition && !overlayOpen && !pauseOpen && (
        <button
          type="button"
          className="ward-interaction-prompt"
          data-available={interactionRequirementsMet(
            wardState,
            nearbyDefinition,
          )}
          onClick={() => handleInteraction(nearbyDefinition.id)}
        >
          <span>{inputMode === 'keyboard' ? 'E' : '11'}</span>
          <strong>{nearbyDefinition.prompt}</strong>
        </button>
      )}

      {message && (
        <output className="ward-system-message">{message}</output>
      )}

      <MobileControls
        visible={controlsVisible}
        interactionReady={nearbyDefinition !== null}
        onMove={(x, y) => bridge.setTouchMovement(x, y)}
        onRunChange={(running) => bridge.setTouchRunning(running)}
        onInteract={() => bridge.requestInteraction()}
        onInventory={() => setInventoryView('inventory')}
        onPause={openPause}
        onTouchActivity={() => setInputMode('touch')}
      />

      <div className="ward-portrait-warning">
        <RotateCcw />
        <strong>ROTATE DEVICE</strong>
      </div>

      {inventoryView && (
        <InventoryPanel
          key={inventoryView}
          state={wardState}
          initialTab={inventoryView}
          onUseMedicalPatch={() => {
            const changed = commitProgress('use-medical-patch');
            if (changed) {
              setMessage('MEDICAL PATCH APPLIED // HEALTH RESTORED');
              haptic([16, 24, 16]);
            }
          }}
          onClose={() => setInventoryView(null)}
        />
      )}

      {activePuzzle === 'ward_power_circuit' && (
        <CircuitRoutingPuzzle
          onSolved={() => solvePuzzle('restore-power')}
          onClose={closePuzzle}
        />
      )}
      {activePuzzle === 'ward_monitor_tuning' && (
        <MonitorTuningPuzzle
          onSolved={() => solvePuzzle('activate-monitor')}
          onClose={closePuzzle}
        />
      )}
      {activePuzzle === 'ward_mirror_observation' && (
        <MirrorObservationPuzzle
          onSolved={() => solvePuzzle('record-mirror-clue')}
          onClose={closePuzzle}
        />
      )}
      {activePuzzle === 'ward_drawer_keypad' && (
        <SymbolKeypadPuzzle
          onSolved={() => solvePuzzle('open-hidden-drawer')}
          onClose={closePuzzle}
        />
      )}

      {completionOpen && (
        <div className="ward-completion" role="dialog" aria-modal="true">
          <DoorOpen aria-hidden="true" />
          <small>AWAKENING WARD // COMPLETE</small>
          <h2>A-07 UNLOCKED</h2>
          <p>تم حفظ تقدم الجناح. المنطقة التالية غير متاحة في هذا النموذج.</p>
          <div>
            <button
              type="button"
              className="ward-command ward-command--primary"
              onClick={() => setCompletionOpen(false)}
            >
              متابعة الاستكشاف
            </button>
            <button
              type="button"
              className="ward-command"
              onClick={() => navigate('main-menu')}
            >
              العودة للقائمة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
