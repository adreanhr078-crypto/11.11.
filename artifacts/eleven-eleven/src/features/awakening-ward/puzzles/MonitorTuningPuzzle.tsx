import { useState } from 'react';
import { Check, RadioTower } from 'lucide-react';
import { PuzzleFrame } from './PuzzleFrame';

const TARGET_CHANNELS = [2, 1, 3] as const;

interface MonitorTuningPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

export function MonitorTuningPuzzle({
  onSolved,
  onClose,
}: MonitorTuningPuzzleProps) {
  const [channels, setChannels] = useState([0, 3, 1]);
  const [attempted, setAttempted] = useState(false);
  const aligned = channels.every((value, index) => (
    value === TARGET_CHANNELS[index]
  ));

  const tune = (index: number) => {
    setAttempted(false);
    setChannels((current) => current.map((value, channelIndex) => (
      channelIndex === index ? (value + 1) % 4 : value
    )));
  };

  return (
    <PuzzleFrame
      code="MON // 03"
      title="Signal Reconstruction"
      status="MONITOR ARRAY // POWER RESTORED"
      onClose={onClose}
      footer={(
        <button
          type="button"
          className="ward-command ward-command--primary"
          onClick={() => {
            setAttempted(true);
            if (aligned) onSolved();
          }}
        >
          {aligned ? <Check /> : <RadioTower />}
          <span>مزامنة القنوات</span>
        </button>
      )}
    >
      <div className="ward-monitor-viewport" data-aligned={aligned}>
        <div className="ward-monitor-viewport__noise" aria-hidden="true" />
        <div className="ward-monitor-symbols" aria-label="رموز مشوشة غير مكتملة">
          <span>◁</span><span>◈</span><span>◌</span><span>╫</span>
        </div>
        <strong>{aligned ? 'READ THROUGH REFLECTION' : 'SIGNAL INCOMPLETE'}</strong>
      </div>
      <div className="ward-channel-bank" dir="ltr">
        {channels.map((value, index) => (
          <button
            type="button"
            key={index}
            onClick={() => tune(index)}
            aria-label={`ضبط القناة ${index + 1}`}
          >
            <small>CH-{index + 1}</small>
            <span className="ward-channel-wave" data-value={value}>
              {Array.from({ length: 4 }, (_, segment) => (
                <i key={segment} data-active={segment === value} />
              ))}
            </span>
            <b>0{value + 1}</b>
          </button>
        ))}
      </div>
      <p className="ward-puzzle-status" data-error={attempted && !aligned}>
        {attempted && !aligned
          ? 'ترددات القنوات غير متزامنة.'
          : 'ثبّت أطوار القنوات الثلاث قبل قراءة الإشارة.'}
      </p>
    </PuzzleFrame>
  );
}
