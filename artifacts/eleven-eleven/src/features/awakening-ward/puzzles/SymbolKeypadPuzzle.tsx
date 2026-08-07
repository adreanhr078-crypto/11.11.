import { useState } from 'react';
import { Check, Delete, RotateCcw } from 'lucide-react';
import { PuzzleFrame } from './PuzzleFrame';

const SYMBOLS = ['△', '◇', '○', '║'] as const;
const SOLUTION = SYMBOLS.join('');

interface SymbolKeypadPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

export function SymbolKeypadPuzzle({
  onSolved,
  onClose,
}: SymbolKeypadPuzzleProps) {
  const [entry, setEntry] = useState<string[]>([]);
  const [attempted, setAttempted] = useState(false);
  const correct = entry.join('') === SOLUTION;

  return (
    <PuzzleFrame
      code="STG // 05"
      title="Hidden Drawer Lock"
      status="SYMBOL INPUT // FOUR POSITIONS"
      onClose={onClose}
      footer={(
        <button
          type="button"
          className="ward-command ward-command--primary"
          disabled={entry.length !== 4}
          onClick={() => {
            setAttempted(true);
            if (correct) onSolved();
          }}
        >
          <Check />
          <span>تحقق من الرمز</span>
        </button>
      )}
    >
      <div className="ward-keypad-entry" dir="ltr">
        {Array.from({ length: 4 }, (_, index) => (
          <span key={index}>{entry[index] ?? '·'}</span>
        ))}
      </div>
      <div className="ward-keypad-grid" dir="ltr">
        {SYMBOLS.map((symbol) => (
          <button
            type="button"
            key={symbol}
            onClick={() => {
              setAttempted(false);
              setEntry((current) => current.length < 4
                ? [...current, symbol]
                : current);
            }}
            aria-label={`إدخال الرمز ${symbol}`}
          >
            {symbol}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setEntry((current) => current.slice(0, -1))}
          aria-label="حذف آخر رمز"
          title="حذف"
        >
          <Delete />
        </button>
        <button
          type="button"
          onClick={() => {
            setAttempted(false);
            setEntry([]);
          }}
          aria-label="مسح التسلسل"
          title="مسح"
        >
          <RotateCcw />
        </button>
      </div>
      <p className="ward-puzzle-status" data-error={attempted && !correct}>
        {attempted && !correct
          ? 'رفض القفل التسلسل المدخل.'
          : 'أدخل الرموز كما ظهرت في الانعكاس.'}
      </p>
    </PuzzleFrame>
  );
}
