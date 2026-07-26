import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { GameButton } from '../../../ui/design-system';

interface GameplayErrorBoundaryProps {
  children: ReactNode;
  onExit: () => void;
}

interface GameplayErrorBoundaryState {
  error: Error | null;
}

export class GameplayErrorBoundary extends Component<
  GameplayErrorBoundaryProps,
  GameplayErrorBoundaryState
> {
  state: GameplayErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(
    error: Error,
  ): GameplayErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Gameplay WebGL boundary:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <section
        className="gameplay-fallback"
        role="alert"
        aria-live="assertive"
      >
        <small>3D RUNTIME // SAFE FALLBACK</small>
        <h1>تعذّر تشغيل الغرفة ثلاثية الأبعاد</h1>
        <p>
          لم يتم فقدان تقدمك. يمكنك العودة إلى واجهة القصة والمحاولة
          مجددًا بعد التحقق من دعم WebGL.
        </p>
        <GameButton onClick={this.props.onExit}>
          العودة إلى واجهة القصة
        </GameButton>
      </section>
    );
  }
}
