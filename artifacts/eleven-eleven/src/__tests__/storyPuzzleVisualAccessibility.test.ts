import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('Story puzzle visual asset accessibility', () => {
  it('keeps image reconstruction recoverable when its visual source cannot load', () => {
    const screen = source('src/features/screens/PuzzleScreen.tsx');
    const stylesheet = source('src/features/screens/story-puzzle-experience.css');

    assert.match(screen, /function usePuzzleVisualAsset\(source\?: string\)/);
    assert.match(screen, /const probe = new Image\(\);/);
    assert.match(screen, /probe\.onload = \(\) =>/);
    assert.match(screen, /probe\.onerror = \(\) =>/);
    assert.match(screen, /assetStatus === 'failed'/);
    assert.match(screen, /Memory record unavailable/);
    assert.match(screen, /No attempt can be sent until the record returns/);
    assert.match(screen, /disabled=\{interactionDisabled\}/);
    assert.match(screen, /assetStatus === 'failed'\s*\? imageCopy\.unavailableDetail/);
    assert.match(screen, /if \(!actionReadiness\.ready\) return;/);
    assert.match(screen, /onVisualAssetStateChange=\{visualAssetContext \? reportVisualAssetState : undefined\}/);
    assert.match(stylesheet, /\.story-puzzle-visual-fallback \{ display: grid;/);
    assert.match(stylesheet, /\.story-puzzle-visual-fallback button \{[\s\S]*?min-block-size: 3rem;/);
  });

  it('maps visual-forensics points by their named grid coordinates and provides a text evidence view', () => {
    const screen = source('src/features/screens/PuzzleScreen.tsx');
    const stylesheet = source('src/features/screens/story-puzzle-experience.css');

    assert.match(screen, /function forensicPointPosition\(id: string, index: number\)/);
    assert.match(screen, /\^\(\[xyz\]\)\(\[123\]\)\$\/i/);
    assert.match(screen, /style=\{\{ '--point-x': position\.x, '--point-y': position\.y \} as CSSProperties\}/);
    assert.match(screen, /story-forensics-board__view-toggle/);
    assert.match(screen, /Show text evidence cards/);
    assert.match(screen, /data-view=\{usesEvidenceList \? 'evidence' : 'map'\}/);
    assert.match(screen, /Text evidence cards remain available/);
    assert.match(stylesheet, /\.story-forensics-board__record\[data-view="map"\] \.story-forensics-board__points > button \{ position: absolute; top: var\(--point-y\); left: var\(--point-x\);/);
    assert.match(stylesheet, /\.story-forensics-board__record\[data-view="evidence"\] \.story-forensics-board__points \{ display: grid;/);
    assert.match(stylesheet, /\.story-forensics-board__record\[data-view="evidence"\] \.story-forensics-board__points > button \{[\s\S]*?min-block-size: 4\.15rem;/);
  });

  it('keeps the non-drag click path and does not import server-side puzzle answers', () => {
    const screen = source('src/features/screens/PuzzleScreen.tsx');

    assert.match(screen, /Dragging is an optional desktop enhancement\./);
    assert.match(screen, /aria-pressed=\{selectedPiece === pieceId\}/);
    assert.doesNotMatch(screen, /_storyPuzzleDefinitions/);
    assert.doesNotMatch(screen, /correctAnswer|rawSolution|targetFrequency|targetChannel/);
  });

  it('flushes a local draft before a hint and does not rehydrate the active puzzle on its snapshot response', () => {
    const screen = source('src/features/screens/PuzzleScreen.tsx');

    assert.match(screen, /const hydratedPuzzleId = useRef<string \| null>\(null\);/);
    assert.match(screen, /if \(hydratedPuzzleId\.current === selectedPuzzle\.id\) return;/);
    assert.match(screen, /hydratedPuzzleId\.current = selectedPuzzle\.id;/);
    assert.match(screen, /const openHint = async \(index: number\) => \{[\s\S]*?await actions\.saveDraft\(selectedPuzzle\.id, draft, locale\);[\s\S]*?await actions\.unlockHint\(selectedPuzzle\.id, index, locale\);/);
    assert.match(screen, /onClick=\{\(\) => void openHint\(index\)\}/);
  });

  it('serializes autosave, hint, and completion writes so a stale draft cannot replace a receipt', () => {
    const screen = source('src/features/screens/PuzzleScreen.tsx');
    const openHint = screen.slice(
      screen.indexOf('const openHint = async'),
      screen.indexOf('const complete = async'),
    );
    const complete = screen.slice(
      screen.indexOf('const complete = async'),
      screen.indexOf('const advanceStage = async'),
    );

    assert.match(screen, /const draftSaveChain = useRef<Promise<unknown>>\(Promise\.resolve\(\)\);/);
    assert.match(screen, /const enqueueDraftSave = \(puzzleId: string, nextDraft: StoryPuzzleDraft\) => \{[\s\S]*?draftSaveChain\.current[\s\S]*?actions\.saveDraft\(puzzleId, persistedDraft, locale\)/);
    assert.match(screen, /saveTimer\.current = window\.setTimeout\(\(\) => \{\s*saveTimer\.current = null;\s*void enqueueDraftSave\(puzzleId, next\);/);
    assert.match(openHint, /terminalPuzzleAction\.current = true;[\s\S]*?await enqueueDraftSave\(selectedPuzzle\.id, draft\);[\s\S]*?await actions\.unlockHint\(selectedPuzzle\.id, index, locale\);/);
    assert.match(complete, /terminalPuzzleAction\.current = true;[\s\S]*?await enqueueDraftSave\(selectedPuzzle\.id, draft\);[\s\S]*?await actions\.complete\(selectedPuzzle\.id, draft, locale\);/);
    assert.match(complete, /finally \{\s*terminalPuzzleAction\.current = false;\s*setBusy\(false\);\s*\}/);
  });
});
