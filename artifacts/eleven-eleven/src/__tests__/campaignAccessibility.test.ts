import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('story puzzle interaction accessibility', () => {
  it('keeps every official interaction available without audio-only controls', () => {
    const puzzleScreen = source('src/features/screens/PuzzleScreen.tsx');

    assert.ok(puzzleScreen.includes('type="button"'));
    assert.ok(puzzleScreen.includes('onClick'));
    assert.ok(puzzleScreen.includes('onDrop'));
    assert.ok(puzzleScreen.includes('swapPieces'));
    assert.ok(puzzleScreen.includes('type="range"'));
    assert.equal(puzzleScreen.includes('<audio'), false);
    assert.equal(puzzleScreen.includes('setInterval'), false);
    assert.ok(puzzleScreen.includes('aria-modal="true"'));
    assert.ok(puzzleScreen.includes('aria-label="تركيب الصورة / Image reconstruction"'));
  });

  it('uses the final publication reader and does not keep a legacy unlock UI', () => {
    const memoryScreen = source('src/features/screens/MemoryScreen.tsx');
    const viewer = source('src/features/manhwa/ManhwaFullscreenViewer.tsx');
    const readModel = source(
      'src/application/ui/manhwaArchiveReadModel.ts',
    );

    assert.ok(memoryScreen.includes('FINAL_MANHWA_PAGES'));
    assert.ok(viewer.includes('onTouchStart'));
    assert.ok(memoryScreen.includes('claimManhwaChapterReward'));
    assert.equal(memoryScreen.includes('<GameModal'), false);
    assert.ok(readModel.includes('thumbnailSrc: page.imageSrc'));
    assert.ok(readModel.includes('thumbnailSrc: page.imageSrc'));
    assert.equal(memoryScreen.includes('/manhwa/chapter-01/'), false);
    assert.equal(memoryScreen.includes('unlockManhwaPage'), false);
  });

  it('supports keyboard, ARIA, focus restoration, and live feedback', () => {
    const memoryScreen = source('src/features/screens/MemoryScreen.tsx');
    const viewer = source('src/features/manhwa/ManhwaFullscreenViewer.tsx');
    const overlays = source('src/ui/design-system/overlays.tsx');

    assert.ok(viewer.includes('onTouchStart'));
    assert.ok(memoryScreen.includes('aria-live="polite"'));
    assert.ok(memoryScreen.includes('aria-atomic="true"'));
    assert.ok(memoryScreen.includes('aria-label='));
    assert.ok(viewer.includes("event.key === 'ArrowLeft'"));
    assert.ok(viewer.includes("event.key === 'ArrowRight'"));
    assert.ok(viewer.includes('role="dialog"'));
    assert.ok(overlays.includes('previousFocus?.focus()'));
    assert.ok(overlays.includes('event.key === \'Escape\''));
  });

  it('honors reduced motion for rewards, shards, and the manhwa viewer', () => {
    const puzzleStyles = source('src/features/screens/story-puzzle-experience.css');
    const memoryStyles = source(
      'src/features/screens/manhwa-archive.css',
    );

    assert.ok(puzzleStyles.includes('@media (prefers-reduced-motion: reduce)'));
    assert.ok(puzzleStyles.includes('[data-gds-motion="reduced"]'));
    assert.ok(memoryStyles.includes('@media (prefers-reduced-motion: reduce)'));
    assert.ok(memoryStyles.includes('[data-gds-motion="reduced"]'));
  });
});
