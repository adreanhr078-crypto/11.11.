export type ClassValue = string | false | null | undefined;

export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}

export function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function formatPercentage(value: number): string {
  return `${Math.round(clampPercentage(value))}%`;
}

export function getNextEnabledIndex(
  disabled: readonly boolean[],
  currentIndex: number,
  direction: 1 | -1,
): number {
  if (disabled.length === 0) return -1;

  for (let offset = 1; offset <= disabled.length; offset += 1) {
    const index = (
      currentIndex + direction * offset + disabled.length
    ) % disabled.length;
    if (!disabled[index]) return index;
  }

  return currentIndex;
}

