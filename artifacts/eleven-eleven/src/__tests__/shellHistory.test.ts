import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('shell navigation history contract', () => {
  it('keeps browser history authoritative for route changes', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../app/shell/shellStore.ts', import.meta.url), 'utf8');

    assert.match(source, /history\.pushState/);
    assert.match(source, /history\.replaceState/);
    assert.match(source, /addEventListener\('hashchange'/);
    assert.match(source, /addEventListener\('popstate'/);
    assert.match(source, /history\.back\(\)/);
    assert.doesNotMatch(source, /history\.replaceState\(null/);
  });
});
