import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FINAL_MANHWA_PAGES } from '../content/manhwa/finalManhwa';
import { deriveManhwaReaderWindow } from '../domain/manhwa/manhwaReaderWindow';

describe('Manhwa reader window', () => {
  const openingWindow = FINAL_MANHWA_PAGES.filter(
    (page) => page.globalPageNumber <= 14,
  );

  it('does not re-lock a verified puzzle source when the local view cache lags', () => {
    const localViews = new Set(
      openingWindow
        .filter((page) => page.globalPageNumber <= 4)
        .map((page) => page.id),
    );
    const window = deriveManhwaReaderWindow(openingWindow, localViews, 5);

    assert.equal(window.firstUnreadPage?.globalPageNumber, 6);
    assert.equal(window.pages.at(-1)?.globalPageNumber, 6);
  });

  it('still opens only the next sequential record from the server-unlocked window', () => {
    const localViews = new Set(
      openingWindow
        .filter((page) => page.globalPageNumber <= 5)
        .map((page) => page.id),
    );
    const window = deriveManhwaReaderWindow(openingWindow, localViews, 5);

    assert.equal(window.firstUnreadPage?.globalPageNumber, 6);
    assert.equal(window.pages.length, 6);
    assert.equal(window.pages.some((page) => page.globalPageNumber === 14), false);
  });

  it('allows the whole authoritative window after every page in it is read', () => {
    const localViews = new Set(openingWindow.map((page) => page.id));
    const window = deriveManhwaReaderWindow(openingWindow, localViews, 5);

    assert.equal(window.firstUnreadPage, undefined);
    assert.equal(window.pages.at(-1)?.globalPageNumber, 14);
  });
});
