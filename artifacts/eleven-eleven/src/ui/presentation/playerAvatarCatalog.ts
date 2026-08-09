import { ECHO_PRESENTATION_ASSETS } from './visualAssets';
import type { PlayerAvatarId } from '../../domain/player-profile/playerProfile';

export interface PlayerAvatarCatalogEntry {
  id: PlayerAvatarId;
  label: string;
  src: string;
  /** The visual shown in the large Profile identity stage. */
  presentationSrc: string;
}

export const PLAYER_AVATAR_CATALOG: readonly PlayerAvatarCatalogEntry[] = [
  {
    id: 'echo',
    label: 'Echo',
    src: ECHO_PRESENTATION_ASSETS.portrait,
    presentationSrc: ECHO_PRESENTATION_ASSETS.fullBodyNormal,
  },
  {
    id: 'silver_signal',
    label: 'Silver Signal',
    src: '/assets/avatars/player-silver-v1.png',
    presentationSrc: '/assets/avatars/player-silver-v1.png',
  },
  {
    id: 'red_rift',
    label: 'Red Rift',
    src: '/assets/avatars/player-rift-v1.png',
    presentationSrc: '/assets/avatars/player-rift-v1.png',
  },
];

export function playerAvatarSrc(id: PlayerAvatarId): string {
  return PLAYER_AVATAR_CATALOG.find((avatar) => avatar.id === id)?.src
    ?? ECHO_PRESENTATION_ASSETS.portrait;
}

export function playerAvatarPresentationSrc(id: PlayerAvatarId): string {
  return PLAYER_AVATAR_CATALOG.find((avatar) => avatar.id === id)?.presentationSrc
    ?? ECHO_PRESENTATION_ASSETS.fullBodyNormal;
}
