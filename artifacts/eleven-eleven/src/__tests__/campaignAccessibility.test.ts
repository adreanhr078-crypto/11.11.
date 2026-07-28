import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('campaign interaction accessibility', () => {
  it('keeps every puzzle interaction available without drag or audio', () => {
    const interaction = source(
      'src/features/puzzles/PuzzleInteractionBoard.tsx',
    );
    const puzzleScreen = source('src/features/screens/PuzzleScreen.tsx');

    assert.ok(interaction.includes('type="button"'));
    assert.ok(interaction.includes('<select'));
    assert.ok(interaction.includes('onClick'));
    assert.equal(interaction.includes('onDrag'), false);
    assert.equal(puzzleScreen.includes('<audio'), false);
    assert.equal(puzzleScreen.includes('setInterval'), false);
    assert.ok(puzzleScreen.includes('aria-modal="true"'));
    assert.ok(puzzleScreen.includes('inert={Boolean(rewardEvent)}'));
  });

  it('keeps locked images out of the UI and uses the canonical unlock action', () => {
    const memoryScreen = source('src/features/screens/MemoryScreen.tsx');
    const readModel = source(
      'src/application/ui/manhwaArchiveReadModel.ts',
    );

    assert.ok(memoryScreen.includes('page.unlockedContent ? ('));
    assert.ok(memoryScreen.includes('loading="lazy"'));
    assert.ok(memoryScreen.includes('unlockManhwaPage(pendingPage.id)'));
    assert.ok(memoryScreen.includes('<GameModal'));
    assert.ok(readModel.includes('...(unlocked'));
    assert.ok(readModel.includes('thumbnailSrc: page.imageSrc'));
    assert.ok(readModel.includes(': {})'));
    assert.equal(memoryScreen.includes('CHAPTER_01_MANHWA_PAGES'), false);
    assert.equal(memoryScreen.includes('markManhwaPageViewed'), false);
    assert.equal(memoryScreen.includes('viewedPageIds'), false);
    assert.equal(memoryScreen.includes('pageViewedAt'), false);
    assert.equal(memoryScreen.includes('claimedPageEffectIds'), false);
    assert.equal(memoryScreen.includes('applyEchoEffects'), false);
    assert.equal(memoryScreen.includes('requestFullscreen'), false);
  });

  it('supports keyboard, ARIA, focus restoration, and live feedback', () => {
    const memoryScreen = source('src/features/screens/MemoryScreen.tsx');
    const overlays = source('src/ui/design-system/overlays.tsx');

    assert.ok(memoryScreen.includes('onKeyDown'));
    assert.ok(memoryScreen.includes('ArrowLeft'));
    assert.ok(memoryScreen.includes('ArrowRight'));
    assert.ok(memoryScreen.includes('Home'));
    assert.ok(memoryScreen.includes('End'));
    assert.ok(memoryScreen.includes('tabIndex='));
    assert.ok(memoryScreen.includes('aria-live="polite"'));
    assert.ok(memoryScreen.includes('aria-atomic="true"'));
    assert.ok(memoryScreen.includes('aria-current='));
    assert.ok(memoryScreen.includes('aria-label='));
    assert.ok(overlays.includes('previousFocus?.focus()'));
    assert.ok(overlays.includes('event.key === \'Escape\''));
  });

  it('honors reduced motion for rewards, shards, and the manhwa viewer', () => {
    const puzzleStyles = source(
      'src/features/screens/puzzle-campaign.css',
    );
    const memoryStyles = source(
      'src/features/screens/manhwa-archive.css',
    );

    assert.ok(puzzleStyles.includes('@media (prefers-reduced-motion: reduce)'));
    assert.ok(puzzleStyles.includes('[data-gds-motion="reduced"]'));
    assert.ok(memoryStyles.includes('@media (prefers-reduced-motion: reduce)'));
    assert.ok(memoryStyles.includes('[data-gds-motion="reduced"]'));
  });
});
