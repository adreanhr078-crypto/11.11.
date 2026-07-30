import type { GameTone } from '../../ui/design-system';
import {
  GameProgress,
  HudPanel,
} from '../../ui/design-system';
import type {
  EchoStatusMetricKey,
  EchoStatusReadModel,
} from '../../application/ui/echoStatusReadModel';

export interface EchoStatusPanelProps {
  model: EchoStatusReadModel;
  className?: string;
}

const METRIC_TONES: Record<EchoStatusMetricKey, GameTone> = {
  humanity: 'progression',
  fear: 'danger',
  trust: 'memory',
  anger: 'danger',
  memoryStability: 'memory',
  corruption: 'rare',
};

export function EchoStatusPanel({
  model,
  className,
}: EchoStatusPanelProps) {
  return (
    <HudPanel
      className={`echo-status-panel ${className ?? ''}`.trim()}
      tone="memory"
      eyebrow="ECHO STATUS"
      title={<span id="echo-status-panel-title">{model.copy.panelTitle}</span>}
      aria-labelledby="echo-status-panel-title"
      aria-describedby="echo-status-announcement"
      tabIndex={0}
    >
      <div className="echo-status-panel__stage">
        <small>{model.copy.stageHeading}</small>
        <strong>{model.stage.label}</strong>
        {model.stage.stageId && <code>{model.stage.stageId}</code>}
      </div>

      <div
        className="echo-status-panel__metrics"
        role="list"
        aria-label={model.copy.metricsLabel}
      >
        {model.metricItems.map((metric) => (
          <div key={metric.key} role="listitem">
            <GameProgress
              label={metric.label}
              value={metric.value}
              tone={METRIC_TONES[metric.key]}
              size="sm"
            />
          </div>
        ))}
      </div>

      <div
        className="echo-status-panel__knowledge"
        aria-label={model.copy.knowledgeLabel}
      >
        {[model.knowledge.player, model.knowledge.echo].map((knowledge) => (
          <section key={knowledge.label}>
            <span>
              <strong>{knowledge.label}</strong>
              <small>{knowledge.statusLabel}</small>
            </span>
            <b aria-label={`${knowledge.label}: ${knowledge.visibleCount}`}>
              {knowledge.visibleCount}
            </b>
          </section>
        ))}
      </div>

      <span
        id="echo-status-announcement"
        className="gds-sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {model.copy.announcement}
      </span>
    </HudPanel>
  );
}
