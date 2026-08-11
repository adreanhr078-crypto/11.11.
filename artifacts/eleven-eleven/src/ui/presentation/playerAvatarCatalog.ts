import { ECHO_PRESENTATION_ASSETS } from './visualAssets';
import type { PlayerAvatarId } from '../../domain/player-profile/playerProfile';

export interface PlayerAvatarCatalogEntry {
  id: PlayerAvatarId;
  label: string;
  src: string;
  /** The visual shown in the large Profile identity stage. */
  presentationSrc: string;
  availability: 'starter' | 'weekly-reward';
  rarity: 'standard' | 'rare';
}

export const PLAYER_AVATAR_CATALOG: readonly PlayerAvatarCatalogEntry[] = [
  {
    id: 'echo',
    label: 'Echo',
    src: ECHO_PRESENTATION_ASSETS.portrait,
    presentationSrc: ECHO_PRESENTATION_ASSETS.fullBodyNormal,
    availability: 'starter',
    rarity: 'standard',
  },
  {
    id: 'silver_signal',
    label: 'Silver Signal',
    src: '/assets/avatars/player-silver-v1.png',
    presentationSrc: '/assets/avatars/player-silver-v1.png',
    availability: 'starter',
    rarity: 'standard',
  },
  {
    id: 'red_rift',
    label: 'Red Rift',
    src: '/assets/avatars/player-rift-v1.png',
    presentationSrc: '/assets/avatars/player-rift-v1.png',
    availability: 'starter',
    rarity: 'standard',
  },
  {
    id: 'rare_yuki',
    label: 'يوكي · YUKI',
    src: '/assets/avatars/rare-yuki-v1.webp',
    presentationSrc: '/assets/avatars/rare-yuki-v1.webp',
    availability: 'weekly-reward',
    rarity: 'rare',
  },
  {
    id: 'rare_nara',
    label: 'نارا · NARA',
    src: '/assets/avatars/rare-nara-v1.webp',
    presentationSrc: '/assets/avatars/rare-nara-v1.webp',
    availability: 'weekly-reward',
    rarity: 'rare',
  },
  {
    id: 'rare_kenja',
    label: 'كينجا · KENJA',
    src: '/assets/avatars/rare-kenja-v1.webp',
    presentationSrc: '/assets/avatars/rare-kenja-v1.webp',
    availability: 'weekly-reward',
    rarity: 'rare',
  },
  {
    id: 'rare_lina',
    label: 'لينا · LINA',
    src: '/assets/avatars/rare-lina-v1.webp',
    presentationSrc: '/assets/avatars/rare-lina-v1.webp',
    availability: 'weekly-reward',
    rarity: 'rare',
  },
  {
    id: 'rare_zero',
    label: 'زيرو · ZERO',
    src: '/assets/avatars/rare-zero-v1.webp',
    presentationSrc: '/assets/avatars/rare-zero-v1.webp',
    availability: 'weekly-reward',
    rarity: 'rare',
  },
];

export const STARTER_PLAYER_AVATAR_CATALOG = PLAYER_AVATAR_CATALOG.filter(
  (avatar) => avatar.availability === 'starter',
);

export function unlockedPlayerAvatarCatalog(
  unlockedAvatarIds: readonly PlayerAvatarId[] | undefined,
): readonly PlayerAvatarCatalogEntry[] {
  const unlocked = new Set(unlockedAvatarIds ?? []);
  return PLAYER_AVATAR_CATALOG.filter((avatar) => (
    avatar.availability === 'starter' || unlocked.has(avatar.id)
  ));
}

export function playerAvatarSrc(id: PlayerAvatarId): string {
  return PLAYER_AVATAR_CATALOG.find((avatar) => avatar.id === id)?.src
    ?? ECHO_PRESENTATION_ASSETS.portrait;
}

export function playerAvatarPresentationSrc(id: PlayerAvatarId): string {
  return PLAYER_AVATAR_CATALOG.find((avatar) => avatar.id === id)?.presentationSrc
    ?? ECHO_PRESENTATION_ASSETS.fullBodyNormal;
}
