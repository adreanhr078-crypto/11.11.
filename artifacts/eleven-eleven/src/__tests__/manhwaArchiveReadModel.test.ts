import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createManhwaArchiveReadModel,
  getCanonicalManhwaBadgeCount,
} from '../application/ui/manhwaArchiveReadModel';
import { FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER } from '../content/manhwa/finalManhwa';
import { buildInitialState } from '../stores/gameStoreHelpers';

describe('canonical final Manhwa Archive read model', () => {
  it('exposes the 71-page catalog but unlocks only the first clue window', () => {
    const model = createManhwaArchiveReadModel(buildInitialState().progressionState);
    const firstPage = model.pages[0];

    assert.equal(model.pages.length, 71);
    assert.equal(firstPage?.pageNumber, 1);
    assert.equal(firstPage?.status, 'unlocked');
    assert.equal(firstPage?.unlockedContent?.thumbnailSrc, '/manhwa/final/page-001.webp');
    assert.equal(model.pages[1]?.unlockedContent?.thumbnailSrc, '/manhwa/final/page-002.webp');
    assert.equal(model.unlockedPageCount, 4);
    assert.equal(model.pages[3]?.unlockedContent?.thumbnailSrc, '/manhwa/final/page-004.webp');
    assert.equal(model.pages[4]?.unlockedContent, undefined);
  });

  it('keeps the final reader assets rooted in the approved publication', () => {
    const model = createManhwaArchiveReadModel(buildInitialState().progressionState);
    const unlocked = model.pages.filter((page) => page.status === 'unlocked');
    const locked = model.pages.filter((page) => page.status !== 'unlocked');
    assert.ok(unlocked.every((page) => (
      page.unlockedContent?.thumbnailSrc.startsWith('/manhwa/final/page-')
    )));
    assert.ok(locked.every((page) => page.unlockedContent === undefined));
    assert.equal(
      FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[71]?.pageKind,
      'back-cover',
    );
  });

  it('derives the shell badge from canonical unlocked minus viewed IDs', () => {
    const progression = structuredClone(buildInitialState().progressionState);
    progression.manhwa.unlockedPageIds = [
      'manhwa_ch00_page_01',
      'manhwa_ch00_page_02',
      'manhwa_ch01_page_01',
    ];
    progression.manhwa.viewedPageIds = ['manhwa_ch00_page_01'];

    assert.equal(getCanonicalManhwaBadgeCount(progression), 2);
    assert.equal(
      createManhwaArchiveReadModel(progression).newPageCount,
      2,
    );
  });
});
