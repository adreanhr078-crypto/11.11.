import type { ReactNode } from 'react';
import type { GameTone } from './types';
import { cx } from './utils';
import { GameProgress } from './metrics';
import { GameButton } from './controls';
import {
  GameIcon,
  type GameIconId,
} from '../icons';

export interface GameNotification {
  id: string;
  title: ReactNode;
  message?: ReactNode;
  icon?: ReactNode;
  iconId?: GameIconId;
  tone?: GameTone;
  timestamp?: ReactNode;
  actionLabel?: ReactNode;
}

export interface NotificationStackProps {
  notifications: readonly GameNotification[];
  onDismiss?: (id: string) => void;
  onAction?: (id: string) => void;
  dismissLabel?: string;
  className?: string;
}

export function NotificationStack({
  notifications,
  onDismiss,
  onAction,
  dismissLabel = 'إخفاء الإشعار',
  className,
}: NotificationStackProps) {
  return (
    <section
      className={cx('gds-notification-stack', className)}
      aria-label="الإشعارات"
      aria-live="polite"
    >
      {notifications.map((notification) => (
        <article
          key={notification.id}
          className="gds-notification"
          data-tone={notification.tone ?? 'neutral'}
        >
          {(notification.iconId || notification.icon) && (
            <span className="gds-notification__icon" aria-hidden="true">
              {notification.iconId
                ? <GameIcon id={notification.iconId} />
                : notification.icon}
            </span>
          )}
          <span className="gds-notification__copy">
            <strong>{notification.title}</strong>
            {notification.message && <span>{notification.message}</span>}
            {notification.timestamp && <small>{notification.timestamp}</small>}
          </span>
          {notification.actionLabel && onAction && (
            <GameButton
              variant="ghost"
              size="sm"
              onClick={() => onAction(notification.id)}
            >
              {notification.actionLabel}
            </GameButton>
          )}
          {onDismiss && (
            <button
              type="button"
              className="gds-notification__dismiss"
              onClick={() => onDismiss(notification.id)}
              aria-label={dismissLabel}
            >
              <GameIcon id="utility-close" />
            </button>
          )}
        </article>
      ))}
    </section>
  );
}

export interface GameLoadingScreenProps {
  title?: ReactNode;
  message?: ReactNode;
  progress?: number;
  status?: ReactNode;
  fullscreen?: boolean;
  className?: string;
}

export function GameLoadingScreen({
  title = '11:11',
  message = 'استعادة صدى الذاكرة',
  progress,
  status,
  fullscreen = true,
  className,
}: GameLoadingScreenProps) {
  const hasProgress = progress !== undefined;
  return (
    <section
      className={cx(
        'gds-loading',
        fullscreen && 'gds-loading--fullscreen',
        className,
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="gds-loading__core" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="gds-loading__copy">
        <strong>{title}</strong>
        <span>{message}</span>
      </div>
      {hasProgress ? (
        <GameProgress
          value={progress}
          tone="danger"
          valueLabel={status}
          className="gds-loading__progress"
        />
      ) : (
        <span className="gds-loading__indeterminate" aria-hidden="true" />
      )}
    </section>
  );
}
