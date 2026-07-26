import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Focus,
  LockKeyhole,
  Minus,
  Plus,
  ScanLine,
} from 'lucide-react';
import {
  CHAPTER_01_MANHWA_PAGES,
} from '../../content/puzzles/chapter01Campaign';
import type {
  ManhwaMemoryPageDefinition,
} from '../../domain/puzzles/campaignContracts';
import { getCampaignPageStatus } from '../../domain/puzzles/campaignEngine';
import { useGameStore } from '../../stores/gameStore';
import {
  GameButton,
  GlassPanel,
} from '../../ui/design-system';
import './memory-archive.css';

type MemoryPageStatus =
  | 'locked'
  | 'collecting'
  | 'restored'
  | 'questioned';

interface ViewTransform {
  scale: number;
  x: number;
  y: number;
}

interface DragOrigin {
  pointerId: number;
  pointerX: number;
  pointerY: number;
  imageX: number;
  imageY: number;
}

const INITIAL_VIEW: ViewTransform = {
  scale: 1,
  x: 0,
  y: 0,
};

const ORDERED_MANHWA_PAGES = [...CHAPTER_01_MANHWA_PAGES].sort((
  first,
  second,
) => (
  first.pageNumber - second.pageNumber
  || first.id.localeCompare(second.id)
));

const statusLabels: Record<
  MemoryPageStatus,
  { ar: string; en: string }
> = {
  locked: { ar: 'مقفلة', en: 'LOCKED' },
  collecting: { ar: 'قيد التجميع', en: 'COLLECTING' },
  restored: { ar: 'مستعادة', en: 'RESTORED' },
  questioned: { ar: 'موضع تساؤل', en: 'QUESTIONED' },
};

function getPageStatus(
  page: ManhwaMemoryPageDefinition,
  collectedFragmentIds: readonly string[],
): MemoryPageStatus {
  return getCampaignPageStatus(
    page,
    collectedFragmentIds,
    ORDERED_MANHWA_PAGES,
  );
}

function getCollectedShardIds(
  page: ManhwaMemoryPageDefinition,
  collectedFragmentIds: ReadonlySet<string>,
): string[] {
  return [...new Set(page.requiredShardIds)].filter((fragmentId) => (
    collectedFragmentIds.has(fragmentId)
  ));
}

function isPageOpen(status: MemoryPageStatus): boolean {
  return status === 'restored' || status === 'questioned';
}

function getProgressPercent(collected: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, (collected / total) * 100);
}

function clampZoom(value: number): number {
  return Math.min(3.5, Math.max(0.75, value));
}

