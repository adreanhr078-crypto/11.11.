import type { ReactNode } from 'react';

export interface ScreenTransitionProps {
  screenId: string;
  children: ReactNode;
}

export function ScreenTransition({
  screenId,
  children,
}: ScreenTransitionProps) {
  return (
    <div
      key={screenId}
      className="premium-screen-transition"
      data-screen={screenId}
    >
      <span className="premium-screen-transition__shutter" aria-hidden="true" />
      <span className="premium-screen-transition__scan" aria-hidden="true" />
      <div className="premium-screen-transition__content">
        {children}
      </div>
    </div>
  );
}

