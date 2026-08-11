import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import {
  createManhwaArchiveReadModel,
  getUnlockedManhwaViewerPages,
} from '../application/ui/manhwaArchiveReadModel';
import {
  ManhwaViewerHistoryMarker,
  type ManhwaViewerHistoryPort,
} from '../infrastructure/browser/manhwaViewerHistory';
import {
  createManhwaViewerPlatformAdapter,
} from '../infrastructure/browser/manhwaViewerPlatformAdapter';
import { buildInitialState } from '../stores/gameStoreHelpers';
import { useShellStore } from '../app/shell/shellStore';

class FakeHistoryPort implements ManhwaViewerHistoryPort {
  readonly entries = [{
    state: { route: 'archive' },
    url: 'https://game.test/archive',
  }];

  index = 0;

  pushCount = 0;

  backCount = 0;

  private readonly listeners = new Set<() => void>();

  get locationHref(): string {
    return this.entries[this.index]?.url ?? '';
  }

  get state(): unknown {
    return this.entries[this.index]?.state;
  }

  pushState(state: unknown, url: string): void {
    this.pushCount += 1;
    this.entries.splice(this.index + 1);
    this.entries.push({ state: state as { route: string }, url });
    this.index = this.entries.length - 1;
  }

  back(): void {
    this.backCount += 1;
    if (this.index > 0) this.index -= 1;
    for (const listener of [...this.listeners]) listener();
  }

  addPopStateListener(listener: () => void): void {
    this.listeners.add(listener);
  }

  removePopStateListener(listener: () => void): void {
    this.listeners.delete(listener);
  }

  simulateBrowserBack(): void {
    this.back();
  }
}

function viewerSource(): string {
  return readFileSync(
    resolve(
      process.cwd(),
      'src',
      'features',
      'manhwa',
      'ManhwaFullscreenViewer.tsx',
    ),
    'utf8',
  );
}

