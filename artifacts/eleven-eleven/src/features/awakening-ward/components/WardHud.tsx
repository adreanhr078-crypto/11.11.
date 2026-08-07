import {
  Activity,
  Radio,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type {
  AwakeningWardSaveState,
} from '../domain/awakeningWardTypes';
import type {
  WardRuntimeMetrics,
} from '../runtime/wardSceneBridge';

function currentObjective(state: AwakeningWardSaveState): string {
  const flags = state.puzzleFlags;
  if (!flags.clock_1111_inspected) return 'افحص الساعة المتوقفة عند 11:11';
  if (!flags.power_restored) return 'أعد توجيه الطاقة إلى أقسام الجناح';
  if (!flags.monitor_activated) return 'فعّل محطة المراقبة';
  if (!flags.mirror_clue_discovered) return 'تتبّع دليل الانعكاس';
  if (!flags.hidden_drawer_opened) return 'افتح الدرج المخفي';
  if (!state.inventory.some((entry) => entry.id === 'keycard_a07')) {
    return 'خذ بطاقة الوصول A-07';
  }
  if (!flags.awakening_exit_unlocked) return 'استخدم البطاقة عند باب A-07';
  return 'تم تأمين مخرج Awakening Ward';
}

interface WardHudProps {
  state: AwakeningWardSaveState;
  playerName: string;
  metrics: WardRuntimeMetrics | null;
  showTelemetry: boolean;
}

export function WardHud({
  state,
  playerName,
  metrics,
  showTelemetry,
}: WardHudProps) {
  const powerOn = state.puzzleFlags.power_restored;
  const progress = [
    state.puzzleFlags.clock_1111_inspected,
    state.puzzleFlags.power_restored,
    state.puzzleFlags.monitor_activated,
    state.puzzleFlags.mirror_clue_discovered,
    state.puzzleFlags.hidden_drawer_opened,
    state.inventory.some((entry) => entry.id === 'keycard_a07'),
    state.puzzleFlags.awakening_exit_unlocked,
  ];
  const completedSteps = progress.filter(Boolean).length;
  return (
    <div className="ward-hud" aria-live="polite">
      <section className="ward-hud__identity">
        <span className="ward-hud__zone">AWAKENING WARD // A-01</span>
        <strong>SUBJECT: {playerName}</strong>
        <small>
          <Radio aria-hidden="true" />
          CONNECTION RESTORED
        </small>
      </section>

      <section className="ward-hud__objective">
        <small>ACTIVE OBJECTIVE</small>
        <strong>{currentObjective(state)}</strong>
        <span data-power={powerOn}>
          <Zap aria-hidden="true" />
          {powerOn ? 'POWER ONLINE' : 'EMERGENCY POWER'}
        </span>
        <div
          className="ward-hud__progress"
          aria-label={`Ward progress ${completedSteps} of ${progress.length}`}
        >
          {progress.map((complete, index) => (
            <i
              key={index}
              data-complete={complete}
              data-current={index === completedSteps && completedSteps < progress.length}
            />
          ))}
        </div>
      </section>

      <section className="ward-hud__vitals">
        <label>
          <span><ShieldCheck aria-hidden="true" /> HP</span>
          <i><b style={{ width: `${state.health}%` }} /></i>
          <strong>{state.health}</strong>
        </label>
        <label>
          <span><Activity aria-hidden="true" /> STM</span>
          <i><b style={{ width: `${state.stamina}%` }} /></i>
          <strong>{state.stamina}</strong>
        </label>
      </section>

      {showTelemetry && metrics && (
        <output className="ward-hud__telemetry">
          {metrics.fps} FPS · {metrics.quality.toUpperCase()} · {metrics.loadTimeMs} MS
        </output>
      )}
    </div>
  );
}
