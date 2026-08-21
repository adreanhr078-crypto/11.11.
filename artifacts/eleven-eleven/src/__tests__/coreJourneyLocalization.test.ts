import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('core journey localization', () => {
  it('keeps the first sign-in decision understandable in English without changing authentication authority', () => {
    const auth = source('src/features/auth/AuthPanel.tsx');

    assert.ok(auth.includes("const locale = useUiPreferencesStore((state) => state.locale);"));
    assert.ok(auth.includes("dir={locale === 'ar' ? 'rtl' : 'ltr'}"));
    assert.ok(auth.includes("'Welcome back'"));
    assert.ok(auth.includes('Continue with Google'));
    assert.ok(auth.includes('Continue as guest'));
    assert.ok(auth.includes('Keep this journey'));
    assert.ok(auth.includes('actions.signInWithGoogle'));
    assert.ok(auth.includes('actions.linkAnonymousAccountWithGoogle'));
  });

  it('keeps the main-menu decision and server-read objective in the selected language', () => {
    const menu = source('src/features/screens/MainMenuScreen.tsx');
    const objective = source('src/application/player-journey/corePlayerLoop.ts');
    const objectiveCard = source('src/features/player-journey/CoreObjectiveCard.tsx');
    const shell = source('src/app/shell/ApplicationShell.tsx');

    assert.ok(menu.includes('const copy = MAIN_MENU_COPY[locale];'));
    assert.ok(menu.includes("deriveCorePlayerObjective(storyPuzzleSnapshot, locale)"));
    assert.ok(menu.includes("signIn: 'Sign in and begin'"));
    assert.ok(menu.includes("identityFirst: 'Secure your identity first'"));
    assert.ok(objective.includes("locale: NetworkLocale = 'ar'"));
    assert.ok(objective.includes('nextPuzzle.title.en'));
    assert.ok(objective.includes("actionLabel: 'Open Manhwa'"));
    assert.ok(objectiveCard.includes('deriveCorePlayerObjective(snapshot, locale)'));
    assert.ok(objectiveCard.includes('Current Echo objective'));
    assert.ok(shell.includes('Skip interface controls to content'));
    assert.ok(shell.includes('ENGLISH_CATEGORY_COPY'));
  });

  it('renders the onboarding story in the selected language and direction', () => {
    const onboarding = source('src/features/onboarding/FirstTimeOnboarding.tsx');

    assert.ok(onboarding.includes("welcomeTitle: 'Welcome to 11.11'"));
    assert.ok(onboarding.includes("missionTitle: 'You are entering a living story'"));
    assert.ok(onboarding.includes("missionAction: 'I understand the mission'"));
    assert.ok(onboarding.includes("dir={locale === 'ar' ? 'rtl' : 'ltr'}"));
    assert.ok(onboarding.includes('const copy = ONBOARDING_COPY[locale];'));
  });

  it('keeps Manhwa titles, descriptions, loading, and recovery states locale-aware', () => {
    const viewer = source('src/features/manhwa/ManhwaFullscreenViewer.tsx');
    const archive = source('src/features/screens/MemoryScreen.tsx');

    assert.ok(viewer.includes('const copy = VIEWER_COPY[locale];'));
    assert.ok(viewer.includes('currentPage.title[locale]'));
    assert.ok(viewer.includes('currentPage.accessibleDescription[locale]'));
    assert.ok(viewer.includes("error: 'Could not load this page'"));
    assert.ok(viewer.includes("dir={locale === 'ar' ? 'rtl' : 'ltr'}"));
    assert.ok(archive.includes('const copy = MEMORY_COPY[locale];'));
    assert.ok(archive.includes('activePage.title[locale]'));
    assert.ok(archive.includes('activePage.accessibleDescription[locale]'));
    assert.ok(archive.includes('nextGatePuzzle.title[locale]'));
  });

  it('uses the selected locale for the first three puzzle briefings, feedback, and reward', () => {
    const puzzle = source('src/features/screens/PuzzleScreen.tsx');

    assert.ok(puzzle.includes('selectedPuzzle.title[locale]'));
    assert.ok(puzzle.includes('selectedPuzzle.objective[locale]'));
    assert.ok(puzzle.includes('selectedPuzzle.brief?.[locale]'));
    assert.ok(puzzle.includes('selectedPuzzle.completionMessage[locale]'));
    assert.ok(puzzle.includes('SIGNAL_PROBE_DESCRIPTIONS_EN'));
    assert.ok(puzzle.includes('const imageCopy = locale === \'ar\''));
    assert.ok(puzzle.includes('retryGuidance(currentStage?.mechanic ?? selectedPuzzle.mechanic, locale)'));
    assert.equal(puzzle.includes('selectedPuzzle.title.ar'), false);
    assert.equal(puzzle.includes('selectedPuzzle.objective.ar'), false);
  });
});
