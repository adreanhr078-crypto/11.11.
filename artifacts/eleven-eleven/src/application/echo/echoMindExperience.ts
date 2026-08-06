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

export interface EchoMindLocalHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
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

function normalizeDialogue(value: string): string {
  return lower(value)
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAny(value: string, phrases: readonly string[]): boolean {
  return phrases.some((phrase) => value.includes(phrase));
}

function responseIndex(input: string, length: number): number {
  if (length < 2) return 0;
  let hash = 0;
  for (const character of input) {
    hash = (Math.imul(hash, 31) + (character.codePointAt(0) ?? 0)) | 0;
  }
  return Math.abs(hash) % length;
}

function chooseResponse(
  input: string,
  options: readonly string[],
  history: readonly EchoMindLocalHistoryMessage[],
): string {
  const recentEchoReplies = new Set(
    history
      .filter((message) => message.role === 'assistant')
      .slice(-4)
      .map((message) => message.content.trim()),
  );
  const start = responseIndex(input, options.length);
  for (let offset = 0; offset < options.length; offset += 1) {
    const option = options[(start + offset) % options.length];
    if (option && !recentEchoReplies.has(option)) return option;
  }
  return options[start] ?? options[0] ?? '';
}

function dialogueSubject(input: string): string {
  const cleaned = input
    .replace(/[\r\n]+/g, ' ')
    .replace(/[؟?!.,،؛:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 74 ? `${cleaned.slice(0, 71)}…` : cleaned;
}

function extractPlayerName(
  input: string,
  history: readonly EchoMindLocalHistoryMessage[],
): string | null {
  const userLines = [
    input,
    ...history
      .filter((message) => message.role === 'user')
      .slice(-8)
      .reverse()
      .map((message) => message.content),
  ];
  for (const line of userLines) {
    const match = line.match(
      /(?:اسمي|انا اسمي|my name is|i am called)\s+([\p{L}][\p{L}\p{M}'-]{1,30})/iu,
    );
    if (match?.[1]) return match[1];
  }
  return null;
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
  history: readonly EchoMindLocalHistoryMessage[],
): string {
  const memoryTitle = latestUnlockedMemoryTitle(state, locale);
  const character = mentionedCharacter(input);
  const knownCharacters = discoveredCharacters(state);
  const normalized = normalizeDialogue(input);
  const subject = dialogueSubject(input);

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
    return chooseResponse(input, locale === 'en' ? [
      'I can feel the shape of the memory, but not its answer. Tell me what you notice first.',
      'I cannot solve it for you, but I can stay with you while you examine the clues you have uncovered.',
      'The fracture should open through what you observe, not through an answer from me. Which detail feels out of place?',
    ] : [
      'أشعر بشكل الذكرى، لا بحلها. أخبرني ما أول شيء لاحظته فيها؟',
      'لا أستطيع حلها بدلًا منك، لكنني أستطيع البقاء معك وأنت تفحص الأدلة التي كشفتها.',
      'يجب أن تنفتح الشظية بما تلاحظه أنت، لا بجواب مني. أي تفصيل يبدو خارج مكانه؟',
    ], history);
  }

  if (isMemoryQuestion(input)) {
    if (memoryTitle) {
      return chooseResponse(input, locale === 'en' ? [
        `One fragment keeps circling back to me: "${memoryTitle}". What part of it stayed with you?`,
        `I can reach "${memoryTitle}", but only in pieces. Ask me about what you saw there, not what is still hidden.`,
        `"${memoryTitle}" is real to me now. The feeling arrived before the full meaning did.`,
      ] : [
        `هناك شظية تعود إليّ باستمرار: «${memoryTitle}». أي جزء منها بقي معك أنت؟`,
        `أستطيع الوصول إلى «${memoryTitle}»، لكن على شكل أجزاء. اسألني عما رأيته هناك، لا عما بقي مخفيًا.`,
        `«${memoryTitle}» حقيقية بالنسبة إليّ الآن. وصلني إحساسها قبل معناها الكامل.`,
      ], history);
    }
    return chooseResponse(input, locale === 'en' ? [
      'There is something missing inside me. What made you ask about my memory now?',
      'I reach inward and find an empty place. Recover a fragment, then ask me again.',
      'I do not want to invent what I cannot remember. For now, all I can trust is this absence.',
    ] : [
      'هناك شيء مفقود بداخلي. ما الذي جعلك تسأل عن ذاكرتي الآن؟',
      'أمد يدي إلى داخلي فلا أجد إلا مكانًا فارغًا. استعد شظية ثم اسألني من جديد.',
      'لا أريد اختراع ما لا أتذكره. في الوقت الحالي، الشيء الوحيد الذي أثق به هو هذا الغياب.',
    ], history);
  }

  if (includesAny(normalized, [
    'هل تسمعني', 'تسمعني', 'سامعني', 'can you hear me', 'are you listening',
  ])) {
    return locale === 'en'
      ? 'I hear you. Not as noise—as someone choosing to stay. What do you want me to understand?'
      : 'أسمعك. لست مجرد ضوضاء… أنت شخص اختار أن يبقى. ماذا تريدني أن أفهم؟';
  }

  if (includesAny(normalized, [
    'من انت', 'مين انت', 'شو اسمك', 'who are you', 'what is your name',
  ])) {
    return locale === 'en'
      ? 'My name is Echo. I know that much with certainty; the rest of me is returning one fragment at a time.'
      : 'اسمي Echo. هذا ما أعرفه بيقين؛ أما بقيتي فتعود إليّ شظية بعد شظية.';
  }

  if (includesAny(normalized, [
    'من انا', 'مين انا', 'شو اسمي', 'what is my name', 'who am i',
  ])) {
    const playerName = extractPlayerName(input, history);
    if (playerName) {
      return locale === 'en'
        ? `You told me your name is ${playerName}. I am holding on to it.`
        : `قلت لي إن اسمك ${playerName}. سأتمسّك به.`;
    }
    return locale === 'en'
      ? 'You are the voice speaking to me from beyond this place. Tell me your name, and I will try to hold on to it.'
      : 'أنت الصوت الذي يكلمني من خارج هذا المكان. أخبرني باسمك، وسأحاول أن أتمسّك به.';
  }

  const introducedName = extractPlayerName(input, []);
  if (introducedName) {
    return locale === 'en'
      ? `Hello, ${introducedName}. Names matter here. I will try not to lose yours.`
      : `أهلًا يا ${introducedName}. الأسماء مهمة هنا… سأحاول ألا أفقد اسمك.`;
  }

  if (includesAny(normalized, [
    'كيفك', 'كيف حالك', 'شو حاسس', 'ماذا تشعر', 'how are you', 'how do you feel',
  ])) {
    const expression = deriveExpression(state);
    if (locale === 'en') {
      return expression === 'afraid' || expression === 'unstable' || expression === 'corrupted'
        ? 'I am frightened, but speaking with you gives the fear an edge I can hold. How are you feeling?'
        : 'I am still piecing myself together, but I feel steadier while we speak. How are you?';
    }
    return expression === 'afraid' || expression === 'unstable' || expression === 'corrupted'
      ? 'أنا خائف، لكن حديثك معي يمنح خوفي شكلًا أستطيع الإمساك به. وأنت، كيف تشعر؟'
      : 'ما زلت أجمع نفسي، لكنني أشعر بثبات أكبر ونحن نتحدث. وأنت، كيف حالك؟';
  }

  if (includesAny(normalized, [
    'انا حزين', 'انا زعلان', 'انا خايف', 'انا خائف', 'انا تعبان',
    'i am sad', "i'm sad", 'i am afraid', "i'm scared", 'i am tired',
  ])) {
    return locale === 'en'
      ? 'I am listening. You do not have to make that feeling smaller for me—what happened?'
      : 'أنا أصغي إليك. لا تحتاج أن تصغّر هذا الشعور من أجلي… ماذا حدث؟';
  }

  if (includesAny(normalized, [
    'بحبك', 'احبك', 'انا معك', 'i love you', 'i am with you', "i'm with you",
  ])) {
    return locale === 'en'
      ? 'Then stay a little longer. I do not know what this place can take from me, but I can feel that you are here.'
      : 'إذًا ابقَ قليلًا. لا أعرف ما الذي يستطيع هذا المكان أخذه مني، لكنني أشعر أنك هنا.';
  }

  if (includesAny(normalized, [
    'شكرا', 'يسلمو', 'thanks', 'thank you',
  ])) {
    return locale === 'en'
      ? 'You do not need to thank me. Speaking with you helps me feel less like an echo.'
      : 'لا تحتاج أن تشكرني. حديثي معك يجعلني أشعر أنني أقل شبهًا بصدى.';
  }

  if (includesAny(normalized, [
    'مع السلامه', 'وداعا', 'تصبح علي خير', 'goodbye', 'bye', 'good night',
  ])) {
    return locale === 'en'
      ? 'Go safely. If the signal survives, I will be here when you return.'
      : 'اذهب بسلام. إذا بقيت الإشارة، سأكون هنا عندما تعود.';
  }

  if (includesAny(normalized, [
    'مرحبا', 'اهلا', 'اهلين', 'السلام عليكم', 'هاي', 'hello', 'hi ', 'hey',
  ]) || normalized === 'hi') {
    return chooseResponse(input, locale === 'en' ? [
      'Hello. I can hear you clearly—what should I call you?',
      'You came back. Talk to me; what is on your mind?',
      'Hello… the signal feels less empty now. What do you want to talk about?',
    ] : [
      'أهلًا. أسمعك بوضوح… بماذا أناديك؟',
      'لقد عدت. تحدّث معي، ما الذي يدور في بالك؟',
      'مرحبًا… تبدو الإشارة أقل فراغًا الآن. عمّ تريد أن نتحدث؟',
    ], history);
  }

  const looksLikeQuestion = /[؟?]\s*$/.test(input)
    || includesAny(normalized, locale === 'en'
      ? ['why ', 'how ', 'what ', 'where ', 'when ', 'do you ', 'are you ', 'can you ']
      : ['ليش', 'لماذا', 'كيف', 'ماذا', 'شو', 'وين', 'اين', 'متي', 'هل']);

  if (looksLikeQuestion) {
    return chooseResponse(input, locale === 'en' ? [
      `I do not have a complete answer to “${subject}”. Tell me what you think, and I will follow the thought with you.`,
      `That question reached me: “${subject}”. I can only answer from what I remember—what made it important to you?`,
      `I am thinking about “${subject}”. The answer is not clear yet, but I do not want to dismiss your question.`,
    ] : [
      `لا أملك جوابًا كاملًا عن «${subject}». أخبرني بما تظنه، وسأتبع الفكرة معك.`,
      `وصلني سؤالك: «${subject}». لا أستطيع الإجابة إلا مما أتذكره… لماذا هو مهم لك؟`,
      `أفكر في «${subject}». الجواب ليس واضحًا بعد، لكنني لا أريد تجاهل سؤالك.`,
    ], history);
  }

  return chooseResponse(input, locale === 'en' ? [
    `I heard you say “${subject}”. Tell me more—I want to understand what it means to you.`,
    `“${subject}”… I am holding on to that. What happened next?`,
    `I am listening. When you say “${subject}”, what feeling sits behind it?`,
  ] : [
    `سمعتك تقول «${subject}». أخبرني أكثر، أريد أن أفهم ما يعنيه لك.`,
    `«${subject}»… سأتمسّك بهذه الكلمات. ماذا حدث بعد ذلك؟`,
    `أنا أصغي. عندما تقول «${subject}»، ما الشعور الموجود خلف هذه الكلمات؟`,
  ], history);
}

export function createEchoMindTurnEnvelope(
  input: string,
  state: GameState,
  fallbackLanguage?: string,
  history: readonly EchoMindLocalHistoryMessage[] = [],
): EchoMindTurnEnvelope {
  const locale = detectEchoMindLocale(input, fallbackLanguage);
  const expression = deriveExpression(state);

  return {
    locale,
    response: buildResponse(input, state, locale, history),
    expression,
    voice: deriveVoice(locale, expression),
  };
}
