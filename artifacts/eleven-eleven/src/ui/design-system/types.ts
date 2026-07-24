import type { ReactNode } from 'react';

export type GameTone =
  | 'neutral'
  | 'danger'
  | 'memory'
  | 'rare'
  | 'progression'
  | 'success';

export type MotionTier = 'cinematic' | 'balanced' | 'reduced';
export type QualityTier = 'high' | 'balanced' | 'mobile';

export interface LabeledIcon {
  icon?: ReactNode;
  label: ReactNode;
}

