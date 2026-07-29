import { Coins, Diamond } from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';

interface PlayerResourceCountersProps {
  className?: string;
}

export function PlayerResourceCounters({
  className = '',
}: PlayerResourceCountersProps) {
  const currency = useGameStore(
    (state) => state.progressionState.resources.coins,
  );
  const spendableShardBalance = useGameStore(
    (state) => (
      state.progressionState.resources.memoryShards.spendableBalance
    ),
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
        title="شظايا الذاكرة / Memory Shards"
        aria-label={`شظايا الذاكرة / Memory Shards: ${spendableShardBalance}`}
      >
        <Diamond aria-hidden="true" />
        <strong key={`shards-${spendableShardBalance}`}>
          {spendableShardBalance}
        </strong>
      </span>
    </div>
  );
}
