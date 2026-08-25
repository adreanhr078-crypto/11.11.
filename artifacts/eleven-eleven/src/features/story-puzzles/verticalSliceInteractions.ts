/**
 * Small, presentation-facing interaction helpers for the opening Story slice.
 *
 * They deliberately know nothing about correctness, rewards, or persistence.
 * The Pages Function remains the only authority for all of those concerns.
 */

const DEFAULT_SIGNAL_FREQUENCY_IDS = ['42', '58', '74'] as const;
const DEFAULT_SIGNAL_CHANNEL_IDS = ['channel-07', 'channel-11', 'channel-13'] as const;

/**
 * Neutral visible baseline for the emergency board. These values are only a
 * draft convenience; final balance correctness remains server-owned.
 */
export const LOAD_BALANCE_STARTING_ASSIGNMENTS = Object.freeze({
  power: '20',
  data: '20',
  cooling: '20',
});

const LOAD_BALANCE_CHANNELS = ['power', 'data', 'cooling'] as const;

export function normalizeLoadBalanceAssignments(
  assignments: Readonly<Record<string, string>>,
): Record<string, string> {
  return Object.fromEntries(LOAD_BALANCE_CHANNELS.map((channel) => {
    const candidate = Number(assignments[channel]);
    const valid = Number.isFinite(candidate)
      && candidate >= 10
      && candidate <= 60
      && candidate % 10 === 0;
    return [channel, valid ? String(candidate) : LOAD_BALANCE_STARTING_ASSIGNMENTS[channel]];
  }));
}

export function loadBalanceTotal(assignments: Readonly<Record<string, string>>): number {
  return LOAD_BALANCE_CHANNELS.reduce(
    (sum, channel) => sum + Number(assignments[channel] ?? 0),
    0,
  );
}

/** A non-secret completeness guard; the server still validates every rule. */
export function isLoadBalanceReady(assignments: Readonly<Record<string, string>>): boolean {
  return LOAD_BALANCE_CHANNELS.every((channel) => assignments[channel] !== undefined)
    && loadBalanceTotal(assignments) === 100;
}

function signalOptionSet(
  optionIds: readonly string[] | undefined,
  fallback: readonly string[],
): ReadonlySet<string> {
  return new Set(optionIds ?? fallback);
}

export function readSignalSelection(
  tokens: readonly string[],
  frequencyIds?: readonly string[],
  channelIds?: readonly string[],
): {
  frequency: string | undefined;
  channel: string | undefined;
} {
  const knownFrequencies = signalOptionSet(frequencyIds, DEFAULT_SIGNAL_FREQUENCY_IDS);
  const knownChannels = signalOptionSet(channelIds, DEFAULT_SIGNAL_CHANNEL_IDS);
  return {
    frequency: tokens.find((token) => knownFrequencies.has(token)),
    channel: tokens.find((token) => knownChannels.has(token)),
  };
}

export function normalizeSignalSelection(
  tokens: readonly string[],
  frequencyIds?: readonly string[],
  channelIds?: readonly string[],
): string[] {
  const { frequency, channel } = readSignalSelection(tokens, frequencyIds, channelIds);
  return [frequency, channel].filter((token): token is string => Boolean(token));
}

/** Keeps frequency and channel independent, regardless of which is tapped first. */
export function toggleSignalSelection(
  tokens: readonly string[],
  optionId: string,
  frequencyIds?: readonly string[],
  channelIds?: readonly string[],
): string[] {
  const knownFrequencies = signalOptionSet(frequencyIds, DEFAULT_SIGNAL_FREQUENCY_IDS);
  const knownChannels = signalOptionSet(channelIds, DEFAULT_SIGNAL_CHANNEL_IDS);
  const { frequency, channel } = readSignalSelection(tokens, frequencyIds, channelIds);
  if (knownFrequencies.has(optionId)) {
    return normalizeSignalSelection([
      frequency === optionId ? '' : optionId,
      channel ?? '',
    ], frequencyIds, channelIds);
  }
  if (knownChannels.has(optionId)) {
    return normalizeSignalSelection([
      frequency ?? '',
      channel === optionId ? '' : optionId,
    ], frequencyIds, channelIds);
  }
  return normalizeSignalSelection(tokens, frequencyIds, channelIds);
}

/** A full sequence must be edited explicitly; never discard an earlier choice. */
export function appendUniqueRouteToken(
  current: readonly string[],
  optionId: string,
  maximum: number,
): string[] {
  if (current.includes(optionId) || current.length >= maximum) return [...current];
  return [...current, optionId];
}

export function removeRouteTokenAt(
  current: readonly string[],
  index: number,
): string[] {
  if (index < 0 || index >= current.length) return [...current];
  return current.filter((_, itemIndex) => itemIndex !== index);
}

export function swapPuzzlePieces(
  current: readonly string[],
  fromPiece: string,
  toPiece: string,
): string[] {
  if (fromPiece === toPiece) return [...current];
  const next = [...current];
  const from = next.indexOf(fromPiece);
  const to = next.indexOf(toPiece);
  if (from < 0 || to < 0) return next;
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

/**
 * Image reconstruction always uses physical canvas coordinates: piece-0 is
 * the source image's top-left tile, regardless of the document's text
 * direction. These helpers deliberately know nothing about the completed
 * arrangement; the server remains the only answer authority.
 */
export function imageReconstructionPieceIds(rows: number, columns: number): string[] {
  const count = Math.max(0, Math.floor(rows)) * Math.max(0, Math.floor(columns));
  return Array.from({ length: count }, (_, index) => `piece-${index}`);
}

export function isExactImageReconstructionPermutation(
  imageOrder: readonly string[],
  rows: number,
  columns: number,
): boolean {
  const expected = imageReconstructionPieceIds(rows, columns);
  return imageOrder.length === expected.length
    && imageOrder.every((pieceId) => expected.includes(pieceId))
    && new Set(imageOrder).size === expected.length;
}

export function normalizeImageReconstructionDraft(
  input: {
    imageOrder: readonly string[];
    rotations: Readonly<Record<string, number>>;
  },
  rows: number,
  columns: number,
  allowRotation: boolean,
): { imageOrder: string[]; rotations: Record<string, number> } {
  const expected = imageReconstructionPieceIds(rows, columns);
  const expectedSet = new Set(expected);
  const seen = new Set<string>();
  const retained = input.imageOrder.filter((pieceId) => {
    if (!expectedSet.has(pieceId) || seen.has(pieceId)) return false;
    seen.add(pieceId);
    return true;
  });
  const imageOrder = [...retained, ...expected.filter((pieceId) => !seen.has(pieceId))];
  const rotations = Object.fromEntries(expected.map((pieceId) => {
    if (!allowRotation) return [pieceId, 0];
    const candidate = input.rotations[pieceId];
    const normalized = Number.isInteger(candidate)
      ? ((candidate % 4) + 4) % 4
      : 0;
    return [pieceId, normalized];
  }));
  return { imageOrder, rotations };
}
