import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createManhwaArchiveReadModel,
  getCanonicalManhwaBadgeCount,
} from '../application/ui/manhwaArchiveReadModel';
import {
  FINAL_MANHWA_ASSET_ROOT,
  FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER,
  FINAL_MANHWA_PAGE_COUNT,
  FINAL_MANHWA_RELEASED_PAGE_COUNT,
} from '../content/manhwa/finalManhwa';
import { buildInitialState } from '../stores/gameStoreHelpers';

describe('corrected final Manhwa Archive read model', () => {
  it('preserves the 70-page catalog while exposing only the initial p1–7 reading window', () => {
    const model = createManhwaArchiveReadModel(buildInitialState().progressionState);
    const firstPage = model.pages[0];

    assert.equal(model.pages.length, FINAL_MANHWA_PAGE_COUNT);
    assert.equal(firstPage?.pageNumber, 1);
    assert.equal(firstPage?.status, 'unlocked');
    assert.equal(firstPage?.unlockedContent?.thumbnailSrc,
      `${FINAL_MANHWA_ASSET_ROOT}/page-001.webp`);
    assert.equal(model.unlockedPageCount, 7);
    assert.equal(model.pages[6]?.unlockedContent?.thumbnailSrc,
      `${FINAL_MANHWA_ASSET_ROOT}/page-007.webp`);
    assert.equal(model.pages[7]?.status, 'story_gated');
    assert.equal(model.pages[7]?.unlockedContent, undefined);
    assert.equal(model.pages[9]?.status, 'unreleased');
    assert.equal(model.pages[9]?.unlockedContent, undefined);
  });

  it('unlocks p8–9 only after current receipt-derived access and keeps p10–70 sealed', () => {
    const progression = structuredClone(buildInitialState().progressionState);
    progression.manhwa.unlockedPageIds = Array.from(
      { length: FINAL_MANHWA_RELEASED_PAGE_COUNT },
      (_, index) => FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[index + 1]!.id,
    );
    const model = createManhwaArchiveReadModel(progression);

    assert.equal(model.unlockedPageCount, FINAL_MANHWA_RELEASED_PAGE_COUNT);
    assert.equal(model.pages[8]?.unlockedContent?.thumbnailSrc,
      `${FINAL_MANHWA_ASSET_ROOT}/page-009.webp`);
    assert.equal(model.pages[9]?.status, 'unreleased');
    assert.equal(model.pages.at(-1)?.status, 'unreleased');
    assert.equal(FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[70]?.pageKind, 'outro');
  });

  it('never renders V2 page IDs as V3 unlocked content', () => {
    const progression = structuredClone(buildInitialState().progressionState);
    progression.manhwa.unlockedPageIds = ['manhwa_ch01_page_01'];
    progression.manhwa.viewedPageIds = ['manhwa_ch01_page_01'];
    const model = createManhwaArchiveReadModel(progression);

    assert.equal(model.unlockedPageCount, 0);
    assert.ok(model.pages.every((page) => page.unlockedContent === undefined));
  });

  it('derives the shell badge from current-publication unlocked minus viewed IDs', () => {
    const progression = structuredClone(buildInitialState().progressionState);
    const pageOne = FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[1]!.id;
    const pageTwo = FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[2]!.id;
    const pageSeven = FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[7]!.id;
    progression.manhwa.unlockedPageIds = [pageOne, pageTwo, pageSeven];
    progression.manhwa.viewedPageIds = [pageOne];

    assert.equal(getCanonicalManhwaBadgeCount(progression), 2);
    assert.equal(
      createManhwaArchiveReadModel(progression).newPageCount,
      2,
    );
  });
});
