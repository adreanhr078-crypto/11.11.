import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { STORY_PUZZLES } from '../content/puzzles/storyPuzzleCatalog';
import {
  isLoadBalanceReady,
  loadBalanceTotal,
  normalizeLoadBalanceAssignments,
} from '../features/story-puzzles/verticalSliceInteractions';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('Stage 3 remaining Story Puzzle playability', () => {
  const remainingPuzzles = STORY_PUZZLES;

  it('keeps every remaining puzzle self-contained with a player goal, in-world brief, reference, and progressive hints', () => {
    assert.equal(remainingPuzzles.length, 2);
    for (const puzzle of remainingPuzzles) {
      assert.ok(puzzle.title.ar.length > 0 && puzzle.title.en.length > 0, `${puzzle.id} needs a localized title`);
      assert.ok(puzzle.objective.ar.length > 0 && puzzle.objective.en.length > 0, `${puzzle.id} needs a localized objective`);
      assert.ok(puzzle.brief?.ar && puzzle.brief.en, `${puzzle.id} needs an in-world brief`);
      assert.ok(puzzle.reference?.entries.length, `${puzzle.id} needs a player-visible reference`);
      assert.equal(puzzle.hints.length, 3, `${puzzle.id} needs a progressive hint ladder`);
    }
  });

  it('keeps special interactions backed by a valid visible input model instead of an empty surface', () => {
    const byOrder = new Map(remainingPuzzles.map((puzzle) => [puzzle.order, puzzle]));
    for (const order of [1, 2]) {
      assert.ok((byOrder.get(order)?.options?.length ?? 0) > 0, `puzzle ${order} needs visible choices`);
    }
    assert.equal(byOrder.get(1)?.mechanic, 'signal');
    assert.equal(byOrder.get(2)?.mechanic, 'sequence');
  });

  it('starts the load-balancing puzzle from a truthful visible baseline and prevents a plainly incomplete submission', () => {
    const screen = source('src/features/screens/PuzzleScreen.tsx');

    assert.equal(loadBalanceTotal(normalizeLoadBalanceAssignments({})), 60);
    assert.deepEqual(normalizeLoadBalanceAssignments({ power: '30' }), {
      power: '30', data: '20', cooling: '20',
    });
    assert.equal(normalizeLoadBalanceAssignments({ power: 'not-a-number' }).power, '20');
    assert.equal(isLoadBalanceReady(normalizeLoadBalanceAssignments({})), false);
    assert.equal(isLoadBalanceReady({ power: '50', data: '20', cooling: '30' }), true);
    assert.match(screen, /assignments: normalizeLoadBalanceAssignments\(\{\}\)/);
    assert.match(screen, /function normalizePuzzleDraft\(/);
    assert.match(screen, /\? normalizePuzzleDraft\(selectedPuzzle, entry\.draft\)/);
    assert.match(screen, /isLoadBalanceReady\(draft\.assignments\)/);
    assert.match(screen, /aria-valuetext=\{copy\.value\(channel\.label\[locale\], value\)\}/);
  });

  it('labels multi-stage work as a draft and serializes its persistence before final verification', () => {
    const screen = source('src/features/screens/PuzzleScreen.tsx');
    const stylesheet = source('src/features/screens/story-puzzle-experience.css');

    assert.match(screen, /confirmStage: 'Save draft & continue'/);
    assert.match(screen, /Stage inputs are collected and verified together only at final submission\./);
    assert.match(screen, /data-prepared=\{index < stageIndex && hasPuzzleDraftInput\(stageDrafts\[index\]!\)\}/);
    assert.match(screen, /const cancelQueuedSave = \(\) =>/);
    assert.match(screen, /const draftSaveChain = useRef<Promise<unknown>>\(Promise\.resolve\(\)\);/);
    assert.match(screen, /return enqueueSerializedDraftSave\(/);
    assert.match(screen, /await enqueueDraftSave\(selectedPuzzle\.id, normalizedDraft\);/);
    assert.match(stylesheet, /button\[data-prepared="true"\]/);
    assert.doesNotMatch(stylesheet, /button\[data-complete="true"\]/);
  });

  it('keeps remaining puzzle controls keyboard-labelled and touch-sized without importing server solutions', () => {
    const screen = source('src/features/screens/PuzzleScreen.tsx');
    const stylesheet = source('src/features/screens/story-puzzle-experience.css');
    const catalog = source('src/content/puzzles/storyPuzzleCatalog.ts');
    const contracts = source('src/domain/story-puzzles/storyPuzzleContracts.ts');

    assert.match(screen, /aria-label=\{wiringCopy\.board\}/);
    assert.match(screen, /aria-label=\{matrixCopy\.board\}/);
    assert.match(screen, /aria-label=\{forensicCopy\.board\}/);
    assert.match(screen, /Build a \$\{limit\}-node route\./);
    assert.doesNotMatch(screen, /_storyPuzzleDefinitions/);
    assert.doesNotMatch(catalog, /rotationGoal/);
    assert.doesNotMatch(contracts, /rotationGoal/);
    assert.doesNotMatch(catalog, /maps to MEMORY|ACCESS port accepts only ECHO identity/);
    assert.match(stylesheet, /\.story-wiring-board article button \{ min-block-size: 3rem;/);
    assert.match(stylesheet, /\.story-data-route__clear \{ justify-self: start; min-block-size: 3rem;/);
    assert.match(stylesheet, /\.story-puzzle-stages > div button \{ flex: 1; min-block-size: 3rem;/);
    assert.match(stylesheet, /\.story-puzzle-screen button:focus-visible/);
    assert.match(stylesheet, /\[data-gds-motion="reduced"\][\s\S]*?\.story-matrix-board__tiles button[\s\S]*?transition: none !important;/);
  });
});
