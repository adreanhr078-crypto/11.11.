import type { CSSProperties, ReactNode } from 'react';
import type { GameTone } from './types';
import { clampPercentage, cx, formatPercentage } from './utils';

interface ProgressStyle extends CSSProperties {
  '--gds-progress-value': string;
}

export interface GameProgressProps {
  value: number;
  label?: ReactNode;
  valueLabel?: ReactNode;
  tone?: GameTone;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export function GameProgress({
  value,
  label,
  valueLabel,
  tone = 'memory',
  size = 'md',
  showValue = true,
  className,
}: GameProgressProps) {
  const normalized = clampPercentage(value);
  const displayValue = valueLabel ?? formatPercentage(normalized);
  const style: ProgressStyle = {
    '--gds-progress-value': `${normalized}%`,
  };

  return (
    <div
      className={cx('gds-progress', className)}
      data-tone={tone}
      data-size={size}
    >
      {(label || showValue) && (
        <span className="gds-progress__meta">
          <span>{label}</span>
          {showValue && <strong>{displayValue}</strong>}
        </span>
      )}
      <span
        className="gds-progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalized}
        aria-label={typeof label === 'string' ? label : undefined}
      >
        <span className="gds-progress__fill" style={style}>
          <span className="gds-progress__flare" aria-hidden="true" />
        </span>
      </span>
    </div>
  );
}

export interface StatMeterProps {
  label: ReactNode;
  value: number;
  tone?: GameTone;
  icon?: ReactNode;
  delta?: number;
  compact?: boolean;
  className?: string;
}

export function StatMeter({
  label,
  value,
  tone = 'neutral',
  icon,
  delta,
  compact = false,
  className,
}: StatMeterProps) {
  const normalized = clampPercentage(value);

  return (
    <div
      className={cx('gds-stat-meter', className)}
      data-tone={tone}
      data-compact={compact}
    >
      <span className="gds-stat-meter__label">
        {icon && <span aria-hidden="true">{icon}</span>}
        <span>{label}</span>
      </span>
      <GameProgress
        value={normalized}
        tone={tone}
        size={compact ? 'sm' : 'md'}
        showValue={false}
      />
      <strong className="gds-stat-meter__value">
        {formatPercentage(normalized)}
        {delta !== undefined && delta !== 0 && (
          <small data-direction={delta > 0 ? 'up' : 'down'}>
            {delta > 0 ? '+' : ''}{delta}
          </small>
        )}
      </strong>
    </div>
  );
}

