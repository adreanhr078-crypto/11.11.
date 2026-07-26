import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent,
} from 'react';
import type { EchoPresentationForm } from '../../application/ui/echoPresentationReadModel';
import { cx } from '../design-system';
import { ECHO_PRESENTATION_ASSETS } from './visualAssets';
import './echo-interactive-stage.css';

interface InteractiveStageStyle extends CSSProperties {
  '--echo-look-x': string;
  '--echo-look-y': string;
}

export interface EchoInteractiveStageProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  form: EchoPresentationForm;
  label?: string;
  eager?: boolean;
}

export function EchoInteractiveStage({
  form,
  label = 'Echo',
  eager = false,
  className,
  ...props
}: EchoInteractiveStageProps) {
  const rootRef = useRef<HTMLElement>(null);
  const reactionTimerRef = useRef<number | null>(null);
  const [isReacting, setIsReacting] = useState(false);
  const source = form === 'corrupted'
    ? ECHO_PRESENTATION_ASSETS.fullBodyCorrupted
    : ECHO_PRESENTATION_ASSETS.fullBodyNormal;

  useEffect(() => () => {
    if (reactionTimerRef.current !== null) {
      window.clearTimeout(reactionTimerRef.current);
    }
  }, []);

  const setLookPosition = (x: number, y: number) => {
    const root = rootRef.current;
    if (!root) return;
    root.style.setProperty('--echo-look-x', x.toFixed(3));
    root.style.setProperty('--echo-look-y', y.toFixed(3));
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch' && event.buttons === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    setLookPosition(
      Math.max(-1, Math.min(1, x)),
      Math.max(-1, Math.min(1, y)),
    );
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    handlePointerMove(event);
    setIsReacting(true);
    if (reactionTimerRef.current !== null) {
      window.clearTimeout(reactionTimerRef.current);
    }
    reactionTimerRef.current = window.setTimeout(() => {
      setIsReacting(false);
    }, 780);
  };

  const style: InteractiveStageStyle = {
    '--echo-look-x': '0',
    '--echo-look-y': '0',
  };

  return (
    <figure
      ref={rootRef}
      className={cx('echo-interactive-stage', className)}
      data-form={form}
      data-reacting={isReacting ? 'true' : 'false'}
      style={style}
      aria-label={`${label} — ${form}`}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerLeave={() => setLookPosition(0, 0)}
      {...props}
    >
      <div className="echo-interactive-stage__depth" aria-hidden="true">
        <span className="echo-interactive-stage__halo" />
        <span className="echo-interactive-stage__orbit echo-interactive-stage__orbit--outer" />
        <span className="echo-interactive-stage__orbit echo-interactive-stage__orbit--inner" />
        <span className="echo-interactive-stage__floor" />
      </div>

      <div className="echo-interactive-stage__character">
        <img
          className="echo-interactive-stage__shadow"
          src={source}
          alt=""
          draggable={false}
          decoding="async"
          loading={eager ? 'eager' : 'lazy'}
          aria-hidden="true"
        />
        <img
          className="echo-interactive-stage__image"
          src={source}
          alt=""
          draggable={false}
          decoding="async"
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
        />
        <img
          className="echo-interactive-stage__signal"
          src={source}
          alt=""
          draggable={false}
          decoding="async"
          loading="lazy"
          aria-hidden="true"
        />
      </div>

      <div className="echo-interactive-stage__interaction" aria-hidden="true">
        <span />
        <i />
      </div>
    </figure>
  );
}
