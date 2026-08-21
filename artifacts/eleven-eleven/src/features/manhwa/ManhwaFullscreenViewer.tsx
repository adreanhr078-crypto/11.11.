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
import type { FinalManhwaPage } from '../../content/manhwa/finalManhwa';
import {
  createBrowserManhwaViewerHistoryPort,
  ManhwaViewerHistoryMarker,
} from '../../infrastructure/browser/manhwaViewerHistory';
import {
  createManhwaViewerPlatformAdapter,
  type ManhwaViewerPlatformAdapter,
} from '../../infrastructure/browser/manhwaViewerPlatformAdapter';
import { useUiPreferencesStore } from '../../app/shell/shellStore';
import { GameButton } from '../../ui/design-system';

type ViewerLoadState = 'loading' | 'ready' | 'error';

const VIEWER_COPY = {
  ar: {
    viewerLabel: 'عارض المانهوا',
    close: 'إغلاق عارض المانهوا',
    loading: 'جارٍ تحميل الصفحة',
    loadingDetail: 'Loading page…',
    error: 'تعذر تحميل الصفحة',
    errorDetail: 'لم تُسجّل الصفحة. تحقّق من الأصل ثم أعد المحاولة.',
    retry: 'إعادة المحاولة',
    previous: 'السابقة',
    next: 'التالية',
    page: 'الصفحة',
    of: 'من',
  },
  en: {
    viewerLabel: 'Manhwa reader',
    close: 'Close Manhwa reader',
    loading: 'Loading page',
    loadingDetail: 'The record is opening…',
    error: 'Could not load this page',
    errorDetail: 'This record could not be opened. Check the connection and try again.',
    retry: 'Try again',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
  },
} as const;

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface ManhwaFullscreenViewerProps {
  pages: readonly FinalManhwaPage[];
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
  const locale = useUiPreferencesStore((state) => state.locale);
  const copy = VIEWER_COPY[locale];
  const availableInitialPage = pages.some(
    (page) => page.id === initialPageId,
  )
    ? initialPageId
    : pages[0]?.id ?? '';
  const [currentPageId, setCurrentPageId] = useState(availableInitialPage);
  const [loadState, setLoadState] = useState<ViewerLoadState>('loading');
  const [retryKey, setRetryKey] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const historyMarkerRef = useRef<ManhwaViewerHistoryMarker | null>(null);
  const onRequestCloseRef = useRef(onRequestClose);
  onRequestCloseRef.current = onRequestClose;
  const adapter = useMemo(
    () => platformAdapter ?? createManhwaViewerPlatformAdapter(),
    [platformAdapter],
  );
  const currentIndex = pages.findIndex(
    (page) => page.id === currentPageId,
  );
  const currentPage = currentIndex >= 0 ? pages[currentIndex] : undefined;
  const previousPage = currentIndex > 0 ? pages[currentIndex - 1] : undefined;
  const nextPage = currentIndex >= 0 ? pages[currentIndex + 1] : undefined;

  const requestClose = useCallback(() => {
    onRequestCloseRef.current();
  }, []);

  const closeViewer = useCallback(() => {
    historyMarkerRef.current?.close();
    requestClose();
  }, [requestClose]);

  const navigateTo = useCallback((pageId: string | undefined) => {
    if (!pageId || !pages.some((page) => page.id === pageId)) return;
    setCurrentPageId(pageId);
    setLoadState('loading');
    setRetryKey(0);
    void adapter.requestPortrait();
  }, [adapter, pages]);

  useEffect(() => {
    if (typeof document === 'undefined' || !availableInitialPage) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const historyMarker = new ManhwaViewerHistoryMarker(
      createBrowserManhwaViewerHistoryPort(),
    );
    historyMarkerRef.current = historyMarker;
    historyMarker.open(requestClose);
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
  }, [adapter, availableInitialPage, requestClose]);

  useEffect(() => {
    if (typeof document === 'undefined' || !currentPage) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeViewer();
        return;
      }
      if (event.key === 'PageUp' || event.key === 'ArrowRight') {
        event.preventDefault();
        navigateTo(previousPage?.id);
        return;
      }
      if (event.key === 'PageDown' || event.key === 'ArrowLeft') {
        event.preventDefault();
        navigateTo(nextPage?.id);
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
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
  }, [closeViewer, currentPage, navigateTo, nextPage?.id, previousPage?.id]);

  if (typeof document === 'undefined' || !currentPage || pages.length === 0) {
    return null;
  }

  return createPortal(
    <div
      className="manhwa-viewer-overlay"
      data-load-state={loadState}
      data-page-index={currentIndex + 1}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      lang={locale}
    >
      <div
        ref={dialogRef}
        className="manhwa-viewer"
        role="dialog"
        aria-modal="true"
        aria-label={`${copy.viewerLabel}, ${copy.page} ${currentPage.globalPageNumber}`}
      >
        <header className="manhwa-viewer__toolbar">
          <span>
            <small>11.11 // FINAL PUBLICATION</small>
            <strong>{currentPage.title[locale]}</strong>
            <em>
              {currentPage.chapterId === 'chapter_0'
                ? 'BOOK'
                : currentPage.chapterId.replace('_', ' ').toUpperCase()}
            </em>
          </span>
          <GameButton
            variant="ghost"
            size="icon"
            onClick={closeViewer}
            aria-label={copy.close}
          >
            <X />
          </GameButton>
        </header>

        <main
          className="manhwa-viewer__stage"
          onTouchStart={(event) => {
            touchStartX.current = event.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const start = touchStartX.current;
            touchStartX.current = null;
            const end = event.changedTouches[0]?.clientX;
            if (start === null || end === undefined) return;
            const distance = end - start;
            if (Math.abs(distance) < 42) return;
            if (distance > 0) navigateTo(previousPage?.id);
            else navigateTo(nextPage?.id);
          }}
        >
          <img
            key={`${currentPage.id}-${retryKey}`}
            src={currentPage.imageSrc}
            alt={currentPage.accessibleDescription[locale]}
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
            <div className="manhwa-viewer__status" role="status" aria-live="polite">
              <span aria-hidden="true" />
              <strong>{copy.loading}</strong>
              <small>{copy.loadingDetail}</small>
            </div>
          )}

          {loadState === 'error' && (
            <div className="manhwa-viewer__status" role="alert" aria-live="assertive">
              <strong>{copy.error}</strong>
              <small>{copy.errorDetail}</small>
              <GameButton
                variant="memory"
                leadingIcon={<RotateCcw />}
                onClick={() => {
                  setLoadState('loading');
                  setRetryKey((value) => value + 1);
                  void adapter.requestPortrait();
                }}
              >
                {copy.retry}
              </GameButton>
            </div>
          )}
        </main>

        <footer className="manhwa-viewer__navigation">
          <GameButton
            variant="ghost"
            leadingIcon={locale === 'ar' ? <ChevronRight /> : <ChevronLeft />}
            disabled={!previousPage}
            onClick={() => navigateTo(previousPage?.id)}
          >
            {copy.previous}
          </GameButton>
          <span aria-live="polite">
            {currentIndex + 1} / {pages.length}
            <small> · {copy.page} {currentPage.globalPageNumber} {copy.of} 71</small>
          </span>
          <GameButton
            variant="ghost"
            trailingIcon={locale === 'ar' ? <ChevronLeft /> : <ChevronRight />}
            disabled={!nextPage}
            onClick={() => navigateTo(nextPage?.id)}
          >
            {copy.next}
          </GameButton>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
