import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LockKeyhole,
  Maximize2,
} from 'lucide-react';
import {
  FINAL_MANHWA_CHAPTERS,
  FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER,
  FINAL_MANHWA_PAGES,
  getFinalManhwaChapter,
} from '../../content/manhwa/finalManhwa';
import { useGameStore } from '../../stores/gameStore';
import { usePlayerProgressionStore } from '../player-progression/playerProgressionStore';
import { useAuthStore } from '../auth/authStore';
import { useStoryPuzzleStore } from '../story-puzzles/storyPuzzleStore';
import { useShellStore, useUiPreferencesStore } from '../../app/shell/shellStore';
import {
  GameButton,
  GlassPanel,
} from '../../ui/design-system';
import { ManhwaFullscreenViewer } from '../manhwa/ManhwaFullscreenViewer';
import './manhwa-archive.css';
import { recordEchoPresenceActivity } from '../../application/ui/echoPresenceActivityStore';
import { emitExperienceCue } from '../../ui/presentation/experienceCues';
import {
  deriveStoryPuzzleManhwaAccess,
} from '../../domain/manhwa/storyPuzzleManhwaAccess';
import { STORY_PUZZLE_BY_ID } from '../../content/puzzles/storyPuzzleCatalog';

const MEMORY_COPY = {
  ar: { title: 'المانهوا', read: 'صفحات مقروءة', progress: 'التقدم الكلي', revealed: 'صفحات مكشوفة', gate: 'مسار كشف صفحات المانهوا', window: 'نافذة القراءة الحالية: الصفحة', readUntil: 'اقرأ الصفحات بالترتيب حتى الصفحة', thenSolve: 'ثم حل', revealNext: 'لكشف الدفعة التالية.', complete: 'اكتمل المسار الرئيسي وأصبحت النسخة كاملة متاحة للقراءة.', choose: 'اختر الفصل', previous: 'اقرأ الصفحة السابقة أولًا', locked: 'مقفل حتى إكمال لغز القصة السابق', completed: 'مكتمل', lockedLabel: 'مقفل', continue: 'متابعة القراءة — الصفحة', approved: 'النسخة النهائية المعتمدة', previousPage: 'الصفحة السابقة', nextPage: 'الصفحة التالية', open: 'فتح القارئ', timeline: 'تقدم الفصول', drag: 'اسحب داخل القارئ للتنقل بين الصفحات', page: 'الصفحة', requiresPrevious: 'تتطلب قراءة الصفحة السابقة', requiresPuzzle: 'تتطلب حل لغز القصة', nextPageUnavailable: 'تعذر تحديد الصفحة التالية. حاول فتح القارئ مرة أخرى.', pageRecorded: 'تم تسجيل قراءة الصفحة', chapterRecorded: 'واكتملت مكافأة XP مرة واحدة.' },
  en: { title: 'Manhwa', read: 'pages read', progress: 'overall progress', revealed: 'pages revealed', gate: 'Manhwa page-unlock path', window: 'Current reading window: page', readUntil: 'Read in order through page', thenSolve: 'then solve', revealNext: 'to reveal the next group.', complete: 'The main path is complete; the full edition is ready to read.', choose: 'Choose chapter', previous: 'Read the previous page first', locked: 'Locked until the previous story puzzle is complete', completed: 'Complete', lockedLabel: 'Locked', continue: 'Continue reading — page', approved: 'Final approved edition', previousPage: 'Previous page', nextPage: 'Next page', open: 'Open reader', timeline: 'Chapter progress', drag: 'Drag inside the reader to move between pages', page: 'Page', requiresPrevious: 'requires reading the previous page', requiresPuzzle: 'requires solving the story puzzle', nextPageUnavailable: 'Could not determine the next page. Try opening the reader again.', pageRecorded: 'Reading recorded for page', chapterRecorded: 'and its XP reward was recorded once.' },
} as const;

