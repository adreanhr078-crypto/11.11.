import { Suspense, useMemo } from 'react';
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
import { toggleLanguage } from '../../core/echoMultilingualSystem';
import { createDashboardReadModel } from '../../application/ui/gameUiReadModels';
import {
  PremiumAtmosphere,
  ScreenTransition,
} from '../../ui/presentation';
import {
  GAME_SCREEN_REGISTRY,
} from './screenRegistry';
import {
  getCategoryScreens,
  getNavigationCategoryForScreen,
  NAVIGATION_CATEGORIES,
  NAVIGATION_CATEGORY_REGISTRY,
} from './navigationRegistry';
import {
  useShellStore,
  useUiPreferencesStore,
} from './shellStore';

export function ApplicationShell() {
  const shell = useShellStore();
  const preferences = useUiPreferencesStore();
  const state = useGameStore();
  const model = useMemo(() => createDashboardReadModel(state), [state]);
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
  const Screen = definition.component;
  const isMainMenu = shell.currentScreen === 'main-menu';

  return (
    <GameViewport
      id="app"
      className={`app-root application-shell ${
        state.time.isNight ? 'night-active' : 'day-dashboard'
      }`}
      dir={document.documentElement.lang === 'ar' ? 'rtl' : 'ltr'}
      quality={preferences.quality}
      motion={preferences.motion}
      data-ui-system="cinematic-shell-v1"
    >
      <PremiumAtmosphere />
      <GameSafeArea className="application-shell__safe">
        {!isMainMenu && (
          <header className="application-shell__topbar">
            <button
              type="button"
              className="application-shell__screen-title"
              onClick={() => {
                if (currentCategoryHasMenu) {
                  shell.openNavigation(currentCategory.id);
                }
              }}
              disabled={!currentCategoryHasMenu}
              aria-label={`فتح قائمة ${currentCategory.label}`}
              title={currentCategory.description}
            >
              <i data-tone={definition.tone}>
                <GameIcon id={definition.iconId} />
                <small>{definition.code}</small>
              </i>
              <span>
                <small>{currentCategory.label} // 11:11</small>
                <strong>{definition.label}</strong>
              </span>
            </button>
            <div className="application-shell__chapter">
              <span>{model.chapter.title}</span>
              <GameProgress
                value={model.puzzleProgress.progress}
                tone="danger"
                showValue={false}
              />
              <small>{model.puzzleProgress.progress}%</small>
            </div>
            <div className="application-shell__utility">
              <span
                className="application-shell__currency"
                aria-label={`بلورات Echo: ${model.resources.crystals}`}
              >
                <GameIcon id="resource-crystal" />
                <span>بلورات</span>
                <strong>{model.resources.crystals}</strong>
              </span>
              <time aria-label="وقت النظام">
                <small>TIME</small>
                {String(state.time.hour).padStart(2, '0')}:
                {String(state.time.minute).padStart(2, '0')}
              </time>
              <GameTooltip label="تبديل لغة الواجهة">
                <GameButton
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleLanguage()}
                  aria-label="تبديل لغة الواجهة"
                >
                  <GameIcon id="utility-language" />
                </GameButton>
              </GameTooltip>
              <GameTooltip label="قائمة الإيقاف">
                <GameButton
                  variant="ghost"
                  size="icon"
                  onClick={shell.openPause}
                  aria-label="قائمة الإيقاف"
                >
                  <GameIcon id="utility-pause" />
                </GameButton>
              </GameTooltip>
            </div>
          </header>
        )}

        <main
          className="application-shell__stage"
          data-fullscreen={isMainMenu || shell.currentScreen === 'cinematic'}
        >
          <Suspense
            fallback={(
              <GameLoadingScreen
                fullscreen={false}
                title="11:11"
                message="تهيئة قناة العرض"
              />
            )}
          >
            <ScreenTransition screenId={shell.currentScreen}>
              <Screen />
            </ScreenTransition>
          </Suspense>
        </main>

        {!isMainMenu && (
          <nav
            className="application-shell__navigation"
            aria-label="التنقل الرئيسي"
          >
            {NAVIGATION_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
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
                aria-label={`${category.label}: ${category.description}`}
                title={category.description}
              >
                <GameIcon id={category.iconId} />
                <span>{category.shortLabel}</span>
              </button>
            ))}
          </nav>
        )}
      </GameSafeArea>

      <GameDrawer
        open={shell.navigationCategory !== null}
        onClose={shell.closeNavigation}
        title={openCategory.label}
        side="end"
        tone={openCategory.tone}
      >
        <div className="application-shell__drawer-intro">
          <GameIconLabel
            iconId={openCategory.iconId}
            label={openCategory.label}
            description={openCategory.description}
          />
        </div>
        <div className="application-shell__drawer-list">
          {categoryScreens.map((screen) => (
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
                <strong>{screen.label}</strong>
                <small>{screen.description}</small>
              </span>
            </GameButton>
          ))}
        </div>
      </GameDrawer>

      <GameModal
        open={shell.pauseOpen}
        onClose={shell.closePause}
        eyebrow="GAME STATE // AUTO-SAVED"
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
          <GameButton
            variant="ghost"
            fullWidth
            leadingIcon={<GameIcon id="screen-overview" />}
            onClick={() => shell.navigate('overview')}
          >
            <span className="application-shell__pause-copy">
              <strong>سجل النظام</strong>
              <small>الأحداث والقرارات المكتشفة</small>
            </span>
          </GameButton>
          <GameButton
            variant="ghost"
            fullWidth
            leadingIcon={<GameIcon id="screen-main-menu" />}
            onClick={() => shell.navigate('main-menu')}
          >
            <span className="application-shell__pause-copy">
              <strong>القائمة الرئيسية</strong>
              <small>العودة إلى نقطة بدء الرحلة</small>
            </span>
          </GameButton>
        </div>
      </GameModal>
    </GameViewport>
  );
}
