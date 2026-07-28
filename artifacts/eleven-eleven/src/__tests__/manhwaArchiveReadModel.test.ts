import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createManhwaArchiveReadModel,
  getCanonicalManhwaBadgeCount,
} from '../application/ui/manhwaArchiveReadModel';
import { buildInitialState } from '../stores/gameStoreHelpers';

function progressionWithBalance(balance: number) {
  const progression = structuredClone(buildInitialState().progressionState);
  progression.resources.memoryShards.spendableBalance = balance;
  return progression;
}

describe('canonical Manhwa Archive read model', () => {
  it('keeps Page 01 free, unlocked, and backed by a real thumbnail', () => {
    const model = createManhwaArchiveReadModel(
      progressionWithBalance(0),
    );
    const pageOne = model.pages[0];

    assert.equal(model.pages.length, 29);
    assert.equal(pageOne?.pageNumber, 1);
    assert.equal(pageOne?.shardCost, 0);
    assert.equal(pageOne?.status, 'unlocked');
    assert.equal(
      pageOne?.unlockedContent?.thumbnailSrc,
      '/manhwa/chapter-01/page-01.webp',
    );
  });

  it('makes Page 02 available at three shards while Page 03 stays gated', () => {
    const model = createManhwaArchiveReadModel(
      progressionWithBalance(3),
    );
    const pageTwo = model.pages[1];
    const pageThree = model.pages[2];

    assert.equal(pageTwo?.status, 'available');
    assert.equal(pageTwo?.shardCost, 3);
    assert.equal(pageTwo?.balanceAfterUnlock, 0);
    assert.equal(pageThree?.status, 'previous_page_required');
    assert.match(pageThree?.reason.ar ?? '', /02/);
  });

  it('reports insufficient balance without exposing locked image URLs', () => {
    const model = createManhwaArchiveReadModel(
      progressionWithBalance(2),
    );
    const pageTwo = model.pages[1];

    assert.equal(pageTwo?.status, 'insufficient_shards');
    assert.equal(pageTwo?.unlockedContent, undefined);
    assert.equal(
      JSON.stringify(model).includes(
        '/manhwa/chapter-01/page-02.webp',
      ),
      false,
    );
    assert.equal(
      JSON.stringify(model).includes(
        '/manhwa/chapter-01/page-29.webp',
      ),
      false,
    );
  });

  it('adds real content only after canonical unlock state changes', () => {
    const progression = progressionWithBalance(0);
    progression.manhwa.unlockedPageIds.push(
      'manhwa_ch01_page_02',
    );
    const model = createManhwaArchiveReadModel(progression);
    const pageTwo = model.pages[1];
    const pageThree = model.pages[2];

    assert.equal(pageTwo?.status, 'unlocked');
    assert.equal(
      pageTwo?.unlockedContent?.thumbnailSrc,
      '/manhwa/chapter-01/page-02.webp',
    );
    assert.equal(pageThree?.status, 'insufficient_shards');
  });

  it('derives the shell badge from canonical unlocked minus viewed IDs', () => {
    const progression = progressionWithBalance(0);
    progression.manhwa.unlockedPageIds = [
      'manhwa_ch01_page_01',
      'manhwa_ch01_page_02',
      'manhwa_ch01_page_02',
    ];
    progression.manhwa.viewedPageIds = ['manhwa_ch01_page_01'];

    assert.equal(getCanonicalManhwaBadgeCount(progression), 1);
    assert.equal(
      createManhwaArchiveReadModel(progression).newPageCount,
      1,
    );
  });
});
