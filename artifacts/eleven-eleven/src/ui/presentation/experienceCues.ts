/**
 * Small, UI-only event seam for the player journey.
 *
 * Gameplay and server authority stay in their existing stores. This seam only
 * tells presentation layers that a meaningful moment happened, so a future
 * cinematic/audio adapter can subscribe without coupling itself to a screen.
 */
export type ExperienceCueName =
  | 'screen-enter'
  | 'onboarding-complete'
  | 'manhwa-open'
  | 'puzzle-armed'
  | 'puzzle-reward';

export interface ExperienceCueDetail {
  name: ExperienceCueName;
  sourceId?: string;
  screenId?: string;
}

export const EXPERIENCE_CUE_EVENT = 'eleven:experience-cue';

export function emitExperienceCue(detail: ExperienceCueDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ExperienceCueDetail>(
    EXPERIENCE_CUE_EVENT,
    { detail },
  ));
}

export function subscribeExperienceCues(
  listener: (detail: ExperienceCueDetail) => void,
): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const handle = (event: Event) => {
    const detail = (event as CustomEvent<ExperienceCueDetail>).detail;
    if (!detail || typeof detail.name !== 'string') return;
    listener(detail);
  };
  window.addEventListener(EXPERIENCE_CUE_EVENT, handle);
  return () => window.removeEventListener(EXPERIENCE_CUE_EVENT, handle);
}
