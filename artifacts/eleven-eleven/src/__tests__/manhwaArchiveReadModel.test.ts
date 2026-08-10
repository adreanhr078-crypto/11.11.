import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createManhwaArchiveReadModel,
  getCanonicalManhwaBadgeCount,
} from '../application/ui/manhwaArchiveReadModel';
import { FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER } from '../content/manhwa/finalManhwa';
import { buildInitialState } from '../stores/gameStoreHelpers';

describe('canonical final Manhwa Archive read model', () => {
  it('exposes all 71 approved pages and the cover first', () => {
    const model = createManhwaArchiveReadModel(buildInitialState().progressionState);
    const firstPage = model.pages[0];

    assert.equal(model.pages.length, 71);
    assert.equal(firstPage?.pageNumber, 1);
    assert.equal(firstPage?.status, 'unlocked');
    assert.equal(firstPage?.unlockedContent?.thumbnailSrc, '/manhwa/final/page-001.webp');
    assert.equal(model.pages[1]?.unlockedContent?.thumbnailSrc, '/manhwa/final/page-002.webp');
    assert.equal(model.unlockedPageCount, 71);
  });

  it('keeps the final reader assets rooted in the approved publication', () => {
    const model = createManhwaArchiveReadModel(buildInitialState().progressionState);
    assert.ok(model.pages.every((page) => (
      page.unlockedContent?.thumbnailSrc.startsWith('/manhwa/final/page-')
    )));
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
