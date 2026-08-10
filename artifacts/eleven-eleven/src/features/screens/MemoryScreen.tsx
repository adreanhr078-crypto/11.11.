import {
  useCallback,
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
  Maximize2,
  Play,
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
import {
  GameButton,
  GlassPanel,
} from '../../ui/design-system';
import { ManhwaFullscreenViewer } from '../manhwa/ManhwaFullscreenViewer';
import './manhwa-archive.css';
import { recordEchoPresenceActivity } from '../../application/ui/echoPresenceActivityStore';

function pageKindLabel(pageKind: string): string {
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
  const savedPageNumber = progressionState.manhwa.lastReadGlobalPageNumber;
  const [activePageNumber, setActivePageNumber] = useState(
    savedPageNumber && FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[savedPageNumber]
      ? savedPageNumber
      : 1,
  );
  const [viewerPageId, setViewerPageId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const completionClaims = useRef(new Set<string>());

  const activePage = FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[activePageNumber]
    ?? FINAL_MANHWA_PAGES[0]!;
  const activeChapter = activePage && activePage.chapterId !== 'chapter_0'
    ? getFinalManhwaChapter(activePage.chapterId)
    : undefined;
  const continuePage = savedPageNumber
    ? FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[savedPageNumber]
    : undefined;
  const viewedPageIds = useMemo(
    () => new Set(progressionState.manhwa.viewedPageIds),
    [progressionState.manhwa.viewedPageIds],
  );
  const viewedCount = viewedPageIds.size;
  const progressPercent = Math.floor(
    (viewedCount / FINAL_MANHWA_PAGES.length) * 100,
  );

  const openViewer = useCallback((pageId: string) => {
    const page = FINAL_MANHWA_PAGES.find((candidate) => candidate.id === pageId);
    if (!page) return;
    setActivePageNumber(page.globalPageNumber);
    setViewerPageId(page.id);
  }, []);

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
    if (authStatus === 'signed-in') {
      void claimManhwaStoryCheckpoint({
        chapterId: page.chapterId,
        pageId: page.id,
        globalPageNumber: page.globalPageNumber,
      }).then((storyState) => {
        if (storyState) {
          syncAuthoritativeStoryState(storyState);
          void refreshStoryPuzzles(true);
        }
      });
    }
    if (
      !pageChapter
      || page.globalPageNumber !== pageChapter.endPage
      || completionClaims.current.has(pageChapter.chapterId)
      || progressionState.manhwa.completedChapterIds.includes(pageChapter.chapterId)
    ) {
      if (viewResult.success && !viewResult.alreadyViewed) {
        setAnnouncement(`تم تسجيل قراءة الصفحة ${page.globalPageNumber}.`);
      }
      return;
    }

    completionClaims.current.add(pageChapter.chapterId);
    void claimManhwaChapterReward(
      pageChapter.chapterId,
      pageChapter.endPage,
    ).then(async (success) => {
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
      setAnnouncement(`اكتمل ${pageChapter.title.ar} وتم تسجيل مكافأة XP مرة واحدة.`);
      await Promise.allSettled([
        loadProfile(),
        loadLeaderboard(true),
      ]);
    });
  }, [
    activeChapter,
    authStatus,
    claimManhwaStoryCheckpoint,
    claimManhwaChapterReward,
    loadLeaderboard,
    loadProfile,
    markChapterCompleted,
    progressionState.manhwa.completedChapterIds,
    recordReadingProgress,
    refreshStoryPuzzles,
    syncAuthoritativeStoryState,
    viewManhwaPage,
  ]);

  const jumpToPage = (globalPageNumber: number) => {
    const page = FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[globalPageNumber];
    if (page) setActivePageNumber(page.globalPageNumber);
  };

  return (
    <div className="shell-screen manhwa-archive final-manhwa-reader" dir="rtl">
      <header className="shell-screen-heading manhwa-archive__heading final-manhwa-reader__heading">
        <span className="shell-screen-code">03</span>
        <span>
          <small>11.11 // FINAL PUBLICATION // 71 PAGES</small>
          <h1>المانهوا</h1>
          <p lang="en">Final approved reading archive</p>
        </span>
        <div className="final-manhwa-reader__summary" aria-label="تقدم قراءة المانهوا">
          <span>
            <strong>{viewedCount}/{FINAL_MANHWA_PAGES.length}</strong>
            <small>صفحات مقروءة</small>
          </span>
          <span>
            <strong>{progressPercent}%</strong>
            <small>التقدم الكلي</small>
          </span>
        </div>
      </header>

      <p className="gds-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <div className="final-manhwa-reader__layout">
        <GlassPanel
          className="final-manhwa-reader__chapters"
          tone="memory"
          eyebrow="CHAPTER SELECT // 01—04"
          title="اختر الفصل"
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
              return (
                <button
                  key={chapter.chapterId}
                  type="button"
                  className="final-manhwa-reader__chapter"
                  data-active={activeChapter?.chapterId === chapter.chapterId}
                  onClick={() => jumpToPage(chapter.startPage)}
                >
                  <span className="final-manhwa-reader__chapter-number">
                    {String(chapter.order).padStart(2, '0')}
                  </span>
                  <span className="final-manhwa-reader__chapter-copy">
                    <strong>{chapter.title.ar}</strong>
                    <small>{chapter.startPage}—{chapter.endPage} // {chapterViewed}/{chapterPages.length}</small>
                  </span>
                  {chapterComplete && <CheckCircle2 aria-label="مكتمل" />}
                </button>
              );
            })}
          </div>
          {continuePage && (
            <GameButton
              variant="memory"
              leadingIcon={<Clock3 />}
              onClick={() => openViewer(continuePage.id)}
            >
              متابعة القراءة — الصفحة {continuePage.globalPageNumber}
            </GameButton>
          )}
        </GlassPanel>

        <GlassPanel
          className="final-manhwa-reader__preview"
          tone="memory"
          eyebrow={`PAGE ${String(activePage.globalPageNumber).padStart(2, '0')} // ${pageKindLabel(activePage.pageKind)}`}
          title={activePage.title.ar}
        >
          <article className="final-manhwa-reader__stage-card">
            <div className="final-manhwa-reader__preview-image-wrap">
              <img
                src={activePage.imageSrc}
                alt={activePage.accessibleDescription.ar}
                loading="eager"
                decoding="async"
              />
              <span>PAGE {String(activePage.globalPageNumber).padStart(2, '0')} / 71</span>
            </div>
            <div className="final-manhwa-reader__preview-copy">
              <span className="final-manhwa-reader__status">
                <BookOpen aria-hidden="true" /> النسخة النهائية المعتمدة
              </span>
              <p>{activePage.accessibleDescription.ar}</p>
              <div className="final-manhwa-reader__controls">
                <GameButton
                  variant="ghost"
                  size="icon"
                  disabled={activePage.globalPageNumber <= 1}
                  onClick={() => jumpToPage(activePage.globalPageNumber - 1)}
                  aria-label="الصفحة السابقة"
                >
                  <ChevronRight />
                </GameButton>
                <GameButton
                  variant="memory"
                  leadingIcon={<Maximize2 />}
                  onClick={() => openViewer(activePage.id)}
                >
                  فتح القارئ
                </GameButton>
                <GameButton
                  variant="ghost"
                  size="icon"
                  disabled={activePage.globalPageNumber >= FINAL_MANHWA_PAGES.length}
                  onClick={() => jumpToPage(activePage.globalPageNumber + 1)}
                  aria-label="الصفحة التالية"
                >
                  <ChevronLeft />
                </GameButton>
              </div>
            </div>
          </article>
        </GlassPanel>
      </div>

      <section className="final-manhwa-reader__timeline" aria-label="تقدم الفصول">
        <div className="final-manhwa-reader__timeline-track">
          {FINAL_MANHWA_PAGES.map((page) => (
            <button
              key={page.id}
              type="button"
              className="final-manhwa-reader__timeline-page"
              data-current={activePage.id === page.id}
              data-viewed={viewedPageIds.has(page.id)}
              onClick={() => jumpToPage(page.globalPageNumber)}
              aria-label={`الصفحة ${page.globalPageNumber}`}
            />
          ))}
        </div>
        <span>اسحب داخل القارئ للتنقل بين الصفحات</span>
      </section>

      {viewerPageId && (
        <ManhwaFullscreenViewer
          pages={FINAL_MANHWA_PAGES}
          initialPageId={viewerPageId}
          onRequestClose={() => setViewerPageId(null)}
          onSuccessfulImageLoad={handleImageLoaded}
        />
      )}

      <div className="final-manhwa-reader__preload" aria-hidden="true">
        {[activePage.globalPageNumber - 1, activePage.globalPageNumber + 1]
          .map((pageNumber) => FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[pageNumber])
          .filter(Boolean)
          .map((page) => (
            <img key={page.id} src={page.imageSrc} alt="" loading="eager" />
          ))}
      </div>
    </div>
  );
}
