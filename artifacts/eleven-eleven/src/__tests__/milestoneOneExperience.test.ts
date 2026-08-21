import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('Milestone 1 first-player experience contract', () => {
  it('explains the story, Manhwa, puzzle, and Echo loop during onboarding', () => {
    const onboarding = source('src/features/onboarding/FirstTimeOnboarding.tsx');
    assert.ok(onboarding.includes("type OnboardingStep = 'welcome' | 'mission' | 'identity'"));
    assert.ok(onboarding.includes('المانهوا تكشف صفحة من السجل'));
    assert.ok(onboarding.includes('الألغاز تحول ما رأيته إلى قرار قابل للتحقق'));
    assert.ok(onboarding.includes('بعد اختيار هويتك ستقابل Echo'));
    assert.ok(onboarding.includes('emitExperienceCue({ name: \'onboarding-complete\''));
  });

  it('gives the first Echo contact one clear next action', () => {
    const echo = source('src/features/screens/EchoMindScreen.tsx');
    assert.ok(echo.includes('FirstContactBrief'));
    assert.ok(echo.includes("const isFirstContact = living.turns.length === 0"));
    assert.ok(echo.includes("onOpenManhwa={() => navigate('memories')}"));
    assert.ok(echo.includes('The Manhwa shows what happened'));
  });

  it('keeps reward presentation accessible and visibly connected to Echo', () => {
    const puzzle = source('src/features/screens/PuzzleScreen.tsx');
    const stylesheet = source('src/features/screens/story-puzzle-experience.css');
    assert.ok(puzzle.includes('<EchoPresence'));
    assert.ok(puzzle.includes('previousFocusRef.current?.focus()'));
    assert.ok(puzzle.includes("emitExperienceCue({ name: 'puzzle-reward'"));
    assert.ok(puzzle.includes('بعد التحقق الخادمي'));
    assert.ok(stylesheet.includes('.story-reward-moment { position: fixed; z-index: 1300;'));
    assert.equal(puzzle.includes('data-anomaly='), false);
    assert.equal(puzzle.includes("'// LOCKED'"), false);
    assert.equal(puzzle.includes('TIMESTAMP CONSISTENT'), false);
  });

  it('keeps paid Story hints instructional rather than shipping exact answer strings', () => {
    const catalog = source('src/content/puzzles/storyPuzzleCatalog.ts');
    const answerHints = [
      'صِل: الطاقة إلى',
      'طابق: △ مع',
      'أدخل التسلسل 3-1-1',
      'السجل CAM-07 هو',
      'اختر العقدة D3',
      'رتّب: 12:00',
      'المسار: A1',
      'اختر المسار A → C',
      'اختر 4-1-4',
      'المواضع الصحيحة: X2',
      'التدوير الصحيح من اليسار',
      'التسلسل: 11، ◇، ACCESS',
      'الأطوار من الأعلى',
      'السجل غير الممكن هو R-03',
      'التوزيع الآمن: طاقة 40',
      'ثبّت: 11:11',
      'المراحل: SYNC',
    ];
    for (const answerHint of answerHints) {
      assert.equal(catalog.includes(answerHint), false, `public catalog still exposes: ${answerHint}`);
    }
  });

  it('keeps Manhwa progress truthful inside the accessible reader window', () => {
    const viewer = source('src/features/manhwa/ManhwaFullscreenViewer.tsx');
    const memory = source('src/features/screens/MemoryScreen.tsx');
    assert.ok(viewer.includes('{currentIndex + 1} / {pages.length}'));
    assert.ok(viewer.includes('{copy.page} {currentPage.globalPageNumber} {copy.of} 71'));
    assert.ok(memory.includes("emitExperienceCue({ name: 'manhwa-open'"));
  });

  it('ships the bounded decorative asset used by the first-contact layer', () => {
    assert.equal(
      existsSync(resolve(process.cwd(), 'public/assets/ui/core-loop/puzzle-reward-signal-v1.webp')),
      true,
    );
  });

  it('uses optimized art on the first player’s identity and objective paths', () => {
    const avatars = source('src/ui/presentation/playerAvatarCatalog.ts');
    const objective = source('src/features/player-journey/core-objective-card.css');
    assert.ok(avatars.includes('player-silver-v1.webp'));
    assert.ok(avatars.includes('player-rift-v1.webp'));
    assert.ok(objective.includes('memory-objective-v1.webp'));
    assert.ok(objective.includes('memory-objective-v1.png'));
  });

  it('keeps Echo’s experimental identity as a decorative collar mark, not game state', () => {
    const onboarding = source('src/features/onboarding/FirstTimeOnboarding.tsx');
    const stylesheet = source('src/features/onboarding/first-time-onboarding.css');
    assert.ok(onboarding.includes('onboarding-echo-stage__experiment-mark'));
    assert.ok(onboarding.includes('EX-011'));
    assert.ok(onboarding.includes('aria-hidden="true"'));
    assert.ok(stylesheet.includes('onboarding-echo-stage__experiment-mark'));
    assert.ok(stylesheet.includes('pointer-events: none'));
  });

  it('renders Yuki’s experimental number only over the published portrait surface', () => {
    const seasonPanel = source('src/features/echo-network/SeasonPanel.tsx');
    const stylesheet = source('src/features/echo-network/echo-network.css');
    assert.ok(seasonPanel.includes('data-character={current.focusCharacter}'));
    assert.ok(seasonPanel.includes('data-character={activity.focusCharacter}'));
    assert.ok(stylesheet.includes('data-character="yuki"'));
    assert.ok(stylesheet.includes('EX-012'));
  });

  it('keeps authored voice status truthful until audio assets are published', () => {
    const settings = source('src/features/screens/SettingsScreen.tsx');
    assert.ok(settings.includes('غير متاح بعد'));
    assert.equal(settings.includes('ثابت للحلقات'), false);
    assert.equal(settings.includes('日本語'), false);
    assert.ok(settings.includes('DEVICE PROFILE // RESPONSIVE WEB'));
    assert.equal(settings.includes('ANDROID LANDSCAPE'), false);
  });

  it('routes opening-room feedback through the mute and SFX-volume preferences', () => {
    const ward = source('src/features/awakening-ward/AwakeningWardScreen.tsx');
    assert.ok(ward.includes("const audioEnabled = useUiPreferencesStore((state) => state.audioEnabled)"));
    assert.ok(ward.includes('if (audioEnabled) playFeedback'));
    assert.ok(ward.includes('sfxVolume'));
  });

  it('mounts a replaceable Echo cue audio bridge without touching reward authority', () => {
    const app = source('src/App.tsx');
    const bridge = source('src/ui/presentation/ExperienceCueAudioBridge.tsx');
    assert.ok(app.includes('<ExperienceCueAudioBridge />'));
    assert.ok(bridge.includes("'onboarding-complete': 'reply'"));
    assert.ok(bridge.includes("'manhwa-open': 'memory'"));
    assert.ok(bridge.includes('if (!audioEnabled) return'));
    assert.ok(bridge.includes('sfxVolume * 0.72'));
    assert.equal(bridge.includes('completeStoryPuzzle'), false);
  });

});
