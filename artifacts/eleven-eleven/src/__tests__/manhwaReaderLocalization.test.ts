import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { resolveManhwaReaderArrowNavigation } from '../features/manhwa/ManhwaFullscreenViewer';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('Manhwa reader localization and direction', () => {
  it('maps horizontal keyboard navigation to the active reading direction', () => {
    assert.deepEqual(resolveManhwaReaderArrowNavigation('ar'), {
      previous: 'ArrowRight',
      next: 'ArrowLeft',
    });
    assert.deepEqual(resolveManhwaReaderArrowNavigation('en'), {
      previous: 'ArrowLeft',
      next: 'ArrowRight',
    });
  });

  it('localizes reader chrome, ARIA labels, and recovery copy without changing the reader boundary', () => {
    const archive = source('src/features/screens/MemoryScreen.tsx');
    const viewer = source('src/features/manhwa/ManhwaFullscreenViewer.tsx');

    assert.ok(archive.includes('lang={locale}'));
    assert.ok(archive.includes('{copy.publication}'));
    assert.ok(archive.includes('{copy.archiveDescription}'));
    assert.ok(archive.includes('eyebrow={copy.chapterSelect}'));
    assert.ok(archive.includes('copy.pageEyebrow(activePage.globalPageNumber'));
    assert.ok(archive.includes('copy.pageIndicator(activePage.globalPageNumber, FINAL_MANHWA_PAGES.length)'));
    assert.ok(archive.includes("locale === 'ar' ? <ChevronRight /> : <ChevronLeft />"));
    assert.ok(archive.includes("locale === 'ar' ? <ChevronLeft /> : <ChevronRight />"));

    assert.ok(viewer.includes("loadingDetail: 'يُفتح السجل…'"));
    assert.equal(viewer.includes("loadingDetail: 'Loading page…'"), false);
    assert.ok(viewer.includes('readerChapterLabel(currentPage.chapterId, locale)'));
    assert.ok(viewer.includes('aria-busy={loadState === \'loading\'}'));
    assert.ok(viewer.includes('aria-label={copy.stage(currentPage.globalPageNumber)}'));
    assert.ok(viewer.includes('aria-label={copy.navigation}'));
    assert.ok(viewer.includes('aria-label={copy.previousPage(previousPage?.globalPageNumber)}'));
    assert.ok(viewer.includes('aria-label={copy.nextPage(nextPage?.globalPageNumber)}'));
  });
});
