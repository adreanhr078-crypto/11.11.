import {
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import type { GameTone } from './types';
import { cx } from './utils';
import { GameButton } from './controls';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function useAccessibleOverlay(
  open: boolean,
  onClose: () => void,
) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const frame = window.requestAnimationFrame(() => {
      const focusable = containerRef.current?.querySelector<HTMLElement>(
        FOCUSABLE_SELECTOR,
      );
      focusable?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !containerRef.current) return;

      const focusable = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, open]);

  return containerRef;
}

export interface GameModalProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  tone?: GameTone;
  closeLabel?: string;
}

export function GameModal({
  open,
  onClose,
  title,
  eyebrow,
  description,
  footer,
  tone = 'neutral',
  closeLabel = 'إغلاق',
  className,
  children,
  ...props
}: GameModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const containerRef = useAccessibleOverlay(open, onClose);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="gds-overlay"
      data-tone={tone}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        className={cx('gds-modal', className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        {...props}
      >
        <header className="gds-modal__header">
          <span>
            {eyebrow && <small>{eyebrow}</small>}
            <strong id={titleId}>{title}</strong>
          </span>
          <GameButton
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={closeLabel}
          >
            ×
          </GameButton>
        </header>
        {description && (
          <p id={descriptionId} className="gds-modal__description">
            {description}
          </p>
        )}
        <div className="gds-modal__body">{children}</div>
        {footer && <footer className="gds-modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export interface GameDrawerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  side?: 'start' | 'end' | 'bottom';
  tone?: GameTone;
  closeLabel?: string;
}

export function GameDrawer({
  open,
  onClose,
  title,
  side = 'end',
  tone = 'neutral',
  closeLabel = 'إغلاق',
  className,
  children,
  ...props
}: GameDrawerProps) {
  const titleId = useId();
  const containerRef = useAccessibleOverlay(open, onClose);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="gds-overlay"
      data-tone={tone}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        ref={containerRef}
        className={cx('gds-drawer', className)}
        data-side={side}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        {...props}
      >
        <header className="gds-drawer__header">
          <strong id={titleId}>{title}</strong>
          <GameButton
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={closeLabel}
          >
            ×
          </GameButton>
        </header>
        <div className="gds-drawer__body">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}

