import type {
  CanonChapter,
  CanonCharacter,
  CanonRegistry,
} from './canonTypes';

export const CANON_VERSION = 'long-fall-v1';

export const CANON_CHAPTERS = [
  {
    id: 'chapter_1',
    order: 1,
    title: { ar: 'الصحوة', en: 'Awakening' },
    publicationStatus: 'runtime-published',
  },
  {
    id: 'chapter_2',
    order: 2,
    title: {
      ar: 'المراقب الذي لا يرمش',
      en: 'The Watcher Who Never Blinks',
    },
    publicationStatus: 'runtime-published',
  },
  {
    id: 'chapter_3',
    order: 3,
    title: {
      ar: 'الأشياء التي يجب أن تنساها',
      en: 'Things You Must Forget',
    },
    publicationStatus: 'runtime-published',
  },
  {
    id: 'chapter_4',
    order: 4,
    title: { ar: 'غير مكشوف', en: 'Unrevealed' },
    publicationStatus: 'runtime-published',
  },
  ...(['chapter_5', 'chapter_6', 'chapter_7'] as const).map(
    (id, index): CanonChapter => ({
      id,
      order: index + 5,
      title: { ar: 'غير مكشوف', en: 'Unrevealed' },
      publicationStatus: 'unpublished',
    }),
  ),
] as const satisfies readonly CanonChapter[];

export const PUBLIC_CANON_CHARACTERS = [
  {
    id: 'echo',
    name: { ar: 'إيكو', en: 'Echo' },
    role: {
      ar: 'الطفل في قلب نظام 11:11',
      en: 'The child at the heart of the 11:11 System',
    },
    publicBio: {
      ar: 'يستيقظ إيكو بذاكرة ممزقة، ويحاول استعادة ما فقده دون أن يعرف الثمن الكامل للتذكّر.',
      en: 'Echo wakes with a fractured memory and tries to recover what was lost without knowing the full price of remembering.',
    },
  },
  {
    id: 'yuki',
    name: { ar: 'يوكي', en: 'Yuki' },
    role: {
      ar: 'الصديقة الأقرب إلى إيكو',
      en: "Echo's closest friend",
    },
    publicBio: {
      ar: 'اسم بقي حاضرًا عندما اختفت أسماء أخرى من ذاكرة إيكو.',
      en: "A name that remained when other names disappeared from Echo's memory.",
    },
  },
  {
    id: 'kenja',
    name: { ar: 'كينجا', en: 'Kenja' },
    role: {
      ar: 'والد إيكو والعالِم خلف التجربة',
      en: "Echo's father and the scientist behind the experiment",
    },
    publicBio: {
      ar: 'قاد تجربة مرتبطة بالوعي البشري ونظام 11:11، لكن دوافعه الكاملة لا تزال محجوبة.',
      en: 'He led an experiment tied to human consciousness and the 11:11 System, while his complete motives remain concealed.',
    },
  },
  {
    id: 'lina',
    name: { ar: 'لينا', en: 'Lina' },
    role: {
      ar: 'والدة إيكو',
      en: "Echo's mother",
    },
    publicBio: {
      ar: 'حضور مفقود في ذاكرة إيكو، ولا تزال حقيقة ما حدث لها غير مكتملة.',
      en: "A missing presence in Echo's memory whose fate has not yet been fully revealed.",
    },
  },
] as const satisfies readonly CanonCharacter[];

export const CANON_REGISTRY = Object.freeze({
  canonVersion: CANON_VERSION,
  storyStatus: 'ongoing',
  runtimePublishedChapterIds: ['chapter_1', 'chapter_2', 'chapter_3', 'chapter_4'],
  authoredInternalChapterIds: [],
  chapters: CANON_CHAPTERS,
  publicCharacters: PUBLIC_CANON_CHARACTERS,
} as const satisfies CanonRegistry);
