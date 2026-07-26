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
  NAVIGATION_CATEGORY_REGISTRY,
  PRIMARY_NAVIGATION_CATEGORIES,
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
  const isGameplay = shell.currentScreen === 'play';
  const isImmersive = isMainMenu
    || isGameplay
    || shell.currentScreen === 'cinematic';

  return (
    <GameViewport
      id="app"
      className="app-root application-shell echo-runtime"
      dir={document.documentElement.lang === 'ar' ? 'rtl' : 'ltr'}
      quality={preferences.quality}
      motion={preferences.motion}
      data-ui-system="cinematic-shell-v2"
    >
      <PremiumAtmosphere />
      <GameSafeArea className="application-shell__safe">
        {!isMainMenu && !isGameplay && (
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
                <small>{currentCategory.label}</small>
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
              <GameTooltip label="الإعدادات">
                <GameButton
                  variant="secondary"
                  leadingIcon={<GameIcon id="screen-settings" />}
                  onClick={() => shell.navigate('settings')}
                >
                  الإعدادات
                </GameButton>
              </GameTooltip>
              <GameTooltip label="قائمة الإيقاف">
                <GameButton
                  variant="ghost"
                  leadingIcon={<GameIcon id="utility-pause" />}
                  onClick={shell.openPause}
                >
                  إيقاف
                </GameButton>
              </GameTooltip>
            </div>
          </header>
        )}

        <main
          className="application-shell__stage"
          data-fullscreen={isImmersive}
          data-gameplay={isGameplay}
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

        {!isMainMenu && !isGameplay && (
          <nav
            className="application-shell__navigation"
            aria-label="التنقل الرئيسي"
          >
            {PRIMARY_NAVIGATION_CATEGORIES.map((category) => (
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
        eyebrow={isGameplay
          ? 'OPENING ROOM // AUTO-SAVED'
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
            leadingIcon={<GameIcon id="screen-progress" />}
            onClick={() => shell.navigate('progress')}
          >
            <span className="application-shell__pause-copy">
              <strong>التقدم</strong>
              <small>مراجعة الإنجازات والذكريات والنهايات</small>
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
    </GameViewport>
  );
}
