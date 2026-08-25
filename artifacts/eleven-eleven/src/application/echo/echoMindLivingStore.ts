import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EchoMindLocale } from './echoMindExperience';

/**
 * Versioned so legacy personal-memory payloads cannot be silently rehydrated
 * into the new bounded companion experience. Stage 3 deliberately keeps all
 * dialogue and derived relationship data in the current browser session only;
 * a future synchronized-memory feature requires an explicit server contract,
 * consent screen, export, and delete path before it may exist.
 */
export const ECHO_MIND_LIVING_STORAGE_KEY = 'eleven_echo_mind_living_v3';
export const LEGACY_ECHO_MIND_LIVING_STORAGE_KEYS = [
  'eleven_echo_mind_living_v1',
  'eleven_echo_mind_living_v2',
] as const;

function clearLegacyEchoMindStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const key of LEGACY_ECHO_MIND_LIVING_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Storage can be unavailable in private or embedded browser contexts.
    // The v3 key still prevents legacy data from being rehydrated there.
  }
}

clearLegacyEchoMindStorage();

export type EchoMindMemoryKind = (
  | 'name'
  | 'feeling'
  | 'preference'
  | 'promise'
);

export type EchoMindTheoryStatus = (
  | 'open'
  | 'supported'
  | 'challenged'
  | 'withdrawn'
);

export type EchoMindIntrusionTone = 'signal' | 'memory' | 'warning';

export interface EchoMindPlayerMemory {
  id: string;
  kind: EchoMindMemoryKind;
  text: string;
  createdAt: number;
  lastSeenAt: number;
  mentions: number;
}

export interface EchoMindPlayerTheory {
  id: string;
  text: string;
  status: EchoMindTheoryStatus;
  createdAt: number;
  updatedAt: number;
}

export interface EchoMindSavedTurn {
  id: string;
  userText: string;
  echoText: string;
  locale: EchoMindLocale;
  createdAt: number;
  usedVoice: boolean;
}

export interface EchoMindRelationship {
  bond: number;
  openness: number;
  tension: number;
  conversations: number;
  voiceConversations: number;
  lastInteractionAt: number | null;
}

export interface EchoMindIntrusion {
  id: string;
  tone: EchoMindIntrusionTone;
  text: { ar: string; en: string };
  caption: { ar: string; en: string };
  createdAt: number;
  availableAfter: number;
  seen: boolean;
}

export interface EchoMindAccessibilityPreferences {
  autoSpeakReplies: boolean;
  captionsEnabled: boolean;
  signalSoundsEnabled: boolean;
  voiceVolume: number;
  signalVolume: number;
}

export interface EchoMindPersistedState {
  preferences: EchoMindAccessibilityPreferences;
}

interface EchoMindLivingState {
  playerName: string | null;
  memories: EchoMindPlayerMemory[];
  theories: EchoMindPlayerTheory[];
  turns: EchoMindSavedTurn[];
  relationship: EchoMindRelationship;
  intrusions: EchoMindIntrusion[];
  preferences: EchoMindAccessibilityPreferences;
  recordTurn: (input: {
    userText: string;
    echoText: string;
    locale: EchoMindLocale;
    usedVoice: boolean;
    timestamp?: number;
  }) => void;
  addTheory: (text: string, timestamp?: number) => boolean;
  setTheoryStatus: (
    id: string,
    status: EchoMindTheoryStatus,
    timestamp?: number,
  ) => void;
  markIntrusionSeen: (id: string) => void;
  setPreferences: (
    preferences: Partial<EchoMindAccessibilityPreferences>,
  ) => void;
  clearPersonalMemory: () => void;
}

const DEFAULT_RELATIONSHIP: EchoMindRelationship = {
  bond: 24,
  openness: 18,
  tension: 12,
  conversations: 0,
  voiceConversations: 0,
  lastInteractionAt: null,
};

const DEFAULT_PREFERENCES: EchoMindAccessibilityPreferences = {
  autoSpeakReplies: false,
  captionsEnabled: true,
  signalSoundsEnabled: true,
  voiceVolume: 0.82,
  signalVolume: 0.42,
};

function clampMetric(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function cleanText(value: string, maximum = 180): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximum);
}

