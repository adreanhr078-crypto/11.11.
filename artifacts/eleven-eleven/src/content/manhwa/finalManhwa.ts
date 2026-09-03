import {
  manhwaMemoryPageSchema,
  type CampaignLocalizedText,
  type EchoMindDelta,
  type ManhwaMemoryPageDefinition,
} from '../../domain/puzzles/campaignContracts';

export type FinalManhwaPageKind =
  | 'cover'
  | 'chapter-page'
  | 'outro';

export type FinalManhwaChapterId =
  | 'chapter_1'
  | 'chapter_2'
  | 'chapter_3'
  | 'chapter_4';

export interface FinalManhwaPage extends ManhwaMemoryPageDefinition {
  globalPageNumber: number;
  pageKind: FinalManhwaPageKind;
  /** Only Chapter 1 is playable in the current evidence-gated release. */
  published: boolean;
}

export interface FinalManhwaChapter {
  /** Presentation chapter ID retained for the shared game shell. */
  chapterId: FinalManhwaChapterId;
  /** Immutable receipt/source namespace for this publication revision. */
  publicationChapterId: string;
  order: 1 | 2 | 3 | 4;
  title: CampaignLocalizedText;
  startPage: number;
  endPage: number;
  /** Kept for archive UI compatibility; this PDF has no fabricated covers. */
  coverPage: number;
  pageCount: number;
  xpReward: number;
  prerequisiteChapterId?: FinalManhwaChapterId;
  published: boolean;
}

/**
 * Immutable identity for the corrected owner-supplied final PDF. Never reuse
 * this value for a re-export: change it and mint new page/source IDs.
 */
export const FINAL_MANHWA_PUBLICATION_ID = 'echo-network-final-2026-09-v1' as const;
export const FINAL_MANHWA_SOURCE_SHA256 =
  '6BE33FDD8A66210302AA44ED56D854B544F7A8B4C62AA57108557438571BFF1C' as const;
export const FINAL_MANHWA_PAGE_COUNT = 70;
export const FINAL_MANHWA_RELEASED_PAGE_COUNT = 9;
export const FINAL_MANHWA_MANIFEST_VERSION = 3;
export const FINAL_MANHWA_ASSET_ROOT =
  '/manhwa/echo-network-final-2026-09-v1';

export const FINAL_MANHWA_XP_REWARDS: Readonly<Record<
  FinalManhwaChapterId,
  number
>> = Object.freeze({
  chapter_1: 100,
  chapter_2: 150,
  chapter_3: 200,
  chapter_4: 250,
});

const publicationChapterId = (chapterId: FinalManhwaChapterId): string => (
  `${FINAL_MANHWA_PUBLICATION_ID}_${chapterId}`.replace(/-/g, '_')
);

/**
 * The PDF sequence is authoritative: cover p1, story pp2–69, outro p70.
 * Chapter divisions describe the approved reading arcs only; they never add
 * synthetic cover pages or alter source-page numbering.
 */
export const FINAL_MANHWA_CHAPTERS: readonly FinalManhwaChapter[] = Object.freeze([
  {
    chapterId: 'chapter_1',
    publicationChapterId: publicationChapterId('chapter_1'),
    order: 1,
    title: { ar: 'عتبة 11:11', en: 'The 11:11 Threshold' },
    startPage: 2,
    endPage: 9,
    coverPage: 2,
    pageCount: 8,
    xpReward: FINAL_MANHWA_XP_REWARDS.chapter_1,
    published: true,
  },
  {
    chapterId: 'chapter_2',
    publicationChapterId: publicationChapterId('chapter_2'),
    order: 2,
    title: { ar: 'أرشيف الذاكرة المفقودة', en: 'The Lost Memory Archive' },
    startPage: 10,
    endPage: 29,
    coverPage: 10,
    pageCount: 20,
    xpReward: FINAL_MANHWA_XP_REWARDS.chapter_2,
    prerequisiteChapterId: 'chapter_1',
    published: false,
  },
  {
    chapterId: 'chapter_3',
    publicationChapterId: publicationChapterId('chapter_3'),
    order: 3,
    title: { ar: 'اختبار الإنسان', en: 'The Human Trial' },
    startPage: 30,
    endPage: 47,
    coverPage: 30,
    pageCount: 18,
    xpReward: FINAL_MANHWA_XP_REWARDS.chapter_3,
    prerequisiteChapterId: 'chapter_2',
    published: false,
  },
  {
    chapterId: 'chapter_4',
    publicationChapterId: publicationChapterId('chapter_4'),
    order: 4,
    title: { ar: 'عقد Zero والعودة', en: 'Zero’s Contract and the Return' },
    startPage: 48,
    endPage: 69,
    coverPage: 48,
    pageCount: 22,
    xpReward: FINAL_MANHWA_XP_REWARDS.chapter_4,
    prerequisiteChapterId: 'chapter_3',
    published: false,
  },
]);

