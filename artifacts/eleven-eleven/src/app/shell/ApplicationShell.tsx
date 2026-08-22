import { Suspense } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameButton,
  GameDrawer,
  GameLoadingScreen,
  GameModal,
  GameProgress,
  GameSafeArea,
  GameTooltip,
  GameViewport,
} from '../../ui/design-system';
import {
  GameIcon,
  GameIconLabel,
} from '../../ui/icons';
import { createDashboardReadModel } from '../../application/ui/gameUiReadModels';
import {
  getCanonicalManhwaBadgeCount,
} from '../../application/ui/manhwaArchiveReadModel';
import {
  PremiumAtmosphere,
  ScreenTransition,
  AchievementPresentationOverlay,
  EchoTransformationCinematic,
} from '../../ui/presentation';
import {
  GAME_SCREEN_REGISTRY,
} from './screenRegistry';
import {
  getCategoryScreens,
  getNavigationCategoryForScreen,
  NAVIGATION_CATEGORY_REGISTRY,
  PRIMARY_NAVIGATION_CATEGORIES,
} from './navigationRegistry';
import {
  useShellStore,
  useUiPreferencesStore,
} from './shellStore';
import { PlayerResourceCounters } from './PlayerResourceCounters';
import { EchoIntrusionOverlay } from '../../features/echo/EchoIntrusionOverlay';
import { DemoExperienceLayer } from '../demo/DemoExperienceLayer';
import { AuthStatusButton } from '../../features/auth/AuthStatusButton';
import { useStoryPuzzleStore } from '../../features/story-puzzles/storyPuzzleStore';
import { CoreObjectiveCard } from '../../features/player-journey/CoreObjectiveCard';

const ENGLISH_CATEGORY_COPY: Record<string, { label: string; shortLabel: string; description: string }> = {
  story: {
    label: 'Home',
    shortLabel: 'Home',
    description: 'Echo status, the journey gateway, and story-connected files.',
  },
  memory: {
    label: 'Manhwa',
    shortLabel: 'Manhwa',
    description: 'Read the Manhwa archive and unlock pages with memory shards.',
  },
  puzzles: {
    label: 'Puzzles',
    shortLabel: 'Puzzles',
    description: 'Solve story nodes and reconstruct missing events.',
  },
  network: {
    label: 'Echo Network',
    shortLabel: 'Network',
    description: 'Chess, co-op, seasons, and the signal community in one place.',
  },
};

const ENGLISH_SCREEN_COPY: Record<string, { label: string; description: string }> = {
  memories: {
    label: 'Manhwa archive',
    description: 'Manhwa Archive // open and locked pages.',
  },
  puzzles: {
    label: '11:11 Puzzle Hub',
    description: 'Story path, Daily Signal, and Weekly System Trial.',
  },
};

function localizedCategory(
  locale: 'ar' | 'en',
  category: { id: string; label: string; shortLabel: string; description: string },
) {
  return locale === 'en'
    ? ENGLISH_CATEGORY_COPY[category.id] ?? category
    : category;
}

function localizedScreen(
  locale: 'ar' | 'en',
  screen: { id: string; label: string; description: string },
) {
  return locale === 'en'
    ? ENGLISH_SCREEN_COPY[screen.id] ?? screen
    : screen;
}

