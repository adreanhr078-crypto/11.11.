import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
} from 'lucide-react';
import type {
  ManhwaViewerPageReadModel,
} from '../../application/ui/manhwaArchiveReadModel';
import {
  createBrowserManhwaViewerHistoryPort,
  ManhwaViewerHistoryMarker,
} from '../../infrastructure/browser/manhwaViewerHistory';
import {
  createManhwaViewerPlatformAdapter,
  type ManhwaViewerPlatformAdapter,
} from '../../infrastructure/browser/manhwaViewerPlatformAdapter';
import { GameButton } from '../../ui/design-system';

type ViewerLoadState = 'loading' | 'ready' | 'error';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface ManhwaFullscreenViewerProps {
  pages: ManhwaViewerPageReadModel[];
  initialPageId: string;
  onRequestClose: () => void;
  onSuccessfulImageLoad: (pageId: string) => void;
  platformAdapter?: ManhwaViewerPlatformAdapter;
}

export function ManhwaFullscreenViewer({
  pages,
  initialPageId,
  onRequestClose,
  onSuccessfulImageLoad,
  platformAdapter,
}: ManhwaFullscreenViewerProps) {
  const availableInitialPage = pages.some(
    (page) => page.id === initialPageId,
  )
    ? initialPageId
    : '';
  const [currentPageId, setCurrentPageId] = useState(
    availableInitialPage,
  );
  const [loadState, setLoadState] = useState<ViewerLoadState>('loading');
  const [retryKey, setRetryKey] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const historyMarkerRef = useRef<ManhwaViewerHistoryMarker | null>(null);
  const adapter = useMemo(
    () => platformAdapter ?? createManhwaViewerPlatformAdapter(),
    [platformAdapter],
  );
  const currentIndex = pages.findIndex(
    (page) => page.id === currentPageId,
  );
  const currentPage = currentIndex >= 0
    ? pages[currentIndex]
    : undefined;
  const previousPage = currentIndex > 0
    ? pages[currentIndex - 1]
    : undefined;
  const nextPage = currentIndex >= 0
    ? pages[currentIndex + 1]
    : undefined;

  const closeViewer = useCallback(() => {
    historyMarkerRef.current?.close();
    onRequestClose();
  }, [onRequestClose]);

  const navigateTo = useCallback((pageId: string | undefined) => {
    if (!pageId || !pages.some((page) => page.id === pageId)) return;
    setCurrentPageId(pageId);
    setLoadState('loading');
    setRetryKey(0);
    void adapter.requestPortrait();
  }, [adapter, pages]);

  useEffect(() => {
    if (
      typeof document === 'undefined'
      || !availableInitialPage
    ) {
      return;
    }
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const historyMarker = new ManhwaViewerHistoryMarker(
      createBrowserManhwaViewerHistoryPort(),
    );
    historyMarkerRef.current = historyMarker;
    historyMarker.open(onRequestClose);
    document.body.style.overflow = 'hidden';
    void adapter.requestPortrait();
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current
        ?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
        ?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      historyMarker.dispose();
      historyMarkerRef.current = null;
      document.body.style.overflow = previousOverflow;
      void adapter.restoreLandscape();
      previousFocus?.focus();
    };
  }, [adapter, availableInitialPage, onRequestClose]);

  useEffect(() => {
    if (typeof document === 'undefined' || !currentPage) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeViewer();
        return;
      }
      if (event.key === 'PageUp') {
        event.preventDefault();
        navigateTo(previousPage?.id);
        return;
      }
      if (event.key === 'PageDown') {
        event.preventDefault();
        navigateTo(nextPage?.id);
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR,
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    closeViewer,
    currentPage,
    navigateTo,
    nextPage?.id,
    previousPage?.id,
  ]);

  if (
    typeof document === 'undefined'
    || !currentPage
    || pages.length === 0
  ) {
    return null;
  }

  return createPortal(
    <div className="manhwa-viewer-overlay" data-load-state={loadState}>
      <div
        ref={dialogRef}
        className="manhwa-viewer"
        role="dialog"
        aria-modal="true"
        aria-label={`عارض المانهوا، الصفحة ${currentPage.pageLabel}`}
      >
        <header className="manhwa-viewer__toolbar">
          <span>
            <small>MANHWA VIEWER</small>
            <strong>
              {currentPage.unlockedContent.title.ar}
            </strong>
          </span>
          <GameButton
            variant="ghost"
            size="icon"
            onClick={closeViewer}
            aria-label="إغلاق عارض المانهوا"
          >
            <X />
          </GameButton>
        </header>

        <main className="manhwa-viewer__stage">
          <img
            key={`${currentPage.id}-${retryKey}`}
            src={currentPage.unlockedContent.thumbnailSrc}
            alt={currentPage.unlockedContent.accessibleDescription.ar}
            decoding="async"
            hidden={loadState === 'error'}
            onLoad={() => {
              setLoadState('ready');
              onSuccessfulImageLoad(currentPage.id);
            }}
            onError={() => {
              setLoadState('error');
              void adapter.restoreLandscape();
            }}
          />

          {loadState === 'loading' && (
            <div
              className="manhwa-viewer__status"
              role="status"
              aria-live="polite"
            >
              <span aria-hidden="true" />
              <strong>جارٍ تحميل الصفحة</strong>
              <small lang="en">Loading page…</small>
            </div>
          )}

          {loadState === 'error' && (
            <div
              className="manhwa-viewer__status"
              role="alert"
              aria-live="assertive"
            >
              <strong>تعذر تحميل الصفحة</strong>
              <small lang="en">
                The page was not viewed and no effect was applied.
              </small>
              <GameButton
                variant="memory"
                leadingIcon={<RotateCcw />}
                onClick={() => {
                  setLoadState('loading');
                  setRetryKey((value) => value + 1);
                  void adapter.requestPortrait();
                }}
              >
                إعادة المحاولة
              </GameButton>
            </div>
          )}
        </main>

        <footer className="manhwa-viewer__navigation">
          <GameButton
            variant="ghost"
            leadingIcon={<ChevronRight />}
            disabled={!previousPage}
            onClick={() => navigateTo(previousPage?.id)}
          >
            الصفحة السابقة
          </GameButton>
          <span aria-live="polite">
            {currentIndex + 1} / {pages.length}
          </span>
          <GameButton
            variant="ghost"
            trailingIcon={<ChevronLeft />}
            disabled={!nextPage}
            onClick={() => navigateTo(nextPage?.id)}
          >
            الصفحة التالية
          </GameButton>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