describe('Manhwa Viewer unlocked-page boundary', () => {
  it('excludes locked pages from opening and navigation', () => {
    const progression = structuredClone(
      buildInitialState().progressionState,
    );
    const model = createManhwaArchiveReadModel(progression);
    const pages = getUnlockedManhwaViewerPages(model);

    assert.equal(pages.length, 4);
    assert.equal(pages[0]?.id, 'manhwa_ch00_page_01');
    assert.equal(pages.at(-1)?.id, 'manhwa_ch01_page_02');
    const screen = readFileSync(
      resolve(
        process.cwd(),
        'src',
        'features',
        'screens',
        'MemoryScreen.tsx',
      ),
      'utf8',
    );
    assert.ok(screen.includes('pages={readerPages}'));
  });

  it('calls the canonical view callback only from image onLoad', () => {
    const source = viewerSource();
    const screen = readFileSync(
      resolve(
        process.cwd(),
        'src',
        'features',
        'screens',
        'MemoryScreen.tsx',
      ),
      'utf8',
    );
    const onLoad = source.indexOf('onLoad={() => {');
    const viewCallback = source.indexOf(
      'onSuccessfulImageLoad(currentPage.id)',
    );
    const onError = source.indexOf('onError={() => {');
    const errorEnd = source.indexOf('/>', onError);

    assert.ok(onLoad >= 0);
    assert.ok(viewCallback > onLoad);
    assert.ok(onError > viewCallback);
    assert.equal(
      source.slice(onError, errorEnd).includes(
        'onSuccessfulImageLoad',
      ),
      false,
    );
    assert.ok(source.includes("setLoadState('error')"));
    assert.ok(source.includes('The page was not recorded'));
    assert.equal(
      [...screen.matchAll(/viewManhwaPage\(page\.id\)/g)].length,
      1,
    );
    assert.ok(
      screen.includes('onSuccessfulImageLoad={handleImageLoaded}'),
    );
  });

  it('keeps the viewer session open when recording a page rerenders its parent', () => {
    const source = viewerSource();
    const screen = readFileSync(
      resolve(
        process.cwd(),
        'src',
        'features',
        'screens',
        'MemoryScreen.tsx',
      ),
      'utf8',
    );

    assert.ok(source.includes('const onRequestCloseRef = useRef(onRequestClose);'));
    assert.ok(source.includes('onRequestCloseRef.current = onRequestClose;'));
    assert.ok(source.includes('historyMarker.open(requestClose);'));
    assert.ok(source.includes('[adapter, availableInitialPage, requestClose]'));
    assert.ok(screen.includes('onRequestClose={handleViewerRequestClose}'));
    assert.doesNotMatch(screen, /onRequestClose=\{\(\) => setViewerPageId/);
  });

  it('opens the reader directly when Story Puzzles requests Manhwa continuation', () => {
    const puzzleScreen = readFileSync(
      resolve(process.cwd(), 'src', 'features', 'screens', 'PuzzleScreen.tsx'),
      'utf8',
    );
    const memoryScreen = readFileSync(
      resolve(process.cwd(), 'src', 'features', 'screens', 'MemoryScreen.tsx'),
      'utf8',
    );

    assert.ok(puzzleScreen.includes('onClick={requestManhwaReader}'));
    assert.ok(memoryScreen.includes('if (!readerLaunchRequested) return;'));
    assert.ok(memoryScreen.includes('const pageToOpen = firstUnreadPage ?? activePage;'));
    assert.ok(memoryScreen.includes('openViewer(pageToOpen.id);'));

    useShellStore.setState({
      currentScreen: 'puzzles',
      previousScreen: null,
      manhwaReaderLaunchRequested: false,
    });

    useShellStore.getState().requestManhwaReader();

    assert.equal(useShellStore.getState().currentScreen, 'memories');
    assert.equal(useShellStore.getState().previousScreen, 'puzzles');
    assert.equal(useShellStore.getState().manhwaReaderLaunchRequested, true);

    useShellStore.getState().consumeManhwaReaderLaunch();
    assert.equal(useShellStore.getState().manhwaReaderLaunchRequested, false);
  });

  it('exposes dialog, focus trap, Escape, and page keyboard controls', () => {
    const source = viewerSource();
    const styles = readFileSync(
      resolve(
        process.cwd(),
        'src',
        'features',
        'screens',
        'manhwa-archive.css',
      ),
      'utf8',
    );

    assert.ok(source.includes('createPortal('));
    assert.ok(source.includes('role="dialog"'));
    assert.ok(source.includes('aria-modal="true"'));
    assert.ok(source.includes("event.key === 'Escape'"));
    assert.ok(source.includes("event.key === 'PageUp'"));
    assert.ok(source.includes("event.key === 'PageDown'"));
    assert.ok(source.includes("event.key !== 'Tab'"));
    assert.ok(source.includes('previousFocus?.focus()'));
    assert.ok(source.includes("document.body.style.overflow = 'hidden'"));
    assert.ok(
      [...source.matchAll(/adapter\.restoreLandscape\(\)/g)].length >= 2,
    );
    assert.match(
      styles,
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.manhwa-viewer-overlay/,
    );
    assert.match(
      styles,
      /\[data-gds-motion="reduced"\] \.manhwa-viewer-overlay/,
    );
  });
});

describe('Manhwa Viewer browser history marker', () => {
  it('adds one marker and lets first Back close without changing route', () => {
    const port = new FakeHistoryPort();
    const marker = new ManhwaViewerHistoryMarker(port);
    let closeCount = 0;
    const routeBefore = port.locationHref;

    marker.open(() => {
      closeCount += 1;
    });
    marker.open(() => {
      closeCount += 100;
    });
    assert.equal(port.pushCount, 1);

    port.simulateBrowserBack();
    assert.equal(closeCount, 1);
    assert.equal(port.locationHref, routeBefore);
    marker.dispose();
    assert.equal(port.backCount, 1);
  });

  it('cleans Close and unmount exactly once without duplicate entries', () => {
    const closePort = new FakeHistoryPort();
    const closeMarker = new ManhwaViewerHistoryMarker(closePort);
    closeMarker.open(() => {});
    closeMarker.close();
    closeMarker.close();
    closeMarker.dispose();
    assert.equal(closePort.pushCount, 1);
    assert.equal(closePort.backCount, 1);
    assert.equal(closePort.index, 0);

    const unmountPort = new FakeHistoryPort();
    const unmountMarker = new ManhwaViewerHistoryMarker(unmountPort);
    unmountMarker.open(() => {});
    unmountMarker.dispose();
    unmountMarker.dispose();
    assert.equal(unmountPort.pushCount, 1);
    assert.equal(unmountPort.backCount, 1);
  });
});

describe('Manhwa Viewer web orientation adapter', () => {
  it('does not reject the Viewer when orientation lock is unavailable', async () => {
    const adapter = createManhwaViewerPlatformAdapter(null);

    assert.equal(await adapter.requestPortrait(), false);
    assert.equal(await adapter.restoreLandscape(), false);
  });

  it('absorbs rejected locks and retries landscape cleanup safely', async () => {
    const calls: string[] = [];
    const adapter = createManhwaViewerPlatformAdapter({
      async lock(orientation) {
        calls.push(orientation);
        throw new Error('Orientation lock rejected');
      },
    });

    await assert.doesNotReject(adapter.requestPortrait());
    await assert.doesNotReject(adapter.restoreLandscape());
    await assert.doesNotReject(adapter.restoreLandscape());
    assert.deepEqual(calls, ['portrait', 'landscape', 'landscape']);
  });
});
