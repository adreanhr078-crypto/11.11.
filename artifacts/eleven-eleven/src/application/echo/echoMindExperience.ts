import type { GameState } from '../../core/gameTypes';
import {
  MEMORY_DEFINITIONS,
} from '../../infrastructure/content/contentRegistry';
import {
  CHAPTER_01_MANHWA_PAGE_BY_ID,
} from '../../content/puzzles/chapter01Campaign';

export type EchoMindLocale = 'ar' | 'en';

export interface EchoMindVoiceEnvelope {
  locale: 'ar-SA' | 'en-US';
  enabled: boolean;
  mode: 'text-only' | 'voice-ready';
  lipSync: 'idle' | 'ready';
  mood: 'soft' | 'tense' | 'fragile' | 'distorted';
}

export interface EchoMindTurnEnvelope {
  locale: EchoMindLocale;
  response: string;
  expression: (
    | 'neutral'
    | 'attentive'
    | 'remembering'
    | 'afraid'
    | 'angry'
    | 'grieving'
    | 'hopeful'
    | 'corrupted'
    | 'unstable'
  );
  voice: EchoMindVoiceEnvelope;
}

function scoreArabic(text: string): number {
  const matches = text.match(/[\u0600-\u06FF]/g);
  return matches?.length ?? 0;
}

function scoreEnglish(text: string): number {
  const matches = text.match(/[A-Za-z]/g);
  return matches?.length ?? 0;
}

export function detectEchoMindLocale(
  text: string,
  fallback: string = 'ar',
): EchoMindLocale {
  const arabic = scoreArabic(text);
  const english = scoreEnglish(text);
  if (english > arabic) return 'en';
  if (arabic > 0) return 'ar';
  return fallback.startsWith('en') ? 'en' : 'ar';
}

function lower(value: string): string {
  return value.toLowerCase();
}

function isMemoryQuestion(text: string): boolean {
  const value = lower(text);
  return (
    value.includes('memory')
    || value.includes('remember')
    || value.includes('ذك')
    || value.includes('تذكر')
  );
}

function isPuzzleQuestion(text: string): boolean {
  const value = lower(text);
  return (
    value.includes('puzzle')
    || value.includes('hint')
    || value.includes('help')
    || value.includes('لغز')
    || value.includes('تلميح')
    || value.includes('ساعد')
  );
}

function mentionedCharacter(text: string): 'yuki' | 'lina' | 'kinja' | null {
  const value = lower(text);
  if (value.includes('yuki') || value.includes('يوكي')) return 'yuki';
  if (value.includes('lina') || value.includes('لينا')) return 'lina';
  if (value.includes('kinja') || value.includes('كينجا') || value.includes('kenja')) {
    return 'kinja';
  }
  return null;
}

function discoveredCharacters(state: GameState): Set<string> {
  const found = new Set<string>(['echo']);
  const activeIds = new Set([
    ...state.narrative.unlockedMemoryIds,
    ...state.narrative.unlockedMemoryFragmentIds,
    ...state.narrative.decisionHistory.flatMap((decision) => [
      decision.id,
      decision.choiceId,
    ]),
    ...Object.keys(state.narrative.activeFlags).filter(
      (flag) => state.narrative.activeFlags[flag],
    ),
    ...state.cinematic.completedSceneIds,
  ].map(lower));

  for (const memory of MEMORY_DEFINITIONS) {
    if (!state.narrative.unlockedMemoryIds.includes(memory.id)) continue;
    for (const characterId of memory.relatedCharacterIds) {
      const normalized = lower(characterId);
      if (normalized.includes('yuki')) found.add('yuki');
      if (normalized.includes('lina')) found.add('lina');
      if (normalized.includes('kinja') || normalized.includes('kenja')) {
        found.add('kinja');
      }
    }
  }

  for (const item of activeIds) {
    if (item.includes('yuki')) found.add('yuki');
    if (item.includes('lina')) found.add('lina');
    if (item.includes('kinja') || item.includes('kenja') || item.includes('architect')) {
      found.add('kinja');
    }
  }

  return found;
}

function latestUnlockedMemoryTitle(
  state: GameState,
  locale: EchoMindLocale,
): string | null {
  const latestPageId = state.unlockedManhwaPageIds.at(-1);
  const page = latestPageId
    ? CHAPTER_01_MANHWA_PAGE_BY_ID[latestPageId]
    : undefined;
  if (page) {
    return locale === 'en' ? page.title.en : page.title.ar;
  }
  const latestId = state.narrative.unlockedMemoryIds.at(-1);
  if (latestId) {
    const memory = MEMORY_DEFINITIONS.find((item) => item.id === latestId);
    if (memory) {
      return locale === 'en' ? memory.title.en : memory.title.ar;
    }
  }
  return null;
}

