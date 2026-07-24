import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import type { GameTone } from './types';
import { cx } from './utils';

export type GameButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'memory'
  | 'rare'
  | 'progression';

export interface GameButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GameButtonVariant;
  size?: 'sm' | 'md' | 'lg' | 'icon';
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
}

export const GameButton = forwardRef<HTMLButtonElement, GameButtonProps>(
  function GameButton({
    variant = 'primary',
    size = 'md',
    leadingIcon,
    trailingIcon,
    loading = false,
    loadingLabel = 'جارٍ التنفيذ',
    fullWidth = false,
    className,
    disabled,
    children,
    type = 'button',
    ...props
  }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cx(
          'gds-button',
          fullWidth && 'gds-button--full',
          className,
        )}
        data-variant={variant}
        data-size={size}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="gds-button__spinner" aria-hidden="true" />
        ) : leadingIcon ? (
          <span className="gds-button__icon" aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        {size === 'icon' && !loading ? (
          <span className="gds-button__icon" aria-hidden="true">
            {children}
          </span>
        ) : (
          <span className="gds-button__label">
            {loading ? loadingLabel : children}
          </span>
        )}
        {!loading && trailingIcon && (
          <span className="gds-button__icon" aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </button>
    );
  },
);

export interface ChoiceCardProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  index?: string | number;
  title: ReactNode;
  description?: ReactNode;
  consequence?: ReactNode;
  icon?: ReactNode;
  tone?: GameTone;
  selected?: boolean;
  locked?: boolean;
}

export const ChoiceCard = forwardRef<HTMLButtonElement, ChoiceCardProps>(
  function ChoiceCard({
    index,
    title,
    description,
    consequence,
    icon,
    tone = 'neutral',
    selected = false,
    locked = false,
    disabled,
    className,
    ...props
  }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cx('gds-choice-card', className)}
        data-tone={tone}
        data-selected={selected}
        data-locked={locked}
        aria-pressed={selected}
        disabled={disabled || locked}
        {...props}
      >
        {(index !== undefined || icon) && (
          <span className="gds-choice-card__marker" aria-hidden="true">
            {icon ?? index}
          </span>
        )}
        <span className="gds-choice-card__copy">
          <strong>{title}</strong>
          {description && <span>{description}</span>}
          {consequence && (
            <small className="gds-choice-card__consequence">
              {consequence}
            </small>
          )}
        </span>
        <span className="gds-choice-card__edge" aria-hidden="true" />
      </button>
    );
  },
);

export interface GameTooltipProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}

export function GameTooltip({
  label,
  children,
  className,
}: GameTooltipProps) {
  return (
    <span className={cx('gds-tooltip', className)}>
      {children}
      <span className="gds-tooltip__content" role="tooltip">
        {label}
      </span>
    </span>
  );
}