function normalizeText(value: string): string {
  return cleanText(value, 240)
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي');
}

/**
 * The only Echo Mind state allowed to cross the browser persistence boundary.
 * Keeping this as a small pure function makes the privacy contract testable
 * without depending on the browser's storage implementation.
 */
export function partializeEchoMindLivingState(
  state: Pick<EchoMindLivingState, 'preferences'>,
): EchoMindPersistedState {
  return { preferences: state.preferences };
}

function stableId(prefix: string, value: string): string {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}_${(hash >>> 0).toString(36)}`;
}

function includesAny(value: string, phrases: readonly string[]): boolean {
  return phrases.some((phrase) => value.includes(phrase));
}

function extractName(text: string): string | null {
  const match = cleanText(text, 240).match(
    /(?:أنا اسمي|انا اسمي|اسمي|my name is|i am called)\s+([\p{L}][\p{L}\p{M}'-]{1,30})/iu,
  );
  return match?.[1] ?? null;
}

export function extractEchoMindPlayerMemories(
  text: string,
  timestamp: number,
): EchoMindPlayerMemory[] {
  const normalized = normalizeText(text);
  const cleaned = cleanText(text);
  const memories: EchoMindPlayerMemory[] = [];
  const name = extractName(text);

  const add = (kind: EchoMindMemoryKind, memoryText: string) => {
    const value = cleanText(memoryText);
    if (!value) return;
    memories.push({
      id: stableId(`echo_${kind}`, normalizeText(value)),
      kind,
      text: value,
      createdAt: timestamp,
      lastSeenAt: timestamp,
      mentions: 1,
    });
  };

  if (name) add('name', name);
  if (includesAny(normalized, [
    'انا حزين', 'انا زعلان', 'انا خايف', 'انا خائف', 'انا تعبان',
    'i am sad', "i'm sad", 'i am afraid', "i'm scared", 'i am tired',
  ])) add('feeling', cleaned);
  if (includesAny(normalized, [
    'انا بحب', 'انا احب', 'بحب ', 'ما بحب', 'اكره',
    'i like ', 'i love ', 'i dislike ', 'i hate ',
  ])) add('preference', cleaned);
  if (includesAny(normalized, [
    'اوعدك', 'أوعدك', 'رح ارجع', 'سوف اعود',
    'i promise', 'i will come back', "i'll come back",
  ])) add('promise', cleaned);

  return memories;
}

export function deriveEchoMindRelationship(
  current: EchoMindRelationship,
  userText: string,
  usedVoice: boolean,
  timestamp: number,
): EchoMindRelationship {
  const normalized = normalizeText(userText);
  const supportive = includesAny(normalized, [
    'انا معك', 'بحبك', 'احبك', 'اثق فيك', 'لن اتركك', 'ما رح اتركك',
    'i am with you', "i'm with you", 'i love you', 'i trust you',
  ]);
  const hostile = includesAny(normalized, [
    'اكرهك', 'كذاب', 'غبي', 'اسكت', 'لن اساعدك',
    'i hate you', 'liar', 'stupid', 'shut up',
  ]);
  const disclosure = includesAny(normalized, [
    'انا ', 'اسمي ', 'اشعر', 'حسيت', 'خايف', 'حزين',
    'i am ', "i'm ", 'my name is', 'i feel ',
  ]);
  const question = /[؟?]\s*$/.test(userText);

  return {
    bond: clampMetric(
      current.bond + 1 + (supportive ? 4 : 0) - (hostile ? 5 : 0),
    ),
    openness: clampMetric(
      current.openness + (disclosure ? 3 : 0) + (question ? 1 : 0),
    ),
    tension: clampMetric(
      current.tension + (hostile ? 7 : 0) - (supportive ? 2 : 0),
    ),
    conversations: current.conversations + 1,
    voiceConversations: current.voiceConversations + (usedVoice ? 1 : 0),
    lastInteractionAt: timestamp,
  };
}

function mergeMemories(
  current: EchoMindPlayerMemory[],
  incoming: EchoMindPlayerMemory[],
): EchoMindPlayerMemory[] {
  const merged = new Map(current.map((memory) => [memory.id, memory]));
  for (const memory of incoming) {
    const existing = merged.get(memory.id);
    merged.set(memory.id, existing ? {
      ...existing,
      lastSeenAt: memory.lastSeenAt,
      mentions: existing.mentions + 1,
    } : memory);
  }
  return [...merged.values()]
    .sort((left, right) => right.lastSeenAt - left.lastSeenAt)
    .slice(0, 24);
}

export function createEchoMindIntrusion(
  _relationship: EchoMindRelationship,
  _playerName: string | null,
  _timestamp: number,
): EchoMindIntrusion | null {
  // Stage 3 deliberately removes the old "every third message" intrusion.
  // A companion answers explicit player intent or a verified gameplay event;
  // it never interrupts a menu simply because a counter was reached.
  return null;
}

export const useEchoMindLivingStore = create<EchoMindLivingState>()(
  persist(
    (set, get) => ({
      playerName: null,
      memories: [],
      theories: [],
      turns: [],
      relationship: { ...DEFAULT_RELATIONSHIP },
      intrusions: [],
      preferences: { ...DEFAULT_PREFERENCES },
      recordTurn(input) {
        const timestamp = input.timestamp ?? Date.now();
        const userText = cleanText(input.userText, 1_200);
        const echoText = cleanText(input.echoText, 2_000);
        if (!userText || !echoText) return;
        const state = get();
        const incomingMemories = extractEchoMindPlayerMemories(
          userText,
          timestamp,
        );
        const playerName = extractName(userText) ?? state.playerName;
        const relationship = deriveEchoMindRelationship(
          state.relationship,
          userText,
          input.usedVoice,
          timestamp,
        );
        set({
          playerName,
          memories: mergeMemories(state.memories, incomingMemories),
          relationship,
          turns: [
            ...state.turns,
            {
              id: `turn_${timestamp}_${state.turns.length + 1}`,
              userText,
              echoText,
              locale: input.locale,
              createdAt: timestamp,
              usedVoice: input.usedVoice,
            },
          // Four turns are exactly eight player/companion messages.
          ].slice(-4),
          // Kept empty for backward-compatible state shape. Companion cues
          // are now authored/deterministic and attached to player intent or
          // verified gameplay instead of spontaneous overlays.
          intrusions: [],
        });
      },
      addTheory(text, timestamp = Date.now()) {
        const cleaned = cleanText(text, 240);
        if (cleaned.length < 4) return false;
        const state = get();
        const id = stableId('theory', normalizeText(cleaned));
        if (state.theories.some((theory) => theory.id === id)) return false;
        const theory: EchoMindPlayerTheory = {
          id,
          text: cleaned,
          status: 'open',
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        set({ theories: [theory, ...state.theories].slice(0, 16) });
        return true;
      },
      setTheoryStatus(id, status, timestamp = Date.now()) {
        set((state) => ({
          theories: state.theories.map((theory) => (
            theory.id === id
              ? { ...theory, status, updatedAt: timestamp }
              : theory
          )),
        }));
      },
      markIntrusionSeen(id) {
        set((state) => ({
          intrusions: state.intrusions.map((intrusion) => (
            intrusion.id === id ? { ...intrusion, seen: true } : intrusion
          )),
        }));
      },
      setPreferences(preferences) {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...preferences,
            voiceVolume: Math.min(
              1,
              Math.max(0, preferences.voiceVolume ?? state.preferences.voiceVolume),
            ),
            signalVolume: Math.min(
              1,
              Math.max(0, preferences.signalVolume ?? state.preferences.signalVolume),
            ),
          },
        }));
      },
      clearPersonalMemory() {
        set({
          playerName: null,
          memories: [],
          theories: [],
          turns: [],
          relationship: { ...DEFAULT_RELATIONSHIP },
          intrusions: [],
        });
      },
    }),
    {
      name: ECHO_MIND_LIVING_STORAGE_KEY,
      version: 3,
      // Never persist raw player dialogue, names, inferred feelings,
      // relationship scores, or theories. The active session holds at most
      // four turns (eight messages) and is cleared on reload/Forget.
      partialize: (state): EchoMindPersistedState => (
        partializeEchoMindLivingState(state)
      ),
    },
  ),
);