export function ApplicationShell() {
  const shell = useShellStore();
  const preferences = useUiPreferencesStore();
  const storyPuzzleSnapshot = useStoryPuzzleStore((state) => state.snapshot);
  const chapterTitle = useGameStore(
    (state) => createDashboardReadModel(
      state,
      storyPuzzleSnapshot,
      preferences.locale,
    ).chapter.title,
  );
  const campaignProgress = useGameStore(
    (state) => createDashboardReadModel(
      state,
      storyPuzzleSnapshot,
      preferences.locale,
    ).puzzleProgress.progress,
  );
  const unviewedManhwaPages = useGameStore((state) => (
    getCanonicalManhwaBadgeCount(state.progressionState)
  ));
  const definition = GAME_SCREEN_REGISTRY[shell.currentScreen];
  const currentCategory = getNavigationCategoryForScreen(
    shell.currentScreen,
  );
  const openCategory = shell.navigationCategory
    ? NAVIGATION_CATEGORY_REGISTRY[shell.navigationCategory]
    : currentCategory;
  const categoryScreens = getCategoryScreens(openCategory.id);
  const currentCategoryScreens = getCategoryScreens(currentCategory.id);
  const currentCategoryHasMenu = currentCategoryScreens.length > 1;
  const currentCategoryCopy = localizedCategory(preferences.locale, currentCategory);
  const currentScreenCopy = localizedScreen(preferences.locale, definition);
  const openCategoryCopy = localizedCategory(preferences.locale, openCategory);
  const Screen = definition.component;
  const isMainMenu = shell.currentScreen === 'main-menu';
  const isGameplay = shell.currentScreen === 'play'
    || shell.currentScreen === 'awakening-ward';
  const isImmersive = isMainMenu
    || isGameplay
    || shell.currentScreen === 'cinematic';
  const showCoreObjective = !isMainMenu
    && !isGameplay
    && shell.currentScreen !== 'echo-network'
    && shell.currentScreen !== 'settings'
    && shell.currentScreen !== 'profile';

  return (
    <GameViewport
      id="app"
      className="app-root application-shell echo-runtime"
      dir={preferences.locale === 'ar' ? 'rtl' : 'ltr'}
      quality={preferences.quality}
      motion={preferences.motion}
      landscapeRequired={false}
      data-ui-system="cinematic-shell-v2"
    >
      <PremiumAtmosphere />
      <a className="application-shell__skip-link" href="#player-content">
        {preferences.locale === 'en'
          ? 'Skip interface controls to content'
          : 'تجاوز عناصر الواجهة إلى المحتوى'}
      </a>
      <GameSafeArea className="application-shell__safe">
        {!isMainMenu && !isGameplay && (
          <header className="application-shell__topbar">
            {currentCategoryHasMenu ? (
              <button
                type="button"
                className="application-shell__screen-title"
                onClick={() => shell.openNavigation(currentCategory.id)}
                aria-label={preferences.locale === 'en'
                  ? `Open ${currentCategoryCopy.label} menu`
                  : `فتح قائمة ${currentCategoryCopy.label}`}
                title={currentCategoryCopy.description}
              >
                <i data-tone={definition.tone}>
                  <GameIcon id={definition.iconId} />
                  <small>{definition.code}</small>
                </i>
                <span>
                  <small>{currentCategoryCopy.label}</small>
                  <strong>{currentScreenCopy.label}</strong>
                </span>
              </button>
            ) : (
              <div
                className="application-shell__screen-title application-shell__screen-title--static"
                role="group"
                aria-label={currentScreenCopy.description}
              >
                <i data-tone={definition.tone}>
                  <GameIcon id={definition.iconId} />
                  <small>{definition.code}</small>
                </i>
                <span>
                  <small>{currentCategoryCopy.label}</small>
                  <strong>{currentScreenCopy.label}</strong>
                </span>
              </div>
            )}

            <div className="application-shell__chapter">
              <span>{chapterTitle}</span>
              <GameProgress
                value={campaignProgress}
                tone="danger"
                showValue={false}
              />
              <small>{campaignProgress}%</small>
            </div>

            <div className="application-shell__utility">
              <PlayerResourceCounters />
              <AuthStatusButton
                variant="ghost"
                className="application-shell__auth-control"
              />
              <GameTooltip label={preferences.locale === 'en' ? 'Settings' : 'الإعدادات'}>
                <GameButton
                  className="application-shell__utility-control"
                  variant="secondary"
                  leadingIcon={<GameIcon id="screen-settings" />}
                  aria-label={preferences.locale === 'en' ? 'Settings' : 'الإعدادات'}
                  onClick={() => shell.navigate('settings')}
                >
                  {preferences.locale === 'en' ? 'Settings' : 'الإعدادات'}
                </GameButton>
              </GameTooltip>
              <GameTooltip label={preferences.locale === 'en' ? 'Pause menu' : 'قائمة الإيقاف'}>
                <GameButton
                  className="application-shell__utility-control"
                  variant="ghost"
                  leadingIcon={<GameIcon id="utility-pause" />}
                  aria-label={preferences.locale === 'en' ? 'Pause menu' : 'قائمة الإيقاف'}
                  onClick={shell.openPause}
                >
                  {preferences.locale === 'en' ? 'Pause' : 'إيقاف'}
                </GameButton>
              </GameTooltip>
            </div>
          </header>
        )}

        <main
          id="player-content"
          className="application-shell__stage"
          data-fullscreen={isImmersive}
          data-gameplay={isGameplay}
          data-has-objective={showCoreObjective}
        >
          <Suspense
            fallback={(
              <GameLoadingScreen
                fullscreen={false}
                title="11:11"
                 message={preferences.locale === 'en' ? 'Preparing the display channel' : 'تهيئة قناة العرض'}
              />
            )}
          >
            <ScreenTransition screenId={shell.currentScreen}>
              <Screen />
            </ScreenTransition>
          </Suspense>
        </main>

        {showCoreObjective && (
          <CoreObjectiveCard compact={shell.currentScreen === 'puzzles' || shell.currentScreen === 'memories'} />
        )}

        {!isMainMenu && !isGameplay && (
          <nav
            className="application-shell__navigation"
             aria-label={preferences.locale === 'en' ? 'Primary navigation' : 'التنقل الرئيسي'}
          >
             {PRIMARY_NAVIGATION_CATEGORIES.map((category) => {
               const categoryCopy = localizedCategory(preferences.locale, category);
               return (
               <button
                key={category.id}
                type="button"
                data-navigation-category={category.id}
                data-active={currentCategory.id === category.id}
                data-tone={category.tone}
                onClick={() => {
                  const screens = getCategoryScreens(category.id);
                  if (
                    currentCategory.id === category.id
                    && screens.length > 1
                  ) {
                    shell.openNavigation(category.id);
                    return;
                  }
                  shell.navigate(category.landingScreenId);
                }}
                 aria-label={`${categoryCopy.label}: ${categoryCopy.description}${
                   category.id === 'memory' && unviewedManhwaPages > 0
                     ? preferences.locale === 'en'
                       ? `, ${unviewedManhwaPages} new Manhwa page${unviewedManhwaPages === 1 ? '' : 's'}`
                       : `، ${unviewedManhwaPages} صفحة مانهوا جديدة`
                     : ''
                 }`}
                 title={categoryCopy.description}
              >
                <GameIcon id={category.iconId} />
                 <span>{categoryCopy.shortLabel}</span>
                {category.id === 'memory' && unviewedManhwaPages > 0 && (
                  <i
                    className="application-shell__navigation-badge"
                    aria-hidden="true"
                  >
                    {unviewedManhwaPages}
                  </i>
                )}
               </button>
               );
             })}
          </nav>
        )}
      </GameSafeArea>

      <GameDrawer
        open={shell.navigationCategory !== null}
        onClose={shell.closeNavigation}
         title={openCategoryCopy.label}
        side="end"
        tone={openCategory.tone}
      >
        <div className="application-shell__drawer-intro">
          <GameIconLabel
            iconId={openCategory.iconId}
             label={openCategoryCopy.label}
             description={openCategoryCopy.description}
          />
        </div>
        <div className="application-shell__drawer-list">
           {categoryScreens.map((screen) => {
             const screenCopy = localizedScreen(preferences.locale, screen);
             return (
             <GameButton
              key={screen.id}
              variant={
                shell.currentScreen === screen.id
                  ? 'secondary'
                  : 'ghost'
              }
              fullWidth
              leadingIcon={<GameIcon id={screen.iconId} />}
              onClick={() => shell.navigate(screen.id)}
            >
              <span className="application-shell__drawer-item-copy">
                 <strong>{screenCopy.label}</strong>
                 <small>{screenCopy.description}</small>
              </span>
             </GameButton>
             );
           })}
        </div>
      </GameDrawer>

      <EchoTransformationCinematic />

      <GameModal
        open={shell.pauseOpen}
        onClose={shell.closePause}
        eyebrow={isGameplay
          ? 'AWAKENING WARD // AUTO-SAVED'
          : 'GAME STATE // AUTO-SAVED'}
        title="قائمة الإيقاف"
        tone="danger"
      >
        <div className="application-shell__pause-actions">
          <GameButton
            size="lg"
            fullWidth
            leadingIcon={<GameIcon id="utility-resume" />}
            onClick={shell.closePause}
          >
            <span className="application-shell__pause-copy">
              <strong>استمرار اللعبة</strong>
              <small>العودة مباشرة إلى التجربة</small>
            </span>
          </GameButton>
          {isGameplay && (
            <GameButton
              variant="secondary"
              fullWidth
              leadingIcon={<GameIcon id="category-story" />}
              onClick={shell.goBack}
            >
              <span className="application-shell__pause-copy">
                <strong>العودة إلى واجهة القصة</strong>
                <small>حفظ تقدم الغرفة ومغادرة المشهد</small>
              </span>
            </GameButton>
          )}
          <GameButton
            variant="secondary"
            fullWidth
            leadingIcon={<GameIcon id="screen-settings" />}
            onClick={() => shell.navigate('settings')}
          >
            <span className="application-shell__pause-copy">
              <strong>الإعدادات</strong>
              <small>الصوت والجودة وإمكانية الوصول</small>
            </span>
          </GameButton>
          {!isGameplay && <GameButton
            variant="ghost"
            fullWidth
            leadingIcon={<GameIcon id="screen-leaderboard" />}
            onClick={() => shell.navigate('leaderboard')}
          >
            <span className="application-shell__pause-copy">
              <strong>الترتيب العالمي</strong>
              <small>عرض ترتيبك ومستواك وإجمالي نقاط الخبرة</small>
              </span>
            </GameButton>
          }
          <GameButton
            variant="ghost"
            fullWidth
            leadingIcon={<GameIcon id="screen-main-menu" />}
            onClick={() => shell.navigate('main-menu')}
          >
            <span className="application-shell__pause-copy">
              <strong>{isGameplay
                ? 'العودة إلى القائمة الرئيسية'
                : 'القائمة الرئيسية'}</strong>
              <small>{isGameplay
                ? 'سيبقى تقدم الغرفة محفوظًا'
                : 'العودة إلى نقطة بدء الرحلة'}</small>
            </span>
          </GameButton>
        </div>
      </GameModal>
      <EchoIntrusionOverlay />
      <AchievementPresentationOverlay />
      <DemoExperienceLayer />
    </GameViewport>
  );
}
