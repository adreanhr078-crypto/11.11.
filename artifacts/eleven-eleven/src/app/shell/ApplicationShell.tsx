import { Suspense, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameButton,
  GameDrawer,
  GameLoadingScreen,
  GameModal,
  GameProgress,
  GameSafeArea,
  GameViewport,
} from '../../ui/design-system';
import { toggleLanguage } from '../../core/echoMultilingualSystem';
import { createDashboardReadModel } from '../../application/ui/gameUiReadModels';
import {
  GAME_SCREEN_REGISTRY,
  PRIMARY_GAME_SCREENS,
  SECONDARY_GAME_SCREENS,
} from './screenRegistry';
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
      <GameSafeArea className="application-shell__safe">
        {!isMainMenu && (
          <header className="application-shell__topbar">
            <span className="application-shell__screen-title">
              <i>{definition.code}</i>
              <span>
                <small>11:11 // ECHO SYSTEM</small>
                <strong>{definition.label}</strong>
              </span>
            </span>
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
              <span className="application-shell__currency">
                ◈ {model.resources.crystals}
              </span>
              <time>
                {String(state.time.hour).padStart(2, '0')}:
                {String(state.time.minute).padStart(2, '0')}
              </time>
              <GameButton
                variant="ghost"
                size="icon"
                onClick={() => toggleLanguage()}
                aria-label="تبديل اللغة"
              >
                {document.documentElement.lang === 'ar' ? 'EN' : 'ع'}
              </GameButton>
              <GameButton
                variant="ghost"
                size="icon"
                onClick={shell.openPause}
                aria-label="قائمة الإيقاف"
              >
                ⚙
              </GameButton>
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
            <Screen />
          </Suspense>
        </main>

        {!isMainMenu && (
          <nav
            className="application-shell__navigation"
            aria-label="التنقل الرئيسي"
          >
            {PRIMARY_GAME_SCREENS.map((screen) => (
              <button
                key={screen.id}
                type="button"
                data-active={shell.currentScreen === screen.id}
                data-tone={screen.tone}
                onClick={() => shell.navigate(screen.id)}
              >
                <i>{screen.code}</i>
                <span>{screen.shortLabel}</span>
              </button>
            ))}
            <button
              type="button"
              data-active={false}
              data-tone="neutral"
              onClick={shell.openNavigation}
            >
              <i>•••</i>
              <span>المزيد</span>
            </button>
          </nav>
        )}
      </GameSafeArea>

      <GameDrawer
        open={shell.navigationOpen}
        onClose={shell.closeNavigation}
        title="أنظمة 11:11"
        side="end"
        tone="danger"
      >
        <div className="application-shell__drawer-list">
          {SECONDARY_GAME_SCREENS.map((screen) => (
            <GameButton
              key={screen.id}
              variant="ghost"
              fullWidth
              leadingIcon={screen.code}
              onClick={() => shell.navigate(screen.id)}
            >
              {screen.label}
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
            onClick={shell.closePause}
          >
            استمرار اللعبة
          </GameButton>
          <GameButton
            variant="secondary"
            fullWidth
            onClick={() => shell.navigate('settings')}
          >
            الإعدادات
          </GameButton>
          <GameButton
            variant="ghost"
            fullWidth
            onClick={() => shell.navigate('overview')}
          >
            سجل النظام
          </GameButton>
          <GameButton
            variant="ghost"
            fullWidth
            onClick={() => shell.navigate('main-menu')}
          >
            العودة إلى القائمة الرئيسية
          </GameButton>
        </div>
      </GameModal>
    </GameViewport>
  );
}

