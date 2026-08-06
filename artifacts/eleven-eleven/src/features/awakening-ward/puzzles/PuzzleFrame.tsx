import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface PuzzleFrameProps {
  code: string;
  title: string;
  status: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

export function PuzzleFrame({
  code,
  title,
  status,
  children,
  footer,
  onClose,
}: PuzzleFrameProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="ward-puzzle-backdrop" role="presentation">
      <section
        className="ward-puzzle-frame"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ward-puzzle-title"
      >
        <header className="ward-puzzle-frame__header">
          <span className="ward-puzzle-frame__code">{code}</span>
          <div>
            <small>{status}</small>
            <h2 id="ward-puzzle-title">{title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="ward-icon-button"
            onClick={onClose}
            aria-label="إغلاق واجهة اللغز"
            title="إغلاق"
          >
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="ward-puzzle-frame__body">{children}</div>
        {footer && (
          <footer className="ward-puzzle-frame__footer">{footer}</footer>
        )}
      </section>
    </div>
  );
}
