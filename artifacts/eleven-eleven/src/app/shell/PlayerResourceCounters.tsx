import { Coins, Diamond } from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';

interface PlayerResourceCountersProps {
  className?: string;
}

export function PlayerResourceCounters({
  className = '',
}: PlayerResourceCountersProps) {
  const currency = useGameStore((state) => state.currency);
  const fragmentCount = useGameStore(
    (state) => state.collectedMemoryFragments.length,
  );

  return (
    <div
      className={`application-shell__resources ${className}`.trim()}
      aria-label="موارد اللاعب / Player resources"
    >
      <span
        className="application-shell__resource"
        data-resource="currency"
        title="العملات / Currency"
        aria-label={`العملات / Currency: ${currency}`}
      >
        <Coins aria-hidden="true" />
        <strong key={`currency-${currency}`}>{currency}</strong>
      </span>
      <span
        className="application-shell__resource"
        data-resource="memory"
        title="شظايا الذاكرة / Memory fragments"
        aria-label={`شظايا الذاكرة / Memory fragments: ${fragmentCount}`}
      >
        <Diamond aria-hidden="true" />
        <strong key={`fragments-${fragmentCount}`}>{fragmentCount}</strong>
      </span>
    </div>
  );
}
