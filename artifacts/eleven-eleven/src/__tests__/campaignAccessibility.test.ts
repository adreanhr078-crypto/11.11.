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

  it('keeps locked page images unloaded and exposes viewer alternatives', () => {
    const memoryScreen = source('src/features/screens/MemoryScreen.tsx');
    const imageBranch = memoryScreen.indexOf('{selectedIsOpen ? (');
    const imageElement = memoryScreen.indexOf('<img', imageBranch);
    const sealedBranch = memoryScreen.indexOf(': (', imageElement);

    assert.ok(imageBranch >= 0);
    assert.ok(imageElement > imageBranch);
    assert.ok(sealedBranch > imageElement);
    assert.ok(memoryScreen.includes('loading="lazy"'));
    assert.ok(memoryScreen.includes('onPointerDown'));
    assert.ok(memoryScreen.includes('onKeyDown'));
    assert.ok(memoryScreen.includes('الوصف النصي وحوار الصفحة'));
    assert.ok(memoryScreen.includes('العودة للأرشيف'));
  });

  it('honors reduced motion for rewards, shards, and the manhwa viewer', () => {
    const puzzleStyles = source(
      'src/features/screens/puzzle-campaign.css',
    );
    const memoryStyles = source(
      'src/features/screens/memory-archive.css',
    );

    assert.ok(puzzleStyles.includes('@media (prefers-reduced-motion: reduce)'));
    assert.ok(puzzleStyles.includes('[data-gds-motion="reduced"]'));
    assert.ok(memoryStyles.includes('@media (prefers-reduced-motion: reduce)'));
    assert.ok(memoryStyles.includes('[data-gds-motion="reduced"]'));
  });
});
