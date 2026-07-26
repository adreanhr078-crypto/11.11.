import { useMemo, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  CinematicFrame,
  GameButton,
  GameModal,
  GlassPanel,
} from '../../ui/design-system';
import { GameIcon } from '../../ui/icons';
import { createDashboardReadModel } from '../../application/ui/gameUiReadModels';
import { useShellStore } from '../../app/shell/shellStore';
import {
  EchoPresence,
  ENVIRONMENT_PRESENTATION_ASSETS,
} from '../../ui/presentation';

export default function MainMenuScreen() {
  const state = useGameStore();
  const navigate = useShellStore((shell) => shell.navigate);
  const [confirmNewGame, setConfirmNewGame] = useState(false);
  const model = useMemo(() => createDashboardReadModel(state), [state]);

  return (
    <CinematicFrame
      className="shell-main-menu"
      overlay="strong"
      safeContent
      aria-label="القائمة الرئيسية"
    >
      <div
        className="shell-main-menu__world"
        style={{
          backgroundImage: `url("${ENVIRONMENT_PRESENTATION_ASSETS.mainMenuWorld}")`,
        }}
        aria-hidden="true"
      >
        <span className="shell-main-menu__world-drift" />
        <span className="shell-main-menu__world-light" />
        <span className="shell-main-menu__world-foreground" />
      </div>

      <div className="shell-main-menu__atmosphere" aria-hidden="true">
        <span className="shell-main-menu__orbit shell-main-menu__orbit--one" />
        <span className="shell-main-menu__orbit shell-main-menu__orbit--two" />
        <span className="shell-main-menu__embers">
          {Array.from({ length: 16 }, (_, index) => (
            <i key={index} />
          ))}
        </span>
      </div>

      <EchoPresence
        className="shell-main-menu__echo"
        variant="hero"
        eager
      />

      <header className="shell-main-menu__utility shell-main-menu__utility--minimal">
        <span className="shell-main-menu__scene-title">
          <span className="shell-screen-code">01</span>
          <strong>المشهد السينمائي</strong>
        </span>
      </header>

      <section className="shell-main-menu__identity">
        <small>PROJECT</small>
        <h1>11:11</h1>
        <p>ECHOES OF THE FORGOTTEN</p>
        <span className="shell-main-menu__line" aria-hidden="true" />
        <blockquote>
          أنت لست مجرد ذكريات.
          <strong> أنت الحقيقة التي تحاول استعادتها.</strong>
        </blockquote>
      </section>

      <div className="shell-main-menu__action-anchor">
        <GlassPanel
          className="shell-main-menu__actions"
          tone="danger"
          eyebrow="Echo Channel"
          title={model.hasJourneyProgress ? 'استعادة الاتصال' : 'ابدأ الرحلة'}
        >
          <GameButton
            size="lg"
            fullWidth
            leadingIcon={<GameIcon id="screen-psychological-state" />}
            onClick={() => navigate('psychological-state')}
          >
            {model.hasJourneyProgress ? 'متابعة الرحلة' : 'ابدأ الرحلة'}
          </GameButton>
          <div className="shell-main-menu__secondary-actions">
            <GameButton
              variant="secondary"
              onClick={() => navigate('memories')}
            >
              الذكريات
            </GameButton>
            <GameButton
              variant="ghost"
              onClick={() => navigate('echo-mind')}
            >
              Echo Mind
            </GameButton>
            <GameButton
              variant="ghost"
              onClick={() => setConfirmNewGame(true)}
            >
              لعبة جديدة
            </GameButton>
          </div>
          <div className="shell-main-menu__checkpoint">
            <span>الفصل الحالي</span>
            <strong>{model.chapter.title}</strong>
            <small>{model.puzzleProgress.progress}% من التقدم الحالي</small>
          </div>
        </GlassPanel>
      </div>

      <footer className="shell-main-menu__footer">
        <span>Android Landscape Cinematic Interface</span>
        <span className="shell-main-menu__audio-signal">
          <i /><i /><i /><i /><i /><i /><i /><i />
          Japanese VO Ready · Arabic Subtitles Ready
        </span>
      </footer>

      <GameModal
        open={confirmNewGame}
        onClose={() => setConfirmNewGame(false)}
        eyebrow="إعادة تهيئة الذاكرة"
        title="بدء رحلة جديدة؟"
        description="سيتم مسح التقدم المحلي الحالي بعد التأكيد. لا يمكن التراجع عن هذا الإجراء."
        tone="danger"
        footer={(
          <>
            <GameButton
              variant="ghost"
              onClick={() => setConfirmNewGame(false)}
            >
              إلغاء
            </GameButton>
            <GameButton
              variant="danger"
              onClick={() => state.actions.resetGame()}
            >
              بدء لعبة جديدة
            </GameButton>
          </>
        )}
      >
        <p className="shell-modal-note">
          هذا يعيد حالة اللاعب فقط ويحافظ على بنية المحتوى والأنظمة كما هي.
        </p>
      </GameModal>
    </CinematicFrame>
  );
}
