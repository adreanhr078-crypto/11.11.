import {
  manhwaMemoryPageSchema,
  type CampaignLocalizedText,
  type EchoMindDelta,
  type ManhwaMemoryPageDefinition,
} from '../../domain/puzzles/campaignContracts';

export type FinalManhwaPageKind =
  | 'cover'
  | 'credits'
  | 'chapter-cover'
  | 'chapter-page'
  | 'teaser'
  | 'back-cover';

export interface FinalManhwaPage extends ManhwaMemoryPageDefinition {
  globalPageNumber: number;
  pageKind: FinalManhwaPageKind;
}

export interface FinalManhwaChapter {
  chapterId: `chapter_${1 | 2 | 3 | 4}`;
  order: 1 | 2 | 3 | 4;
  title: CampaignLocalizedText;
  startPage: number;
  endPage: number;
  coverPage: number;
  pageCount: number;
  xpReward: number;
  prerequisiteChapterId?: `chapter_${1 | 2 | 3 | 4}`;
}

/**
 * The final approved publication is the only active Manhwa source.
 * Page numbers below are the PDF's physical page numbers, not a rebuilt
 * or inferred sequence.
 */
export const FINAL_MANHWA_PAGE_COUNT = 71;
export const FINAL_MANHWA_MANIFEST_VERSION = 2;
export const FINAL_MANHWA_ASSET_ROOT = '/manhwa/final';

export const FINAL_MANHWA_XP_REWARDS: Readonly<Record<
  `chapter_${1 | 2 | 3 | 4}`,
  number
>> = Object.freeze({
  chapter_1: 100,
  chapter_2: 150,
  chapter_3: 200,
  chapter_4: 250,
});

export const FINAL_MANHWA_CHAPTERS: readonly FinalManhwaChapter[] = [
  {
    chapterId: 'chapter_1',
    order: 1,
    title: {
      ar: 'الفصل الأول - البداية التي لا تنتهي',
      en: 'Chapter 1 - The Beginning That Never Ends',
    },
    startPage: 3,
    endPage: 11,
    coverPage: 3,
    pageCount: 9,
    xpReward: FINAL_MANHWA_XP_REWARDS.chapter_1,
  },
  {
    chapterId: 'chapter_2',
    order: 2,
    title: {
      ar: 'الفصل الثاني - المراقب الذي لا يرمش',
      en: 'Chapter 2 - The Watcher Who Never Blinks',
    },
    startPage: 12,
    endPage: 28,
    coverPage: 12,
    pageCount: 17,
    xpReward: FINAL_MANHWA_XP_REWARDS.chapter_2,
    prerequisiteChapterId: 'chapter_1',
  },
  {
    chapterId: 'chapter_3',
    order: 3,
    title: {
      ar: 'الفصل الثالث - الثلاث عشرة ثانية',
      en: 'Chapter 3 - The Thirteen Seconds',
    },
    startPage: 29,
    endPage: 54,
    coverPage: 29,
    pageCount: 26,
    xpReward: FINAL_MANHWA_XP_REWARDS.chapter_3,
    prerequisiteChapterId: 'chapter_2',
  },
  {
    chapterId: 'chapter_4',
    order: 4,
    title: {
      ar: 'الفصل الرابع - بداية العالم الجديد',
      en: 'Chapter 4 - The Beginning of the New World',
    },
    startPage: 55,
    endPage: 69,
    coverPage: 55,
    pageCount: 15,
    xpReward: FINAL_MANHWA_XP_REWARDS.chapter_4,
    prerequisiteChapterId: 'chapter_3',
  },
];

const EMPTY_ECHO_DELTA: EchoMindDelta = {
  emotions: {},
  beliefsAdded: [],
  questionsAdded: [],
  knowledgeNodesAdded: [],
};

const localized = (ar: string, en: string): CampaignLocalizedText => ({
  ar,
  en,
});

function pageIdForChapter(chapterNumber: number, localPage: number): string {
  return `manhwa_ch${String(chapterNumber).padStart(2, '0')}_page_${String(localPage).padStart(2, '0')}`;
}

