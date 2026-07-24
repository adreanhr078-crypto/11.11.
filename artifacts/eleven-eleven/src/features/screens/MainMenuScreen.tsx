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
        <span className="shell-memory-flower">
          <i /><i /><i /><i /><i /><i />
        </span>
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

      <header className="shell-main-menu__utility">
        <span className="shell-main-menu__scene-title">
          <span className="shell-screen-code">01</span>
          <strong>المشهد السينمائي</strong>
        </span>
        <span className="shell-main-menu__episode">PROJECT 11:11</span>
        <span className="shell-main-menu__signal">SYSTEM // STABLE</span>
      </header>

      <section className="shell-main-menu__identity">
        <small>PROJECT // ECHO MIND</small>
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
          eyebrow="ECHO // SIGNAL CHANNEL"
          title={model.hasJourneyProgress ? 'استعادة الاتصال' : 'القناة بانتظارك'}
        >
          <GameButton
            size="lg"
            fullWidth
            leadingIcon={<GameIcon id="screen-dashboard" />}
            onClick={() => navigate('dashboard')}
          >
            {model.hasJourneyProgress ? 'متابعة الرحلة' : 'ابدأ الرحلة'}
          </GameButton>
          <div className="shell-main-menu__secondary-actions">
            <GameButton
              variant="secondary"
              onClick={() => setConfirmNewGame(true)}
            >
              لعبة جديدة
            </GameButton>
            <GameButton
              variant="ghost"
              leadingIcon={<GameIcon id="screen-memory" />}
              onClick={() => navigate('memories')}
            >
              الذكريات
            </GameButton>
            <GameButton
              variant="ghost"
              leadingIcon={<GameIcon id="screen-settings" />}
              onClick={() => navigate('settings')}
            >
              الإعدادات
            </GameButton>
          </div>
          <div className="shell-main-menu__checkpoint">
            <span>الفصل الحالي</span>
            <strong>{model.chapter.title}</strong>
            <small>{model.puzzleProgress.progress}% من الرحلة</small>
          </div>
        </GlassPanel>
      </div>

      <footer className="shell-main-menu__footer">
        <span>11:11 // MOBILE CINEMATIC RUNTIME</span>
        <span className="shell-main-menu__audio-signal">
          <i /><i /><i /><i /><i /><i /><i /><i />
          日本語 VO · العربية SUB
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
          المحتوى القصصي يبقى منفصلاً في ملفات البيانات؛ هذا يعيد حالة اللاعب
          فقط ولا يغيّر تعريفات المحتوى.
        </p>
      </GameModal>
    </CinematicFrame>
  );
}
