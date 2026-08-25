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
    assert.match(screen, /!actionReadiness\.ready/);
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
    const openHint = screen.slice(
      screen.indexOf('const openHint = async'),
      screen.indexOf('const complete = async'),
    );

    assert.match(screen, /const hydratedPuzzleId = useRef<string \| null>\(null\);/);
    assert.match(screen, /if \(hydratedPuzzleId\.current === selectedPuzzle\.id\) return;/);
    assert.match(screen, /hydratedPuzzleId\.current = selectedPuzzle\.id;/);
    assert.match(openHint, /const persistedDraft = normalizePuzzleDraft\(selectedPuzzle, draft\);[\s\S]*?await enqueueDraftSave\(selectedPuzzle\.id, persistedDraft\);[\s\S]*?await actions\.unlockHint\(selectedPuzzle\.id, index, locale\);/);
    assert.doesNotMatch(openHint, /defaultDraft\(|setDraftResetVersion/);
    assert.match(screen, /onClick=\{\(\) => void openHint\(index\)\}/);
  });

  it('never presents a malformed hint price as free or lets it reset the current draft', () => {
    const screen = source('src/features/screens/PuzzleScreen.tsx');

    assert.match(screen, /const priced = Number\.isSafeInteger\(cost\) && cost > 0;/);
    assert.match(screen, /\{priced \? `\$\{cost\} ◉` : 'UNAVAILABLE'\}/);
    assert.match(screen, /disabled=\{busy \|\| !preceding \|\| !priced \|\| selectedEntry\.status === 'locked'\}/);
    assert.doesNotMatch(screen, /cost === 0 \? 'FREE'/);
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
    assert.match(screen, /enqueueSerializedDraftSave\(\s*draftSaveChain,\s*\(\) => actions\.saveDraft\(puzzleId, persistedDraft, locale\),\s*\)/);
    assert.match(screen, /saveTimer\.current = window\.setTimeout\(\(\) => \{\s*saveTimer\.current = null;\s*void enqueueDraftSave\(puzzleId, normalizedDraft\);/);
    assert.match(openHint, /terminalPuzzleAction\.current = true;[\s\S]*?await enqueueDraftSave\(selectedPuzzle\.id, persistedDraft\);[\s\S]*?await actions\.unlockHint\(selectedPuzzle\.id, index, locale\);/);
    assert.match(complete, /terminalPuzzleAction\.current = true;[\s\S]*?await enqueueDraftSave\(selectedPuzzle\.id, submissionDraft\);[\s\S]*?await actions\.complete\(selectedPuzzle\.id, submissionDraft, locale\);/);
    assert.match(complete, /finally \{\s*terminalPuzzleAction\.current = false;\s*setBusy\(false\);\s*\}/);
  });

  it('keeps a deferred autosave ahead of the current draft and terminal receipt', async () => {
    const { createServer } = await import('vite');
    const server = await createServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    try {
      const screen = await server.ssrLoadModule('/src/features/screens/PuzzleScreen.tsx');
      const enqueue = screen.enqueueSerializedDraftSave as <T>(
        chain: { current: Promise<unknown> },
        save: () => Promise<T>,
      ) => Promise<T | null>;
      const chain: { current: Promise<unknown> } = { current: Promise.resolve() };
      const order: string[] = [];
      let releaseAutosave: (value: string) => void = () => undefined;
      const deferredAutosave = new Promise<string>((resolveAutosave) => {
        releaseAutosave = resolveAutosave;
      });

      const autosave = enqueue(chain, async () => {
        order.push('autosave');
        return deferredAutosave;
      });
      const currentDraft = enqueue(chain, async () => {
        order.push('current-draft');
        return 'current-draft';
      });
      const receipt = currentDraft.then(async (saved) => {
        if (!saved) return null;
        order.push('completion');
        return 'receipt';
      });

      await new Promise<void>((resolveTick) => setTimeout(resolveTick, 0));
      assert.deepEqual(order, ['autosave']);
      releaseAutosave('old-draft');
      assert.equal(await autosave, 'old-draft');
      assert.equal(await currentDraft, 'current-draft');
      assert.equal(await receipt, 'receipt');
      assert.deepEqual(order, ['autosave', 'current-draft', 'completion']);
    } finally {
      await server.close();
    }
  });
});
