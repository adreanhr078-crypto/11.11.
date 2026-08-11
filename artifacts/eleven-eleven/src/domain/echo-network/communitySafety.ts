import type { NetworkLocale } from './contracts';

export const PRESET_MESSAGES = Object.freeze([
  { id: 'ready', ar: 'جاهز للإشارة.', en: 'Ready for the signal.' },
  { id: 'memory-here', ar: 'دليل الذاكرة عندي.', en: 'I have the memory clue.' },
  { id: 'check-route', ar: 'راجع مسار البيانات.', en: 'Check the data route.' },
  { id: 'need-hint', ar: 'نحتاج تلميحًا جماعيًا.', en: 'We need a team hint.' },
  { id: 'good-signal', ar: 'إشارة ممتازة.', en: 'Strong signal.' },
  { id: 'one-moment', ar: 'لحظة، أراجع الدليل.', en: 'One moment, checking the clue.' },
] as const);

export type PresetMessageId = typeof PRESET_MESSAGES[number]['id'];

export interface ModerationResult {
  allowed: boolean;
  sanitized: string;
  reason: 'ok' | 'empty' | 'too-long' | 'link' | 'personal-data' | 'abuse';
}

const LINK_PATTERN = /(?:https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|gg|io|me)\b)/iu;
const EMAIL_PATTERN = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/iu;
const PHONE_PATTERN = /(?:\+?\d[\s().-]*){8,}/u;
const ABUSE_PATTERNS = [
  /\b(?:kill yourself|kys|nazi)\b/iu,
  /(?:انتحر|نازي|سأقتلك|اقتلك)/u,
];

export function moderateCommunityText(value: string): ModerationResult {
  const sanitized = value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!sanitized) return { allowed: false, sanitized, reason: 'empty' };
  if (sanitized.length > 600) return { allowed: false, sanitized, reason: 'too-long' };
  if (LINK_PATTERN.test(sanitized)) return { allowed: false, sanitized, reason: 'link' };
  if (EMAIL_PATTERN.test(sanitized) || PHONE_PATTERN.test(sanitized)) {
    return { allowed: false, sanitized, reason: 'personal-data' };
  }
  if (ABUSE_PATTERNS.some((pattern) => pattern.test(sanitized))) {
    return { allowed: false, sanitized, reason: 'abuse' };
  }
  return { allowed: true, sanitized, reason: 'ok' };
}

export function presetMessage(id: string, locale: NetworkLocale): string | null {
  const message = PRESET_MESSAGES.find((candidate) => candidate.id === id);
  return message?.[locale] ?? null;
}
