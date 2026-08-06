import { useState } from 'react';
import {
  GameButton,
  GameTooltip,
  type GameButtonVariant,
} from '../../ui/design-system';
import { GameIcon } from '../../ui/icons';
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
  const label = getButtonLabel(status, user);
  const tooltip = user
    ? 'إدارة حساب اللاعب'
    : 'تسجيل الدخول وتجهيز الحفظ السحابي';

  return (
    <>
      <GameTooltip label={tooltip}>
        <GameButton
          className={className}
          variant={variant}
          leadingIcon={<GameIcon id="category-characters" />}
          onClick={() => setOpen(true)}
        >
          {label}
        </GameButton>
      </GameTooltip>
      <AuthPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