export default function MemoryScreen() {
  const collectedMemoryFragments = useGameStore(
    (state) => state.collectedMemoryFragments,
  );
  const viewedManhwaPageIds = useGameStore(
    (state) => state.viewedManhwaPageIds,
  );
  const markManhwaPageViewed = useGameStore(
    (state) => state.actions.markManhwaPageViewed,
  );

  const [selectedPageId, setSelectedPageId] = useState(
    ORDERED_MANHWA_PAGES[0]?.id ?? '',
  );
  const [view, setView] = useState<ViewTransform>(INITIAL_VIEW);
  const [dragOrigin, setDragOrigin] = useState<DragOrigin | null>(null);
  const viewerRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pageImageRef = useRef<HTMLImageElement>(null);
  const archiveListRef = useRef<HTMLDivElement>(null);

  const collectedSet = useMemo(
    () => new Set(collectedMemoryFragments),
    [collectedMemoryFragments],
  );
  const viewedSet = useMemo(
    () => new Set(viewedManhwaPageIds),
    [viewedManhwaPageIds],
  );
  const statusByPageId = useMemo(() => {
    const statuses = new Map<string, MemoryPageStatus>();
    let previousPageIsOpen = true;

    ORDERED_MANHWA_PAGES.forEach((page) => {
      const status = previousPageIsOpen
        ? getPageStatus(page, collectedMemoryFragments)
        : 'locked';
      statuses.set(page.id, status);
      previousPageIsOpen = isPageOpen(status);
    });

    return statuses;
  }, [collectedMemoryFragments]);
  const selectedPage = ORDERED_MANHWA_PAGES.find(
    (page) => page.id === selectedPageId,
  ) ?? ORDERED_MANHWA_PAGES[0]!;
  const selectedStatus = statusByPageId.get(selectedPage.id) ?? 'locked';
  const selectedCollectedShards = getCollectedShardIds(
    selectedPage,
    collectedSet,
  );
  const selectedShardTotal = new Set(
    selectedPage.requiredShardIds,
  ).size;
  const selectedRemainingShards = Math.max(
    0,
    selectedShardTotal - selectedCollectedShards.length,
  );
  const selectedCollectedSet = new Set(selectedCollectedShards);
  const selectedIsOpen = isPageOpen(selectedStatus);
  const availableViewerPages = ORDERED_MANHWA_PAGES.filter((page) => {
    const status = statusByPageId.get(page.id);
    return status === 'restored' || status === 'questioned';
  });
  const viewerPageIndex = availableViewerPages.findIndex(
    (page) => page.id === selectedPage.id,
  );
  const previousPage = viewerPageIndex > 0
    ? availableViewerPages[viewerPageIndex - 1]
    : undefined;
  const nextPage = viewerPageIndex >= 0
    ? availableViewerPages[viewerPageIndex + 1]
    : undefined;
  const restoredPageCount = ORDERED_MANHWA_PAGES.filter((page) => {
    const status = statusByPageId.get(page.id);
    return status === 'restored' || status === 'questioned';
  }).length;
  const campaignPageCount = ORDERED_MANHWA_PAGES.length;
  const campaignShardCount = ORDERED_MANHWA_PAGES.reduce((
    total,
    page,
  ) => total + getCollectedShardIds(page, collectedSet).length, 0);
  const campaignShardTotal = ORDERED_MANHWA_PAGES.reduce((
    total,
    page,
  ) => total + new Set(page.requiredShardIds).size, 0);

  useEffect(() => {
    if (selectedIsOpen) markManhwaPageViewed(selectedPage.id);
  }, [markManhwaPageViewed, selectedIsOpen, selectedPage.id]);

  const fitPage = () => {
    setView(INITIAL_VIEW);
    setDragOrigin(null);
  };

  const selectPage = (pageId: string) => {
    if (statusByPageId.get(pageId) === 'locked') return;
    setSelectedPageId(pageId);
    fitPage();
  };

  const adjustZoom = (amount: number) => {
    setView((current) => ({
      ...current,
      scale: clampZoom(current.scale + amount),
    }));
  };

  const fitToWidth = () => {
    const viewport = viewportRef.current;
    const image = pageImageRef.current;
    if (!viewport || !image) {
      fitPage();
      return;
    }
    const renderedWidth = image.getBoundingClientRect().width;
    const baseWidth = renderedWidth / view.scale;
    if (baseWidth <= 0) {
      fitPage();
      return;
    }
    setView({
      scale: clampZoom((viewport.clientWidth * 0.94) / baseWidth),
      x: 0,
      y: 0,
    });
    setDragOrigin(null);
  };

  const panBy = (x: number, y: number) => {
    setView((current) => ({
      ...current,
      x: current.x + x,
      y: current.y + y,
    }));
  };

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragOrigin({
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      imageX: view.x,
      imageY: view.y,
    });
  };

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (!dragOrigin || dragOrigin.pointerId !== event.pointerId) return;
    setView((current) => ({
      ...current,
      x: dragOrigin.imageX + event.clientX - dragOrigin.pointerX,
      y: dragOrigin.imageY + event.clientY - dragOrigin.pointerY,
    }));
  };

  const releasePointer = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragOrigin(null);
  };

  const handleViewerKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) => {
    const keyActions: Partial<Record<string, () => void>> = {
      '+': () => adjustZoom(0.25),
      '=': () => adjustZoom(0.25),
      '-': () => adjustZoom(-0.25),
      '0': fitPage,
      ArrowUp: () => panBy(0, 32),
      ArrowDown: () => panBy(0, -32),
      ArrowLeft: () => panBy(32, 0),
      ArrowRight: () => panBy(-32, 0),
      PageUp: () => {
        if (previousPage) selectPage(previousPage.id);
      },
      PageDown: () => {
        if (nextPage) selectPage(nextPage.id);
      },
    };
    const action = keyActions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  const toggleFullscreen = async () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    try {
      if (document.fullscreenElement === viewer) {
        await document.exitFullscreen();
      } else {
        await viewer.requestFullscreen();
      }
    } catch {
      // Fullscreen can be denied by the host; the archive remains usable.
    }
  };

  return (
    <div
      className="shell-screen manhwa-memory-archive"
      dir="rtl"
    >
      <header className="shell-screen-heading manhwa-memory-archive__heading">
        <span className="shell-screen-code">03</span>
        <span>
          <small>MEMORY ARCHIVE // CHAPTER 01</small>
          <h1>الذكريات</h1>
        </span>
        <div
          className="manhwa-memory-archive__summary"
          aria-label={`${campaignShardCount} من ${campaignShardTotal} شظية، ${restoredPageCount} من ${campaignPageCount} صفحات مستعادة`}
        >
          <span>
            <strong>{campaignShardCount}/{campaignShardTotal}</strong>
            <small>شظايا</small>
          </span>
          <span>
            <strong>{restoredPageCount}/{campaignPageCount}</strong>
            <small>صفحات</small>
          </span>
        </div>
      </header>

      <div className="manhwa-memory-archive__layout">
        <GlassPanel
          className="manhwa-memory-archive__index"
          tone="memory"
          eyebrow="RECOVERED PAGES"
          title="فهرس الذاكرة"
        >
          <div
            ref={archiveListRef}
            className="manhwa-memory-archive__page-list"
          >
            {ORDERED_MANHWA_PAGES.map((page) => {
              const status = statusByPageId.get(page.id) ?? 'locked';
              const collected = getCollectedShardIds(page, collectedSet);
              const shardTotal = new Set(page.requiredShardIds).size;
              const pageOpen = isPageOpen(status);
              const isNew = pageOpen && !viewedSet.has(page.id);
              return (
                <button
                  key={page.id}
                  type="button"
                  className="manhwa-memory-card"
                  data-active={selectedPage.id === page.id}
                  data-status={status}
                  disabled={status === 'locked'}
                  onClick={() => selectPage(page.id)}
                  aria-current={
                    selectedPage.id === page.id ? 'page' : undefined
                  }
                  aria-label={
                    `الصفحة ${page.pageNumber}: ${
                      pageOpen ? page.title.ar : 'ذاكرة مشفرة'
                    }، ${statusLabels[status].ar}، ${
                      collected.length
                    } من ${shardTotal} شظايا`
                  }
                >
                  <span className="manhwa-memory-card__number">
                    {status === 'locked'
                      ? <LockKeyhole aria-hidden="true" />
                      : String(page.pageNumber).padStart(2, '0')}
                  </span>
                  <span className="manhwa-memory-card__copy">
                    <small>
                      PAGE {String(page.pageNumber).padStart(2, '0')}
                      {' // '}
                      {statusLabels[status].en}
                    </small>
                    <strong>
                      {pageOpen ? page.title.ar : 'ذاكرة مشفّرة'}
                    </strong>
                    <span>{collected.length}/{shardTotal} شظايا</span>
                  </span>
                  {isNew && (
                    <span className="manhwa-memory-card__new">NEW</span>
                  )}
                  <i aria-hidden="true">
                    <b
                      style={{
                        width: `${getProgressPercent(
                          collected.length,
                          shardTotal,
                        )}%`,
                      }}
                    />
                  </i>
                </button>
              );
            })}
          </div>
        </GlassPanel>

        <main className="manhwa-memory-archive__workspace">
          <GlassPanel
            className="manhwa-memory-archive__shards"
            tone="memory"
            eyebrow={`PAGE ${String(selectedPage.pageNumber).padStart(2, '0')} // ${statusLabels[selectedStatus].en}`}
            title={
              selectedIsOpen
                ? selectedPage.title.ar
                : 'ذاكرة مشفّرة'
            }
            actions={(
              <span className="manhwa-memory-archive__count">
                {selectedCollectedShards.length}/{selectedShardTotal}
              </span>
            )}
          >
            <ol
              className="manhwa-memory-shard-grid"
              aria-label={`شظايا الصفحة ${selectedPage.pageNumber}`}
            >
              {selectedPage.requiredShardIds.map((shardId, index) => {
                const collected = selectedCollectedSet.has(shardId);
                return (
                  <li
                    key={shardId}
                    data-collected={collected}
                    aria-label={
                      `الشظية ${index + 1}: ${
                        collected ? 'تم جمعها' : 'لم تُجمع'
                      }`
                    }
                  >
                    <span aria-hidden="true">◇</span>
                    <small>{String(index + 1).padStart(2, '0')}</small>
                  </li>
                );
              })}
            </ol>
            <p
              className="manhwa-memory-archive__recovery-copy"
              aria-live="polite"
            >
              {selectedStatus === 'locked' && (
                <>
                  أكمل استعادة الصفحة السابقة لفتح مسار هذه الذاكرة.
                  <span lang="en">
                    Restore the previous page to unlock this memory path.
                  </span>
                </>
              )}
              {selectedStatus === 'collecting'
                && selectedCollectedShards.length === 0 && (
                <>
                  لم يتم جمع أي شظايا ذاكرة لهذه الصفحة بعد.
                  <span lang="en">
                    No memory fragments collected yet.
                  </span>
                </>
              )}
              {selectedStatus === 'collecting'
                && selectedCollectedShards.length > 0 && (
                <>
                  تبقّت {selectedRemainingShards} شظايا
                  لاستعادة الصورة الكاملة.
                  <span lang="en">
                    {selectedRemainingShards} fragments remain
                    before reconstruction.
                  </span>
                </>
              )}
              {selectedIsOpen && (
                <>
                  اكتملت الشظايا. الصورة متاحة الآن داخل العارض الآمن.
                  <span lang="en">
                    Reconstruction complete. The page is ready to inspect.
                  </span>
                </>
              )}
            </p>
          </GlassPanel>

          {selectedIsOpen ? (
            <section
              ref={viewerRef}
              className="manhwa-page-viewer"
              aria-label={`عارض ${selectedPage.title.ar}`}
            >
              <header className="manhwa-page-viewer__toolbar">
                <span className="manhwa-page-viewer__identity">
                  <ScanLine aria-hidden="true" />
                  <span>
                    <small>
                      {statusLabels[selectedStatus].en}
                    </small>
                    <strong>{selectedPage.title.ar}</strong>
                  </span>
                </span>
                <div
                  className="manhwa-page-viewer__controls"
                  role="toolbar"
                  aria-label="أدوات عرض الصفحة"
                >
                  <GameButton
                    className="manhwa-page-viewer__back"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      archiveListRef.current?.scrollIntoView({
                        behavior: 'auto',
                        block: 'start',
                      });
                      archiveListRef.current
                        ?.querySelector<HTMLButtonElement>(
                          '[aria-current="page"]',
                        )
                        ?.focus();
                    }}
                  >
                    العودة للأرشيف
                  </GameButton>
                  <GameButton
                    variant="ghost"
                    size="icon"
                    onClick={() => adjustZoom(-0.25)}
                    aria-label="تصغير الصفحة"
                    title="تصغير"
                  >
                    <Minus />
                  </GameButton>
                  <output
                    aria-live="polite"
                    aria-label="نسبة التكبير"
                  >
                    {Math.round(view.scale * 100)}%
                  </output>
                  <GameButton
                    variant="ghost"
                    size="icon"
                    onClick={() => adjustZoom(0.25)}
                    aria-label="تكبير الصفحة"
                    title="تكبير"
                  >
                    <Plus />
                  </GameButton>
                  <GameButton
                    variant="ghost"
                    size="icon"
                    onClick={fitToWidth}
                    aria-label="ملاءمة عرض الصفحة مع العارض"
                    title="ملاءمة للعرض"
                  >
                    <Focus />
                  </GameButton>
                  <GameButton
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    aria-label="عرض الصفحة بملء الشاشة"
                    title="ملء الشاشة"
                  >
                    <Expand />
                  </GameButton>
                </div>
              </header>

              <div
                ref={viewportRef}
                className="manhwa-page-viewer__viewport"
                data-dragging={Boolean(dragOrigin)}
                tabIndex={0}
                role="application"
                aria-label="اسحب لتحريك الصفحة. استخدم زائد وناقص للتكبير، والأسهم للتحريك، وصفر للملاءمة."
                onKeyDown={handleViewerKeyDown}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={releasePointer}
                onPointerCancel={releasePointer}
                onDoubleClick={fitPage}
              >
                <img
                  ref={pageImageRef}
                  src={selectedPage.imageSrc}
                  alt={selectedPage.accessibleDescription.ar}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  style={{
                    transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
                  }}
                />
                <span
                  className="manhwa-page-viewer__scan"
                  aria-hidden="true"
                />
              </div>

              <details className="manhwa-page-viewer__transcript">
                <summary>الوصف النصي وحوار الصفحة</summary>
                <p>{selectedPage.accessibleDescription.ar}</p>
                <ol>
                  {selectedPage.transcript.map((line, index) => (
                    <li key={`${selectedPage.id}-transcript-${index}`}>
                      {line.ar}
                    </li>
                  ))}
                </ol>
              </details>

              <footer className="manhwa-page-viewer__navigation">
                <GameButton
                  variant="ghost"
                  leadingIcon={<ChevronRight />}
                  disabled={!previousPage}
                  onClick={() => {
                    if (previousPage) selectPage(previousPage.id);
                  }}
                >
                  الصفحة السابقة
                </GameButton>
                <span>
                  {viewerPageIndex + 1} / {availableViewerPages.length}
                </span>
                <GameButton
                  variant="ghost"
                  trailingIcon={<ChevronLeft />}
                  disabled={!nextPage}
                  onClick={() => {
                    if (nextPage) selectPage(nextPage.id);
                  }}
                >
                  الصفحة التالية
                </GameButton>
              </footer>
            </section>
          ) : (
            <section
              className="manhwa-page-sealed"
              data-status={selectedStatus}
              aria-label="الصفحة غير مستعادة"
            >
              <span className="manhwa-page-sealed__signal" aria-hidden="true">
                {selectedStatus === 'locked'
                  ? <LockKeyhole />
                  : <ScanLine />}
              </span>
              <small>IMAGE CHANNEL // SEALED</small>
              <h2>الصورة غير متاحة بعد</h2>
              <p>
                لا تُحمّل صفحة المانهوا قبل اكتمال شظاياها وفتحها داخل
                نظام الذاكرة.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
