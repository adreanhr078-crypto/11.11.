import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './app/ErrorBoundary';
import { bootstrapApplication } from './app/bootstrap';
import {
  EmotionVisualProvider,
} from './features/emotion/useEmotionVisualSystem';

bootstrapApplication();
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' });
  }, { once: true });
}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <EmotionVisualProvider>
        <App />
      </EmotionVisualProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
