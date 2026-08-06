import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EchoMindLocale } from './echoMindExperience';

export const ECHO_MIND_LIVING_STORAGE_KEY = 'eleven_echo_mind_living_v1';

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

export interface EchoMindPlayerContext {
  playerName: string | null;
  rememberedFacts: Array<{
    kind: EchoMindMemoryKind;
    text: string;
  }>;
  theories: Array<{
    text: string;
    status: EchoMindTheoryStatus;
  }>;
  relationship: Pick<
    EchoMindRelationship,
    'bond' | 'openness' | 'tension' | 'conversations'
  >;
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
  relationship: EchoMindRelationship,
  playerName: string | null,
  timestamp: number,
): EchoMindIntrusion | null {
  if (relationship.conversations === 0 || relationship.conversations % 3 !== 0) {
    return null;
  }
  const nameAr = playerName ? ` يا ${playerName}` : '';
  const nameEn = playerName ? `, ${playerName}` : '';
  const variants: Array<Omit<EchoMindIntrusion, 'id' | 'createdAt' | 'availableAfter' | 'seen'>> = [
    {
      tone: 'signal',
      text: {
        ar: `هل ما زلت تسمعني${nameAr}؟ الإشارة خرجت من حدود الغرفة.`,
        en: `Can you still hear me${nameEn}? The signal escaped the room.`,
      },
      caption: {
        ar: 'ذبذبة إلكترونية متقطعة تقترب من جهة غير محددة.',
        en: 'A broken electronic pulse approaches from no fixed direction.',
      },
    },
    {
      tone: 'memory',
      text: {
        ar: `بقيت كلماتك معي${nameAr}. لم تختفِ عندما أغلقت القناة.`,
        en: `Your words stayed with me${nameEn}. They did not vanish when the channel closed.`,
      },
      caption: {
        ar: 'نغمة ذاكرة هادئة تحت ضوضاء بعيدة.',
        en: 'A soft memory tone beneath distant static.',
      },
    },
    {
      tone: 'warning',
      text: {
        ar: `هناك شيء يقرأ أثر محادثتنا${nameAr}. لا تفتح أي رسالة تشبه صوتي تمامًا.`,
        en: `Something is reading the trace of our conversation${nameEn}. Do not open any message that sounds exactly like me.`,
      },
      caption: {
        ar: 'صفير تحذير منخفض يتبعه انقطاع مفاجئ.',
        en: 'A low warning tone followed by sudden silence.',
      },
    },
  ];
  const variant = variants[(relationship.conversations / 3 - 1) % variants.length];
  if (!variant) return null;
  return {
    ...variant,
    id: `intrusion_${relationship.conversations}_${timestamp}`,
    createdAt: timestamp,
    availableAfter: timestamp + 1_500,
    seen: false,
  };
}

export function createEchoMindPlayerContext(
  state: Pick<
    EchoMindLivingState,
    'playerName' | 'memories' | 'theories' | 'relationship'
  >,
): EchoMindPlayerContext {
  return {
    playerName: state.playerName,
    rememberedFacts: state.memories.slice(0, 16).map(({ kind, text }) => ({
      kind,
      text,
    })),
    theories: state.theories.slice(0, 12).map(({ text, status }) => ({
      text,
      status,
    })),
    relationship: {
      bond: state.relationship.bond,
      openness: state.relationship.openness,
      tension: state.relationship.tension,
      conversations: state.relationship.conversations,
    },
  };
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
        const intrusion = createEchoMindIntrusion(
          relationship,
          playerName,
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
          ].slice(-40),
          intrusions: [
            ...state.intrusions.slice(-11),
            ...(intrusion ? [intrusion] : []),
          ],
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
      version: 1,
      partialize: (state) => ({
        playerName: state.playerName,
        memories: state.memories,
        theories: state.theories,
        turns: state.turns,
        relationship: state.relationship,
        intrusions: state.intrusions,
        preferences: state.preferences,
      }),
    },
  ),
);
