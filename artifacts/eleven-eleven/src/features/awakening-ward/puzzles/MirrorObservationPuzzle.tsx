import { Eye, NotebookPen } from 'lucide-react';
import { PuzzleFrame } from './PuzzleFrame';

interface MirrorObservationPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

export function MirrorObservationPuzzle({
  onSolved,
  onClose,
}: MirrorObservationPuzzleProps) {
  return (
    <PuzzleFrame
      code="RFL // 04"
      title="Mirror Analysis"
      status="REFLECTION CHANNEL"
      onClose={onClose}
      footer={(
        <button
          type="button"
          className="ward-command ward-command--primary"
          onClick={onSolved}
        >
          <NotebookPen />
          <span>سجّل ترتيب الرموز</span>
        </button>
      )}
    >
      <div className="ward-mirror-stage">
        <Eye aria-hidden="true" />
        <div className="ward-mirror-glass">
          <span className="ward-mirror-glass__raw">║ ○ ◇ △</span>
          <span className="ward-mirror-glass__reflection">△ ◇ ○ ║</span>
        </div>
        <div className="ward-mirror-scan" aria-hidden="true" />
      </div>
      <p className="ward-puzzle-status">
        الانعكاس يعيد بناء الترتيب. لن يُحفظ حتى تسجّل الملاحظة.
      </p>
    </PuzzleFrame>
  );
}
