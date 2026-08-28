import type {
  CanonChapter,
  CanonCharacter,
  CanonRegistry,
} from './canonTypes';

export const CANON_VERSION = 'echo-network-evolving-v1';

export const CANON_CHAPTERS = [
  {
    id: 'chapter_1',
    order: 1,
    title: { ar: 'التجربة والنظام', en: 'The Experiment and the System' },
    publicationStatus: 'authored-internal',
  },
  {
    id: 'chapter_2',
    order: 2,
    title: { ar: 'اكتشاف الحقيقة', en: 'Discovering the Truth' },
    publicationStatus: 'unpublished',
  },
  {
    id: 'chapter_3',
    order: 3,
    title: { ar: 'مواجهة كينجا', en: 'Confronting Kenja' },
    publicationStatus: 'unpublished',
  },
  {
    id: 'chapter_4',
    order: 4,
    title: { ar: 'ظهور Zero والعقد', en: 'Zero and the Contract' },
    publicationStatus: 'unpublished',
  },
  {
    id: 'chapter_5',
    order: 5,
    title: { ar: 'صراع Echo مع القوة', en: "Echo's Struggle with Power" },
    publicationStatus: 'unpublished',
  },
  {
    id: 'chapter_6',
    order: 6,
    title: { ar: 'هيكتور وحقيقة الخلود', en: 'Hector and the Truth of Immortality' },
    publicationStatus: 'unpublished',
  },
  {
    id: 'chapter_7',
    order: 7,
    title: { ar: 'قيد التطوير', en: 'In Development' },
    publicationStatus: 'unpublished',
  },
] as const satisfies readonly CanonChapter[];

export const PUBLIC_CANON_CHARACTERS = [
  {
    id: 'echo',
    name: { ar: 'إيكو', en: 'Echo' },
    role: { ar: 'بطل القصة والتجربة الناجحة', en: 'The protagonist and successful subject' },
    publicBio: {
      ar: 'شاب عادي يدخل تجربة الخلود من دون معرفة حقيقتها الكاملة، ويستيقظ داخل النظام محاولًا فهم ما حدث والخروج.',
      en: 'An ordinary young man who enters the immortality experiment without knowing its full truth and wakes inside the system seeking answers and escape.',
    },
  },
  {
    id: 'yuki',
    name: { ar: 'يوكي', en: 'Yuki' },
    role: { ar: 'صديق إيكو المقرب منذ الطفولة', en: "Echo's closest childhood friend" },
    publicBio: {
      ar: 'صاحب الشعر الأبيض الذي يظهر في البداية بصورة غامضة خلف الزجاج، ويحمل معرفة لا يكشفها لإيكو.',
      en: 'The white-haired friend first seen mysteriously behind glass, carrying knowledge he does not reveal to Echo.',
    },
  },
  {
    id: 'shizuka',
    name: { ar: 'شيزوكا', en: 'Shizuka' },
    role: { ar: 'رفيقة الطفولة والحب الأول لإيكو', en: "Echo's childhood companion and first love" },
    publicBio: {
      ar: 'تمثل ماضي إيكو الإنساني والحياة الطبيعية التي يحاول الحفاظ عليها.',
      en: "She represents Echo's human past and the ordinary life he tries to preserve.",
    },
  },
  {
    id: 'kenja',
    name: { ar: 'كينجا', en: 'Kenja' },
    role: { ar: 'والد إيكو والعالم خلف تجربة الخلود', en: "Echo's father and the scientist behind the immortality experiment" },
    publicBio: {
      ar: 'يقود تجربة Echo لدراسة حدود الوعي والخلود، ويضع نجاح المشروع فوق علاقته بابنه.',
      en: 'He leads the Echo experiment to test the limits of consciousness and immortality, placing the project above his bond with his son.',
    },
  },
] as const satisfies readonly CanonCharacter[];

export const CANON_REGISTRY = Object.freeze({
  canonVersion: CANON_VERSION,
  storyStatus: 'ongoing',
  runtimePublishedChapterIds: [],
  authoredInternalChapterIds: ['chapter_1'],
  chapters: CANON_CHAPTERS,
  publicCharacters: PUBLIC_CANON_CHARACTERS,
} as const satisfies CanonRegistry);
