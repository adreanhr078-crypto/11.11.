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

/**
 * Continuous tuning support. The dial sweeps a padded frequency span; the
 * carrier feedback below is honest acquisition physics (distance to the
 * nearest broadcast centre), never answer correctness. The server remains
 * the only judge of which reading satisfies the manhwa relationship.
 */
export type SignalDialScale = { min: number; max: number; span: number };

export function signalDialScale(frequencies: readonly number[]): SignalDialScale {
  const finite = frequencies.filter((value) => Number.isFinite(value));
  const values = finite.length > 0 ? finite : [0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(6, Math.round((max - min) * 0.25));
  return { min: min - pad, max: max + pad, span: (max + pad) - (min - pad) };
}

export function signalAcquisition(
  dialValue: number,
  frequencies: readonly number[],
): { nearestIndex: number; clarity: number; locked: boolean } {
  const finite = frequencies.filter((value) => Number.isFinite(value));
  const values = finite.length > 0 ? finite : [0];
  const scale = signalDialScale(values);
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  values.forEach((frequency, index) => {
    const distance = Math.abs(dialValue - frequency);
    if (distance < nearestDistance) {
      nearestIndex = index;
      nearestDistance = distance;
    }
  });
  // Half of the smallest gap between centres: crossing the midpoint hands
  // the lock to the next probe, so exactly one reading is ever armed.
  const sorted = [...values].sort((left, right) => left - right);
  const gaps = sorted.slice(1).map((value, index) => value - sorted[index]!);
  const lockRadius = gaps.length > 0 ? Math.min(...gaps) / 2 : scale.span / 2;
  const reach = Math.max(lockRadius * 3, 1);
  const clarity = Math.max(0, Math.min(1, 1 - nearestDistance / reach));
  // A midpoint or the padded initial dial boundary is not a confirmed probe.
  // The player must deliberately steer into a reading rather than arrive at a
  // misleadingly pre-locked state before touching the control.
  return { nearestIndex, clarity, locked: nearestDistance < lockRadius };
}

/** Deterministic pseudo-noise so SSR, tests, and clients render identically. */
function signalJitter(index: number): number {
  return (((index + 1) * 73) % 17) / 17 - 0.5;
}

export function buildLiveSignalWavePath(
  clarity: number,
  width = 120,
  height = 54,
): string {
  const mid = height / 2;
  const segments = 12;
  const step = width / segments;
  const boundedClarity = Math.max(0, Math.min(1, clarity));
  const points: string[] = [`M2 ${mid.toFixed(1)}`];
  for (let index = 1; index <= segments; index += 1) {
    const x = Math.min(width - 2, index * step);
    // A trusted pulse leans into a stable crest/trough rhythm; pure noise
    // scatters around the measurement line instead.
    const rhythm = index % 2 === 0 ? 1 : -1;
    const noise = signalJitter(index);
    const amplitude = (noise * (1 - boundedClarity) + rhythm * 0.72 * boundedClarity) * (height * 0.36);
    points.push(`L${x.toFixed(1)} ${(mid + amplitude).toFixed(1)}`);
  }
  return points.join(' ');
}

/**
 * Explains the KIND of contradiction inside a player's own ordering using
 * only public port metadata. It never names the correct arrangement.
 */
export type SequenceContradictionKind = 'no-entry' | 'no-exit' | 'impossible-link';

export function diagnoseSequenceContradiction(
  tokens: readonly string[],
  ports: Readonly<Record<string, { input: string; output: string }>>,
): { kind: SequenceContradictionKind; atStep?: number } | undefined {
  const resolved = tokens
    .map((token) => ports[token])
    .filter((port): port is { input: string; output: string } => Boolean(port));
  if (resolved.length !== tokens.length || resolved.length === 0) return undefined;
  if (resolved[0]!.input !== 'START') return { kind: 'no-entry', atStep: 0 };
  // Report the earliest broken hop first: it is the most local, most
  // teachable contradiction. The exit port is only checked once every
  // documented link already holds.
  for (let index = 1; index < resolved.length; index += 1) {
    if (resolved[index - 1]!.output !== resolved[index]!.input) {
      return { kind: 'impossible-link', atStep: index };
    }
  }
  if (resolved[resolved.length - 1]!.output !== 'END') {
    return { kind: 'no-exit', atStep: resolved.length - 1 };
  }
  return undefined;
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
