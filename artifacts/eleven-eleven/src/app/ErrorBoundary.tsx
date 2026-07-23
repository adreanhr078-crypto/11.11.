import React from 'react';

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application boundary caught an error', error, info);
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <main role="alert" style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '2rem',
          background: '#08090d',
          color: '#eee',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <section style={{ maxWidth: 640 }}>
            <h1>11:11 could not start</h1>
            <p>The game foundation reported a recoverable startup error.</p>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#e17878' }}>
              {this.state.error.message}
            </pre>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