const EMPTY_ECHO_DELTA: EchoMindDelta = Object.freeze({
  emotions: {},
  beliefsAdded: [],
  questionsAdded: [],
  knowledgeNodesAdded: [],
});

const localized = (ar: string, en: string): CampaignLocalizedText => ({ ar, en });

function pageIdFor(globalPageNumber: number): string {
  return `${FINAL_MANHWA_PUBLICATION_ID.replace(/-/g, '_')}_page_${String(
    globalPageNumber,
  ).padStart(3, '0')}`;
}

function chapterForPage(globalPageNumber: number): FinalManhwaChapter | undefined {
  return FINAL_MANHWA_CHAPTERS.find((chapter) => (
    globalPageNumber >= chapter.startPage && globalPageNumber <= chapter.endPage
  ));
}

function descriptionForPage(
  globalPageNumber: number,
  chapter: FinalManhwaChapter | undefined,
): CampaignLocalizedText {
  if (globalPageNumber === 1) {
    return localized(
      'غلاف مانهوَا 11.11: Echo Network.',
      'Cover of 11.11: Echo Network.',
    );
  }
  if (globalPageNumber === FINAL_MANHWA_PAGE_COUNT) {
    return localized(
      'الصفحة الختامية لمانهوَا 11.11: Echo Network.',
      'Closing page of 11.11: Echo Network.',
    );
  }
  return localized(
    `صفحة ${globalPageNumber} من فصل «${chapter?.title.ar ?? '11.11'}» في مانهوَا Echo Network. النص الحواري جزء من الرسم المصدر.`,
    `Page ${globalPageNumber} of “${chapter?.title.en ?? '11.11'}” in the Echo Network Manhwa. Dialogue is embedded in the source art.`,
  );
}

function createPage(globalPageNumber: number): FinalManhwaPage {
  const chapter = chapterForPage(globalPageNumber);
  const chapterId = chapter?.chapterId ?? 'chapter_0';
  const pageNumber = chapter
    ? globalPageNumber - chapter.startPage + 1
    : globalPageNumber === 1 ? 1 : 2;
  const pageKind: FinalManhwaPageKind = globalPageNumber === 1
    ? 'cover'
    : globalPageNumber === FINAL_MANHWA_PAGE_COUNT
      ? 'outro'
      : 'chapter-page';
  const title = globalPageNumber === 1
    ? localized('11.11: Echo Network', '11.11: Echo Network')
    : globalPageNumber === FINAL_MANHWA_PAGE_COUNT
      ? localized('النهاية المؤقتة', 'Closing Threshold')
      : localized(
        `${chapter?.title.ar ?? '11.11'} — الصفحة ${pageNumber}`,
        `${chapter?.title.en ?? '11.11'} — Page ${pageNumber}`,
      );
  // The cover is the sole non-chapter page available in the opening slice.
  // Do not expose the closing page merely because it has no chapter wrapper:
  // direct API requests must obey the same release gate as the reader.
  const published = globalPageNumber === 1 || chapter?.published === true;

  return {
    ...manhwaMemoryPageSchema.parse({
      id: pageIdFor(globalPageNumber),
      chapterId,
      pageNumber,
      title,
      imageSrc: `${FINAL_MANHWA_ASSET_ROOT}/page-${String(globalPageNumber).padStart(3, '0')}.webp`,
      accessibleDescription: descriptionForPage(globalPageNumber, chapter),
      // The PDF is art-only; an authored transcript remains a separate
      // accessibility deliverable and is never fabricated from image OCR.
      transcript: [],
      requiredShardIds: [],
      restoredStatus: 'restored',
      echoMindDelta: EMPTY_ECHO_DELTA,
      narrativeFlags: [],
      dialogue: localized(
        'هذه الصفحة جزء من إصدار Echo Network المصحح.',
        'This page belongs to the corrected Echo Network publication.',
      ),
      dialogueTriggers: [],
      globalPageNumber,
      pageKind,
    }),
    globalPageNumber,
    pageKind,
    published,
  };
}

export const FINAL_MANHWA_PAGES: readonly FinalManhwaPage[] = Object.freeze(
  Array.from({ length: FINAL_MANHWA_PAGE_COUNT }, (_, index) => (
    createPage(index + 1)
  )),
);

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

export function getFinalManhwaChapterByPublicationId(
  publicationChapterId: string,
): FinalManhwaChapter | undefined {
  return FINAL_MANHWA_CHAPTERS.find((chapter) => (
    chapter.publicationChapterId === publicationChapterId
  ));
}

export function getFinalManhwaChapterRewardSourceId(chapterId: string): string | null {
  return getFinalManhwaChapter(chapterId)?.publicationChapterId ?? null;
}

export function getFinalManhwaPageByGlobalNumber(
  globalPageNumber: number,
): FinalManhwaPage | undefined {
  return FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[globalPageNumber];
}
