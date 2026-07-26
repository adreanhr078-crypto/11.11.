import type { PointerEvent } from 'react';
import { GameButton } from '../../../ui/design-system';
import type {
  MovementDirection,
} from '../hooks/usePlayerControls';
import { InteractionPrompt } from './InteractionPrompt';

interface GameplayHUDProps {
  prompt: string | null;
  objective: string;
  puzzleProgress: string;
  showTutorial: boolean;
  onDismissTutorial: () => void;
  onInteract: () => void;
  onPause: () => void;
  setTouchDirection: (
    direction: MovementDirection,
    active: boolean,
  ) => void;
}

const DIRECTION_LABELS: Record<MovementDirection, string> = {
  forward: 'تحرك إلى الأمام',
  backward: 'تحرك إلى الخلف',
  left: 'تحرك إلى اليسار',
  right: 'تحرك إلى اليمين',
};

function directionGlyph(direction: MovementDirection): string {
  switch (direction) {
    case 'forward': return '▲';
    case 'backward': return '▼';
    case 'left': return '◀';
    case 'right': return '▶';
  }
}

export function GameplayHUD({
  prompt,
  objective,
  puzzleProgress,
  showTutorial,
  onDismissTutorial,
  onInteract,
  onPause,
  setTouchDirection,
}: GameplayHUDProps) {
  const bindDirection = (direction: MovementDirection) => ({
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setTouchDirection(direction, true);
    },
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => {
      setTouchDirection(direction, false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    onPointerCancel: () => setTouchDirection(direction, false),
    onPointerLeave: () => setTouchDirection(direction, false),
  });

  return (
    <div className="gameplay-hud">
      <aside className="gameplay-hud__status" aria-live="polite">
        <small>OPENING ROOM // 11:11</small>
        <strong>{objective}</strong>
        <span>{puzzleProgress}</span>
      </aside>

      <button
        type="button"
        className="gameplay-hud__pause"
        onClick={onPause}
        aria-label="إيقاف اللعبة"
      >
        <span aria-hidden="true">Ⅱ</span>
        إيقاف
      </button>

      <InteractionPrompt
        prompt={prompt}
        onInteract={onInteract}
      />

      <div
        className="gameplay-touch-controls"
        aria-label="عناصر تحكم اللمس"
      >
        <div className="gameplay-touch-controls__dpad">
          {(
            ['forward', 'left', 'right', 'backward'] as const
          ).map((direction) => (
            <button
              key={direction}
              type="button"
              data-direction={direction}
              aria-label={DIRECTION_LABELS[direction]}
              {...bindDirection(direction)}
            >
              {directionGlyph(direction)}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="gameplay-touch-controls__interact"
          onClick={onInteract}
          disabled={!prompt}
        >
          تفاعل
        </button>
      </div>

      {showTutorial && (
        <section
          className="gameplay-controls-guide"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gameplay-controls-title"
        >
          <small>CONTROL LINK // FIRST ENTRY</small>
          <h2 id="gameplay-controls-title">تحكم بـEcho</h2>
          <p>
            تحرّك بـWASD أو الأسهم، اسحب بالفأرة لتوجيه الكاميرا،
            اضغط Shift للجري وE للفحص. يفتح Escape قائمة الإيقاف.
          </p>
          <p className="gameplay-controls-guide__touch">
            على الهاتف استخدم أزرار الاتجاهات وزر «تفاعل».
          </p>
          <GameButton onClick={onDismissTutorial} autoFocus>
            ابدأ الاستكشاف
          </GameButton>
        </section>
      )}
    </div>
  );
}
