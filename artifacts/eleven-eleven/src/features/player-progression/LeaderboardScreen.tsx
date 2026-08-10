import { useEffect } from 'react';
import {
  GameButton,
  GameProgress,
  GameTooltip,
  HudPanel,
} from '../../ui/design-system';
import { GameIcon } from '../../ui/icons';
import { AuthStatusButton } from '../auth/AuthStatusButton';
import { useAuthStore } from '../auth/authStore';
import { usePlayerProgressionStore } from './playerProgressionStore';
import { useShellStore } from '../../app/shell/shellStore';

const numberFormatter = new Intl.NumberFormat('en-US');

export default function LeaderboardScreen() {
  const navigate = useShellStore((state) => state.navigate);
  const authStatus = useAuthStore((state) => state.status);
  const progression = usePlayerProgressionStore();
  const loadLeaderboard = progression.actions.loadLeaderboard;

  useEffect(() => {
    if (authStatus === 'signed-in') {
      void loadLeaderboard(true);
    }
  }, [authStatus, loadLeaderboard]);

  const currentInTop = progression.entries.some(
    (entry) => entry.isCurrentPlayer,
  );

  return (
    <div className="shell-screen leaderboard-screen">
      <header className="shell-screen-heading leaderboard-screen__heading">
        <span className="shell-screen-code">08</span>
        <span>
          <small>GLOBAL RANKING // TOTAL XP</small>
          <h1>الترتيب العالمي</h1>
        </span>
        <div className="shell-screen-heading__metrics">
          <span>{numberFormatter.format(progression.totalPlayers)} لاعب</span>
          <span>TOP {progression.entries.length || 25}</span>
        </div>
      </header>

      {authStatus !== 'signed-in' ? (
        <HudPanel
          className="leaderboard-screen__gate"
          tone="progression"
          eyebrow="ACCOUNT REQUIRED"
          title="سجّل الدخول لعرض ترتيبك"
        >
          <AuthStatusButton variant="progression" />
        </HudPanel>
      ) : (
        <>
          <section
            className="leaderboard-player"
            aria-label="ترتيب اللاعب الحالي"
          >
            {progression.currentPlayer ? (
              <>
                <div className="leaderboard-player__rank">
                  <small>ترتيبك</small>
                  <strong>#{numberFormatter.format(
                    progression.currentPlayer.rank,
                  )}</strong>
                </div>
                <div className="leaderboard-player__identity">
                  <small>PLAYER</small>
                  <strong>{progression.currentPlayer.username}</strong>
                  <span>
                    {!currentInTop && 'خارج القائمة العليا · '}
                    TOTAL XP {numberFormatter.format(
                      progression.currentPlayer.totalXp,
                    )}
                  </span>
                </div>
                <div className="leaderboard-player__level">
                  <span>
                    <small>LEVEL</small>
                    <strong>{progression.currentPlayer.level}</strong>
                  </span>
                  <GameProgress
                    value={progression.currentPlayer.progressPercent}
                    label={progression.currentPlayer.xpForNextLevel === null
                      ? 'MAX LEVEL'
                      : `${numberFormatter.format(
                          progression.currentPlayer.xpIntoLevel,
                        )} / ${numberFormatter.format(
                          progression.currentPlayer.xpForNextLevel,
                        )} XP`}
                    tone="progression"
                    showValue={false}
                  />
                </div>
              </>
            ) : (
              <p className="leaderboard-screen__status">جاري استعادة ملف اللاعب...</p>
            )}
          </section>

          <HudPanel
            className="leaderboard-board"
            tone="progression"
            eyebrow="WORLDWIDE PLAYERS"
            title="أعلى اللاعبين"
            actions={(
              <div className="leaderboard-board__actions">
                <GameButton
                  variant="secondary"
                  onClick={() => navigate('progress')}
                >
                  SYSTEM RECOVERY
                </GameButton>
              <GameTooltip label="تحديث الترتيب">
                <GameButton
                  size="icon"
                  variant="ghost"
                  aria-label="تحديث الترتيب"
                  title="تحديث الترتيب"
                  loading={progression.status === 'loading'}
                  onClick={() => void loadLeaderboard(true)}
                >
                  <GameIcon id="utility-refresh" />
                </GameButton>
              </GameTooltip>
              </div>
            )}
          >
            {progression.status === 'error' ? (
              <div className="leaderboard-screen__error" role="alert">
                <p>{progression.error}</p>
                <GameButton
                  variant="secondary"
                  onClick={() => void loadLeaderboard(true)}
                >
                  إعادة المحاولة
                </GameButton>
              </div>
            ) : progression.entries.length > 0 ? (
              <div className="leaderboard-table-wrap">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th scope="col">RANK</th>
                      <th scope="col">USERNAME</th>
                      <th scope="col">LEVEL</th>
                      <th scope="col">XP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progression.entries.map((entry, index) => (
                      <tr
                        key={`${entry.rank}:${entry.username}:${index}`}
                        data-rank={entry.rank <= 3 ? entry.rank : undefined}
                        data-current={entry.isCurrentPlayer || undefined}
                      >
                        <td>
                          <span className="leaderboard-table__rank">
                            {entry.rank <= 3 && (
                              <GameIcon id="screen-leaderboard" />
                            )}
                            #{numberFormatter.format(entry.rank)}
                          </span>
                        </td>
                        <th scope="row">{entry.username}</th>
                        <td>{entry.level}</td>
                        <td>{numberFormatter.format(entry.totalXp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="leaderboard-screen__status" aria-live="polite">
                {progression.status === 'loading'
                  ? 'جاري تحميل الترتيب العالمي...'
                  : 'لا توجد نتائج بعد.'}
              </p>
            )}
          </HudPanel>
        </>
      )}
    </div>
  );
}
