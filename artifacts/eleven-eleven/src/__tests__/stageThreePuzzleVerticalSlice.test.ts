import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import {
  appendUniqueRouteToken,
  isExactImageReconstructionPermutation,
  normalizeImageReconstructionDraft,
  normalizeSignalSelection,
  removeRouteTokenAt,
  swapPuzzlePieces,
  toggleSignalSelection,
} from '../features/story-puzzles/verticalSliceInteractions';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('Stage 3 opening puzzle vertical slice', () => {
  it('keeps Signal selections stable in either tap order without deciding correctness on the client', () => {
    const channelFirst = toggleSignalSelection([], 'channel-11');
    assert.deepEqual(channelFirst, ['channel-11']);
    assert.deepEqual(toggleSignalSelection(channelFirst, '58'), ['58', 'channel-11']);
    assert.deepEqual(toggleSignalSelection(['58', 'channel-11'], '42'), ['42', 'channel-11']);
    assert.deepEqual(toggleSignalSelection(['58', 'channel-11'], 'channel-11'), ['58']);
    assert.deepEqual(normalizeSignalSelection(['unknown', 'channel-13', '42']), ['42', 'channel-13']);
  });

  it('makes the opening signal tactile while keeping the displayed candidates separate from server truth', () => {
    const screen = source('src/features/screens/PuzzleScreen.tsx');
    const stylesheet = source('src/features/screens/story-puzzle-experience.css');

    assert.match(screen, /className="story-signal-board__tuner"/);
    assert.match(screen, /type="range"/);
    assert.match(screen, /aria-valuetext=\{signalCopy\.tunerValue\(frequencyProbe\)\}/);
    assert.match(screen, /data-frequency-index=\{selectedProbeIndex\}/);
    assert.match(screen, /className="story-signal-board__field-guide"/);
    assert.match(screen, /signalGuide\.balanceTitle/);
    assert.match(screen, /signalGuide\.cleanTitle/);
    assert.match(screen, /story-signal-board__guide-wave/);
    assert.match(stylesheet, /\.story-signal-board__tuner input \{/);
    assert.match(stylesheet, /\.story-signal-board__field-guide/);
    assert.doesNotMatch(screen, /targetFrequency|targetChannel|data-target/);
  });

  it('keeps later signal stages playable through visible candidates without publishing a target field', () => {
    const coreFrequencyIds = ['63', '81', '97'];
    const coreChannelIds = ['channel-07', 'channel-11', 'channel-13'];
    const relayFirst = toggleSignalSelection([], 'channel-11', coreFrequencyIds, coreChannelIds);
    assert.deepEqual(relayFirst, ['channel-11']);
    assert.deepEqual(toggleSignalSelection(relayFirst, '81', coreFrequencyIds, coreChannelIds), ['81', 'channel-11']);

    const catalog = source('src/content/puzzles/storyPuzzleCatalog.ts');
    const screen = source('src/features/screens/PuzzleScreen.tsx');
    const coreSlice = catalog.slice(catalog.indexOf("id: 'story_puzzle_20_core_sequence'"));
    assert.doesNotMatch(catalog, /targetFrequency|targetChannel/);
    assert.match(coreSlice, /frequencyOptions: \[63, 81, 97\]/);
    assert.match(coreSlice, /visualProfile: 'core'/);
    assert.doesNotMatch(coreSlice, /81 on channel 11|81 على القناة 11/);
    assert.doesNotMatch(coreSlice, /SIGNAL → MEMORY → ECHO|ACCESS → MEMORY → SIGNAL|SIGNAL → ACCESS → MEMORY → ECHO/);
    assert.doesNotMatch(coreSlice, /المسار الموثق|مفتاح النواة:|التثبيت الأخير:/);
    assert.match(coreSlice, /source ⌁ launches the trace/);
    assert.match(coreSlice, /clearance gate/);
    assert.match(screen, /signal=\{currentStage\?\.signal \?\? selectedPuzzle\.signal\}/);
    assert.match(screen, /data-profile=\{profile\}/);
  });

  it('keeps the route timeline explicit: full input never silently discards a prior symbol', () => {
    const route = ['signal', 'access', 'memory', 'echo'];
    assert.deepEqual(appendUniqueRouteToken(route, 'extra', 4), route);
    assert.deepEqual(removeRouteTokenAt(route, 1), ['signal', 'memory', 'echo']);
    assert.deepEqual(swapPuzzlePieces(route, 'signal', 'memory'), ['memory', 'access', 'signal', 'echo']);
  });

  it('offers an optional desktop drag path without removing the keyboard route controls', () => {
    const screen = source('src/features/screens/PuzzleScreen.tsx');
    const stylesheet = source('src/features/screens/story-puzzle-experience.css');

    assert.match(screen, /const placeDraggedToken = \(targetIndex: number\)/);
    assert.match(screen, /onDragOver=\{\(event\) =>/);
    assert.match(screen, /onDrop=\{\(event\) =>/);
    assert.match(screen, /data-drop-target=\{dropSlot === index\}/);
    assert.match(screen, /moveSelected\(-1\)/);
    assert.match(stylesheet, /li\[data-drop-target="true"\]/);
  });

  it('gives the visible route one unambiguous source and sink without moving verification to the client', () => {
    const screen = source('src/features/screens/PuzzleScreen.tsx');
    const ports = {
      signal: { input: 'START', output: '◇' },
      access: { input: '◇', output: '△' },
      memory: { input: '△', output: '□' },
      echo: { input: '□', output: 'END' },
    } as const;
    const followsVisibleRoute = (route: readonly (keyof typeof ports)[]) => (
      route[0] !== undefined
      && ports[route[0]].input === 'START'
      && route.at(-1) !== undefined
      && ports[route.at(-1)!].output === 'END'
      && route.slice(0, -1).every((id, index) => ports[id].output === ports[route[index + 1]!].input)
    );

    assert.equal(followsVisibleRoute(['signal', 'access', 'memory', 'echo']), true);
    assert.equal(followsVisibleRoute(['access', 'memory', 'echo', 'signal']), false);
    assert.match(screen, /signal: \{ input: 'START', output: '◇' \}/);
    assert.match(screen, /echo: \{ input: '□', output: 'END' \}/);
    assert.match(screen, /Begin at START/);
  });

  it('removes answer-like prose from the first three public puzzle records while retaining a fair observable rule', () => {
    const catalog = source('src/content/puzzles/storyPuzzleCatalog.ts');
    const openingSlice = catalog.slice(0, catalog.indexOf("id: 'story_puzzle_04_circuit_restore'"));
    const screen = source('src/features/screens/PuzzleScreen.tsx');

    assert.doesNotMatch(openingSlice, /symmetrical around|without interference|Signal precedes Access|Access opens Memory|Echo ends the route/i);
    assert.doesNotMatch(openingSlice, /متناظرة حول خط الوسط|لا تحمل تشويش|الإشارة تسبق الوصول|الوصول يفتح الذاكرة|Echo هو نهاية المسار/);
    assert.doesNotMatch(screen, /targetFrequency|targetChannel|data-target/);
    assert.match(screen, /readSignalSelection/);
    assert.match(screen, /story-system-route__slots/);
    assert.match(screen, /aria-live="polite"/);
    assert.match(screen, /setDraftResetVersion/);
    assert.match(screen, /key=\{`\$\{selectedPuzzle\.id\}:\$\{stageIndex\}:\$\{draftResetVersion\}`\}/);
  });

  it('gives Torn Memory a touch and keyboard path with no contradictory rotation control', () => {
    const catalog = source('src/content/puzzles/storyPuzzleCatalog.ts');
    const openingSlice = catalog.slice(0, catalog.indexOf("id: 'story_puzzle_04_circuit_restore'"));
    const screen = source('src/features/screens/PuzzleScreen.tsx');
    const stylesheet = source('src/features/screens/story-puzzle-experience.css');

    assert.match(openingSlice, /torn-memory-record-v1\.webp/);
    assert.match(openingSlice, /allowRotation: false/);
    assert.match(screen, /aria-pressed=\{selectedPiece === pieceId\}/);
    assert.match(screen, /story-image-puzzle__status/);
    assert.match(screen, /className="story-image-puzzle__grid"\s+dir="ltr"/);
    assert.match(stylesheet, /\.story-image-puzzle__art \{ position: relative; min-block-size: 2\.75rem; touch-action: manipulation;/);
    assert.match(stylesheet, /\.story-image-puzzle__grid \{[^}]*direction: ltr;/);
  });

  it('normalizes Torn Memory drafts to physical canvas pieces without learning its solution', () => {
    const canonical = Array.from({ length: 9 }, (_, index) => `piece-${index}`);
    const normalizedCanonical = normalizeImageReconstructionDraft({
      imageOrder: canonical,
      rotations: { 'piece-0': 0, stale: 3 },
    }, 3, 3, false);
    assert.deepEqual(normalizedCanonical.imageOrder, canonical);
    assert.deepEqual(normalizedCanonical.rotations, Object.fromEntries(
      canonical.map((pieceId) => [pieceId, 0]),
    ));

    const normalizedMalformed = normalizeImageReconstructionDraft({
      imageOrder: ['piece-0', 'piece-0', 'unknown', 'piece-2', 'piece-4', 'piece-4', 'piece-8'],
      rotations: { 'piece-0': 3, stale: 1 },
    }, 3, 3, false);
    assert.equal(isExactImageReconstructionPermutation(normalizedMalformed.imageOrder, 3, 3), true);
    assert.equal(Object.hasOwn(normalizedMalformed.rotations, 'stale'), false);
    assert.equal(Object.values(normalizedMalformed.rotations).every((rotation) => rotation === 0), true);
  });

  it('ships bounded, versioned puzzle art and keeps the signal atmosphere non-interactive', () => {
    const signal = resolve(process.cwd(), 'public/assets/ui/puzzles/signal-chamber-v1.webp');
    const memory = resolve(process.cwd(), 'public/assets/ui/puzzles/torn-memory-record-v1.webp');
    const stylesheet = source('src/features/screens/story-puzzle-experience.css');

    assert.equal(existsSync(signal), true);
    assert.equal(existsSync(memory), true);
    assert.ok(statSync(signal).size <= 100 * 1024, 'signal atmosphere exceeds its 100KB budget');
    assert.ok(statSync(memory).size <= 120 * 1024, 'memory crop exceeds its 120KB budget');
    assert.match(stylesheet, /signal-chamber-v1\.webp/);
    assert.match(stylesheet, /pointer-events: none;/);
    assert.match(stylesheet, /font: 700 \.7rem/);
  });
});
