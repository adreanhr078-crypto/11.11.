import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('canonical progression presentation contract', () => {
  it('does not present ongoing-story endings or truncate authoritative achievements', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../features/screens/ProgressScreen.tsx', import.meta.url), 'utf8');

    assert.doesNotMatch(source, /model\.endings(?:Seen|Eligible|Total)/);
    assert.doesNotMatch(source, /collection\.achievements\.slice\(0,\s*8\)/);
    assert.match(source, /collection\.achievements\.map\(\(achievement\)/);
    assert.match(source, /canonicalAchievementsUnlocked/);
  });
});