function pageKindLabel(pageKind: string, locale: 'ar' | 'en'): string {
  if (locale === 'en') {
    switch (pageKind) {
      case 'cover': return 'Cover'; case 'credits': return 'Credits'; case 'chapter-cover': return 'Chapter cover'; case 'teaser': return 'Next-part teaser'; case 'back-cover': return 'Back cover'; default: return 'Manhwa page';
    }
  }
  switch (pageKind) {
    case 'cover': return 'الغلاف';
    case 'credits': return 'الحقوق والاعتمادات';
    case 'chapter-cover': return 'غلاف الفصل';
    case 'teaser': return 'إعلان الجزء التالي';
    case 'back-cover': return 'الغلاف الخلفي';
    default: return 'صفحة المانهوا';
  }
}

export default function MemoryScreen() {
  const locale = useUiPreferencesStore((state) => state.locale);
  const copy = MEMORY_COPY[locale];
  const progressionState = useGameStore((state) => state.progressionState);
  const viewManhwaPage = useGameStore((state) => state.actions.viewManhwaPage);
  const recordReadingProgress = useGameStore(
    (state) => state.actions.recordManhwaReadingProgress,
  );
  const markChapterCompleted = useGameStore(
    (state) => state.actions.markManhwaChapterCompleted,
  );
  const syncAuthoritativeStoryState = useGameStore(
    (state) => state.actions.syncAuthoritativeStoryState,
  );
  const authStatus = useAuthStore((state) => state.status);
  const claimManhwaChapterReward = usePlayerProgressionStore(
    (state) => state.actions.claimManhwaChapterReward,
  );
  const loadProfile = usePlayerProgressionStore((state) => state.actions.loadProfile);
  const loadLeaderboard = usePlayerProgressionStore(
    (state) => state.actions.loadLeaderboard,
  );
  const claimManhwaStoryCheckpoint = usePlayerProgressionStore(
    (state) => state.actions.claimManhwaStoryCheckpoint,
  );
  const refreshStoryPuzzles = useStoryPuzzleStore(
    (state) => state.actions.load,
  );
  const storyPuzzleSnapshot = useStoryPuzzleStore((state) => state.snapshot);
  const readerLaunchRequested = useShellStore(
    (state) => state.manhwaReaderLaunchRequested,
  );
  const consumeReaderLaunch = useShellStore(
    (state) => state.consumeManhwaReaderLaunch,
  );
  const manhwaAccess = useMemo(() => deriveStoryPuzzleManhwaAccess(
    storyPuzzleSnapshot?.entries
      .filter((entry) => entry.status === 'completed')
      .map((entry) => entry.puzzleId) ?? [],
  ), [storyPuzzleSnapshot]);
  const accessiblePageIds = useMemo(
    () => new Set(manhwaAccess.accessiblePageIds),
    [manhwaAccess.accessiblePageIds],
  );
  const accessiblePages = useMemo(
    () => FINAL_MANHWA_PAGES.filter((page) => accessiblePageIds.has(page.id)),
    [accessiblePageIds],
  );
  const viewedPageIds = useMemo(
    () => new Set(progressionState.manhwa.viewedPageIds),
    [progressionState.manhwa.viewedPageIds],
  );
  const firstUnreadPage = accessiblePages.find((page) => !viewedPageIds.has(page.id));
  const maxSequentialPage = firstUnreadPage?.globalPageNumber
    ?? manhwaAccess.maxAccessibleGlobalPage;
  const readerPages = useMemo(
    () => accessiblePages.filter((page) => page.globalPageNumber <= maxSequentialPage),
    [accessiblePages, maxSequentialPage],
  );
  const readerPageIds = useMemo(
    () => new Set(readerPages.map((page) => page.id)),
    [readerPages],
  );
  const nextGatePuzzle = manhwaAccess.nextGatePuzzleId
    ? STORY_PUZZLE_BY_ID[manhwaAccess.nextGatePuzzleId]
    : undefined;
  const savedPageNumber = progressionState.manhwa.lastReadGlobalPageNumber;
  const [activePageNumber, setActivePageNumber] = useState(
    savedPageNumber && FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[savedPageNumber]
      ? savedPageNumber
      : 1,
  );
  const [viewerPageId, setViewerPageId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const completionClaims = useRef(new Set<string>());

  const requestedActivePage = FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[activePageNumber];
  const activePage = requestedActivePage && readerPageIds.has(requestedActivePage.id)
    ? requestedActivePage
    : readerPages.at(-1) ?? FINAL_MANHWA_PAGES[0]!;
  const activeChapter = activePage && activePage.chapterId !== 'chapter_0'
    ? getFinalManhwaChapter(activePage.chapterId)
    : undefined;
  const continuePage = savedPageNumber
    ? FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[savedPageNumber]
    : undefined;
  const viewedCount = FINAL_MANHWA_PAGES.filter((page) => viewedPageIds.has(page.id)).length;
  const progressPercent = Math.floor(
    (viewedCount / FINAL_MANHWA_PAGES.length) * 100,
  );

  useEffect(() => {
    if (requestedActivePage && readerPageIds.has(requestedActivePage.id)) return;
    setActivePageNumber(readerPages.at(-1)?.globalPageNumber ?? 1);
    setViewerPageId(null);
  }, [readerPageIds, readerPages, requestedActivePage]);

  const openViewer = useCallback((pageId: string) => {
    const page = FINAL_MANHWA_PAGES.find((candidate) => candidate.id === pageId);
    if (!page || !readerPageIds.has(page.id)) return;
    setActivePageNumber(page.globalPageNumber);
    setViewerPageId(page.id);
    emitExperienceCue({ name: 'manhwa-open', sourceId: page.id });
  }, [readerPageIds]);

  const handleViewerRequestClose = useCallback(() => {
    setViewerPageId(null);
  }, []);

  useEffect(() => {
    if (!readerLaunchRequested) return;
    consumeReaderLaunch();
    const pageToOpen = firstUnreadPage ?? activePage;
    if (!pageToOpen || !readerPageIds.has(pageToOpen.id)) {
      setAnnouncement(copy.nextPageUnavailable);
      return;
    }
    openViewer(pageToOpen.id);
  }, [
    activePage,
    consumeReaderLaunch,
    firstUnreadPage,
    openViewer,
    readerLaunchRequested,
    copy.nextPageUnavailable,
    readerPageIds,
  ]);

  const handleImageLoaded = useCallback((pageId: string) => {
    const page = FINAL_MANHWA_PAGES.find((candidate) => candidate.id === pageId);
    if (!page) return;
    const pageChapter = page.chapterId !== 'chapter_0'
      ? getFinalManhwaChapter(page.chapterId)
      : undefined;
    setActivePageNumber(page.globalPageNumber);
    const viewResult = viewManhwaPage(page.id);
    recordReadingProgress(
      page.id,
      page.globalPageNumber,
      page.chapterId === 'chapter_0' ? null : page.chapterId,
    );
    const storyCheckpointPromise = authStatus === 'signed-in'
      ? claimManhwaStoryCheckpoint({
        chapterId: page.chapterId,
        pageId: page.id,
        globalPageNumber: page.globalPageNumber,
      }).then((storyState) => {
        if (storyState) {
          syncAuthoritativeStoryState(storyState);
          void refreshStoryPuzzles(true);
        }
        return storyState;
      })
      : undefined;
    if (
      !pageChapter
      || page.globalPageNumber !== pageChapter.endPage
      || completionClaims.current.has(pageChapter.chapterId)
      || progressionState.manhwa.completedChapterIds.includes(pageChapter.chapterId)
    ) {
      if (viewResult.success && !viewResult.alreadyViewed) {
        setAnnouncement(`${copy.pageRecorded} ${page.globalPageNumber}.`);
      }
      return;
    }

    completionClaims.current.add(pageChapter.chapterId);
    void (storyCheckpointPromise ?? Promise.resolve(null)).then((storyState) => {
      if (authStatus === 'signed-in' && !storyState) return false;
      return claimManhwaChapterReward(
        pageChapter.chapterId,
        pageChapter.endPage,
      );
    }).then(async (success) => {
      if (!success) {
        completionClaims.current.delete(pageChapter.chapterId);
        return;
      }
      const chapterRecorded = markChapterCompleted(pageChapter.chapterId);
      if (chapterRecorded) {
        recordEchoPresenceActivity({
          kind: 'chapter-completed',
          sourceId: pageChapter.chapterId,
        });
      }
      setAnnouncement(`${pageChapter.title[locale]} ${copy.chapterRecorded}`);
      await Promise.allSettled([
        loadProfile(),
        loadLeaderboard(true),
      ]);
    });
  }, [
    activeChapter,
    authStatus,
    claimManhwaStoryCheckpoint,
    copy.chapterRecorded,
    copy.pageRecorded,
    claimManhwaChapterReward,
    loadLeaderboard,
    loadProfile,
    locale,
    markChapterCompleted,
    progressionState.manhwa.completedChapterIds,
    recordReadingProgress,
    refreshStoryPuzzles,
    syncAuthoritativeStoryState,
    viewManhwaPage,
  ]);

  const jumpToPage = (globalPageNumber: number) => {
    const page = FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[globalPageNumber];
    if (page && readerPageIds.has(page.id)) {
      setActivePageNumber(page.globalPageNumber);
    }
  };

  return (
    <div className="shell-screen manhwa-archive final-manhwa-reader" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <header className="shell-screen-heading manhwa-archive__heading final-manhwa-reader__heading">
        <span className="shell-screen-code">03</span>
        <span>
          <small>11.11 // FINAL PUBLICATION // 71 PAGES</small>
          <h1>{copy.title}</h1>
          <p lang="en">Final approved reading archive</p>
        </span>
        <div className="final-manhwa-reader__summary" aria-label={copy.progress}>
          <span>
            <strong>{viewedCount}/{FINAL_MANHWA_PAGES.length}</strong>
            <small>{copy.read}</small>
          </span>
          <span>
            <strong>{progressPercent}%</strong>
            <small>{copy.progress}</small>
          </span>
          <span>
            <strong>{accessiblePages.length}/71</strong>
            <small>{copy.revealed}</small>
          </span>
        </div>
      </header>

      <section className="final-manhwa-reader__gate" aria-label={copy.gate}>
        <span><BookOpen aria-hidden="true" /> {copy.window} 01—{String(manhwaAccess.maxAccessibleGlobalPage).padStart(2, '0')}</span>
        {nextGatePuzzle ? (
          <p>
            {copy.readUntil} <strong>{nextGatePuzzle.source.globalPageNumber}</strong>,
            {` ${copy.thenSolve} `}<strong>«{nextGatePuzzle.title[locale]}»</strong> {copy.revealNext}
          </p>
        ) : (
          <p><CheckCircle2 aria-hidden="true" /> {copy.complete}</p>
        )}
      </section>

      <p className="gds-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <div className="final-manhwa-reader__layout">
        <GlassPanel
          className="final-manhwa-reader__chapters"
          tone="memory"
          eyebrow="CHAPTER SELECT // 01—04"
          title={copy.choose}
        >
          <div className="final-manhwa-reader__chapter-list">
            {FINAL_MANHWA_CHAPTERS.map((chapter) => {
              const chapterPages = FINAL_MANHWA_PAGES.filter(
                (page) => page.chapterId === chapter.chapterId,
              );
              const chapterViewed = chapterPages.filter((page) => (
                viewedPageIds.has(page.id)
              )).length;
              const chapterComplete = progressionState.manhwa.completedChapterIds
                .includes(chapter.chapterId);
              const chapterUnlocked = chapter.startPage <= manhwaAccess.maxAccessibleGlobalPage;
              const chapterReadable = chapter.startPage <= maxSequentialPage;
              return (
                <button
                  key={chapter.chapterId}
                  type="button"
                  className="final-manhwa-reader__chapter"
                  data-active={activeChapter?.chapterId === chapter.chapterId}
                  data-locked={!chapterReadable}
                  disabled={!chapterReadable}
                  onClick={() => jumpToPage(chapter.startPage)}
                >
                  <span className="final-manhwa-reader__chapter-number">
                    {String(chapter.order).padStart(2, '0')}
                  </span>
                  <span className="final-manhwa-reader__chapter-copy">
                    <strong>{chapter.title[locale]}</strong>
                    <small>
                      {chapterReadable
                        ? `${chapter.startPage}—${Math.min(chapter.endPage, manhwaAccess.maxAccessibleGlobalPage)} // ${chapterViewed}/${chapterPages.length}`
                        : chapterUnlocked
                          ? copy.previous
                          : copy.locked}
                    </small>
                  </span>
                  {chapterReadable
                    ? chapterComplete && <CheckCircle2 aria-label={copy.completed} />
                    : <LockKeyhole aria-label={copy.lockedLabel} />}
                </button>
              );
            })}
          </div>
          {continuePage && readerPageIds.has(continuePage.id) && (
            <GameButton
              variant="memory"
              leadingIcon={<Clock3 />}
              onClick={() => openViewer(continuePage.id)}
            >
              {copy.continue} {continuePage.globalPageNumber}
            </GameButton>
          )}
        </GlassPanel>

        <GlassPanel
          className="final-manhwa-reader__preview"
          tone="memory"
          eyebrow={`PAGE ${String(activePage.globalPageNumber).padStart(2, '0')} // ${pageKindLabel(activePage.pageKind, locale)}`}
          title={activePage.title[locale]}
        >
          <article className="final-manhwa-reader__stage-card">
            <div className="final-manhwa-reader__preview-image-wrap">
              <img
                src={activePage.imageSrc}
                alt={activePage.accessibleDescription[locale]}
                loading="eager"
                decoding="async"
              />
              <span>PAGE {String(activePage.globalPageNumber).padStart(2, '0')} / 71</span>
            </div>
            <div className="final-manhwa-reader__preview-copy">
              <span className="final-manhwa-reader__status">
                <BookOpen aria-hidden="true" /> {copy.approved}
              </span>
              <p>{activePage.accessibleDescription[locale]}</p>
              <div className="final-manhwa-reader__controls">
                <GameButton
                  variant="ghost"
                  size="icon"
                  disabled={activePage.globalPageNumber <= 1}
                  onClick={() => jumpToPage(activePage.globalPageNumber - 1)}
                  aria-label={copy.previousPage}
                >
                  <ChevronRight />
                </GameButton>
                <GameButton
                  variant="memory"
                  leadingIcon={<Maximize2 />}
                  onClick={() => openViewer(activePage.id)}
                >
                  {copy.open}
                </GameButton>
                <GameButton
                  variant="ghost"
                  size="icon"
                  disabled={activePage.globalPageNumber >= maxSequentialPage}
                  onClick={() => jumpToPage(activePage.globalPageNumber + 1)}
                  aria-label={copy.nextPage}
                >
                  <ChevronLeft />
                </GameButton>
              </div>
            </div>
          </article>
        </GlassPanel>
      </div>

      <section className="final-manhwa-reader__timeline" aria-label={copy.timeline}>
        <div className="final-manhwa-reader__timeline-track">
          {FINAL_MANHWA_PAGES.map((page) => (
            <button
              key={page.id}
              type="button"
              className="final-manhwa-reader__timeline-page"
              data-current={activePage.id === page.id}
              data-viewed={viewedPageIds.has(page.id)}
              data-locked={!readerPageIds.has(page.id)}
              data-story-gated={!accessiblePageIds.has(page.id)}
              disabled={!readerPageIds.has(page.id)}
              onClick={() => jumpToPage(page.globalPageNumber)}
              aria-label={readerPageIds.has(page.id)
                ? `${copy.page} ${page.globalPageNumber}`
                : accessiblePageIds.has(page.id)
                  ? `${copy.page} ${page.globalPageNumber} ${copy.requiresPrevious}`
                  : `${copy.page} ${page.globalPageNumber} ${copy.requiresPuzzle}`}
            />
          ))}
        </div>
        <span>{copy.drag}</span>
      </section>

      {viewerPageId && (
        <ManhwaFullscreenViewer
          pages={readerPages}
          initialPageId={viewerPageId}
          onRequestClose={handleViewerRequestClose}
          onSuccessfulImageLoad={handleImageLoaded}
        />
      )}

      <div className="final-manhwa-reader__preload" aria-hidden="true">
        {[activePage.globalPageNumber - 1, activePage.globalPageNumber + 1]
          .map((pageNumber) => FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[pageNumber])
          .filter((page) => page && readerPageIds.has(page.id))
          .map((page) => (
            <img key={page.id} src={page.imageSrc} alt="" loading="eager" />
          ))}
      </div>
    </div>
  );
}
