import {
  CANONICAL_ECHO_METRIC_KEYS,
} from '../../core/echoEventTypes';
import type {
  CanonicalEchoEffect,
} from '../../core/echoEventTypes';
import type {
  NarrativeEffectPlan,
  NarrativeSourceIdentity,
} from '../../core/narrativeEventTypes';
import {
  normalizeCanonicalEchoEffect,
} from '../echo/canonicalEchoMetrics';

export const NARRATIVE_EVENT_FINGERPRINT_PATTERN =
  /^narrative-v1-[0-9a-f]{8}$/;

const ID_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;

export function isValidNarrativeId(value: string): boolean {
  return ID_PATTERN.test(value.trim());
}

export function createNarrativeSourceReceiptKey(
  source: NarrativeSourceIdentity,
  eventVersion: number,
): string {
  switch (source.kind) {
    case 'memory':
      return source.fragmentId
        ? `memory:${source.memoryId.trim()}:${source.fragmentId.trim()}:${eventVersion}`
        : `memory:${source.memoryId.trim()}:${eventVersion}`;
    case 'dialogue':
      return [
        'dialogue',
        source.dialogueId.trim(),
        source.nodeId.trim(),
        source.choiceId.trim(),
        eventVersion,
      ].join(':');
    case 'cinematic':
      return [
        'cinematic',
        source.episodeId.trim(),
        source.narrativeEventId.trim(),
        eventVersion,
      ].join(':');
    case 'story':
      return `story:${source.eventId.trim()}:${eventVersion}`;
  }
}

function orderedBooleanRecord(
  value: Readonly<Record<string, boolean>>,
): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => (
      left.localeCompare(right)
    )),
  );
}

function orderedEchoEffect(
  effect: CanonicalEchoEffect,
): CanonicalEchoEffect | null {
  if (Object.keys(effect).length === 0) return {};
  const normalized = normalizeCanonicalEchoEffect(effect);
  if (!normalized) return null;
  return Object.fromEntries(
    CANONICAL_ECHO_METRIC_KEYS.flatMap((metric) => {
      const amount = normalized[metric];
      return amount === undefined ? [] : [[metric, amount]];
    }),
  );
}

function orderedSource(source: NarrativeSourceIdentity) {
  switch (source.kind) {
    case 'memory':
      return {
        kind: source.kind,
        memoryId: source.memoryId.trim(),
        fragmentId: source.fragmentId?.trim() ?? null,
      };
    case 'dialogue':
      return {
        kind: source.kind,
        dialogueId: source.dialogueId.trim(),
        nodeId: source.nodeId.trim(),
        choiceId: source.choiceId.trim(),
      };
    case 'cinematic':
      return {
        kind: source.kind,
        episodeId: source.episodeId.trim(),
        narrativeEventId: source.narrativeEventId.trim(),
      };
    case 'story':
      return {
        kind: source.kind,
        eventId: source.eventId.trim(),
      };
  }
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Fingerprints the authored payload while excluding timestamp. Retries after
 * reload therefore compare the same source payload deterministically.
 */
export function createNarrativeEffectFingerprint(
  plan: Omit<NarrativeEffectPlan, 'fingerprint' | 'timestamp'>,
): string {
  const echoEffect = orderedEchoEffect(plan.echoEffect);
  if (!echoEffect) return '';
  const payload = {
    source: orderedSource(plan.source),
    eventVersion: plan.eventVersion,
    replayPolicy: plan.replayPolicy,
    echoEffect,
    storyFlags: orderedBooleanRecord(plan.storyFlags),
    knowledgeGrants: [...plan.knowledgeGrants]
      .map(({ nodeId, audience }) => ({
        nodeId: nodeId.trim(),
        audience,
      }))
      .sort((left, right) => (
        `${left.audience}:${left.nodeId}`.localeCompare(
          `${right.audience}:${right.nodeId}`,
        )
      )),
    dialogueTransition: plan.dialogueTransition ?? null,
    storyEvent: plan.storyEvent ?? null,
  };
  return `narrative-v1-${fnv1a(JSON.stringify(payload))}`;
}
