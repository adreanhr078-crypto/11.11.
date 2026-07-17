import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/eleven-theme.css';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#000', color: '#f87171', fontFamily: 'monospace',
          padding: '2rem', direction: 'rtl', zIndex: 9999, textAlign: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>حدث خطأ غير متوقع</h1>
          <pre style={{ maxWidth: '80vw', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#fff' }}>
            {this.state.error?.message}
          </pre>
          <p style={{ color: '#9ca3af' }}>تحقق من Console للتفاصيل</p>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
