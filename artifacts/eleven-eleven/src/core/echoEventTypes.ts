export const CANONICAL_ECHO_METRIC_KEYS = [
  'humanity',
  'trust',
  'fear',
  'anger',
  'memoryStability',
  'memoriesRecovered',
  'corruption',
] as const;

export type CanonicalEchoMetric =
  typeof CANONICAL_ECHO_METRIC_KEYS[number];

export interface EchoMetricContract {
  min: 0;
  max: 100;
  integer: true;
}

export const ECHO_METRIC_CONTRACTS = Object.freeze(
  Object.fromEntries(CANONICAL_ECHO_METRIC_KEYS.map((metric) => [
    metric,
    Object.freeze({
      min: 0,
      max: 100,
      integer: true,
    } satisfies EchoMetricContract),
  ])) as Record<CanonicalEchoMetric, EchoMetricContract>,
);

export type CanonicalEchoEffect = Readonly<
  Partial<Record<CanonicalEchoMetric, number>>
>;

export interface StandaloneEchoEvent {
  eventId: string;
  eventVersion: number;
  fingerprint: string;
  timestamp: string;
  echoEffect: CanonicalEchoEffect;
}

export interface StandaloneEchoEventReceipt {
  eventId: string;
  eventVersion: number;
  fingerprint: string;
  timestamp: string;
  echoEffect: CanonicalEchoEffect;
}

export interface EchoEventProgressState {
  /**
   * Receipts only for independent Echo events that do not have a source-owned
   * receipt. Puzzle, Manhwa, Memory, Dialogue, and Story receipts never enter
   * this ledger.
   */
  standaloneReceiptsByKey: Record<string, StandaloneEchoEventReceipt>;
}

export type StandaloneEchoEventFailureReason =
  | 'invalid-event-id'
  | 'invalid-event-version'
  | 'invalid-fingerprint'
  | 'invalid-timestamp'
  | 'invalid-echo-effect'
  | 'event-conflict';

export interface StandaloneEchoEventResult {
  success: boolean;
  applied: boolean;
  alreadyApplied: boolean;
  conflict: boolean;
  receiptKey: string;
  failureReason?: StandaloneEchoEventFailureReason;
}
