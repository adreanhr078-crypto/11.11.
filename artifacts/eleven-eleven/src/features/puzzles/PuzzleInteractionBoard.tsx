import type {
  CampaignHintTier,
  CampaignInteractionStage,
  CampaignPuzzleProgress,
} from '../../domain/puzzles/campaignContracts';

interface PuzzleInteractionBoardProps {
  stage: CampaignInteractionStage;
  progress: CampaignPuzzleProgress;
  onChange: (progress: CampaignPuzzleProgress) => void;
  assistanceLevel: number;
  assistanceEffect?: CampaignHintTier['effect'];
  disabled?: boolean;
}

function selectedIndex(
  progress: CampaignPuzzleProgress,
  optionId: string,
): number {
  return progress.values.indexOf(optionId);
}

export function PuzzleInteractionBoard({
  stage,
  progress,
  onChange,
  assistanceLevel,
  assistanceEffect,
  disabled = false,
}: PuzzleInteractionBoardProps) {
  if (stage.mode === 'rings') {
    const values = stage.rings.map((ring, index) => (
      progress.values[index] ?? ring.values[0] ?? ''
    ));
    return (
      <div
        className="campaign-interaction campaign-interaction--rings"
        aria-label={stage.prompt.ar}
      >
        {stage.rings.map((ring, index) => {
          const value = values[index] ?? '';
          const isNextUnstableRing = values.findIndex(
            (candidate, ringIndex) => candidate !== stage.solution[ringIndex],
          ) === index;
          return (
            <button
              key={ring.id}
              type="button"
              className="campaign-ring"
              data-hint-relevant={
                assistanceLevel >= 2 && isNextUnstableRing
              }
              disabled={disabled}
              aria-label={`الحلقة ${index + 1}: ${value}`}
              onClick={() => {
                const currentIndex = ring.values.indexOf(value);
                const next = ring.values[
                  (currentIndex + 1) % ring.values.length
                ] ?? ring.values[0] ?? '';
                const nextValues = [...values];
                nextValues[index] = next;
                onChange({ ...progress, values: nextValues });
              }}
            >
              <small>R{index + 1}</small>
              <strong>{value}</strong>
              <span>↻</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (stage.mode === 'match') {
    return (
      <div
        className="campaign-interaction campaign-interaction--match"
        aria-label={stage.prompt.ar}
      >
        {stage.options.map((option) => (
          <label key={option.id}>
            <span>
              <strong>{option.label.ar}</strong>
              {option.meta && <small>{option.meta.ar}</small>}
            </span>
            <select
              value={progress.matches[option.id] ?? ''}
              disabled={disabled}
              aria-label={`موضع ${option.label.ar}`}
              onChange={(event) => onChange({
                ...progress,
                matches: {
                  ...progress.matches,
                  [option.id]: event.target.value,
                },
              })}
            >
              <option value="">اختر الموضع</option>
              {stage.targets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.label.ar}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    );
  }

  const isOrdered = stage.mode === 'sequence' || stage.mode === 'path';
  const isSingle = stage.mode === 'single';
  const solutionIds = new Set(stage.solution);
  const decoyOptions = stage.options.filter(
    (option) => !solutionIds.has(option.id),
  );
  const nextCorrectId = isOrdered
    ? stage.solution[progress.values.length]
    : stage.solution.find((id) => !progress.values.includes(id));
  const assistanceCandidates = new Set<string>();
  if (assistanceLevel >= 2) {
    if (
      assistanceLevel >= 3
      && assistanceEffect === 'highlight_relevant'
    ) {
      const partialSolution = stage.solution.length > 1
        ? stage.solution.slice(0, Math.min(2, stage.solution.length - 1))
        : stage.solution;
      partialSolution.forEach((optionId) => (
        assistanceCandidates.add(optionId)
      ));
    } else {
      if (nextCorrectId) assistanceCandidates.add(nextCorrectId);
      const comparisonDecoy = decoyOptions.find(
        (option) => !progress.values.includes(option.id),
      );
      if (comparisonDecoy) assistanceCandidates.add(comparisonDecoy.id);
    }
  }
  const shouldRemoveDecoys = assistanceLevel >= 3 && (
    assistanceEffect === 'remove_decoys'
    || (isSingle && assistanceEffect === 'lock_correct_element')
  );
  const removableDecoyIds = new Set(
    shouldRemoveDecoys && decoyOptions.length > 1
      ? decoyOptions
          .slice(0, Math.max(1, Math.floor(decoyOptions.length / 2)))
          .map((option) => option.id)
      : [],
  );

  return (
    <div
      className="campaign-interaction"
      data-mode={stage.mode}
      aria-label={stage.prompt.ar}
    >
      {isOrdered && (
        <div
          className="campaign-interaction__sequence"
          aria-live="polite"
          aria-label="الترتيب الحالي"
        >
          {progress.values.length === 0 ? (
            <span>اختر العناصر بالترتيب</span>
          ) : progress.values.map((id, index) => {
            const option = stage.options.find((item) => item.id === id);
            return (
              <button
                key={`${id}-${index}`}
                type="button"
                disabled={disabled}
                onClick={() => onChange({
                  ...progress,
                  values: progress.values.filter(
                    (_, candidate) => candidate !== index,
                  ),
                })}
                aria-label={`إزالة ${option?.label.ar ?? id} من الموضع ${index + 1}`}
              >
                <small>{index + 1}</small>
                <strong>{option?.label.ar ?? id}</strong>
              </button>
            );
          })}
        </div>
      )}

      <div className="campaign-interaction__options">
        {stage.options
          .filter((option) => !removableDecoyIds.has(option.id))
          .map((option) => {
          const index = selectedIndex(progress, option.id);
          const selected = index >= 0;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled || (isOrdered && selected)}
              data-selected={selected}
              data-hint-relevant={assistanceCandidates.has(option.id)}
              aria-pressed={selected}
              onClick={() => {
                if (isSingle) {
                  onChange({ ...progress, values: [option.id] });
                  return;
                }
                if (isOrdered) {
                  onChange({
                    ...progress,
                    values: [...progress.values, option.id],
                  });
                  return;
                }
                onChange({
                  ...progress,
                  values: selected
                    ? progress.values.filter((id) => id !== option.id)
                    : [...progress.values, option.id],
                });
              }}
            >
              {selected && <small>{isOrdered ? index + 1 : '✓'}</small>}
              <strong>{option.label.ar}</strong>
              {option.meta && <span>{option.meta.ar}</span>}
            </button>
          );
          })}
      </div>
    </div>
  );
}
