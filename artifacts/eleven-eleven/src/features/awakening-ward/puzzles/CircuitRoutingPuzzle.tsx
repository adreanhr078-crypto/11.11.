import { useMemo, useState } from 'react';
import { Check, RotateCw, Zap } from 'lucide-react';
import {
  CIRCUIT_TILES,
  INITIAL_CIRCUIT_ROTATIONS,
  circuitGlyph,
  isCircuitSolved,
  poweredCircuitTiles,
} from './circuitPuzzle';
import { PuzzleFrame } from './PuzzleFrame';

interface CircuitRoutingPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

export function CircuitRoutingPuzzle({
  onSolved,
  onClose,
}: CircuitRoutingPuzzleProps) {
  const [rotations, setRotations] = useState<number[]>([
    ...INITIAL_CIRCUIT_ROTATIONS,
  ]);
  const [attempted, setAttempted] = useState(false);
  const powered = useMemo(() => poweredCircuitTiles(rotations), [rotations]);

  const rotate = (index: number) => {
    if (CIRCUIT_TILES[index]?.type === 'empty') return;
    setAttempted(false);
    setRotations((current) => current.map((rotation, tileIndex) => (
      tileIndex === index ? (rotation + 1) % 4 : rotation
    )));
  };

  const routePower = () => {
    setAttempted(true);
    if (isCircuitSolved(rotations)) onSolved();
  };

  return (
    <PuzzleFrame
      code="PWR // 02"
      title="Circuit Routing"
      status="A-01 POWER BUS"
      onClose={onClose}
      footer={(
        <button
          type="button"
          className="ward-command ward-command--primary"
          onClick={routePower}
        >
          {isCircuitSolved(rotations) ? <Check /> : <Zap />}
          <span>اختبار مسار الطاقة</span>
        </button>
      )}
    >
      <div className="ward-circuit-layout" dir="ltr">
        <span className="ward-circuit-port ward-circuit-port--source">
          IN
        </span>
        <div className="ward-circuit-grid">
          {CIRCUIT_TILES.map((tile, index) => (
            <button
              type="button"
              key={index}
              className="ward-circuit-tile"
              data-powered={powered.has(index)}
              data-empty={tile.type === 'empty'}
              onClick={() => rotate(index)}
              aria-label={`تدوير قطعة الدائرة ${index + 1}`}
              disabled={tile.type === 'empty'}
            >
              <span>{circuitGlyph(tile.type, rotations[index] ?? 0)}</span>
              {tile.type !== 'empty' && <RotateCw aria-hidden="true" />}
            </button>
          ))}
        </div>
        <span className="ward-circuit-port ward-circuit-port--east">
          AUX
        </span>
        <span className="ward-circuit-port ward-circuit-port--south">
          CORE
        </span>
      </div>
      <p className="ward-puzzle-status" data-error={attempted && !isCircuitSolved(rotations)}>
        {attempted && !isCircuitSolved(rotations)
          ? 'المسار غير مكتمل. خرج واحد على الأقل ما زال معزولًا.'
          : `${powered.size.toString().padStart(2, '0')} عقدة تستقبل الطاقة`}
      </p>
    </PuzzleFrame>
  );
}
