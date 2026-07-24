import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from 'react';
import type { GameTone } from './types';
import { cx } from './utils';

interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: GameTone;
  eyebrow?: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
  interactive?: boolean;
}

function PanelHeader({
  eyebrow,
  title,
  actions,
}: Pick<PanelProps, 'eyebrow' | 'title' | 'actions'>) {
  if (!eyebrow && !title && !actions) return null;

  return (
    <header className="gds-panel__header">
      <span className="gds-panel__heading">
        {eyebrow && <small>{eyebrow}</small>}
        {title && <strong>{title}</strong>}
      </span>
      {actions && <span className="gds-panel__actions">{actions}</span>}
    </header>
  );
}

export function HudPanel({
  tone = 'neutral',
  eyebrow,
  title,
  actions,
  interactive = false,
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <section
      className={cx('gds-panel', 'gds-panel--hud', className)}
      data-tone={tone}
      data-interactive={interactive}
      {...props}
    >
      <span className="gds-panel__corner" aria-hidden="true" />
      <PanelHeader eyebrow={eyebrow} title={title} actions={actions} />
      <div className="gds-panel__body">{children}</div>
    </section>
  );
}

export function GlassPanel({
  tone = 'neutral',
  eyebrow,
  title,
  actions,
  interactive = false,
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <section
      className={cx('gds-panel', 'gds-panel--glass', className)}
      data-tone={tone}
      data-interactive={interactive}
      {...props}
    >
      <PanelHeader eyebrow={eyebrow} title={title} actions={actions} />
      <div className="gds-panel__body">{children}</div>
    </section>
  );
}

export interface GameCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  tone?: GameTone;
  selected?: boolean;
  locked?: boolean;
  media?: ReactNode;
  overline?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
}

export function GameCard({
  tone = 'neutral',
  selected = false,
  locked = false,
  media,
  overline,
  title,
  description,
  footer,
  className,
  children,
  ...props
}: GameCardProps) {
  return (
    <article
      className={cx('gds-card', className)}
      data-tone={tone}
      data-selected={selected}
      data-locked={locked}
      {...props}
    >
      {media && <div className="gds-card__media">{media}</div>}
      <div className="gds-card__content">
        {overline && <small className="gds-card__overline">{overline}</small>}
        {title && <strong className="gds-card__title">{title}</strong>}
        {description && (
          <p className="gds-card__description">{description}</p>
        )}
        {children}
      </div>
      {footer && <footer className="gds-card__footer">{footer}</footer>}
      {locked && <span className="gds-card__lock" aria-hidden="true">◇</span>}
    </article>
  );
}

export interface CinematicFrameProps extends HTMLAttributes<HTMLElement> {
  backgroundSrc?: string;
  backgroundAlt?: string;
  focalPoint?: string;
  overlay?: 'none' | 'soft' | 'strong';
  safeContent?: boolean;
  hud?: ReactNode;
}

export function CinematicFrame({
  backgroundSrc,
  backgroundAlt = '',
  focalPoint = '50% 50%',
  overlay = 'soft',
  safeContent = true,
  hud,
  className,
  children,
  style,
  ...props
}: CinematicFrameProps) {
  const frameStyle = {
    ...style,
    '--gds-frame-focal-point': focalPoint,
  } as CSSProperties;

  return (
    <section
      className={cx('gds-cinematic-frame', className)}
      data-overlay={overlay}
      style={frameStyle}
      {...props}
    >
      {backgroundSrc && (
        <img
          className="gds-cinematic-frame__media"
          src={backgroundSrc}
          alt={backgroundAlt}
          draggable={false}
        />
      )}
      <span className="gds-cinematic-frame__wash" aria-hidden="true" />
      <div
        className={cx(
          'gds-cinematic-frame__content',
          safeContent && 'gds-safe-area',
        )}
      >
        {children}
      </div>
      {hud && <div className="gds-cinematic-frame__hud">{hud}</div>}
    </section>
  );
}
