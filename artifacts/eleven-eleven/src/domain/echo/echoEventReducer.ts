import type {
  CanonicalEchoEffect,
  EchoEventProgressState,
  StandaloneEchoEvent,
  StandaloneEchoEventFailureReason,
  StandaloneEchoEventReceipt,
  StandaloneEchoEventResult,
} from '../../core/echoEventTypes';
import type { GameProgressionState } from '../../core/gameProgressionTypes';
import {
  applyCanonicalEchoEffect,
  normalizeCanonicalEchoEffect,
} from './canonicalEchoMetrics';

const EVENT_ID_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
const FINGERPRINT_PATTERN = /^echo-v1-[0-9a-f]{8}$/;

export interface StandaloneEchoEventTransitionResult
  extends StandaloneEchoEventResult {
  state: GameProgressionState;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidTimestamp(value: string): boolean {
  return Boolean(value.trim()) && Number.isFinite(Date.parse(value));
}

export function createStandaloneEchoEventReceiptKey(
  eventId: string,
  eventVersion: number,
): string {
  return `${eventId.trim()}:${eventVersion}`;
}

function createEventPayload(
  eventId: string,
  eventVersion: number,
  echoEffect: CanonicalEchoEffect,
): string {
  return JSON.stringify({
    eventId: eventId.trim(),
    eventVersion,
    echoEffect,
  });
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function createStandaloneEchoEventFingerprint(input: {
  eventId: string;
  eventVersion: number;
  echoEffect: CanonicalEchoEffect;
}): string {
  const normalizedEffect = normalizeCanonicalEchoEffect(input.echoEffect);
  if (
    !EVENT_ID_PATTERN.test(input.eventId.trim())
    || !Number.isSafeInteger(input.eventVersion)
    || input.eventVersion < 1
    || !normalizedEffect
  ) {
    return '';
  }
  return `echo-v1-${fnv1a(createEventPayload(
    input.eventId,
    input.eventVersion,
    normalizedEffect,
  ))}`;
}

function failedTransition(
  state: GameProgressionState,
  receiptKey: string,
  failureReason: StandaloneEchoEventFailureReason,
  conflict = false,
): StandaloneEchoEventTransitionResult {
  return {
    success: false,
    applied: false,
    alreadyApplied: false,
    conflict,
    receiptKey,
    failureReason,
    state,
  };
}

function samePayload(
  receipt: StandaloneEchoEventReceipt,
  event: {
    eventId: string;
    eventVersion: number;
    fingerprint: string;
    echoEffect: CanonicalEchoEffect;
  },
): boolean {
  const storedEffect = normalizeCanonicalEchoEffect(receipt.echoEffect);
  return (
    storedEffect !== null
    && receipt.eventId === event.eventId
    && receipt.eventVersion === event.eventVersion
    && receipt.fingerprint === event.fingerprint
    && createEventPayload(
      receipt.eventId,
      receipt.eventVersion,
      storedEffect,
    ) === createEventPayload(
      event.eventId,
      event.eventVersion,
      event.echoEffect,
    )
  );
}

/**
 * Applies an independent Echo event atomically.
 *
 * Source-owned events never call this transaction. Their Puzzle, Manhwa,
 * Memory, Choice, or Story transaction owns idempotency and invokes the pure
 * metric reducer directly in that same transaction.
 */
export function applyStandaloneEchoEventTransaction(
  state: GameProgressionState,
  event: StandaloneEchoEvent,
): StandaloneEchoEventTransitionResult {
  const eventId = event.eventId.trim();
  const receiptKey = createStandaloneEchoEventReceiptKey(
    eventId,
    event.eventVersion,
  );
  if (!EVENT_ID_PATTERN.test(eventId)) {
    return failedTransition(state, receiptKey, 'invalid-event-id');
  }
  if (
    !Number.isSafeInteger(event.eventVersion)
    || event.eventVersion < 1
  ) {
    return failedTransition(
      state,
      receiptKey,
      'invalid-event-version',
    );
  }
  if (!isValidTimestamp(event.timestamp)) {
    return failedTransition(state, receiptKey, 'invalid-timestamp');
  }

  const echoEffect = normalizeCanonicalEchoEffect(event.echoEffect);
  if (!echoEffect) {
    return failedTransition(state, receiptKey, 'invalid-echo-effect');
  }
  const fingerprint = event.fingerprint.trim();
  const expectedFingerprint = createStandaloneEchoEventFingerprint({
    eventId,
    eventVersion: event.eventVersion,
    echoEffect,
  });
  const existing =
    state.echoEvents.standaloneReceiptsByKey[receiptKey];
  if (existing) {
    if (samePayload(existing, {
      eventId,
      eventVersion: event.eventVersion,
      fingerprint,
      echoEffect,
    })) {
      return {
        success: true,
        applied: false,
        alreadyApplied: true,
        conflict: false,
        receiptKey,
        state,
      };
    }
    return failedTransition(
      state,
      receiptKey,
      'event-conflict',
      true,
    );
  }
  if (
    !FINGERPRINT_PATTERN.test(fingerprint)
    || fingerprint !== expectedFingerprint
  ) {
    return failedTransition(state, receiptKey, 'invalid-fingerprint');
  }

  const echoTransition = applyCanonicalEchoEffect(
    state.echo,
    echoEffect,
  );
  if (!echoTransition.success) {
    return failedTransition(state, receiptKey, 'invalid-echo-effect');
  }

  return {
    success: true,
    applied: true,
    alreadyApplied: false,
    conflict: false,
    receiptKey,
    state: {
      ...state,
      echo: echoTransition.echo,
      echoEvents: {
        standaloneReceiptsByKey: {
          ...state.echoEvents.standaloneReceiptsByKey,
          [receiptKey]: {
            eventId,
            eventVersion: event.eventVersion,
            fingerprint,
            timestamp: event.timestamp.trim(),
            echoEffect,
          },
        },
      },
    },
  };
}

export function normalizeEchoEventProgressState(
  value: unknown,
): EchoEventProgressState {
  if (!isRecord(value)) return { standaloneReceiptsByKey: {} };
  const rawReceipts = isRecord(value.standaloneReceiptsByKey)
    ? value.standaloneReceiptsByKey
    : {};
  const standaloneReceiptsByKey: Record<
    string,
    StandaloneEchoEventReceipt
  > = {};

  for (const [key, rawReceipt] of Object.entries(rawReceipts)) {
    if (!isRecord(rawReceipt)) continue;
    const eventId = typeof rawReceipt.eventId === 'string'
      ? rawReceipt.eventId.trim()
      : '';
    const eventVersion = rawReceipt.eventVersion;
    const fingerprint = typeof rawReceipt.fingerprint === 'string'
      ? rawReceipt.fingerprint.trim()
      : '';
    const timestamp = typeof rawReceipt.timestamp === 'string'
      ? rawReceipt.timestamp.trim()
      : '';
    const echoEffect = normalizeCanonicalEchoEffect(
      rawReceipt.echoEffect,
    );
    if (
      !EVENT_ID_PATTERN.test(eventId)
      || !Number.isSafeInteger(eventVersion)
      || (eventVersion as number) < 1
      || !isValidTimestamp(timestamp)
      || !echoEffect
    ) {
      continue;
    }
    const normalizedVersion = eventVersion as number;
    const expectedKey = createStandaloneEchoEventReceiptKey(
      eventId,
      normalizedVersion,
    );
    const expectedFingerprint = createStandaloneEchoEventFingerprint({
      eventId,
      eventVersion: normalizedVersion,
      echoEffect,
    });
    if (
      key !== expectedKey
      || !FINGERPRINT_PATTERN.test(fingerprint)
      || fingerprint !== expectedFingerprint
    ) {
      continue;
    }
    standaloneReceiptsByKey[key] = {
      eventId,
      eventVersion: normalizedVersion,
      fingerprint,
      timestamp,
      echoEffect,
    };
  }

  return { standaloneReceiptsByKey };
}
