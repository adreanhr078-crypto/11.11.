import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('Stage 3 surface accessibility regressions', () => {
  it('keeps the shell skip link touch-sized while it becomes the first keyboard focus', () => {
    const shellStyles = source('src/app/shell/application-shell.css');
    assert.match(shellStyles, /\.application-shell__skip-link\s*\{[\s\S]*?display: inline-flex;[\s\S]*?align-items: center;[\s\S]*?min-block-size: var\(--gds-touch-target\);/);
  });

  it('keeps real localized Manhwa navigation labels on phone layouts', () => {
    const stylesheet = source('src/features/screens/memory-archive.css');
    assert.doesNotMatch(stylesheet, /content:\s*["']صفحة["']/);
    assert.match(stylesheet, /\.manhwa-page-viewer__navigation \.gds-button__label \{[\s\S]*?white-space: nowrap;/);
  });

  it('uses one touch-sized Manhwa page scrubber instead of seventy-one tiny tab stops', () => {
    const screen = source('src/features/screens/MemoryScreen.tsx');
    const stylesheet = source('src/features/screens/manhwa-archive.css');
    assert.match(screen, /final-manhwa-reader__timeline-track" aria-hidden="true"/);
    assert.match(screen, /type="range"[\s\S]*?aria-valuetext=/);
    assert.doesNotMatch(screen, /className="final-manhwa-reader__timeline-page"[^>]*onClick/);
    assert.match(stylesheet, /\.final-manhwa-reader__timeline-scrubber input \{[\s\S]*?min-block-size: var\(--gds-touch-target\);/);
  });

  it('keeps optional image rotation and achievement notices safe for touch and keyboard play', () => {
    const puzzleStyles = source('src/features/screens/story-puzzle-experience.css');
    const overlay = source('src/ui/presentation/AchievementPresentationOverlay.tsx');
    const overlayStyles = source('src/ui/presentation/achievement-presentation.css');
    assert.match(puzzleStyles, /\.story-image-puzzle__rotate \{[\s\S]*?inline-size: var\(--gds-touch-target\);[\s\S]*?block-size: var\(--gds-touch-target\);/);
    assert.match(overlay, /aria-live="polite"[\s\S]*?aria-atomic="true"/);
    assert.doesNotMatch(overlay, /<button/);
    assert.match(overlayStyles, /\.achievement-presentation \{[\s\S]*?pointer-events: none;/);
  });

  it('treats pawn promotion as a focus-contained modal decision', () => {
    const panel = source('src/features/echo-network/ContractChessPanel.tsx');
    assert.match(panel, /promotionDialogRef/);
    assert.match(panel, /promotionReturnFocusRef/);
    assert.match(panel, /event\.key === 'Escape'/);
    assert.match(panel, /event\.key !== 'Tab'/);
    assert.match(panel, /disabled=\{disabled \|\| pendingPromotion !== null\}/);
    assert.match(panel, /aria-hidden=\{pendingPromotion \? true : undefined\}/);
  });

  it('serializes Live challenge terminal actions before preserving the current draft', () => {
    const screen = source('src/features/live-challenges/LiveChallengesScreen.tsx');
    assert.match(screen, /const terminalActionInFlight = useRef\(false\);/);
    assert.match(screen, /const pendingDraftSave = useRef<Promise<unknown>>\(Promise\.resolve\(\)\);/);
    assert.match(screen, /async function persistCurrentDraft\(\): Promise<boolean> \{[\s\S]*?await pendingDraftSave\.current;[\s\S]*?queueDraftSave\(answer\)/);
    assert.match(screen, /if \(busy \|\| terminalActionInFlight\.current\) return;/);
    assert.match(screen, /await persistCurrentDraft\(\)[\s\S]*?actions\.completeDaily\(answer, locale\)/);
    assert.match(screen, /role="dialog"[\s\S]*?aria-modal="true"/);
    assert.match(screen, /aria-describedby="live-hint-purchase-description"/);
    assert.match(screen, /const busyRef = useRef\(busy\);/);
    assert.match(screen, /sealedRewardLabel:/);
    assert.match(screen, /weekly\.trial\.reward\?\.label \?\? uiCopy\.sealedRewardLabel/);
    assert.match(screen, /\{weekly && \(/);
  });
});
