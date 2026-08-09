import { useState } from 'react';
import {
  GameButton,
  GameTooltip,
  type GameButtonVariant,
} from '../../ui/design-system';
import { GameIcon } from '../../ui/icons';
import { playerAvatarSrc } from '../../ui/presentation/playerAvatarCatalog';
import { useShellStore } from '../../app/shell/shellStore';
import { usePlayerProgressionStore } from '../player-progression/playerProgressionStore';
import { useAuthStore } from './authStore';
import { AuthPanel } from './AuthPanel';

interface AuthStatusButtonProps {
  variant?: GameButtonVariant;
  className?: string;
}

function getButtonLabel(
  status: ReturnType<typeof useAuthStore.getState>['status'],
  user: ReturnType<typeof useAuthStore.getState>['user'],
): string {
  if (status === 'checking') return 'الحساب';
  if (status === 'unavailable') return 'تفعيل الحساب';
  if (!user) return 'تسجيل الدخول';
  return user.isAnonymous
    ? 'ضيف'
    : user.displayName || user.email || 'الحساب';
}

export function AuthStatusButton({
  variant = 'secondary',
  className,
}: AuthStatusButtonProps) {
  const [open, setOpen] = useState(false);
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const shell = useShellStore();
  const profile = usePlayerProgressionStore((state) => state.profile);
  const currentPlayer = usePlayerProgressionStore((state) => state.currentPlayer);
  const label = getButtonLabel(status, user);
  const tooltip = user
    ? 'إدارة حساب اللاعب'
    : 'تسجيل الدخول وتجهيز الحفظ السحابي';

  const signedInLabel = profile?.username
    ?? currentPlayer?.username
    ?? user?.displayName
    ?? user?.email
    ?? 'PLAYER';
  const signedInLevel = profile?.progression.level
    ?? currentPlayer?.level
    ?? 1;

  return (
    <>
      <GameTooltip label={tooltip}>
        <GameButton
          className={user ? `application-shell__player-card ${className ?? ''}` : className}
          variant={variant}
          leadingIcon={user ? (
            <img
              className="application-shell__player-avatar"
              src={playerAvatarSrc(profile?.avatarId ?? 'echo')}
              alt=""
            />
          ) : <GameIcon id="category-characters" />}
          onClick={() => {
            if (user) {
              shell.navigate('profile');
            } else {
              setOpen(true);
            }
          }}
        >
          {user ? (
            <span className="application-shell__player-card-copy">
              <strong>{signedInLabel}</strong>
              <small>LVL {signedInLevel}</small>
            </span>
          ) : label}
        </GameButton>
      </GameTooltip>
      <AuthPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
