import { useEffect, useMemo, useState } from 'react';
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
  PlayerResourceCounters,
} from '../../app/shell/PlayerResourceCounters';
import {
  EchoPresence,
  ENVIRONMENT_PRESENTATION_ASSETS,
} from '../../ui/presentation';
import { AuthStatusButton } from '../auth/AuthStatusButton';
import { AuthPanel } from '../auth/AuthPanel';
import { useAuthStore } from '../auth/authStore';
import { useStoryPuzzleStore } from '../story-puzzles/storyPuzzleStore';
import { deriveCorePlayerObjective } from '../../application/player-journey/corePlayerLoop';

export default function MainMenuScreen() {
  const state = useGameStore();
  const navigate = useShellStore((shell) => shell.navigate);
  const storyPuzzleSnapshot = useStoryPuzzleStore((store) => store.snapshot);
  const requestManhwaReader = useShellStore((shell) => shell.requestManhwaReader);
  const authStatus = useAuthStore((store) => store.status);
  const [confirmNewGame, setConfirmNewGame] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const model = useMemo(
    () => createDashboardReadModel(state, storyPuzzleSnapshot),
    [state, storyPuzzleSnapshot],
  );
  const objective = useMemo(
    () => deriveCorePlayerObjective(storyPuzzleSnapshot),
    [storyPuzzleSnapshot],
  );
  const signedIn = authStatus === 'signed-in';

  useEffect(() => {
    if (signedIn) setAuthOpen(false);
  }, [signedIn]);

  const continueJourney = () => {
    if (!signedIn) {
      setAuthOpen(true);
      return;
    }
    if (objective.screen === 'memories') requestManhwaReader();
    else navigate(objective.screen);
  };

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
        <PlayerResourceCounters className="shell-main-menu__resources" />
        <AuthStatusButton
          variant="ghost"
          className="shell-main-menu__auth-control"
        />
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
          title={signedIn
            ? model.hasJourneyProgress ? 'استعادة الاتصال' : 'ابدأ الرحلة'
            : 'ثبّت هويتك أولًا'}
        >
          <GameButton
            size="lg"
            fullWidth
            leadingIcon={<GameIcon id={signedIn
              ? (objective.kind === 'read' ? 'screen-memory' : 'screen-puzzles')
              : 'category-characters'} />}
            onClick={continueJourney}
          >
            {signedIn ? objective.actionLabel : 'سجّل الدخول وابدأ'}
          </GameButton>
          <div className="shell-main-menu__secondary-actions">
            <GameButton
              variant="secondary"
              onClick={() => navigate('memories')}
            >
              الذكريات
            </GameButton>
            <GameButton
              variant="secondary"
              onClick={() => navigate('echo-network')}
            >
              شبكة Echo
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
            <span>خطوتك التالية</span>
            <strong>{signedIn ? objective.title : 'تسجيل الدخول يربط دليلك بحسابك'}</strong>
            <small>{signedIn ? objective.detail : 'يمكنك إنشاء حساب أو متابعة كضيف، ثم ستقابل Echo قبل أول دليل.'}</small>
          </div>
        </GlassPanel>
      </div>

      <footer className="shell-main-menu__footer">
        <span>Mobile Browser Interface</span>
        <span className="shell-main-menu__audio-signal">
          <i /><i /><i /><i /><i /><i /><i /><i />
          مؤثرات تفاعلية متاحة · الصوت المؤلف قيد الإضافة
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
      <AuthPanel open={authOpen} onClose={() => setAuthOpen(false)} />
    </CinematicFrame>
  );
}
