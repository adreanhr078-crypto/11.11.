import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  BookOpen,
  Check,
  Diamond,
  LockKeyhole,
} from 'lucide-react';
import {
  createManhwaArchiveReadModel,
  type ManhwaArchivePageReadModel,
} from '../../application/ui/manhwaArchiveReadModel';
import { useGameStore } from '../../stores/gameStore';
import {
  GameButton,
  GameModal,
  GlassPanel,
} from '../../ui/design-system';
import './manhwa-archive.css';

const STATUS_CLASS_NAMES = {
  unlocked: 'unlocked',
  available: 'available',
  insufficient_shards: 'insufficient',
  previous_page_required: 'prerequisite',
} as const;

function purchaseAnnouncement(
  page: ManhwaArchivePageReadModel,
): string {
  return `تم فتح الصفحة ${page.pageLabel}. الرصيد المتبقي ${page.balanceAfterUnlock} شظية.`;
}

export default function MemoryScreen() {
  const progressionState = useGameStore(
    (state) => state.progressionState,
  );
  const unlockManhwaPage = useGameStore(
    (state) => state.actions.unlockManhwaPage,
  );
  const model = useMemo(
    () => createManhwaArchiveReadModel(progressionState),
    [progressionState],
  );
  const [selectedPageId, setSelectedPageId] = useState(
    model.pages[0]?.id ?? '',
  );
  const [pendingPageId, setPendingPageId] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const cardGridRef = useRef<HTMLDivElement>(null);
  const unlockPendingRef = useRef(false);

  const selectedPage = model.pages.find(
    (page) => page.id === selectedPageId,
  ) ?? model.pages[0];
  const pendingPage = model.pages.find(
    (page) => page.id === pendingPageId,
  );

  const focusPage = (index: number) => {
    const normalizedIndex = Math.min(
      model.pages.length - 1,
      Math.max(0, index),
    );
    const page = model.pages[normalizedIndex];
    if (!page) return;
    setSelectedPageId(page.id);
    cardGridRef.current
      ?.querySelector<HTMLButtonElement>(
        `[data-page-id="${page.id}"]`,
      )
      ?.focus();
  };

  const handleGridKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) => {
    const currentIndex = model.pages.findIndex(
      (page) => page.id === selectedPageId,
    );
    const keyTargets: Partial<Record<string, number>> = {
      ArrowLeft: currentIndex + 1,
      ArrowDown: currentIndex + 1,
      ArrowRight: currentIndex - 1,
      ArrowUp: currentIndex - 1,
      Home: 0,
      End: model.pages.length - 1,
    };
    const targetIndex = keyTargets[event.key];
    if (targetIndex === undefined) return;
    event.preventDefault();
    focusPage(targetIndex);
  };

  const selectPage = (page: ManhwaArchivePageReadModel) => {
    setSelectedPageId(page.id);
    if (page.status === 'available') {
      setPendingPageId(page.id);
      return;
    }
    if (page.status !== 'unlocked') {
      setAnnouncement(`${page.statusLabel.ar}. ${page.reason.ar}`);
    }
  };

  const closeConfirmation = () => {
    if (unlockPendingRef.current) return;
    setPendingPageId(null);
  };

  const confirmUnlock = async () => {
    if (
      !pendingPage
      || pendingPage.status !== 'available'
      || unlockPendingRef.current
    ) {
      return;
    }
    unlockPendingRef.current = true;
    setIsUnlocking(true);
    await Promise.resolve();
    const result = unlockManhwaPage(pendingPage.id);
    if (result.success) {
      setAnnouncement(purchaseAnnouncement(pendingPage));
      setPendingPageId(null);
      setSelectedPageId(pendingPage.id);
    } else {
      setAnnouncement(
        `تعذر فتح الصفحة ${pendingPage.pageLabel}: ${
          result.failureReason ?? 'unknown'
        }`,
      );
    }
    unlockPendingRef.current = false;
    setIsUnlocking(false);
  };

  return (
    <div className="shell-screen manhwa-archive" dir="rtl">
      <header className="shell-screen-heading manhwa-archive__heading">
        <span className="shell-screen-code">03</span>
        <span>
          <small>MANHWA ARCHIVE // CHAPTER 01</small>
          <h1>المانهوا</h1>
          <p lang="en">Manhwa</p>
        </span>
        <div
          className="manhwa-archive__summary"
          aria-label={`${model.unlockedPageCount} من ${model.totalPageCount} صفحات مفتوحة، الرصيد ${model.spendableShardBalance} شظية`}
        >
          <span>
            <strong>
              {model.unlockedPageCount}/{model.totalPageCount}
            </strong>
            <small>صفحات مفتوحة</small>
          </span>
          <span>
            <strong>{model.spendableShardBalance}</strong>
            <small>شظايا متاحة</small>
          </span>
        </div>
      </header>

      <p
        className="gds-sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </p>

      <div className="manhwa-archive__layout">
        <GlassPanel
          className="manhwa-archive__catalogue"
          tone="memory"
          eyebrow="PAGES 01—29"
          title="أرشيف الصفحات"
        >
          <div
            ref={cardGridRef}
            className="manhwa-archive__grid"
            aria-label="صفحات المانهوا"
            onKeyDown={handleGridKeyDown}
          >
            {model.pages.map((page) => {
              const unlocked = page.status === 'unlocked';
              return (
                <button
                  key={page.id}
                  type="button"
                  className="manhwa-archive-card"
                  data-page-id={page.id}
                  data-status={STATUS_CLASS_NAMES[page.status]}
                  data-selected={selectedPage?.id === page.id}
                  tabIndex={selectedPage?.id === page.id ? 0 : -1}
                  aria-current={
                    selectedPage?.id === page.id ? 'page' : undefined
                  }
                  aria-label={`الصفحة ${page.pageLabel}، ${page.statusLabel.ar}، ${page.reason.ar}`}
                  onFocus={() => setSelectedPageId(page.id)}
                  onClick={() => selectPage(page)}
                >
                  <span className="manhwa-archive-card__visual">
                    {page.unlockedContent ? (
                      <img
                        src={page.unlockedContent.thumbnailSrc}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span
                        className="manhwa-archive-card__placeholder"
                        aria-hidden="true"
                      >
                        <LockKeyhole />
                        <b>{page.pageLabel}</b>
                      </span>
                    )}
                    <span className="manhwa-archive-card__page">
                      PAGE {page.pageLabel}
                    </span>
                    {page.isNew && (
                      <span className="manhwa-archive-card__new">
                        NEW
                      </span>
                    )}
                  </span>

                  <span className="manhwa-archive-card__copy">
                    <strong>
                      {page.unlockedContent
                        ? page.unlockedContent.title.ar
                        : `الصفحة ${page.pageLabel}`}
                    </strong>
                    <span data-status-label>
                      {page.statusLabel.ar}
                      <small lang="en">{page.statusLabel.en}</small>
                    </span>
                    {!unlocked && (
                      <>
                        <span className="manhwa-archive-card__cost">
                          <Diamond aria-hidden="true" />
                          {page.shardCost}
                        </span>
                        <small>{page.reason.ar}</small>
                      </>
                    )}
                    {unlocked && (
                      <span className="manhwa-archive-card__ready">
                        <Check aria-hidden="true" />
                        جاهزة للقراءة
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </GlassPanel>

        <GlassPanel
          className="manhwa-archive__preview"
          tone="memory"
          eyebrow={selectedPage
            ? `PAGE ${selectedPage.pageLabel} // ${selectedPage.statusLabel.en.toUpperCase()}`
            : 'PAGE'}
          title={selectedPage?.unlockedContent?.title.ar ?? 'صفحة مقفلة'}
        >
          {selectedPage?.unlockedContent ? (
            <article className="manhwa-archive__reader">
              <img
                src={selectedPage.unlockedContent.thumbnailSrc}
                alt={selectedPage.unlockedContent.accessibleDescription.ar}
                loading="lazy"
                decoding="async"
              />
              <div>
                <span>
                  <BookOpen aria-hidden="true" />
                  عرض مضمّن مؤقت
                </span>
                <p>
                  {selectedPage.unlockedContent.accessibleDescription.ar}
                </p>
                <small lang="en">
                  Reading this preview does not record a view or apply
                  narrative effects.
                </small>
              </div>
            </article>
          ) : selectedPage ? (
            <article
              className="manhwa-archive__sealed"
              data-status={STATUS_CLASS_NAMES[selectedPage.status]}
            >
              <span aria-hidden="true">
                <LockKeyhole />
              </span>
              <small>PAGE {selectedPage.pageLabel} // SEALED</small>
              <h2>{selectedPage.statusLabel.ar}</h2>
              <p>{selectedPage.reason.ar}</p>
              <dl>
                <div>
                  <dt>تكلفة الفتح</dt>
                  <dd>{selectedPage.shardCost}</dd>
                </div>
                <div>
                  <dt>الرصيد الحالي</dt>
                  <dd>{model.spendableShardBalance}</dd>
                </div>
              </dl>
              {selectedPage.status === 'available' && (
                <GameButton
                  variant="memory"
                  leadingIcon={<Diamond />}
                  onClick={() => setPendingPageId(selectedPage.id)}
                >
                  فتح الصفحة
                </GameButton>
              )}
            </article>
          ) : null}
        </GlassPanel>
      </div>

      <GameModal
        open={Boolean(pendingPage)}
        onClose={closeConfirmation}
        eyebrow="MANHWA ARCHIVE // UNLOCK"
        title={`تأكيد فتح الصفحة ${pendingPage?.pageLabel ?? ''}`}
        description="يُخصم الرصيد عبر معاملة الأرشيف المركزية. فتح الصفحة دائم ولا يتراجع بعد إنفاق الشظايا."
        tone="memory"
        closeLabel="إلغاء فتح الصفحة"
        footer={(
          <>
            <GameButton
              variant="ghost"
              disabled={isUnlocking}
              onClick={closeConfirmation}
            >
              إلغاء
            </GameButton>
            <GameButton
              variant="memory"
              loading={isUnlocking}
              loadingLabel="جارٍ فتح الصفحة"
              disabled={!pendingPage || pendingPage.status !== 'available'}
              leadingIcon={<Diamond />}
              onClick={() => void confirmUnlock()}
            >
              تأكيد الفتح
            </GameButton>
          </>
        )}
      >
        {pendingPage && (
          <dl className="manhwa-archive__confirmation">
            <div>
              <dt>تكلفة الصفحة</dt>
              <dd>{pendingPage.shardCost}</dd>
            </div>
            <div>
              <dt>الرصيد الحالي</dt>
              <dd>{model.spendableShardBalance}</dd>
            </div>
            <div>
              <dt>الرصيد بعد الشراء</dt>
              <dd>{pendingPage.balanceAfterUnlock}</dd>
            </div>
          </dl>
        )}
      </GameModal>
    </div>
  );
}
