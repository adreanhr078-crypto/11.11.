import type { HTMLAttributes, ReactNode } from 'react';
import type { MotionTier, QualityTier } from './types';
import { cx } from './utils';

export interface GameViewportProps extends HTMLAttributes<HTMLDivElement> {
  quality?: QualityTier;
  motion?: MotionTier;
  landscapeRequired?: boolean;
  orientationTitle?: ReactNode;
  orientationMessage?: ReactNode;
}

export function GameViewport({
  quality = 'balanced',
  motion = 'balanced',
  landscapeRequired = true,
  orientationTitle = 'أفضل تجربة في الوضع الأفقي',
  orientationMessage = 'قم بتدوير جهازك للمتابعة.',
  className,
  children,
  ...props
}: GameViewportProps) {
  return (
    <div
      className={cx('gds-viewport', className)}
      data-gds-quality={quality}
      data-gds-motion={motion}
      data-landscape-required={landscapeRequired}
      {...props}
    >
      {children}
      <aside className="gds-landscape-guard" aria-live="polite">
        <div className="gds-landscape-guard__content">
          <span className="gds-landscape-guard__device" aria-hidden="true" />
          <strong>{orientationTitle}</strong>
          <span>{orientationMessage}</span>
        </div>
      </aside>
    </div>
  );
}

export interface GameSafeAreaProps extends HTMLAttributes<HTMLDivElement> {}

export function GameSafeArea({
  className,
  ...props
}: GameSafeAreaProps) {
  return <div className={cx('gds-safe-area', className)} {...props} />;
}

