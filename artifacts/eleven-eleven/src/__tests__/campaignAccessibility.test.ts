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
    assert.ok(puzzleScreen.includes("board: 'Image reconstruction'"));
    assert.ok(puzzleScreen.includes('aria-label={imageCopy.board}'));
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

  it('keeps the signed-out Puzzle screen fallback stable across renders', () => {
    const puzzleScreen = source('src/features/screens/PuzzleScreen.tsx');
    assert.ok(puzzleScreen.includes('EMPTY_STORY_PUZZLE_ENTRIES'));
    assert.ok(puzzleScreen.includes(
      'snapshot?.entries ?? EMPTY_STORY_PUZZLE_ENTRIES',
    ));
    assert.equal(puzzleScreen.includes('snapshot?.entries ?? []'), false);
  });

  it('keeps visual Daily and Weekly boards stable while draft responses refresh', () => {
    const liveScreen = source('src/features/live-challenges/LiveChallengesScreen.tsx');
    assert.match(liveScreen, /\}, \[definition\.id\]\);/);
    assert.match(liveScreen, /saveDailyDraft\(value \|\| undefined\)/);
    assert.match(liveScreen, /saveWeeklyDraft\(value \|\| undefined\)/);
    assert.doesNotMatch(liveScreen, /\[definition\.id, visual\]/);
  });

  it('contains the cinematic shell without page or horizontal stage overflow', () => {
    const foundation = source('src/ui/design-system/styles/foundation.css');
    const shellStyles = source('src/app/shell/application-shell.css');
    const presentationStyles = source(
      'src/ui/presentation/premium-presentation.css',
    );

    assert.ok(foundation.includes('html,\nbody,\n#root'));
    assert.ok(foundation.includes('overflow: hidden;'));
    assert.ok(shellStyles.includes('overflow-x: hidden;'));
    assert.ok(shellStyles.includes('overflow-y: auto;'));
    assert.ok(presentationStyles.includes('overflow-x: clip;'));
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
