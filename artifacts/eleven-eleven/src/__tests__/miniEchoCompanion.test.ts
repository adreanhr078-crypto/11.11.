import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function source(...segments: string[]): string {
  return readFileSync(resolve(process.cwd(), 'src', ...segments), 'utf8');
}

describe('Mini Echo companion', () => {
  it('appears only from a verified reward projection and stays in normal layout flow', () => {
    const home = source('features', 'screens', 'PsychologicalStateScreen.tsx');
    const companion = source('features', 'echo', 'MiniEchoCompanion.tsx');
    const styles = source('features', 'echo', 'mini-echo-companion.css');

    assert.match(home, /<MiniEchoCompanion/);
    assert.match(home, /available=\{hasVerifiedReward\}/);
    assert.match(companion, /if \(!available\) return null/);
    assert.match(companion, /useId\(\)/);
    assert.doesNotMatch(styles, /position:\s*fixed/);
    assert.match(styles, /min-block-size: 3\.5rem/);
  });

  it('keeps the original 2.5D companion asset inside the mobile budget', () => {
    const asset = resolve(process.cwd(), 'public', 'assets', 'ui', 'echo', 'companion-signal-dock-v1.webp');

    assert.equal(existsSync(asset), true);
    assert.ok(statSync(asset).size <= 250 * 1024);
  });

  it('reacts beside verified puzzle feedback and a legal Echo-chess move without covering either board', () => {
    const puzzle = source('features', 'screens', 'PuzzleScreen.tsx');
    const chess = source('features', 'echo-network', 'ContractChessPanel.tsx');
    const companion = source('features', 'echo', 'MiniEchoCompanion.tsx');

    assert.match(puzzle, /className="story-puzzle-console__mini-echo"/);
    assert.match(puzzle, /objectiveKind="solve"/);
    assert.match(chess, /className="contract-chess-stage__mini-echo"/);
    assert.match(chess, /kind: 'chess-move-completed'/);
    assert.match(companion, /event \?\? \(latestActivity/);
  });

  it('uses brief contextual animation with a Reduced Motion equivalent', () => {
    const companion = source('features', 'echo', 'MiniEchoCompanion.tsx');
    const styles = source('features', 'echo', 'mini-echo-companion.css');

    assert.match(companion, /key=\{cue\.cueId\}/);
    assert.match(styles, /mini-echo-celebrate/);
    assert.match(styles, /mini-echo-focus/);
    assert.match(styles, /mini-echo-concern/);
    assert.match(styles, /prefers-reduced-motion/);
    assert.match(styles, /data-gds-motion="reduced"/);
  });
});
