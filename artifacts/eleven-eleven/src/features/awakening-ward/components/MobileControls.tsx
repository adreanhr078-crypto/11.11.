import {
  Backpack,
  Hand,
  Pause,
  PersonStanding,
} from 'lucide-react';
import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

interface MobileControlsProps {
  visible: boolean;
  interactionReady: boolean;
  onMove: (x: number, y: number) => void;
  onRunChange: (running: boolean) => void;
  onInteract: () => void;
  onInventory: () => void;
  onPause: () => void;
  onTouchActivity: () => void;
}

export function MobileControls({
  visible,
  interactionReady,
  onMove,
  onRunChange,
  onInteract,
  onInventory,
  onPause,
  onTouchActivity,
}: MobileControlsProps) {
  const joystickPointer = useRef<number | null>(null);
  const [stick, setStick] = useState({ x: 0, y: 0 });

  const updateJoystick = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    if (joystickPointer.current !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const radius = rect.width / 2;
    const rawX = (event.clientX - rect.left - radius) / radius;
    const rawY = (event.clientY - rect.top - radius) / radius;
    const length = Math.hypot(rawX, rawY);
    const x = length > 1 ? rawX / length : rawX;
    const y = length > 1 ? rawY / length : rawY;
    setStick({ x, y });
    onMove(x, y);
  };

  const releaseJoystick = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    if (joystickPointer.current !== event.pointerId) return;
    joystickPointer.current = null;
    setStick({ x: 0, y: 0 });
    onMove(0, 0);
  };

  return (
    <div className="ward-mobile-controls" data-visible={visible}>
      <div
        className="ward-joystick"
        role="application"
        aria-label="عصا الحركة"
        onPointerDown={(event) => {
          onTouchActivity();
          joystickPointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          updateJoystick(event);
        }}
        onPointerMove={updateJoystick}
        onPointerUp={releaseJoystick}
        onPointerCancel={releaseJoystick}
      >
        <span
          style={{
            transform: `translate(${stick.x * 30}px, ${stick.y * 30}px)`,
          }}
        />
      </div>

      <div className="ward-action-cluster">
        <button
          type="button"
          className="ward-action-button ward-action-button--pause"
          onPointerDown={onTouchActivity}
          onClick={onPause}
          aria-label="إيقاف مؤقت"
          title="إيقاف"
        >
          <Pause />
        </button>
        <button
          type="button"
          className="ward-action-button ward-action-button--inventory"
          onPointerDown={onTouchActivity}
          onClick={onInventory}
          aria-label="فتح الحقيبة"
          title="الحقيبة"
        >
          <Backpack />
        </button>
        <button
          type="button"
          className="ward-action-button ward-action-button--run"
          onPointerDown={(event) => {
            onTouchActivity();
            event.currentTarget.setPointerCapture(event.pointerId);
            onRunChange(true);
          }}
          onPointerUp={() => onRunChange(false)}
          onPointerCancel={() => onRunChange(false)}
          onPointerLeave={() => onRunChange(false)}
          aria-label="ركض"
          title="ركض"
        >
          <PersonStanding />
        </button>
        <button
          type="button"
          className="ward-action-button ward-action-button--interact"
          data-ready={interactionReady}
          onPointerDown={onTouchActivity}
          onClick={onInteract}
          aria-label="تفاعل"
          title="تفاعل"
        >
          <Hand />
        </button>
      </div>
    </div>
  );
}
