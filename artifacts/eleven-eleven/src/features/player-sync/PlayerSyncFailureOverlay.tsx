import { GameButton } from '../../ui/design-system';
import { useAuthStore } from '../auth/authStore';
import { usePlayerProgressionStore } from '../player-progression/playerProgressionStore';
import { retryPlayerSync } from './playerSyncCoordinator';
import { usePlayerSyncStore } from './playerSyncStore';

export function PlayerSyncFailureOverlay() {
  const authStatus = useAuthStore((state) => state.status);
  const signOut = useAuthStore((state) => state.actions.signOut);
  const phase = usePlayerSyncStore((state) => state.phase);
  const error = usePlayerSyncStore((state) => state.error);
  const profileError = usePlayerProgressionStore((state) => state.profileError);

  if (
    authStatus !== 'signed-in'
    || phase !== 'error'
    || !error
    || profileError
  ) {
    return null;
  }

  return (
    <div className="player-sync-failure" role="alert" dir="rtl">
      <div className="player-sync-failure__panel">
        <span className="player-sync-failure__eyebrow">PLAYER CHANNEL // ERROR</span>
        <h2>تعذر فتح بيانات اللاعب</h2>
        <p>انتهت محاولة المزامنة بأمان. يمكنك إعادة المحاولة أو تسجيل الخروج.</p>
        <div className="player-sync-failure__actions">
          <GameButton variant="secondary" onClick={() => void retryPlayerSync()}>
            إعادة المحاولة
          </GameButton>
          <GameButton variant="ghost" onClick={() => void signOut()}>
            تسجيل الخروج
          </GameButton>
        </div>
      </div>
    </div>
  );
}
