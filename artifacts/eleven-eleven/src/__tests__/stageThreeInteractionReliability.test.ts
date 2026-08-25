import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('Stage 3 interaction reliability', () => {
  it('keeps developer diagnostics opt-in so they cannot cover player controls', () => {
    const runtime = source('src/app/shell/GameRuntimeBridge.tsx');
    assert.match(runtime, /narrative-debug/);
    assert.match(runtime, /narrativeDebugEnabled/);
    assert.doesNotMatch(runtime, /const NarrativeDebugPanel = import\.meta\.env\.DEV\s*\?/);
  });

  it('keeps compact shell controls named, touch-sized, and visibly interactive', () => {
    const auth = source('src/features/auth/AuthStatusButton.tsx');
    const shell = source('src/app/shell/ApplicationShell.tsx');
    const stylesheet = source('src/app/shell/application-shell.css');

    assert.match(auth, /aria-label=\{tooltip\}/);
    assert.match(shell, /aria-label=\{preferences\.locale === 'en' \? 'Settings'/);
    assert.match(shell, /aria-label=\{preferences\.locale === 'en' \? 'Pause menu'/);
    assert.match(stylesheet, /\.application-shell__utility \.gds-button \{\s*min-width: var\(--gds-touch-target\);/);
    assert.match(stylesheet, /\.application-shell__navigation button \{[\s\S]*cursor: pointer;/);
    assert.match(stylesheet, /\.application-shell__navigation button:active/);
    assert.match(stylesheet, /@media \(max-width: 900px\) \{/);
    assert.match(stylesheet, /\.application-shell__player-card-copy \{\s*display: none;/);
  });

  it('keeps the language settings usable at phone width instead of pushing cards beyond the viewport', () => {
    const settings = source('src/features/screens/SettingsScreen.tsx');
    const stylesheet = source('src/app/shell/application-shell.css');

    assert.match(settings, /role="group" aria-label=\{copy\.languageChoice\}/);
    assert.match(settings, /aria-pressed=\{preferences\.locale === 'ar'\}/);
    assert.match(settings, /aria-pressed=\{preferences\.locale === 'en'\}/);
    assert.match(stylesheet, /@media \(max-width: 44rem\) \{\s*\.shell-settings-screen \{\s*grid-template-columns: minmax\(0, 1fr\);/);
    assert.match(stylesheet, /\.shell-settings-screen > \* \{\s*min-inline-size: 0;/);
    assert.match(stylesheet, /\.shell-settings-list > div > dd \{\s*inline-size: 100%;/);
  });

  it('gives local and verified Chess an intentional board-first recovery path without changing authority', () => {
    const chess = source('src/features/echo-network/ContractChessPanel.tsx');
    const stylesheet = source('src/features/echo-network/echo-network.css');

    assert.match(chess, /boardId = 'contract-chess-board'/);
    assert.match(chess, /id=\{boardId\}/);
    assert.match(chess, /scrollIntoView/);
    assert.match(chess, /boardIsVisible/);
    assert.match(chess, /const boardTargetId = activeView === 'training' && trainingSurface === 'verified'/);
    assert.match(chess, /document\.getElementById\(boardTargetId\)/);
    assert.match(chess, /document\.getElementById\('verified-chess-training-board'\)/);
    assert.match(stylesheet, /scroll-margin-block: \.5rem 5rem/);
    assert.match(stylesheet, /\.echo-network\[data-tab="chess"\]/);
    assert.match(stylesheet, /\.contract-chess-board-frame \{ inline-size: min\(100%, 22rem\); \}/);
    assert.doesNotMatch(chess, /completeNetworkTraining\(/);
  });

  it('keeps a pending terminal room visible and every chess square touch-sized on a narrow phone', () => {
    const network = source('src/features/echo-network/EchoNetworkScreen.tsx');
    const stylesheet = source('src/features/echo-network/echo-network.css');

    assert.match(network, /'reconnecting', 'settling', 'completed'/);
    assert.match(stylesheet, /--contract-chess-touch-square: 44px;/);
    assert.match(stylesheet, /--contract-chess-board-min: 352px;/);
    assert.match(stylesheet, /\.contract-chess-stage__board-area \{[^}]*overflow-x: auto;/);
    assert.match(stylesheet, /\.contract-chess-square \{[^}]*min-inline-size: var\(--contract-chess-touch-square\);[^}]*min-block-size: var\(--contract-chess-touch-square\);/);
  });

  it('labels the home surface honestly across browser form factors', () => {
    const menu = source('src/features/screens/MainMenuScreen.tsx');
    assert.match(menu, /scene: 'القائمة الرئيسية'/);
    assert.match(menu, /scene: 'Main menu'/);
    assert.match(menu, /shell-screen-code">00/);
    assert.doesNotMatch(menu, /Mobile Browser Interface/);
  });

  it('makes every generic puzzle composer explicit, reversible, and touch-sized', () => {
    const screen = source('src/features/screens/PuzzleScreen.tsx');
    const stylesheet = source('src/features/screens/story-puzzle-experience.css');

    assert.match(screen, /aria-label=\{composerCopy\.board\}/);
    assert.match(screen, /role="status" aria-live="polite" aria-label=\{composerCopy\.buffer\}/);
    assert.match(screen, /aria-pressed=\{!repeatable \? isSelected : undefined\}/);
    assert.match(screen, /function tokenOptionUnavailable/);
    assert.match(screen, /const unavailable = tokenOptionUnavailable\(selected, option\.id, limit, repeatable\);/);
    assert.match(screen, /aria-label=\{composerCopy\.remove/);
    assert.match(screen, /aria-label=\{composerCopy\.clear\}/);
    assert.match(stylesheet, /\.story-token-board__buffer button \{[^}]*min-block-size: 3rem;/);
    assert.match(stylesheet, /\.story-token-board__clear \{[^}]*min-block-size: 3rem;/);
  });

  it('keeps special puzzle inputs stateful and replaces the reduced-motion answer dump with controlled observation', () => {
    const screen = source('src/features/screens/PuzzleScreen.tsx');
    const stylesheet = source('src/features/screens/story-puzzle-experience.css');

    assert.match(screen, /aria-pressed=\{isSelected\}/);
    assert.match(screen, /aria-pressed=\{draft\.tokens\.includes\(cell\)\}/);
    assert.match(screen, /aria-pressed=\{selectionCount > 0\}/);
    assert.match(screen, /aria-pressed=\{draft\.assignments\[source\] === target\.id\}/);
    assert.match(screen, /MEMORY_GRID_PULSE_PATTERN/);
    assert.match(screen, /CONTROLLED STEP/);
    assert.match(screen, /Show next pulse/);
    assert.doesNotMatch(screen, /STATIC ACCESSIBLE VIEW|A1 → B2 → C3 → B2/);
    assert.match(stylesheet, /\.story-memory-grid__guided-step/);
  });

  it('ports the authoritative reward presentation outside transformed stages and keeps it phone-reachable', () => {
    const screen = source('src/features/screens/PuzzleScreen.tsx');
    const stylesheet = source('src/features/screens/story-puzzle-experience.css');

    assert.match(screen, /import \{ createPortal \} from 'react-dom';/);
    assert.match(screen, /return createPortal\(/);
    assert.match(screen, /document\.body,/);
    assert.match(screen, /dir=\{locale === 'ar' \? 'rtl' : 'ltr'\}/);
    assert.match(stylesheet, /This dialog is portalled to body/);
    assert.match(stylesheet, /min-block-size: 100dvh;/);
    assert.match(stylesheet, /max-block-size: calc\(100dvh - 2rem\);/);
    assert.match(stylesheet, /\.story-reward-moment button \{ min-block-size: 3rem; \}/);
  });
});