function createPage(
  globalPageNumber: number,
  id: string,
  chapterId: `chapter_${0 | 1 | 2 | 3 | 4}`,
  pageNumber: number,
  pageKind: FinalManhwaPageKind,
  title: CampaignLocalizedText,
  requiredShardIds: string[] = [],
): FinalManhwaPage {
  return {
    ...manhwaMemoryPageSchema.parse({
    id,
    chapterId,
    pageNumber,
    title,
    imageSrc: `${FINAL_MANHWA_ASSET_ROOT}/page-${String(globalPageNumber).padStart(3, '0')}.webp`,
    accessibleDescription: localized(
      `صفحة المانهوا النهائية رقم ${globalPageNumber} من النسخة المعتمدة.`,
      `Final approved Manhwa page ${globalPageNumber}.`,
    ),
    transcript: [],
    requiredShardIds,
    ...(pageNumber > 1 && chapterId === 'chapter_1'
      ? { prerequisitePageId: pageIdForChapter(1, pageNumber - 1) }
      : {}),
    restoredStatus: 'restored',
    echoMindDelta: EMPTY_ECHO_DELTA,
    narrativeFlags: [],
    dialogue: localized(
      'هذه الصفحة جزء من النسخة النهائية المعتمدة.',
      'This page is part of the final approved publication.',
    ),
    dialogueTriggers: [],
    globalPageNumber,
    }),
    globalPageNumber,
    pageKind,
  };
}

const bookPages: FinalManhwaPage[] = [
  createPage(1, 'manhwa_ch00_page_01', 'chapter_0', 1, 'cover', localized('الغلاف الأمامي', 'Front Cover')),
  createPage(2, 'manhwa_ch00_page_02', 'chapter_0', 2, 'credits', localized('الحقوق والاعتمادات', 'Credits')),
  createPage(70, 'manhwa_ch00_page_03', 'chapter_0', 3, 'teaser', localized('يتبع في الجزء الثاني', 'To Be Continued')),
  createPage(71, 'manhwa_ch00_page_04', 'chapter_0', 4, 'back-cover', localized('الغلاف الخلفي', 'Back Cover')),
];

function createChapterPages(
  chapter: FinalManhwaChapter,
): FinalManhwaPage[] {
  const chapterNumber = chapter.order;
  return Array.from({ length: chapter.pageCount }, (_, index) => {
    const localPage = index + 1;
    const globalPageNumber = chapter.startPage + index;
    const requiredShardIds = chapterNumber === 1 && localPage === 2
      ? Array.from(
          { length: 10 },
          (_, shardIndex) => `page02_shard_${String(shardIndex + 1).padStart(2, '0')}`,
        )
      : [];
    return createPage(
      globalPageNumber,
      pageIdForChapter(chapterNumber, localPage),
      chapter.chapterId,
      localPage,
      localPage === 1 ? 'chapter-cover' : 'chapter-page',
      localPage === 1
        ? chapter.title
        : localized(
            `صفحة ${localPage} - ${chapter.title.ar}`,
            `Page ${localPage} - ${chapter.title.en}`,
          ),
      requiredShardIds,
    );
  });
}

export const FINAL_MANHWA_PAGES: readonly FinalManhwaPage[] = Object.freeze([
  ...bookPages,
  ...FINAL_MANHWA_CHAPTERS.flatMap(createChapterPages),
].sort((left, right) => left.globalPageNumber - right.globalPageNumber));

const finalManhwaPageById = Object.fromEntries(
  FINAL_MANHWA_PAGES.map((page) => [page.id, page]),
) as Record<string, FinalManhwaPage>;

export const FINAL_MANHWA_PAGE_BY_ID = Object.freeze(finalManhwaPageById);

const finalManhwaPageByGlobalNumber = Object.fromEntries(
  FINAL_MANHWA_PAGES.map((page) => [page.globalPageNumber, page]),
) as Record<number, FinalManhwaPage>;

export const FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER = Object.freeze(
  finalManhwaPageByGlobalNumber,
);

export function getFinalManhwaChapter(
  chapterId: string,
): FinalManhwaChapter | undefined {
  return FINAL_MANHWA_CHAPTERS.find((chapter) => chapter.chapterId === chapterId);
}

export function getFinalManhwaPageByGlobalNumber(
  globalPageNumber: number,
): FinalManhwaPage | undefined {
  return FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[globalPageNumber];
}