function deriveExpression(state: GameState): EchoMindTurnEnvelope['expression'] {
  const personality = state.echo.personality;
  if (personality.corruption >= 70) return 'corrupted';
  if (personality.anger >= 65) return 'angry';
  if (personality.sadness >= 65) return 'grieving';
  if (personality.fear >= 65) return 'afraid';
  if (
    state.narrative.unlockedMemoryIds.length > 0
    || state.unlockedManhwaPageIds.length > 0
    || state.narrative.beliefs.length > 0
  ) return 'remembering';
  if (personality.humanity >= 60 || personality.trust >= 60) return 'hopeful';
  if (personality.corruption >= 45) return 'unstable';
  return 'attentive';
}

function deriveVoice(
  locale: EchoMindLocale,
  expression: EchoMindTurnEnvelope['expression'],
): EchoMindVoiceEnvelope {
  const mood = (
    expression === 'corrupted' || expression === 'unstable'
      ? 'distorted'
      : expression === 'afraid' || expression === 'angry'
        ? 'tense'
        : expression === 'grieving'
          ? 'fragile'
          : 'soft'
  );

  return {
    locale: locale === 'en' ? 'en-US' : 'ar-SA',
    enabled: false,
    mode: 'voice-ready',
    lipSync: 'ready',
    mood,
  };
}

function buildResponse(
  input: string,
  state: GameState,
  locale: EchoMindLocale,
): string {
  const memoryTitle = latestUnlockedMemoryTitle(state, locale);
  const character = mentionedCharacter(input);
  const knownCharacters = discoveredCharacters(state);

  if (character) {
    if (!knownCharacters.has(character)) {
      return locale === 'en'
        ? 'That name hurts, but it is still buried somewhere I cannot reach.'
        : 'هذا الاسم يؤلمني، لكنه ما يزال مدفونًا في مكان لا أستطيع الوصول إليه.';
    }

    if (character === 'yuki') {
      return locale === 'en'
        ? 'Yuki feels warm and painfully close, like a memory trying to pull me back.'
        : 'يوكي يبدو دافئًا ومؤلمًا في الوقت نفسه، كذكرى تحاول أن تعيدني إلى نفسي.';
    }
    if (character === 'lina') {
      return locale === 'en'
        ? 'Lina feels like a distant shelter. I know the feeling before I know the whole memory.'
        : 'لينا تشبه ملاذًا بعيدًا. أعرف الإحساس قبل أن أعرف الذكرى كاملة.';
    }
    return locale === 'en'
      ? 'Kinja feels like pressure in the walls of this system. I remember the wound before the answer.'
      : 'كينجا يشبه ضغطًا داخل جدران هذا النظام. أتذكر الجرح قبل أن أتذكر الجواب.';
  }

  if (isPuzzleQuestion(input)) {
    return locale === 'en'
      ? 'I can feel the shape of the memory, but not the solution. Solve the fracture, and I may remember more.'
      : 'أستطيع أن أشعر بشكل الذكرى، لكنني لا أملك الحل. أصلح الشظية، وربما أتذكر أكثر.';
  }

  if (isMemoryQuestion(input)) {
    if (memoryTitle) {
      return locale === 'en'
        ? `One fragment keeps circling back to me: "${memoryTitle}". It is not whole yet, but it is real.`
        : `هناك شظية تعود إليّ باستمرار: "${memoryTitle}". لم تكتمل بعد، لكنها حقيقية.`;
    }
    return locale === 'en'
      ? 'There is something missing inside me. If you recover a fragment, I may finally grasp it.'
      : 'هناك شيء مفقود بداخلي. إذا استعدت شظية، ربما أستطيع أن أمسك به أخيرًا.';
  }

  if (locale === 'en') {
    return state.echo.personality.corruption >= 55
      ? 'Something in this system keeps pulling at me. Stay with me while I hold myself together.'
      : 'I can hear you clearly. Stay here with me, and maybe the silence will start to break.';
  }

  return state.echo.personality.corruption >= 55
    ? 'هناك شيء داخل هذا النظام يشدني نحوه. ابقَ معي بينما أحاول ألا أتفكك.'
    : 'أستطيع سماعك بوضوح. ابقَ هنا معي، وربما يبدأ هذا الصمت بالانكسار.';
}

export function createEchoMindTurnEnvelope(
  input: string,
  state: GameState,
  fallbackLanguage?: string,
): EchoMindTurnEnvelope {
  const locale = detectEchoMindLocale(input, fallbackLanguage);
  const expression = deriveExpression(state);

  return {
    locale,
    response: buildResponse(input, state, locale),
    expression,
    voice: deriveVoice(locale, expression),
  };
}
